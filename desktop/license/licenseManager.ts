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
import type { ClientResult, KeyRedeemResult, LicenseClient } from './licenseClient';
import {
  evaluateLicense,
  toSalesDecision,
  type LicenseStatusDto,
  type SalesDecision,
} from './licensePolicy';
import { deriveDeviceId } from './machineId';

type ClientLike = Pick<LicenseClient, 'activate' | 'validate' | 'redeemActivationKey'>;

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

export class LicenseManager extends EventEmitter {
  private record: DeviceRecord = emptyRecord();
  private deviceId = '';
  private weakIdentity = false;
  private claims: TokenClaims | null = null;
  private offline = false;
  private started = false;
  private inFlight: Promise<void> | null = null;
  private lastEmitted = '';

  constructor(private readonly deps: LicenseManagerDeps) {
    super();
  }

  /** Loads the cached state and evaluates it immediately (no network), so the app never waits on the service. */
  async start(): Promise<void> {
    const record = this.deps.store.read();
    await this.resolveIdentity(record);
    this.record = record;
    this.claims = this.loadCachedClaims();

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
