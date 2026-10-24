// Pure: turns a verified subscription snapshot plus "what time it is now" into what the License & Subscription
// tab shows. No I/O and no clock reads. DISPLAY ONLY: nothing here can change what the sales gate decides,
// which comes from the token alone (see licensePolicy.ts).
import type { LicenseStatus, SubscriptionSnapshotClaims } from '@trovix/license-contract';

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** How old a snapshot (judged by the server's own `iat`) may be before the screen says so. */
export const SNAPSHOT_AGING_AFTER_MS = 24 * HOUR_MS;
/** Past the offline grace (see OFFLINE_GRACE_MS): the details can no longer be called verified. */
export const SNAPSHOT_STALE_AFTER_MS = 4 * DAY_MS;
export const SNAPSHOT_VERY_STALE_AFTER_MS = 30 * DAY_MS;

export type SubscriptionFreshness = 'fresh' | 'aging' | 'stale' | 'very_stale';

export interface SubscriptionPaymentDto {
  paidAt: number;
  /** Minor currency units (paise). */
  amount: number;
  currency: string;
  plan: string;
}

export interface SubscriptionDeviceDto {
  shortId: string;
  platform: string;
  lastSeenAt: number;
  isThisDevice: boolean;
}

/** Sent to the renderer. Mirrored by client/src/shared/types/license.ts, keep the two in sync. Times are epoch ms. */
export interface SubscriptionDetailsDto {
  /** False until a signature-verified snapshot has ever been received on this install. */
  available: boolean;
  /** The last sync attempt failed (offline, service error, or an unacceptable response). The cached copy, if
   *  any, is still shown. */
  syncFailed: boolean;
  /** Server time the snapshot was issued, and the local time it arrived. */
  asOf: number | null;
  fetchedAt: number | null;
  freshness: SubscriptionFreshness | null;
  status: LicenseStatus | null;
  plan: string | null;
  businessName: string | null;
  subscribedSince: number | null;
  periodStart: number | null;
  periodEnd: number | null;
  /** True once `periodEnd` has passed, whatever the (possibly old) snapshot's status says, so a cached copy can
   *  never keep showing "Active" beyond its own end date. */
  periodEnded: boolean;
  deviceLimit: number | null;
  trialStartedAt: number | null;
  trialEndsAt: number | null;
  legacy: boolean;
  lastPayment: SubscriptionPaymentDto | null;
  payments: SubscriptionPaymentDto[];
  devices: SubscriptionDeviceDto[];
}

export const emptySubscriptionDetails = (syncFailed = false): SubscriptionDetailsDto => ({
  available: false,
  syncFailed,
  asOf: null,
  fetchedAt: null,
  freshness: null,
  status: null,
  plan: null,
  businessName: null,
  subscribedSince: null,
  periodStart: null,
  periodEnd: null,
  periodEnded: false,
  deviceLimit: null,
  trialStartedAt: null,
  trialEndsAt: null,
  legacy: false,
  lastPayment: null,
  payments: [],
  devices: [],
});

const ms = (sec: number | null): number | null => (sec === null ? null : sec * 1000);

const toPayment = (p: SubscriptionSnapshotClaims['payments'][number]): SubscriptionPaymentDto => ({
  paidAt: p.paidAt * 1000,
  amount: p.amount,
  currency: p.currency,
  plan: p.plan,
});

export const freshnessOf = (ageMs: number): SubscriptionFreshness => {
  if (ageMs < SNAPSHOT_AGING_AFTER_MS) return 'fresh';
  if (ageMs < SNAPSHOT_STALE_AFTER_MS) return 'aging';
  if (ageMs < SNAPSHOT_VERY_STALE_AFTER_MS) return 'stale';
  return 'very_stale';
};

export interface BuildDetailsInput {
  claims: SubscriptionSnapshotClaims | null;
  fetchedAtMs: number | null;
  /** Already clamped so it can never be earlier than the newest server time this install has seen. */
  nowMs: number;
  syncFailed: boolean;
}

export const buildSubscriptionDetails = ({
  claims,
  fetchedAtMs,
  nowMs,
  syncFailed,
}: BuildDetailsInput): SubscriptionDetailsDto => {
  if (claims === null) return emptySubscriptionDetails(syncFailed);
  const periodEnd = ms(claims.periodEnd);
  return {
    available: true,
    syncFailed,
    asOf: claims.iat * 1000,
    fetchedAt: fetchedAtMs,
    // Age is measured against the server's clock stamp, never the local fetch time, so rolling the system clock
    // back cannot make an old copy look fresh.
    freshness: freshnessOf(Math.max(0, nowMs - claims.iat * 1000)),
    status: claims.status,
    plan: claims.plan,
    businessName: claims.businessName,
    subscribedSince: ms(claims.subscribedSince),
    periodStart: ms(claims.periodStart),
    periodEnd,
    periodEnded: periodEnd !== null && nowMs >= periodEnd,
    deviceLimit: claims.deviceLimit,
    trialStartedAt: claims.trialStartedAt * 1000,
    trialEndsAt: claims.trialEndsAt * 1000,
    legacy: claims.legacy,
    lastPayment: claims.lastPayment ? toPayment(claims.lastPayment) : null,
    payments: claims.payments.map(toPayment),
    devices: claims.devices.map((d) => ({
      shortId: d.shortId,
      platform: d.platform,
      lastSeenAt: d.lastSeenAt * 1000,
      isThisDevice: d.isThisDevice,
    })),
  };
};
