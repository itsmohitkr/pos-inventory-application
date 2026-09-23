// Mirror of LicenseStatusDto in desktop/license/licensePolicy.ts (the renderer cannot import from desktop/).
// Keep the two in sync; the main process is the source of truth.
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

export interface LicenseStatusDto {
  mode: LicenseMode;
  enforcement: 'off' | 'warn' | 'on';
  salesAllowed: boolean;
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

/** Mirror of RedeemKeyOutcome in desktop/license/licenseManager.ts. Keep the two in sync. */
export type RedeemKeyOutcome =
  | { kind: 'ok' }
  | { kind: 'malformed' }
  | { kind: 'invalid_key' }
  | { kind: 'seat_limit_reached' }
  | { kind: 'device_already_licensed' }
  | { kind: 'offline' };

/** Mirror of CheckoutState in desktop/license/licenseManager.ts (P6.5). The main process decides this; the
 *  renderer only displays it — pushed live over LICENSE_CHECKOUT_STATE_CHANGED, the same pattern as
 *  LicenseStatusDto. */
export type CheckoutPhase = 'idle' | 'pending' | 'paid' | 'failed' | 'expired';

export interface CheckoutState {
  phase: CheckoutPhase;
  /** Set only while `phase === 'pending'`, and only for the launch that started it — resuming a session left
   *  pending across a restart does not restore it, so the waiting UI must tolerate it being null. */
  checkoutUrl: string | null;
}

/** Mirror of CheckoutStartResult in desktop/license/licenseManager.ts. Keep the two in sync. */
export type CheckoutStartResult =
  | { kind: 'ok'; checkoutUrl: string }
  | { kind: 'already_pending' }
  | { kind: 'rejected' }
  | { kind: 'unknown_plan' }
  | { kind: 'offline' };
