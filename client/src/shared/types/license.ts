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
