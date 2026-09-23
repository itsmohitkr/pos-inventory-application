// Orchestrates licensing: identity, the local record, talking to the service, and turning the latest verified
// token into a status. Electron-free on purpose (everything external is injected) so it is unit-testable.
//
// Hard rules, mirrored from the service design:
//  - Only a signature-verified, nonce-matched response can change entitlement.
//  - Anything else (offline, 5xx, garbage, bad signature) is treated as "offline": the cached token keeps
//    working until its own grace runs out. Nothing here can revoke or degrade a customer on its own.
//  - Time never runs backwards: decisions use max(local clock, newest server time ever accepted).
import { EventEmitter } from 'events';
import {
  normalizeActivationKey,
  verifyLicenseToken,
  type ActivateRequest,
  type EnforcementMode,
  type TokenClaims,
} from '@trovix/license-contract';
import { emptyRecord, type DeviceRecord, type RecordStore } from './deviceStore';
import type {
  CheckoutPollResult,
  ClientResult,
  KeyRedeemResult,
  LicenseClient,
} from './licenseClient';
import {
  evaluateLicense,
  toSalesDecision,
  type LicenseStatusDto,
  type SalesDecision,
} from './licensePolicy';
import { deriveDeviceId } from './machineId';

type ClientLike = Pick<
  LicenseClient,
  'activate' | 'validate' | 'redeemActivationKey' | 'createCheckoutSession' | 'pollCheckoutSession'
>;

export type CheckoutPhase = 'idle' | 'pending' | 'paid' | 'failed' | 'expired';

/** Pushed to the renderer as the Upgrade/Renew dialog's entire state — decided here, only displayed there. */
export interface CheckoutState {
  phase: CheckoutPhase;
  /** Set only while `phase === 'pending'` and only for the call that started it — a relaunch resumes polling
   *  without it (see DeviceRecord's own comment), so the waiting UI must tolerate it being null. */
  checkoutUrl: string | null;
}

export type CheckoutStartResult =
  | { kind: 'ok'; checkoutUrl: string }
  | { kind: 'already_pending' }
  | { kind: 'rejected' }
  | { kind: 'unknown_plan' }
  | { kind: 'offline' };

const IDLE_CHECKOUT: CheckoutState = { phase: 'idle', checkoutUrl: null };

/**
 * Sent to the renderer as the result of an "Enter key" attempt. `malformed` is a purely local checksum
 * rejection (see @trovix/license-contract's normalizeActivationKey) — no network call is made for it, so a
 * typo is caught instantly and never counts against the service's guess-lockout. Every other outcome came
 * from (or is a stand-in for) a real service response; `offline` never means the key was rejected.
 */
export type RedeemKeyOutcome =
  | { kind: 'ok' }
  | { kind: 'malformed' }
  | { kind: 'invalid_key' }
  | { kind: 'seat_limit_reached' }
  | { kind: 'device_already_licensed' }
  | { kind: 'offline' };

export interface LicenseManagerDeps {
  client: ClientLike;
  store: RecordStore;
  publicKeys: Readonly<Record<string, string>>;
  readMachineId: () => Promise<string | null>;
  appVersion: string;
  platform: 'darwin' | 'win32' | 'linux';
  now: () => number;
  randomNonce: () => string;
  randomHex: (bytes: number) => string;
  /** True when this install predates the license release (existing customer being grandfathered). */
  isLegacyInstall: () => boolean;
  defaultEnforcement: EnforcementMode;
  log?: (message: string, fields?: Record<string, unknown>) => void;
}

const CLOCK_SKEW_MS = 5 * 60 * 1000;

// Polling cadence for an in-progress checkout (plan section N): fast while the person is plausibly still on
// the payment page, slower after that so a browser left open overnight does not hammer the service.
const CHECKOUT_FAST_INTERVAL_MS = 3 * 1000;
const CHECKOUT_FAST_WINDOW_MS = 2 * 60 * 1000;
const CHECKOUT_SLOW_INTERVAL_MS = 10 * 1000;
// A little past the session's own server-side expiry (30 min) before the client gives up entirely: the
// service's own "paid wins over expiry" policy means a payment completed right at the boundary can still
// resolve after the client's naive clock-based expiry, so this is a grace window, not a hard cutoff to race.
const CHECKOUT_EXPIRY_GRACE_MS = 2 * 60 * 1000;

export class LicenseManager extends EventEmitter {
  private record: DeviceRecord = emptyRecord();
  private deviceId = '';
  private weakIdentity = false;
  private claims: TokenClaims | null = null;
  private offline = false;
  private started = false;
  private inFlight: Promise<void> | null = null;
  private lastEmitted = '';

  private checkoutState: CheckoutState = IDLE_CHECKOUT;
  private checkoutSessionId: string | null = null;
  private checkoutStartedAtMs = 0;
  private checkoutTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEmittedCheckout = '';

  constructor(private readonly deps: LicenseManagerDeps) {
    super();
  }

  /** Loads the cached state and evaluates it immediately (no network), so the app never waits on the service. */
  async start(): Promise<void> {
    const record = this.deps.store.read();
    await this.resolveIdentity(record);
    this.record = record;
    this.claims = this.loadCachedClaims();

    // Resume polling a checkout that was in progress when the app last closed (plan: "quitting and
    // relaunching ... still resolves"). The cadence restarts from "just launched", not wherever it left off —
    // simpler, and never worse than the steady-state slow cadence.
    if (this.record.pendingCheckoutSessionId) {
      this.checkoutSessionId = this.record.pendingCheckoutSessionId;
      this.checkoutStartedAtMs = this.deps.now();
      this.checkoutState = { phase: 'pending', checkoutUrl: null };
      this.scheduleNextCheckoutPoll();
    }

    // No usable token: start the local provisional trial once, before any network attempt, so a first
    // launch with no internet still gets a bounded trial and an unusable token cannot mean "unlimited".
    if (this.claims === null && this.record.provisionalStartedAtMs === null) {
      this.record.provisionalStartedAtMs = this.deps.now();
    }
    this.persist();
    this.started = true;
    this.emitStatus();
  }

  getStatus(): LicenseStatusDto {
    return evaluateLicense({
      claims: this.claims,
      provisionalStartedAtMs: this.record.provisionalStartedAtMs,
      nowMs: this.effectiveNowMs(),
      defaultEnforcement: this.deps.defaultEnforcement,
      offline: this.offline,
      clockSuspect: this.deps.now() < this.record.highWaterMarkSec * 1000 - CLOCK_SKEW_MS,
      lastValidatedAtMs: this.record.lastValidatedAtMs,
    });
  }

  evaluateSalesGate(): SalesDecision {
    return toSalesDecision(this.getStatus());
  }

  /**
   * Redeems a key the person typed into the app. Unlike the background exchange(), this always sends the
   * device's current secret when one exists (buildActivateRequest deliberately does not, since it is only ever
   * called when no working secret exists) — without it, an already-owned device would be routed into the
   * secret-recovery check instead of the actual key-redeem path, and could never apply a key for a different
   * account. Never throws; concurrent calls with the background refresh are safe (this is a plain activate()).
   */
  async redeemActivationKey(rawKey: string): Promise<RedeemKeyOutcome> {
    if (!this.started) return { kind: 'offline' };
    if (normalizeActivationKey(rawKey) === null) return { kind: 'malformed' };

    const nonce = this.deps.randomNonce();
    const request: ActivateRequest = {
      deviceId: this.deviceId,
      nonce,
      appVersion: this.deps.appVersion,
      platform: this.deps.platform,
      activationKey: rawKey,
    };
    if (this.weakIdentity) request.fingerprint = 'weak';
    if (this.record.deviceSecret) request.deviceSecret = this.record.deviceSecret;

    let result: KeyRedeemResult;
    try {
      result = await this.deps.client.redeemActivationKey(request);
    } catch (error) {
      this.log('redeemActivationKey failed unexpectedly', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { kind: 'offline' };
    }

    if (result.kind === 'ok') {
      const applied = this.acceptToken(result.data.token, result.data.deviceSecret, nonce);
      this.emitStatus();
      return applied ? { kind: 'ok' } : { kind: 'offline' };
    }
    if (result.kind === 'offline') return { kind: 'offline' };
    return result;
  }

  getCheckoutState(): CheckoutState {
    return this.checkoutState;
  }

  /**
   * Starts a checkout for `plan` (the Upgrade/Renew button). The price is decided server-side; this never
   * sends an amount. Refuses to start a second session while one is already pending — the caller should show
   * the existing waiting state instead (checking `getCheckoutState()` before offering the button at all).
   */
  async startCheckout(plan: string): Promise<CheckoutStartResult> {
    if (!this.started) return { kind: 'offline' };
    if (this.checkoutState.phase === 'pending') return { kind: 'already_pending' };
    // No secret yet means this device has never successfully activated -- nothing to authenticate a checkout
    // session with. Should not be reachable from the UI (the Upgrade button only shows once licensed at all).
    if (!this.record.deviceSecret) return { kind: 'offline' };

    const result = await this.deps.client.createCheckoutSession({
      deviceId: this.deviceId,
      deviceSecret: this.record.deviceSecret,
      appVersion: this.deps.appVersion,
      platform: this.deps.platform,
      plan,
    });
    if (result.kind === 'rejected') return { kind: 'rejected' };
    if (result.kind === 'unknown_plan') return { kind: 'unknown_plan' };
    if (result.kind === 'offline') return { kind: 'offline' };

    const expiresAtMs = Date.parse(result.data.expiresAt);
    this.checkoutSessionId = result.data.sessionId;
    this.checkoutStartedAtMs = this.deps.now();
    this.record = {
      ...this.record,
      pendingCheckoutSessionId: result.data.sessionId,
      pendingCheckoutExpiresAtMs: Number.isFinite(expiresAtMs) ? expiresAtMs : null,
    };
    this.persist();
    this.checkoutState = { phase: 'pending', checkoutUrl: result.data.checkoutUrl };
    this.emitCheckoutState();
    this.scheduleNextCheckoutPoll();
    return { kind: 'ok', checkoutUrl: result.data.checkoutUrl };
  }

  /** Cancel (while pending) and Close (after a terminal outcome) are the same action: stop polling if any is
   *  running, forget the pending session, and go back to idle. */
  cancelCheckout(): void {
    this.stopCheckoutPolling();
    this.checkoutSessionId = null;
    if (this.record.pendingCheckoutSessionId !== null) {
      this.record = {
        ...this.record,
        pendingCheckoutSessionId: null,
        pendingCheckoutExpiresAtMs: null,
      };
      this.persist();
    }
    this.checkoutState = IDLE_CHECKOUT;
    this.emitCheckoutState();
  }

  /** An extra, out-of-schedule check — called when the app window regains focus, since that is exactly when
   *  the person plausibly just finished paying in the system browser and switched back. */
  pollCheckoutNow(): void {
    if (this.checkoutState.phase !== 'pending') return;
    this.stopCheckoutPolling();
    void this.pollCheckoutOnce();
  }

  private stopCheckoutPolling(): void {
    if (this.checkoutTimer) {
      clearTimeout(this.checkoutTimer);
      this.checkoutTimer = null;
    }
  }

  private scheduleNextCheckoutPoll(): void {
    this.stopCheckoutPolling();
    const now = this.deps.now();
    const expiresAtMs = this.record.pendingCheckoutExpiresAtMs;
    if (expiresAtMs !== null && now >= expiresAtMs + CHECKOUT_EXPIRY_GRACE_MS) {
      // Long past expiry with no terminal answer: stop polling for good. A truly lost webhook past this point
      // is what the service's own reconciliation job is for, not indefinite client-side polling.
      this.finishCheckout('expired');
      return;
    }
    const elapsed = now - this.checkoutStartedAtMs;
    const delay =
      elapsed < CHECKOUT_FAST_WINDOW_MS ? CHECKOUT_FAST_INTERVAL_MS : CHECKOUT_SLOW_INTERVAL_MS;
    this.checkoutTimer = setTimeout(() => void this.pollCheckoutOnce(), delay);
  }

  private async pollCheckoutOnce(): Promise<void> {
    const sessionId = this.checkoutSessionId;
    if (!sessionId || this.checkoutState.phase !== 'pending') return;

    const nonce = this.deps.randomNonce();
    let result: CheckoutPollResult;
    try {
      result = await this.deps.client.pollCheckoutSession(sessionId, {
        deviceId: this.deviceId,
        deviceSecret: this.record.deviceSecret ?? '',
        nonce,
        appVersion: this.deps.appVersion,
        platform: this.deps.platform,
      });
    } catch (error) {
      this.log('checkout poll failed unexpectedly', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.scheduleNextCheckoutPoll();
      return;
    }
    // The session may have been cancelled while this request was in flight.
    if (this.checkoutSessionId !== sessionId || this.checkoutState.phase !== 'pending') return;

    // offline/rejected are both transient from the poller's point of view: a real payment provider outage or a
    // momentary blip must never surface as "failed" — only a genuine terminal status from the service does.
    if (result.kind === 'offline' || result.kind === 'rejected') {
      this.scheduleNextCheckoutPoll();
      return;
    }
    if (result.kind === 'not_found') {
      // Gone (long expired and forgotten, or never valid) -- nothing more to learn by asking again.
      this.finishCheckout('expired');
      return;
    }

    const { status, token } = result.data;
    if (status === 'pending') {
      this.scheduleNextCheckoutPoll();
      return;
    }
    if (status === 'paid') {
      // A "paid" status without a verifiable token is never trusted on its own (only a signature-verified,
      // nonce-matched response may change entitlement) -- keep polling; the next background validate() will
      // pick up the new entitlement even if this particular response was malformed.
      if (token && this.acceptToken(token, undefined, nonce)) {
        this.finishCheckout('paid');
      } else {
        this.scheduleNextCheckoutPoll();
      }
      return;
    }
    this.finishCheckout(status); // 'failed' | 'expired'
  }

  private finishCheckout(phase: 'paid' | 'failed' | 'expired'): void {
    this.stopCheckoutPolling();
    this.checkoutSessionId = null;
    if (this.record.pendingCheckoutSessionId !== null) {
      this.record = {
        ...this.record,
        pendingCheckoutSessionId: null,
        pendingCheckoutExpiresAtMs: null,
      };
      this.persist();
    }
    this.checkoutState = { phase, checkoutUrl: null };
    this.emitCheckoutState();
    if (phase === 'paid') this.emitStatus(); // entitlement just changed
  }

  private emitCheckoutState(): void {
    const serialized = JSON.stringify(this.checkoutState);
    if (serialized === this.lastEmittedCheckout) return;
    this.lastEmittedCheckout = serialized;
    this.emit('checkoutState', this.checkoutState);
  }

  /** Re-evaluates against the current time and notifies listeners if anything visible changed. */
  reevaluate(): void {
    this.emitStatus();
  }

  /** Contacts the service. Never throws and never rejects; concurrent calls share one request. */
  refresh(): Promise<void> {
    if (!this.started) return Promise.resolve();
    if (!this.inFlight) {
      this.inFlight = this.doRefresh().finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }

  private async doRefresh(): Promise<void> {
    try {
      await this.exchange();
    } catch (error) {
      this.offline = true;
      this.log('refresh failed unexpectedly', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    this.emitStatus();
  }

  private async exchange(): Promise<void> {
    if (this.record.deviceSecret) {
      const nonce = this.deps.randomNonce();
      const validated = await this.deps.client.validate({
        deviceId: this.deviceId,
        deviceSecret: this.record.deviceSecret,
        nonce,
        appVersion: this.deps.appVersion,
        platform: this.deps.platform,
      });
      if (validated.kind === 'ok') {
        this.acceptToken(validated.data.token, undefined, nonce);
        return;
      }
      if (validated.kind === 'offline') return this.markOffline(validated.reason);
      // rejected: the service does not know this device/secret pair, so recover by activating again.
    }

    const nonce = this.deps.randomNonce();
    const activated: ClientResult<{ token: string; deviceSecret?: string }> =
      await this.deps.client.activate(this.buildActivateRequest(nonce));
    if (activated.kind === 'ok') {
      this.acceptToken(activated.data.token, activated.data.deviceSecret, nonce);
      return;
    }
    // A rejected activation (owned device without its secret) needs the activation-key flow; until that exists
    // it is handled like being offline so it can never lock anyone out on its own.
    this.markOffline(activated.kind === 'rejected' ? 'activation_rejected' : activated.reason);
  }

  /** Returns whether the response was actually applied — false for an untrusted/unmatched token, which is
   *  always treated as 'offline' by callers, never as a rejection or a silent no-op success. */
  private acceptToken(token: string, newSecret: string | undefined, nonce: string): boolean {
    const verdict = verifyLicenseToken(token, {
      publicKeys: this.deps.publicKeys,
      expectedDeviceId: this.deviceId,
      expectedNonce: nonce,
      nowMs: this.deps.now(),
      highWaterMarkSec: this.record.highWaterMarkSec,
      trustServerClock: true,
    });
    if (verdict.ok === false) {
      this.log('ignored an unacceptable service response', { reason: verdict.reason });
      this.offline = true;
      return false;
    }

    this.record = {
      ...this.record,
      token,
      deviceSecret: newSecret ?? this.record.deviceSecret,
      highWaterMarkSec: Math.max(this.record.highWaterMarkSec, verdict.claims.iat),
      // The service now owns the trial clock.
      provisionalStartedAtMs: null,
      lastValidatedAtMs: this.deps.now(),
    };
    this.persist();
    this.claims = verdict.claims;
    this.offline = false;
    return true;
  }

  private markOffline(reason: string): void {
    this.offline = true;
    this.log('service unreachable or unusable; keeping cached license', { reason });
  }

  private buildActivateRequest(nonce: string): ActivateRequest {
    const request: ActivateRequest = {
      deviceId: this.deviceId,
      nonce,
      appVersion: this.deps.appVersion,
      platform: this.deps.platform,
    };
    if (this.weakIdentity) request.fingerprint = 'weak';
    if (this.record.provisionalStartedAtMs !== null) {
      request.provisionalStartedAt = new Date(this.record.provisionalStartedAtMs).toISOString();
    }
    if (this.record.token === null && this.deps.isLegacyInstall()) request.legacy = true;
    return request;
  }

  /** Verifies the stored token without network. A token that fails (edited, other machine's) is simply ignored. */
  private loadCachedClaims(): TokenClaims | null {
    if (!this.record.token) return null;
    const verdict = verifyLicenseToken(this.record.token, {
      publicKeys: this.deps.publicKeys,
      expectedDeviceId: this.deviceId,
      nowMs: this.effectiveNowMs(),
      allowExpired: true,
    });
    if (verdict.ok === true) return verdict.claims;
    this.log('cached license token rejected', { reason: verdict.reason });
    return null;
  }

  private async resolveIdentity(record: DeviceRecord): Promise<void> {
    const machineId = await this.deps.readMachineId();
    if (machineId) {
      this.deviceId = deriveDeviceId(machineId);
      this.weakIdentity = false;
      return;
    }
    if (!record.fallbackMachineId) record.fallbackMachineId = this.deps.randomHex(32);
    this.deviceId = deriveDeviceId(record.fallbackMachineId);
    this.weakIdentity = true;
  }

  private effectiveNowMs(): number {
    return Math.max(this.deps.now(), this.record.highWaterMarkSec * 1000);
  }

  private persist(): void {
    try {
      this.deps.store.write(this.record);
    } catch (error) {
      this.log('could not persist license record', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private emitStatus(): void {
    const status = this.getStatus();
    const serialized = JSON.stringify(status);
    if (serialized === this.lastEmitted) return;
    this.lastEmitted = serialized;
    this.emit('status', status);
  }

  private log(message: string, fields?: Record<string, unknown>): void {
    this.deps.log?.(message, fields);
  }
}
