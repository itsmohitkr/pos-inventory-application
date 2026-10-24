// Electron glue for licensing: builds the real dependencies, registers the renderer-facing IPC, and drives the
// periodic refresh. All decisions live in licenseManager/licensePolicy; this file only wires them to Electron.
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { app, BrowserWindow, ipcMain, net, powerMonitor, shell } from 'electron';
import IPC = require('../ipcChannels');
import { LICENSE_RELEASE_TIME_MS, resolveLicenseConfig } from './config';
import { DeviceStore } from './deviceStore';
import { LicenseClient } from './licenseClient';
import { LicenseManager } from './licenseManager';
import { disabledStatus } from './licensePolicy';
import { emptySubscriptionDetails } from './subscriptionDetails';
import { readMachineId } from './machineId';
import type { CheckoutStartResult, RedeemKeyOutcome } from './licenseManager';

// A plan is at most 32 characters per the contract's PlanKeySchema; this only guards against an absurd
// payload before it ever reaches the service, not a real allow-list of plan names (the service owns that).
const MAX_PLAN_INPUT_LENGTH = 32;

const REEVALUATE_INTERVAL_MS = 60 * 1000;
const VERSION_PATTERN = /^\d{1,4}\.\d{1,4}\.\d{1,6}(?:[-+][0-9A-Za-z.-]{1,32})?$/;
// A key is at most 26 characters (20 body + 2 checksum + separators); this only guards against an absurd
// payload before it ever reaches parsing/validation, not a real length limit.
const MAX_KEY_INPUT_LENGTH = 128;

let manager: LicenseManager | null = null;

export const getLicenseManager = (): LicenseManager | null => manager;

const log = (message: string, fields?: Record<string, unknown>): void => {
  console.log(`[license] ${message}`, fields ?? '');
};

// A database older than the license release means a pre-existing customer, who is grandfathered.
const isLegacyInstall = (): boolean => {
  if (LICENSE_RELEASE_TIME_MS <= 0) return false;
  try {
    return (
      fs.statSync(path.join(app.getPath('userData'), 'pos.db')).birthtimeMs <
      LICENSE_RELEASE_TIME_MS
    );
  } catch {
    return false;
  }
};

export const initLicensing = (getWindow: () => BrowserWindow | null): void => {
  ipcMain.handle(IPC.LICENSE_GET_STATUS, () => (manager ? manager.getStatus() : disabledStatus()));
  ipcMain.handle(IPC.LICENSE_REFRESH, async () => {
    if (!manager) return disabledStatus();
    await manager.refresh();
    return manager.getStatus();
  });
  ipcMain.handle(IPC.LICENSE_GET_SUBSCRIPTION, () =>
    manager ? manager.getSubscriptionDetails() : emptySubscriptionDetails()
  );
  ipcMain.handle(IPC.LICENSE_REFRESH_SUBSCRIPTION, async () => {
    if (!manager) return emptySubscriptionDetails();
    await manager.refreshSubscription({ force: true });
    return manager.getSubscriptionDetails();
  });
  ipcMain.handle(
    IPC.LICENSE_REDEEM_KEY,
    async (_event, rawKey: unknown): Promise<RedeemKeyOutcome> => {
      if (!manager) return { kind: 'offline' };
      if (
        typeof rawKey !== 'string' ||
        rawKey.length === 0 ||
        rawKey.length > MAX_KEY_INPUT_LENGTH
      ) {
        return { kind: 'malformed' };
      }
      return manager.redeemActivationKey(rawKey);
    }
  );
  ipcMain.handle(
    IPC.LICENSE_START_CHECKOUT,
    async (_event, plan: unknown): Promise<CheckoutStartResult> => {
      if (!manager) return { kind: 'offline' };
      if (typeof plan !== 'string' || plan.length === 0 || plan.length > MAX_PLAN_INPUT_LENGTH) {
        return { kind: 'unknown_plan' };
      }
      const result = await manager.startCheckout(plan);
      if (result.kind === 'ok') {
        // Never an embedded webview: UPI intents, 3-D Secure and bank redirects need a real browser, and card
        // data must never touch this app. Fire-and-forget -- a failure to launch a browser is surfaced to the
        // person by the dialog just sitting at "waiting" with nothing happening, not by this call rejecting.
        shell.openExternal(result.checkoutUrl).catch((error: unknown) => {
          log('could not open the system browser for checkout', {
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
      return result;
    }
  );
  ipcMain.handle(IPC.LICENSE_GET_CHECKOUT_STATE, () =>
    manager ? manager.getCheckoutState() : { phase: 'idle', checkoutUrl: null }
  );
  ipcMain.handle(IPC.LICENSE_CANCEL_CHECKOUT, () => {
    manager?.cancelCheckout();
  });

  const config = resolveLicenseConfig(process.env, app.isPackaged);
  if (!config) {
    log('not configured for this build; licensing is disabled');
    return;
  }

  const version = app.getVersion();
  const platform =
    process.platform === 'darwin' || process.platform === 'win32' ? process.platform : 'linux';

  const created = new LicenseManager({
    client: new LicenseClient({
      baseUrl: config.apiUrl,
      fetchImpl: (url, init) => net.fetch(url, init),
    }),
    store: new DeviceStore(path.join(app.getPath('userData'), 'license', 'device.json')),
    publicKeys: config.publicKeys,
    readMachineId,
    appVersion: VERSION_PATTERN.test(version) ? version : '0.0.0',
    platform,
    now: () => Date.now(),
    randomNonce: () => randomBytes(16).toString('base64url'),
    randomHex: (bytes) => randomBytes(bytes).toString('hex'),
    isLegacyInstall,
    defaultEnforcement: config.defaultEnforcement,
    log,
  });
  manager = created;

  created.on('status', (status) => {
    const window = getWindow();
    if (window && !window.isDestroyed())
      window.webContents.send(IPC.LICENSE_STATUS_CHANGED, status);
  });
  created.on('subscription', (details) => {
    const window = getWindow();
    if (window && !window.isDestroyed())
      window.webContents.send(IPC.LICENSE_SUBSCRIPTION_CHANGED, details);
  });
  created.on('checkoutState', (state) => {
    const window = getWindow();
    if (window && !window.isDestroyed())
      window.webContents.send(IPC.LICENSE_CHECKOUT_STATE_CHANGED, state);
  });

  // Never blocks startup: the cached state is evaluated first, the network refresh happens in the background.
  void created.start().then(() => created.refresh());

  setInterval(() => void created.refresh(), config.refreshIntervalMs).unref();
  setInterval(() => created.reevaluate(), REEVALUATE_INTERVAL_MS).unref();
  powerMonitor.on('resume', () => void created.refresh());
  // An extra, out-of-schedule checkout check whenever any app window regains focus -- exactly when the person
  // plausibly just finished paying in the system browser and switched back. The app-level event, not a
  // specific window's own 'focus', since initLicensing() runs before createWindow() gives mainWindow a value.
  app.on('browser-window-focus', () => created.pollCheckoutNow());
};
