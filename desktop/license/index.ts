// Electron glue for licensing: builds the real dependencies, registers the renderer-facing IPC, and drives the
// periodic refresh. All decisions live in licenseManager/licensePolicy; this file only wires them to Electron.
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { app, BrowserWindow, ipcMain, net, powerMonitor } from 'electron';
import IPC = require('../ipcChannels');
import { LICENSE_RELEASE_TIME_MS, resolveLicenseConfig } from './config';
import { DeviceStore } from './deviceStore';
import { LicenseClient } from './licenseClient';
import { LicenseManager } from './licenseManager';
import { disabledStatus } from './licensePolicy';
import { readMachineId } from './machineId';

const REEVALUATE_INTERVAL_MS = 60 * 1000;
const VERSION_PATTERN = /^\d{1,4}\.\d{1,4}\.\d{1,6}(?:[-+][0-9A-Za-z.-]{1,32})?$/;

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

  // Never blocks startup: the cached state is evaluated first, the network refresh happens in the background.
  void created.start().then(() => created.refresh());

  setInterval(() => void created.refresh(), config.refreshIntervalMs).unref();
  setInterval(() => created.reevaluate(), REEVALUATE_INTERVAL_MS).unref();
  powerMonitor.on('resume', () => void created.refresh());
};
