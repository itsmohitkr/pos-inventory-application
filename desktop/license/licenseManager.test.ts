import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ActivateRequest,
  CreateCheckoutSessionRequest,
  LicenseStatus,
  PollCheckoutSessionRequest,
  ValidateRequest,
} from '@trovix/license-contract';
import type {
  CheckoutCreateResult,
  CheckoutPollResult,
  ClientResult,
  KeyRedeemResult,
} from './licenseClient';
import { LicenseManager } from './licenseManager';
import { deriveDeviceId } from './machineId';
import { DAY, MemoryStore, NOW, SECRET, issueToken, makeKeys, type TokenSpec } from './testUtils';

type Reply = ClientResult<{ token: string; deviceSecret?: string }>;
type Script<Req> = (request: Req) => Reply | Promise<Reply>;
type CheckoutCreateScript = (
  request: CreateCheckoutSessionRequest
) => CheckoutCreateResult | Promise<CheckoutCreateResult>;
type CheckoutPollScript = (
  request: PollCheckoutSessionRequest
) => CheckoutPollResult | Promise<CheckoutPollResult>;

const MACHINE = 'machine-1';
const DEVICE_ID = deriveDeviceId(MACHINE);

interface Options {
  machineId?: string | null;
  legacy?: boolean;
  defaultEnforcement?: 'off' | 'warn' | 'on';
  store?: MemoryStore;
  keys?: ReturnType<typeof makeKeys>;
}

const setup = (options: Options = {}) => {
  const keys = options.keys ?? makeKeys();
  const store = options.store ?? new MemoryStore();
  const clock = { now: NOW };
  const activateCalls: ActivateRequest[] = [];
  const validateCalls: ValidateRequest[] = [];
  const redeemCalls: ActivateRequest[] = [];
  const checkoutCreateCalls: CreateCheckoutSessionRequest[] = [];
  const checkoutPollCalls: PollCheckoutSessionRequest[] = [];
  const activateScript: Array<Script<ActivateRequest>> = [];
  const validateScript: Array<Script<ValidateRequest>> = [];
  const redeemScript: Array<
    (request: ActivateRequest) => KeyRedeemResult | Promise<KeyRedeemResult>
  > = [];
  const checkoutCreateScript: CheckoutCreateScript[] = [];
  const checkoutPollScript: CheckoutPollScript[] = [];
  let nonceCounter = 0;

  const manager = new LicenseManager({
    client: {
      activate: async (request) => {
        activateCalls.push(request);
        const next = activateScript.shift();
        return next ? next(request) : { kind: 'offline', reason: 'unscripted' };
      },
      validate: async (request) => {
        validateCalls.push(request);
        const next = validateScript.shift();
        return next ? next(request) : { kind: 'offline', reason: 'unscripted' };
      },
      redeemActivationKey: async (request) => {
        redeemCalls.push(request);
        const next = redeemScript.shift();
        return next ? next(request) : { kind: 'offline', reason: 'unscripted' };
      },
      createCheckoutSession: async (request) => {
        checkoutCreateCalls.push(request);
        const next = checkoutCreateScript.shift();
        return next ? next(request) : { kind: 'offline', reason: 'unscripted' };
      },
      pollCheckoutSession: async (_sessionId, request) => {
        checkoutPollCalls.push(request);
        const next = checkoutPollScript.shift();
        return next ? next(request) : { kind: 'offline', reason: 'unscripted' };
      },
    },
    store,
    publicKeys: keys.publicKeys,
    readMachineId: async () => (options.machineId === undefined ? MACHINE : options.machineId),
    appVersion: '1.0.255',
    platform: 'darwin',
    now: () => clock.now,
    randomNonce: () => `nonce${String((nonceCounter += 1)).padStart(17, '0')}`,
    randomHex: () => 'f'.repeat(64),
    isLegacyInstall: () => options.legacy ?? false,
    defaultEnforcement: options.defaultEnforcement ?? 'warn',
  });

  const okReply =
    (spec: {
      st?: LicenseStatus;
      tendMs?: number | null;
      guMs?: number | null;
      enf?: 'off' | 'warn' | 'on';
      secret?: string;
      at?: number;
    }) =>
    (request: { deviceId: string; nonce: string }): Reply => ({
      kind: 'ok',
      data: {
        token: issueToken(keys, {
          deviceId: request.deviceId,
          nonce: request.nonce,
          nowMs: spec.at ?? clock.now,
          ...spec,
        }),
        ...(spec.secret ? { deviceSecret: spec.secret } : {}),
      },
    });

  /** A real, correctly signed token for a poll response's `paid` status — never a placeholder string, so
   *  checkout tests exercise the exact same signature-verification path as activate()/validate(). */
  const paidToken = (
    nonce: string,
    spec: Partial<Omit<TokenSpec, 'deviceId' | 'nonce'>> = {}
  ): string =>
    issueToken(keys, {
      deviceId: DEVICE_ID,
      nonce,
      nowMs: clock.now,
      st: 'active',
      ...spec,
    });

  return {
    manager,
    keys,
    store,
    clock,
    activateCalls,
    validateCalls,
    redeemCalls,
    checkoutCreateCalls,
    checkoutPollCalls,
    activateScript,
    validateScript,
    redeemScript,
    checkoutCreateScript,
    checkoutPollScript,
    okReply,
    paidToken,
  };
};

/** Boots a manager that has already completed a first successful activation. */
const activated = async (
  options: Options & { spec?: Parameters<ReturnType<typeof setup>['okReply']>[0] } = {}
) => {
  const ctx = setup(options);
  await ctx.manager.start();
  ctx.activateScript.push(ctx.okReply({ secret: SECRET, ...options.spec }));
  await ctx.manager.refresh();
  return ctx;
};

describe('first launch', () => {
  it('offline: starts a bounded provisional trial, allows sales and persists the start', async () => {
    const ctx = setup();
    await ctx.manager.start();

    expect(ctx.manager.getStatus()).toMatchObject({
      mode: 'trialing',
      provisional: true,
      salesAllowed: true,
      daysLeft: 7,
    });
    expect(ctx.store.record.provisionalStartedAtMs).toBe(NOW);
    expect(ctx.activateCalls).toHaveLength(0);

    await ctx.manager.refresh();
    expect(ctx.manager.getStatus()).toMatchObject({ provisional: true, offline: true });
  });

  it('online: activates, verifies the response, persists token and secret, and clears the provisional trial', async () => {
    const ctx = setup();
    await ctx.manager.start();
    ctx.activateScript.push(ctx.okReply({ secret: SECRET }));
    await ctx.manager.refresh();

    const request = ctx.activateCalls[0]!;
    expect(request).toMatchObject({
      deviceId: DEVICE_ID,
      appVersion: '1.0.255',
      platform: 'darwin',
    });
    expect(request.provisionalStartedAt).toBe(new Date(NOW).toISOString());
    expect(request.deviceSecret).toBeUndefined();

    expect(ctx.manager.getStatus()).toMatchObject({
      mode: 'trialing',
      provisional: false,
      offline: false,
      daysLeft: 7,
    });
    expect(ctx.store.record).toMatchObject({
      deviceSecret: SECRET,
      provisionalStartedAtMs: null,
      lastValidatedAtMs: NOW,
    });
    expect(ctx.store.record.token).toBeTruthy();
    expect(ctx.store.record.highWaterMarkSec).toBe(Math.floor(NOW / 1000));
  });

  it('claims legacy status only on a first activation of a pre-existing install', async () => {
    const legacy = setup({ legacy: true });
    await legacy.manager.start();
    await legacy.manager.refresh();
    expect(legacy.activateCalls[0]!.legacy).toBe(true);

    const fresh = setup({ legacy: false });
    await fresh.manager.start();
    await fresh.manager.refresh();
    expect(fresh.activateCalls[0]!.legacy).toBeUndefined();
  });

  it('uses a persisted fallback identity and flags it weak when the machine id cannot be read', async () => {
    const ctx = setup({ machineId: null });
    await ctx.manager.start();
    await ctx.manager.refresh();
    expect(ctx.activateCalls[0]).toMatchObject({
      fingerprint: 'weak',
      deviceId: deriveDeviceId('f'.repeat(64)),
    });
    expect(ctx.store.record.fallbackMachineId).toBe('f'.repeat(64));
  });
});

describe('subsequent launches', () => {
  it('evaluates the cached token immediately with no network call', async () => {
    const first = await activated();
    const restarted = setup({ store: first.store, keys: first.keys });
    await restarted.manager.start();

    expect(restarted.manager.getStatus()).toMatchObject({
      mode: 'trialing',
      provisional: false,
      daysLeft: 7,
    });
    expect(restarted.activateCalls).toHaveLength(0);
    expect(restarted.validateCalls).toHaveLength(0);
  });

  it('refreshes with validate using the stored secret and advances the high-water mark', async () => {
    const ctx = await activated();
    ctx.clock.now = NOW + DAY;
    ctx.validateScript.push(ctx.okReply({}));
    await ctx.manager.refresh();

    expect(ctx.validateCalls[0]).toMatchObject({ deviceId: DEVICE_ID, deviceSecret: SECRET });
    expect(ctx.store.record.highWaterMarkSec).toBe(Math.floor((NOW + DAY) / 1000));
    expect(ctx.manager.getStatus().daysLeft).toBe(7);
  });

  it('recovers by activating again when the service does not recognize the device', async () => {
    const ctx = await activated();
    ctx.validateScript.push(() => ({ kind: 'rejected' }));
    ctx.activateScript.push(ctx.okReply({ secret: 'r'.repeat(43) }));
    await ctx.manager.refresh();

    expect(ctx.activateCalls).toHaveLength(2);
    expect(ctx.store.record.deviceSecret).toBe('r'.repeat(43));
    expect(ctx.manager.getStatus().offline).toBe(false);
  });

  it('a rejected re-activation never reduces entitlement', async () => {
    const ctx = await activated();
    ctx.validateScript.push(() => ({ kind: 'rejected' }));
    ctx.activateScript.push(() => ({ kind: 'rejected' }));
    await ctx.manager.refresh();
    expect(ctx.manager.getStatus()).toMatchObject({
      mode: 'trialing',
      offline: true,
      salesAllowed: true,
    });
  });
});

describe('an unreachable service never reduces entitlement', () => {
  it('keeps the cached license and reports offline', async () => {
    const ctx = await activated();
    ctx.validateScript.push(() => ({ kind: 'offline', reason: 'network' }));
    await ctx.manager.refresh();
    expect(ctx.manager.getStatus()).toMatchObject({
      mode: 'trialing',
      offline: true,
      salesAllowed: true,
    });
  });

  it('only degrades once the token is older than its expiry plus the offline grace', async () => {
    const ctx = await activated({ defaultEnforcement: 'on', spec: { enf: 'on' } });
    ctx.clock.now = NOW + 6 * DAY;
    expect(ctx.manager.getStatus().mode).not.toBe('unverified');
    ctx.clock.now = NOW + 8 * DAY;
    expect(ctx.manager.getStatus()).toMatchObject({ mode: 'unverified', salesAllowed: false });
    expect(ctx.manager.evaluateSalesGate()).toMatchObject({
      allowed: false,
      reason: 'LICENSE_UNVERIFIED',
    });
  });

  it('shares a single request between concurrent refreshes', async () => {
    const ctx = await activated();
    let release: (reply: Reply) => void = () => undefined;
    ctx.validateScript.push(() => new Promise<Reply>((resolve) => (release = resolve)));
    const a = ctx.manager.refresh();
    const b = ctx.manager.refresh();
    release({ kind: 'offline', reason: 'network' });
    await Promise.all([a, b]);
    expect(ctx.validateCalls).toHaveLength(1);
  });
});

describe('hostile responses are ignored', () => {
  it('a token signed by an unknown key', async () => {
    const ctx = await activated();
    const attacker = makeKeys('k1');
    ctx.validateScript.push((request) => ({
      kind: 'ok',
      data: {
        token: issueToken(attacker, {
          deviceId: request.deviceId,
          nonce: request.nonce,
          nowMs: NOW,
          st: 'active',
          tendMs: null,
          pendMs: NOW + 365 * DAY,
        }),
      },
    }));
    const before = ctx.store.record.token;
    await ctx.manager.refresh();

    expect(ctx.manager.getStatus()).toMatchObject({ mode: 'trialing', offline: true });
    expect(ctx.store.record.token).toBe(before);
  });

  it('a replayed response whose nonce does not match the request', async () => {
    const ctx = await activated();
    ctx.validateScript.push((request) => ({
      kind: 'ok',
      data: {
        token: issueToken(ctx.keys, {
          deviceId: request.deviceId,
          nonce: 'someOtherNonce000000000',
          nowMs: NOW + DAY,
          st: 'active',
          tendMs: null,
          pendMs: NOW + 365 * DAY,
        }),
      },
    }));
    await ctx.manager.refresh();
    expect(ctx.manager.getStatus()).toMatchObject({ mode: 'trialing', offline: true });
  });

  it('a genuine but older token (replay of an earlier "active" answer after a newer one was accepted)', async () => {
    const ctx = await activated();
    ctx.clock.now = NOW + 2 * DAY;
    ctx.validateScript.push(ctx.okReply({ st: 'revoked', tendMs: null, guMs: null }));
    await ctx.manager.refresh();
    expect(ctx.manager.getStatus().mode).toBe('revoked');

    ctx.clock.now = NOW + 3 * DAY;
    ctx.validateScript.push((request) => ({
      kind: 'ok',
      data: {
        token: issueToken(ctx.keys, {
          deviceId: request.deviceId,
          nonce: request.nonce,
          nowMs: NOW,
          st: 'trialing',
        }),
      },
    }));
    await ctx.manager.refresh();
    expect(ctx.manager.getStatus()).toMatchObject({ mode: 'revoked', offline: true });
  });

  it('a token issued for a different device', async () => {
    const ctx = setup();
    await ctx.manager.start();
    ctx.activateScript.push((request) => ({
      kind: 'ok',
      data: {
        token: issueToken(ctx.keys, { deviceId: 'b'.repeat(64), nonce: request.nonce, nowMs: NOW }),
        deviceSecret: SECRET,
      },
    }));
    await ctx.manager.refresh();
    expect(ctx.store.record.token).toBeNull();
    expect(ctx.store.record.deviceSecret).toBeNull();
    expect(ctx.manager.getStatus()).toMatchObject({ provisional: true, offline: true });
  });
});

describe('tampering with the local record', () => {
  it('a token copied from another machine is ignored and starts a provisional trial, not unlimited use', async () => {
    const keys = makeKeys();
    const store = new MemoryStore();
    store.record.token = issueToken(keys, {
      deviceId: 'c'.repeat(64),
      nonce: 'n'.repeat(22),
      nowMs: NOW,
      st: 'active',
      tendMs: null,
      pendMs: NOW + 365 * DAY,
    });
    store.record.deviceSecret = SECRET;
    const ctx = setup({ store, keys });
    await ctx.manager.start();
    expect(ctx.manager.getStatus()).toMatchObject({ mode: 'trialing', provisional: true });
  });

  it('an edited token payload is ignored', async () => {
    const first = await activated();
    const [h, p, s] = first.store.record.token!.split('.') as [string, string, string];
    const edited = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    edited.st = 'active';
    first.store.record.token = `${h}.${Buffer.from(JSON.stringify(edited)).toString('base64url')}.${s}`;
    const restarted = setup({ store: first.store, keys: first.keys });
    await restarted.manager.start();
    expect(restarted.manager.getStatus().mode).toBe('trialing');
    expect(restarted.manager.getStatus().provisional).toBe(true);
  });

  it('rolling the clock back cannot extend a trial: time never runs earlier than the last server time', async () => {
    const first = await activated();
    const restarted = setup({ store: first.store, keys: first.keys });
    restarted.clock.now = NOW - 5 * DAY;
    await restarted.manager.start();
    expect(restarted.manager.getStatus()).toMatchObject({
      mode: 'trialing',
      provisional: false,
      daysLeft: 7,
      clockSuspect: true,
    });
  });

  it('a wrong local clock does not stop a genuine live response being accepted', async () => {
    const ctx = setup();
    await ctx.manager.start();
    ctx.clock.now = NOW - 30 * DAY;
    ctx.activateScript.push((request) => ({
      kind: 'ok',
      data: {
        token: issueToken(ctx.keys, {
          deviceId: request.deviceId,
          nonce: request.nonce,
          nowMs: NOW,
        }),
        deviceSecret: SECRET,
      },
    }));
    await ctx.manager.refresh();
    expect(ctx.manager.getStatus()).toMatchObject({
      mode: 'trialing',
      offline: false,
      clockSuspect: true,
    });
  });

  it('a corrupt record file behaves like a fresh install', async () => {
    const ctx = setup();
    await ctx.manager.start();
    expect(ctx.manager.getStatus().mode).toBe('trialing');
  });
});

describe('the passage of time (enforcement on)', () => {
  it('trial -> grace (warning, still selling) -> lapsed (blocked)', async () => {
    const ctx = await activated({
      spec: { st: 'lapsed', tendMs: NOW - DAY, guMs: NOW + 6 * DAY, enf: 'on' },
    });

    expect(ctx.manager.getStatus()).toMatchObject({ mode: 'grace', salesAllowed: true });
    expect(ctx.manager.evaluateSalesGate()).toEqual({ allowed: true });

    ctx.clock.now = NOW + 2 * DAY;
    expect(ctx.manager.getStatus().mode).toBe('grace');

    ctx.clock.now = NOW + 6 * DAY + 60_000;
    expect(ctx.manager.getStatus()).toMatchObject({ mode: 'lapsed', salesAllowed: false });
    expect(ctx.manager.evaluateSalesGate()).toMatchObject({
      allowed: false,
      reason: 'LICENSE_EXPIRED',
    });
  });

  it('warn mode never blocks, even long after expiry', async () => {
    const ctx = await activated({
      spec: { st: 'lapsed', tendMs: NOW - 10 * DAY, guMs: NOW - 3 * DAY, enf: 'warn' },
    });
    expect(ctx.manager.getStatus()).toMatchObject({
      mode: 'lapsed',
      wouldBlock: true,
      salesAllowed: true,
    });
    expect(ctx.manager.evaluateSalesGate()).toEqual({ allowed: true });
  });

  it('a revocation delivered by the service takes effect immediately', async () => {
    const ctx = await activated({ spec: { enf: 'on' } });
    ctx.validateScript.push(ctx.okReply({ st: 'revoked', tendMs: null, guMs: null, enf: 'on' }));
    await ctx.manager.refresh();
    expect(ctx.manager.evaluateSalesGate()).toMatchObject({
      allowed: false,
      reason: 'LICENSE_REVOKED',
    });
  });

  it('the kill-switch (enf=off) lifts an existing block on the next refresh', async () => {
    const ctx = await activated({
      spec: { st: 'lapsed', tendMs: NOW - 10 * DAY, guMs: NOW - 3 * DAY, enf: 'on' },
    });
    expect(ctx.manager.evaluateSalesGate().allowed).toBe(false);
    ctx.validateScript.push(
      ctx.okReply({ st: 'lapsed', tendMs: NOW - 10 * DAY, guMs: NOW - 3 * DAY, enf: 'off' })
    );
    await ctx.manager.refresh();
    expect(ctx.manager.evaluateSalesGate()).toEqual({ allowed: true });
  });
});

describe('status events', () => {
  it('emits only when something visible changed', async () => {
    const ctx = setup();
    const events: unknown[] = [];
    ctx.manager.on('status', (status) => events.push(status));

    await ctx.manager.start();
    const afterStart = events.length;
    ctx.manager.reevaluate();
    ctx.manager.reevaluate();
    expect(events).toHaveLength(afterStart);

    ctx.activateScript.push(ctx.okReply({ secret: SECRET }));
    await ctx.manager.refresh();
    expect(events.length).toBeGreaterThan(afterStart);
  });

  it('refresh before start is a harmless no-op', async () => {
    const ctx = setup();
    await ctx.manager.refresh();
    expect(ctx.activateCalls).toHaveLength(0);
  });
});

describe('redeeming an activation key', () => {
  const GOOD_KEY = '0WD2T-G2KCS-WRS7X-JRQCE-DN'; // well-formed test vector, checksum-valid
  const MALFORMED = 'not-a-real-key';

  it('rejects a malformed key locally: no network call, no status change', async () => {
    const ctx = setup();
    await ctx.manager.start();
    const before = ctx.manager.getStatus();

    const outcome = await ctx.manager.redeemActivationKey(MALFORMED);

    expect(outcome).toEqual({ kind: 'malformed' });
    expect(ctx.redeemCalls).toHaveLength(0);
    expect(ctx.manager.getStatus()).toEqual(before);
  });

  it('on success: verifies the token, updates status, and persists a returned secret', async () => {
    const ctx = setup();
    await ctx.manager.start();
    ctx.redeemScript.push(() => ({
      kind: 'ok',
      data: {
        token: issueToken(ctx.keys, {
          deviceId: DEVICE_ID,
          nonce: 'nonce00000000000000001',
          nowMs: ctx.clock.now,
          st: 'active',
        }),
        deviceSecret: SECRET,
      },
    }));

    const outcome = await ctx.manager.redeemActivationKey(GOOD_KEY);

    expect(outcome).toEqual({ kind: 'ok' });
    expect(ctx.manager.getStatus()).toMatchObject({ mode: 'active', salesAllowed: true });
    expect(ctx.store.record.deviceSecret).toBe(SECRET);
  });

  it('sends the CURRENT device secret when one exists, so an owned device is not misrouted into recovery', async () => {
    const ctx = await activated();
    ctx.redeemScript.push(ctx.okReply({ st: 'active', secret: SECRET }));

    await ctx.manager.redeemActivationKey(GOOD_KEY);

    expect(ctx.redeemCalls[0]).toMatchObject({ deviceSecret: SECRET, activationKey: GOOD_KEY });
  });

  it('sends no deviceSecret for a fresh trial device (there is none yet)', async () => {
    const ctx = setup();
    await ctx.manager.start();
    ctx.redeemScript.push(ctx.okReply({ st: 'active', secret: SECRET }));

    await ctx.manager.redeemActivationKey(GOOD_KEY);

    expect(ctx.redeemCalls[0]!.deviceSecret).toBeUndefined();
    expect(ctx.redeemCalls[0]!.activationKey).toBe(GOOD_KEY);
  });

  it.each(['invalid_key', 'seat_limit_reached', 'device_already_licensed'] as const)(
    'passes a %s verdict straight through, and does not touch the cached status',
    async (kind) => {
      const ctx = setup();
      await ctx.manager.start();
      const before = ctx.manager.getStatus();
      ctx.redeemScript.push(() => ({ kind }));

      const outcome = await ctx.manager.redeemActivationKey(GOOD_KEY);

      expect(outcome).toEqual({ kind });
      expect(ctx.manager.getStatus()).toEqual(before);
    }
  );

  it('an offline result from the client never changes entitlement', async () => {
    const ctx = setup();
    await ctx.manager.start();
    const before = ctx.manager.getStatus();
    ctx.redeemScript.push(() => ({ kind: 'offline', reason: 'network' }));

    const outcome = await ctx.manager.redeemActivationKey(GOOD_KEY);

    expect(outcome).toEqual({ kind: 'offline' });
    expect(ctx.manager.getStatus()).toEqual(before);
  });

  it('a client that throws is treated as offline, never crashes', async () => {
    const ctx = setup();
    await ctx.manager.start();
    ctx.redeemScript.push(() => {
      throw new Error('boom');
    });

    await expect(ctx.manager.redeemActivationKey(GOOD_KEY)).resolves.toEqual({ kind: 'offline' });
  });

  it('a response that fails signature/nonce verification is treated as offline, not applied', async () => {
    const ctx = setup();
    await ctx.manager.start();
    const otherKeys = makeKeys();
    ctx.redeemScript.push(() => ({
      kind: 'ok',
      data: {
        token: issueToken(otherKeys, {
          deviceId: DEVICE_ID,
          nonce: 'nonce00000000000000001',
          nowMs: ctx.clock.now,
          st: 'active',
        }),
      },
    }));

    const outcome = await ctx.manager.redeemActivationKey(GOOD_KEY);

    // acceptToken() rejects it internally (untrusted signer): the outcome is honestly reported as offline, not
    // a false 'ok', since nothing was actually applied.
    expect(outcome).toEqual({ kind: 'offline' });
    expect(ctx.manager.getStatus().mode).not.toBe('active');
  });

  it('before start(), redeeming is a safe no-op reported as offline', async () => {
    const ctx = setup();
    const outcome = await ctx.manager.redeemActivationKey(GOOD_KEY);
    expect(outcome).toEqual({ kind: 'offline' });
    expect(ctx.redeemCalls).toHaveLength(0);
  });
});

describe('checkout (P6.5)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Advances both vitest's fake timers (so scheduled polls fire) and the manager's own injected clock (so its
   *  elapsed-time cadence math sees the same passage of time) — the two are deliberately separate in this
   *  suite's `now: () => clock.now`, so they must be moved together or `elapsed` never changes. Stepped in
   *  small increments, not one lump jump: a poll firing partway through a large advance must see `now()` at
   *  the moment IT fires, not the final target time, or every poll mid-advance sees the same (wrong) elapsed
   *  time and the fast/slow cadence boundary can never be observed correctly. */
  const advance = async (ctx: { clock: { now: number } }, ms: number): Promise<void> => {
    const STEP = 250;
    let remaining = ms;
    while (remaining > 0) {
      const step = Math.min(STEP, remaining);
      ctx.clock.now += step;
      await vi.advanceTimersByTimeAsync(step);
      remaining -= step;
    }
  };

  const CHECKOUT_RESPONSE = {
    sessionId: 'sess_abc123',
    checkoutUrl: 'https://rzp.io/i/xyz',
    expiresAt: new Date(NOW + 30 * 60 * 1000).toISOString(),
  };

  it('starts a checkout, persists the session, and reports it pending with the checkout URL', async () => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));

    const result = await ctx.manager.startCheckout('monthly');

    expect(result).toEqual({ kind: 'ok', checkoutUrl: CHECKOUT_RESPONSE.checkoutUrl });
    expect(ctx.manager.getCheckoutState()).toEqual({
      phase: 'pending',
      checkoutUrl: CHECKOUT_RESPONSE.checkoutUrl,
    });
    expect(ctx.checkoutCreateCalls[0]).toMatchObject({
      deviceId: DEVICE_ID,
      deviceSecret: SECRET,
      plan: 'monthly',
    });
    expect(ctx.store.record.pendingCheckoutSessionId).toBe(CHECKOUT_RESPONSE.sessionId);
    expect(ctx.store.record.pendingCheckoutExpiresAtMs).toBe(NOW + 30 * 60 * 1000);
  });

  it('never sends an amount or price — only a plan key', async () => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
    await ctx.manager.startCheckout('yearly');
    expect(Object.keys(ctx.checkoutCreateCalls[0]!)).not.toContain('amount');
  });

  it('refuses to start a second checkout while one is already pending, without a second network call', async () => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
    await ctx.manager.startCheckout('monthly');

    const second = await ctx.manager.startCheckout('yearly');

    expect(second).toEqual({ kind: 'already_pending' });
    expect(ctx.checkoutCreateCalls).toHaveLength(1);
  });

  it('a device that has never activated (no secret) cannot start a checkout', async () => {
    const ctx = setup();
    await ctx.manager.start(); // no refresh(): no secret yet

    const result = await ctx.manager.startCheckout('monthly');

    expect(result).toEqual({ kind: 'offline' });
    expect(ctx.checkoutCreateCalls).toHaveLength(0);
  });

  it.each([
    ['rejected', { kind: 'rejected' } as const, { kind: 'rejected' }],
    ['unknown_plan', { kind: 'unknown_plan' } as const, { kind: 'unknown_plan' }],
    ['offline', { kind: 'offline', reason: 'network' } as const, { kind: 'offline' }],
  ])('passes a %s outcome straight through, changing no state', async (_label, reply, expected) => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => reply);

    const result = await ctx.manager.startCheckout('monthly');

    expect(result).toEqual(expected);
    expect(ctx.manager.getCheckoutState()).toEqual({ phase: 'idle', checkoutUrl: null });
    expect(ctx.store.record.pendingCheckoutSessionId).toBeNull();
  });

  it('polls every 3s at first', async () => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
    await ctx.manager.startCheckout('monthly');
    ctx.checkoutPollScript.push(() => ({ kind: 'ok', data: { status: 'pending' } }));
    ctx.checkoutPollScript.push(() => ({ kind: 'ok', data: { status: 'pending' } }));

    await advance(ctx, 3_000);
    expect(ctx.checkoutPollCalls).toHaveLength(1);
    await advance(ctx, 3_000);
    expect(ctx.checkoutPollCalls).toHaveLength(2);
    expect(ctx.manager.getCheckoutState().phase).toBe('pending');
  });

  it('slows to every 10s once the 2-minute fast window has passed', async () => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
    await ctx.manager.startCheckout('monthly');
    // Enough scripted "pending" replies to cover every poll up to and past the 2-minute mark.
    for (let i = 0; i < 60; i += 1) {
      ctx.checkoutPollScript.push(() => ({ kind: 'ok', data: { status: 'pending' } }));
    }

    // Safely past the fast window (2 min), comfortably into slow-cadence territory.
    await advance(ctx, 3 * 60 * 1000);
    const callsByThreeMinutes = ctx.checkoutPollCalls.length;
    expect(callsByThreeMinutes).toBeGreaterThan(0);

    // The next poll cannot have fired yet if the cadence is genuinely 10s, not 3s.
    await advance(ctx, 3_000);
    expect(ctx.checkoutPollCalls).toHaveLength(callsByThreeMinutes);
    // ...but does fire once the full 10s has elapsed.
    await advance(ctx, 7_000);
    expect(ctx.checkoutPollCalls).toHaveLength(callsByThreeMinutes + 1);

    expect(ctx.manager.getCheckoutState().phase).toBe('pending');
  });

  it('a paid response with a verifiable token activates the device and stops polling', async () => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
    await ctx.manager.startCheckout('monthly');

    let statusEvents = 0;
    ctx.manager.on('status', () => (statusEvents += 1));

    ctx.checkoutPollScript.push((request) => ({
      kind: 'ok',
      data: { status: 'paid', token: ctx.paidToken(request.nonce) },
    }));
    await advance(ctx, 3_000);

    expect(ctx.manager.getCheckoutState()).toEqual({ phase: 'paid', checkoutUrl: null });
    expect(ctx.manager.getStatus().mode).toBe('active');
    expect(ctx.store.record.pendingCheckoutSessionId).toBeNull();
    expect(ctx.store.record.pendingCheckoutExpiresAtMs).toBeNull();
    expect(statusEvents).toBeGreaterThan(0);

    // Polling has genuinely stopped: no further calls even if more time passes.
    const callsAtPaid = ctx.checkoutPollCalls.length;
    await advance(ctx, 60_000);
    expect(ctx.checkoutPollCalls).toHaveLength(callsAtPaid);
  });

  it('a paid response WITHOUT a verifiable token is never trusted on its own; polling continues', async () => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
    await ctx.manager.startCheckout('monthly');

    ctx.checkoutPollScript.push(() => ({ kind: 'ok', data: { status: 'paid' } })); // no token
    ctx.checkoutPollScript.push(() => ({ kind: 'ok', data: { status: 'pending' } }));
    await advance(ctx, 3_000);
    expect(ctx.manager.getCheckoutState().phase).toBe('pending');
    expect(ctx.manager.getStatus().mode).not.toBe('active');

    await advance(ctx, 3_000);
    expect(ctx.checkoutPollCalls).toHaveLength(2);
  });

  it('a paid response with a token signed by an untrusted key is never trusted; polling continues', async () => {
    const ctx = await activated();
    const impostor = makeKeys('impostor');
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
    await ctx.manager.startCheckout('monthly');

    ctx.checkoutPollScript.push((request) => ({
      kind: 'ok',
      data: {
        status: 'paid',
        token: issueToken(impostor, { deviceId: DEVICE_ID, nonce: request.nonce, nowMs: NOW }),
      },
    }));
    await advance(ctx, 3_000);

    expect(ctx.manager.getCheckoutState().phase).toBe('pending');
    expect(ctx.manager.getStatus().mode).not.toBe('active');
  });

  it.each(['failed', 'expired'] as const)(
    'a terminal %s status stops polling and is reported as-is',
    async (status) => {
      const ctx = await activated();
      ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
      await ctx.manager.startCheckout('monthly');

      ctx.checkoutPollScript.push(() => ({ kind: 'ok', data: { status } }));
      await advance(ctx, 3_000);

      expect(ctx.manager.getCheckoutState()).toEqual({ phase: status, checkoutUrl: null });
      expect(ctx.store.record.pendingCheckoutSessionId).toBeNull();
    }
  );

  it('a not_found poll response (session forgotten) is treated as expired', async () => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
    await ctx.manager.startCheckout('monthly');

    ctx.checkoutPollScript.push(() => ({ kind: 'not_found' }));
    await advance(ctx, 3_000);

    expect(ctx.manager.getCheckoutState()).toEqual({ phase: 'expired', checkoutUrl: null });
  });

  it.each([
    ['offline', { kind: 'offline', reason: 'network' } as const],
    ['rejected', { kind: 'rejected' } as const],
  ])(
    'a transient %s poll result never changes the visible phase; polling continues',
    async (_label, reply) => {
      const ctx = await activated();
      ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
      await ctx.manager.startCheckout('monthly');

      ctx.checkoutPollScript.push(() => reply);
      ctx.checkoutPollScript.push(() => ({ kind: 'ok', data: { status: 'pending' } }));
      await advance(ctx, 3_000);
      expect(ctx.manager.getCheckoutState().phase).toBe('pending');

      await advance(ctx, 3_000);
      expect(ctx.checkoutPollCalls).toHaveLength(2);
    }
  );

  it('cancelCheckout stops polling, clears the persisted session, and returns to idle', async () => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
    await ctx.manager.startCheckout('monthly');

    ctx.manager.cancelCheckout();

    expect(ctx.manager.getCheckoutState()).toEqual({ phase: 'idle', checkoutUrl: null });
    expect(ctx.store.record.pendingCheckoutSessionId).toBeNull();

    // No poll fires even though the fast interval would otherwise have elapsed.
    await advance(ctx, 10_000);
    expect(ctx.checkoutPollCalls).toHaveLength(0);
  });

  it('cancelCheckout after a terminal outcome is a safe no-op (Close reuses Cancel)', async () => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
    await ctx.manager.startCheckout('monthly');
    ctx.checkoutPollScript.push(() => ({ kind: 'ok', data: { status: 'failed' } }));
    await advance(ctx, 3_000);

    expect(() => ctx.manager.cancelCheckout()).not.toThrow();
    expect(ctx.manager.getCheckoutState()).toEqual({ phase: 'idle', checkoutUrl: null });
  });

  it('pollCheckoutNow polls immediately, bypassing the scheduled interval', async () => {
    const ctx = await activated();
    ctx.checkoutCreateScript.push(() => ({ kind: 'ok', data: CHECKOUT_RESPONSE }));
    await ctx.manager.startCheckout('monthly');

    ctx.checkoutPollScript.push(() => ({ kind: 'ok', data: { status: 'pending' } }));
    ctx.manager.pollCheckoutNow();
    await advance(ctx, 0);

    expect(ctx.checkoutPollCalls).toHaveLength(1);
  });

  it('pollCheckoutNow is a no-op when nothing is pending', async () => {
    const ctx = await activated();
    ctx.manager.pollCheckoutNow();
    await advance(ctx, 0);
    expect(ctx.checkoutPollCalls).toHaveLength(0);
  });

  it('resumes polling a session left pending across a restart', async () => {
    const store = new MemoryStore();
    store.record = {
      ...store.record,
      deviceSecret: SECRET,
      pendingCheckoutSessionId: 'sess_resumed',
      pendingCheckoutExpiresAtMs: NOW + 20 * 60 * 1000,
    };
    const ctx = setup({ store });
    await ctx.manager.start();

    expect(ctx.manager.getCheckoutState()).toEqual({ phase: 'pending', checkoutUrl: null });

    ctx.checkoutPollScript.push(() => ({ kind: 'ok', data: { status: 'pending' } }));
    await advance(ctx, 3_000);

    expect(ctx.checkoutPollCalls).toHaveLength(1);
  });

  it('a resumed session already well past its expiry finishes as expired without polling', async () => {
    const store = new MemoryStore();
    store.record = {
      ...store.record,
      deviceSecret: SECRET,
      pendingCheckoutSessionId: 'sess_stale',
      pendingCheckoutExpiresAtMs: NOW - 10 * 60 * 1000, // expired 10 minutes before "now", past the grace window
    };
    const ctx = setup({ store });
    await ctx.manager.start();

    expect(ctx.manager.getCheckoutState()).toEqual({ phase: 'expired', checkoutUrl: null });
    expect(ctx.store.record.pendingCheckoutSessionId).toBeNull();
    expect(ctx.checkoutPollCalls).toHaveLength(0);
  });
});
