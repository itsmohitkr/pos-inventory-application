/** The three payment states tracked on Expense and Purchase records. */
export type PaymentStatus = 'Paid' | 'Due' | 'Unpaid';

/**
 * Derives a Paid/Due/Unpaid status from a total and the amount paid so far.
 * `Paid` when fully covered (including a zero-total record), `Unpaid` when
 * nothing has been paid, `Due` otherwise.
 */
export const derivePaymentStatus = (total: number, paid: number): PaymentStatus => {
  if (paid >= total) return 'Paid';
  if (paid === 0) return 'Unpaid';
  return 'Due';
};
