// Pure policy: turns "what the last verified token said" plus "what time it is now" into the status the UI
// shows and the decision the sales gate enforces. No I/O and no clock reads, so it is exhaustively unit-tested.
//
// All time-based decisions use the deadlines the SERVER put in the signed token (`tend`, `pend`, `gu`), so the
// grace length lives in one place (the service config) and works fully offline.
import type { EnforcementMode, TokenClaims } from '@trovix/license-contract';

const DAY_MS = 86_400_000;

/** How long past a token's own expiry we keep trusting it while offline (72 h token + 4 d = ~7 d since last contact). */
export const OFFLINE_GRACE_MS = 4 * DAY_MS;
/** Local trial allowed before the very first successful contact with the service. */
export const PROVISIONAL_TRIAL_MS = 7 * DAY_MS;
export const SUPPORT_EMAIL = 'support@trovix.app';

export type LicenseMode =
  | 'disabled'
  | 'checking'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'grace'
  | 'lapsed'
  | 'revoked'
  | 'unverified';

export type LicenseSeverity = 'none' | 'info' | 'warning' | 'error';

/** Sent to the renderer. Mirrored by client/src/shared/types/license.ts, keep the two in sync. */
export interface LicenseStatusDto {
  mode: LicenseMode;
  enforcement: EnforcementMode;
  /** What the sales gate will do right now (already accounts for enforcement mode). */
  salesAllowed: boolean;
  /** True when the state would block sales if enforcement were `on`. Drives warn-mode banners. */
  wouldBlock: boolean;
  severity: LicenseSeverity;
  message: string | null;
  trialEndsAt: number | null;
  paidUntil: number | null;
  graceUntil: number | null;
  daysLeft: number | null;
  provisional: boolean;
  offline: boolean;
  clockSuspect: boolean;
  lastValidatedAt: number | null;
}

export interface PolicyInput {
  /** Claims from a signature-verified token, or null when there is none. */
  claims: TokenClaims | null;
  provisionalStartedAtMs: number | null;
  /** Already clamped so it can never be earlier than the newest server time this install has seen. */
  nowMs: number;
  defaultEnforcement: EnforcementMode;
  offline: boolean;
  clockSuspect: boolean;
  lastValidatedAtMs: number | null;
}

export interface SalesDecision {
  allowed: boolean;
  reason?: 'LICENSE_EXPIRED' | 'LICENSE_REVOKED' | 'LICENSE_UNVERIFIED';
  message?: string;
}

const BLOCKING_MODES: ReadonlySet<LicenseMode> = new Set(['lapsed', 'revoked', 'unverified']);

const formatDate = (ms: number): string =>
  new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const daysUntil = (endMs: number, nowMs: number): number => Math.max(0, Math.ceil((endMs - nowMs) / DAY_MS));

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

export const disabledStatus = (): LicenseStatusDto => ({
  mode: 'disabled',
  enforcement: 'off',
  salesAllowed: true,
  wouldBlock: false,
  severity: 'none',
  message: null,
  trialEndsAt: null,
  paidUntil: null,
  graceUntil: null,
  daysLeft: null,
  provisional: false,
  offline: false,
  clockSuspect: false,
  lastValidatedAt: null,
});

interface ModeFacts {
  mode: LicenseMode;
  trialEndsAtMs?: number | null;
  paidUntilMs?: number | null;
  graceUntilMs?: number | null;
  daysLeft?: number | null;
  provisional?: boolean;
}

const describe = (
  { mode, graceUntilMs, daysLeft }: ModeFacts,
  salesAllowed: boolean,
): { severity: LicenseSeverity; message: string | null } => {
  switch (mode) {
    case 'trialing':
      return { severity: 'info', message: `Free trial: ${plural(daysLeft ?? 0, 'day')} left.` };
    case 'past_due':
      return {
        severity: 'warning',
        message: `Payment is overdue. Renew${graceUntilMs ? ` by ${formatDate(graceUntilMs)}` : ''} to keep recording sales.`,
      };
    case 'grace':
      return {
        severity: 'warning',
        message: `Your license has ended. New sales will be blocked${graceUntilMs ? ` on ${formatDate(graceUntilMs)}` : ''} unless you renew.`,
      };
    case 'lapsed':
      return { severity: salesAllowed ? 'warning' : 'error', message: 'Your license has expired. Renew to record new sales.' };
    case 'revoked':
      return {
        severity: salesAllowed ? 'warning' : 'error',
        message: `Access for this device has been revoked. Contact ${SUPPORT_EMAIL}.`,
      };
    case 'unverified':
      return {
        severity: salesAllowed ? 'warning' : 'error',
        message: "Can't verify your license. Connect to the internet to continue.",
      };
    default:
      return { severity: 'none', message: null };
  }
};

const build = (input: PolicyInput, enforcement: EnforcementMode, facts: ModeFacts): LicenseStatusDto => {
  const wouldBlock = BLOCKING_MODES.has(facts.mode);
  const salesAllowed = enforcement !== 'on' || !wouldBlock;
  // `off` is the global kill-switch: fully silent and never blocks.
  const shown = enforcement === 'off' ? { severity: 'none' as const, message: null } : describe(facts, salesAllowed);

  return {
    mode: facts.mode,
    enforcement,
    salesAllowed,
    wouldBlock,
    severity: shown.severity,
    message: shown.message,
    trialEndsAt: facts.trialEndsAtMs ?? null,
    paidUntil: facts.paidUntilMs ?? null,
    graceUntil: facts.graceUntilMs ?? null,
    daysLeft: facts.daysLeft ?? null,
    provisional: facts.provisional ?? false,
    offline: input.offline,
    clockSuspect: input.clockSuspect,
    lastValidatedAt: input.lastValidatedAtMs,
  };
};

const seconds = (value: number | null): number | null => (value === null ? null : value * 1000);

export const evaluateLicense = (input: PolicyInput): LicenseStatusDto => {
  const { claims, nowMs } = input;
  const enforcement = claims?.enf ?? input.defaultEnforcement;

  if (!claims) {
    if (input.provisionalStartedAtMs === null) return build(input, enforcement, { mode: 'checking' });
    const trialEnd = input.provisionalStartedAtMs + PROVISIONAL_TRIAL_MS;
    if (nowMs < trialEnd) {
      return build(input, enforcement, {
        mode: 'trialing',
        trialEndsAtMs: trialEnd,
        daysLeft: daysUntil(trialEnd, nowMs),
        provisional: true,
      });
    }
    return build(input, enforcement, { mode: 'unverified' });
  }

  const trialEndsAtMs = seconds(claims.tend);
  const paidUntilMs = seconds(claims.pend);
  const graceUntilMs = seconds(claims.gu);
  const carried = { trialEndsAtMs, paidUntilMs, graceUntilMs };

  // A revocation stays a revocation no matter how stale the token is: staleness must never soften it.
  if (claims.st === 'revoked') return build(input, enforcement, { mode: 'revoked' });

  if (nowMs >= claims.exp * 1000 + OFFLINE_GRACE_MS) return build(input, enforcement, { mode: 'unverified', ...carried });

  const endMs = claims.st === 'trialing' ? trialEndsAtMs : claims.st === 'lapsed' ? (trialEndsAtMs ?? paidUntilMs) : paidUntilMs;

  if ((claims.st === 'trialing' || claims.st === 'active') && (endMs === null || nowMs < endMs)) {
    return build(input, enforcement, {
      mode: claims.st,
      ...carried,
      daysLeft: endMs === null ? null : daysUntil(endMs, nowMs),
    });
  }

  if (graceUntilMs !== null && nowMs < graceUntilMs) {
    return build(input, enforcement, { mode: claims.st === 'past_due' ? 'past_due' : 'grace', ...carried });
  }

  return build(input, enforcement, { mode: 'lapsed', ...carried });
};

export const toSalesDecision = (status: LicenseStatusDto): SalesDecision => {
  if (status.salesAllowed) return { allowed: true };
  const reason =
    status.mode === 'revoked' ? 'LICENSE_REVOKED' : status.mode === 'unverified' ? 'LICENSE_UNVERIFIED' : 'LICENSE_EXPIRED';
  return { allowed: false, reason, message: status.message ?? 'New sales are currently blocked.' };
};
