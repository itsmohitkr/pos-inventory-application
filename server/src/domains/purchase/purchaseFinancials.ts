import type { Purchase, PurchasePayment } from '@prisma/client';
import { derivePaymentStatus, type PaymentStatus } from '../../shared/utils/paymentStatus';

/**
 * The Purchase fields this computation reads, plus its payments. Structural
 * (rather than the full model) so it works with any query that selects at
 * least these fields, and derived from Prisma so a schema change breaks here
 * rather than silently producing a wrong "amount owed".
 */
type PurchaseForFinancials = Pick<Purchase, 'totalAmount'> & {
  payments: Pick<PurchasePayment, 'amount'>[];
};

export interface PurchaseFinancials {
  totalPaid: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
}

/**
 * The one place "what has been paid, what's still owed, and what status that
 * implies" is computed for a purchase — shared by purchase.service.ts's own
 * reads and by vendor.service.ts's per-vendor totals, so the two can never
 * disagree about what a vendor is owed.
 */
export const computePurchaseFinancials = (purchase: PurchaseForFinancials): PurchaseFinancials => {
  const totalPaid = purchase.payments.reduce((sum, p) => sum + p.amount, 0);
  const dueAmount = Math.max(0, purchase.totalAmount - totalPaid);
  const paymentStatus = derivePaymentStatus(purchase.totalAmount, totalPaid);

  return { totalPaid, dueAmount, paymentStatus };
};
