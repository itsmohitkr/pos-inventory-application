import { describe, expect, it } from 'vitest';
import type { TokenClaims } from '@trovix/license-contract';
import {
  OFFLINE_GRACE_MS,
  PROVISIONAL_TRIAL_MS,
  disabledStatus,
  evaluateLicense,
  toSalesDecision,
  type PolicyInput,
} from './licensePolicy';
import { DAY, NOW } from './testUtils';

const sec = (ms: number): number => Math.floor(ms / 1000);

const claims = (over: Partial<TokenClaims> = {}): TokenClaims => ({
  iss: 'trovix-license',
  aud: 'trovix-desktop',
  sub: 'a'.repeat(64),
  jti: 'jti-00000001',
  iat: sec(NOW),
  exp: sec(NOW + 3 * DAY),
  nonce: 'n'.repeat(22),
  v: 1,
  st: 'trialing',
  tend: sec(NOW + 5 * DAY),
  pend: null,
  gu: sec(NOW + 12 * DAY),
  lim: null,
  acct: null,
  enf: 'on',
  ...over,
});

const input = (over: Partial<PolicyInput> = {}): PolicyInput => ({
  claims: claims(),
  provisionalStartedAtMs: null,
  nowMs: NOW,
  defaultEnforcement: 'warn',
  offline: false,
  clockSuspect: false,
  lastValidatedAtMs: NOW,
  ...over,
});

describe('with a verified token', () => {
  it('trialing: counts whole days left, allows sales, shows an info message', () => {
    const status = evaluateLicense(input());
    expect(status).toMatchObject({ mode: 'trialing', daysLeft: 5, salesAllowed: true, wouldBlock: false, severity: 'info' });
    expect(status.message).toBe('Free trial: 5 days left.');
  });

  it('trialing: uses singular for the last day and rounds partial days up', () => {
    const status = evaluateLicense(input({ nowMs: NOW + 4 * DAY + 3600_000 }));
    expect(status.daysLeft).toBe(1);
    expect(status.message).toBe('Free trial: 1 day left.');
  });

  it('active: silent', () => {
    const status = evaluateLicense(input({ claims: claims({ st: 'active', tend: null, pend: sec(NOW + 20 * DAY) }) }));
    expect(status).toMatchObject({ mode: 'active', severity: 'none', message: null, salesAllowed: true, daysLeft: 20 });
  });

  it('a trial that ends while the app is running moves to grace using the server-supplied deadline', () => {
    const status = evaluateLicense(input({ nowMs: NOW + 6 * DAY }));
    expect(status.mode).toBe('grace');
    expect(status.salesAllowed).toBe(true);
    expect(status.message).toContain('New sales will be blocked');
  });

  it('blocks new sales once the grace deadline passes (enforcement on)', () => {
    const status = evaluateLicense(input({ claims: claims({ exp: sec(NOW + 30 * DAY) }), nowMs: NOW + 12 * DAY }));
    expect(status).toMatchObject({ mode: 'lapsed', salesAllowed: false, wouldBlock: true, severity: 'error' });
    expect(toSalesDecision(status)).toMatchObject({ allowed: false, reason: 'LICENSE_EXPIRED' });
  });

  it('a lapsed token inside its grace window is grace, not lapsed', () => {
    const status = evaluateLicense(
      input({ claims: claims({ st: 'lapsed', tend: sec(NOW - DAY), gu: sec(NOW + 6 * DAY) }) }),
    );
    expect(status.mode).toBe('grace');
  });

  it('past_due stays past_due inside grace and becomes lapsed after it', () => {
    const past = claims({ st: 'past_due', tend: null, pend: sec(NOW - DAY), gu: sec(NOW + 6 * DAY), exp: sec(NOW + 30 * DAY) });
    expect(evaluateLicense(input({ claims: past })).mode).toBe('past_due');
    expect(evaluateLicense(input({ claims: past, nowMs: NOW + 6 * DAY })).mode).toBe('lapsed');
  });

  it('revoked always blocks under enforcement, even when the token is very stale', () => {
    const revoked = claims({ st: 'revoked', tend: null, pend: null, gu: null });
    for (const nowMs of [NOW, NOW + 30 * DAY, NOW + 365 * DAY]) {
      const status = evaluateLicense(input({ claims: revoked, nowMs }));
      expect(status.mode).toBe('revoked');
      expect(status.salesAllowed).toBe(false);
      expect(toSalesDecision(status)).toMatchObject({ reason: 'LICENSE_REVOKED' });
    }
  });

  it('a token older than its expiry plus the offline grace becomes unverified', () => {
    const at = NOW + 3 * DAY + OFFLINE_GRACE_MS;
    expect(evaluateLicense(input({ nowMs: at - 1 })).mode).not.toBe('unverified');
    const status = evaluateLicense(input({ nowMs: at }));
    expect(status).toMatchObject({ mode: 'unverified', salesAllowed: false });
    expect(toSalesDecision(status)).toMatchObject({ reason: 'LICENSE_UNVERIFIED' });
  });

  it('a token past expiry but inside the offline grace keeps working', () => {
    expect(evaluateLicense(input({ nowMs: NOW + 4 * DAY })).mode).toBe('trialing');
  });
});

describe('enforcement modes', () => {
  const expired = { claims: claims({ exp: sec(NOW + 30 * DAY) }), nowMs: NOW + 13 * DAY };

  it('warn: reports what would block but never blocks', () => {
    const status = evaluateLicense(input({ ...expired, claims: claims({ ...expired.claims, enf: 'warn' }) }));
    expect(status).toMatchObject({ mode: 'lapsed', wouldBlock: true, severity: 'warning' });
    expect(status.salesAllowed).toBe(true);
    expect(toSalesDecision(status)).toEqual({ allowed: true });
  });

  it('off: the kill-switch is silent and never blocks, even when revoked', () => {
    const revoked = evaluateLicense(input({ claims: claims({ st: 'revoked', enf: 'off' }) }));
    expect(revoked).toMatchObject({ mode: 'revoked', salesAllowed: true, severity: 'none', message: null });
    const lapsed = evaluateLicense(input({ ...expired, claims: claims({ ...expired.claims, enf: 'off' }) }));
    expect(lapsed).toMatchObject({ salesAllowed: true, severity: 'none', message: null });
  });

  it('on: blocks', () => {
    expect(evaluateLicense(input(expired)).salesAllowed).toBe(false);
  });
});

describe('without a token', () => {
  it('is just "checking" (allowed) before anything is known', () => {
    expect(evaluateLicense(input({ claims: null }))).toMatchObject({ mode: 'checking', salesAllowed: true });
  });

  it('runs a provisional offline trial for its length', () => {
    const status = evaluateLicense(input({ claims: null, provisionalStartedAtMs: NOW - 2 * DAY }));
    expect(status).toMatchObject({ mode: 'trialing', provisional: true, daysLeft: 5, salesAllowed: true });
  });

  it('becomes unverified when the provisional trial runs out, and blocks only under enforcement', () => {
    const at = { claims: null, provisionalStartedAtMs: NOW - PROVISIONAL_TRIAL_MS };
    expect(evaluateLicense(input({ ...at, defaultEnforcement: 'on' }))).toMatchObject({ mode: 'unverified', salesAllowed: false });
    expect(evaluateLicense(input({ ...at, defaultEnforcement: 'warn' }))).toMatchObject({ mode: 'unverified', salesAllowed: true });
  });
});

describe('passthrough fields', () => {
  it('carries offline and clock flags and the last validation time', () => {
    const status = evaluateLicense(input({ offline: true, clockSuspect: true, lastValidatedAtMs: NOW - 5 }));
    expect(status).toMatchObject({ offline: true, clockSuspect: true, lastValidatedAt: NOW - 5 });
  });

  it('disabledStatus never blocks and shows nothing', () => {
    expect(disabledStatus()).toMatchObject({ mode: 'disabled', salesAllowed: true, severity: 'none', message: null });
  });
});
