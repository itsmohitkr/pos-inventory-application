/**
 * Shared shapes for the expenses domain.
 *
 * Field names and optionality mirror server/prisma/schema.prisma (models
 * Expense, Purchase, and their payment tables). `dueAmount` is computed by the
 * service rather than stored, so it is optional here.
 */

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Due';

export interface PaymentRecord {
  id: number;
  amount: number;
  paymentMethod?: string | null;
  date: string;
  note?: string | null;
}

export interface Expense {
  id: number;
  amount: number;
  category: string;
  description?: string | null;
  date: string;
  paymentStatus: PaymentStatus | string;
  paymentMethod?: string | null;
  payments?: PaymentRecord[];
  /** Derived server-side: amount minus the sum of payments. */
  dueAmount?: number;
  /** Derived server-side: the sum of payments. */
  totalPaid?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** A line item on a purchase, as returned with the purchase. */
export interface PurchaseItem {
  id?: number;
  productId: number;
  batchId?: number | null;
  quantity: number;
  costPrice: number;
}

export interface Purchase {
  id: number;
  vendor?: string | null;
  totalAmount: number;
  date: string;
  note?: string | null;
  paymentStatus: PaymentStatus | string;
  paymentMethod?: string | null;
  payments?: PaymentRecord[];
  items?: PurchaseItem[];
  /** Derived server-side: totalAmount minus the sum of payments. */
  dueAmount?: number;
  /** Derived server-side: the sum of payments. */
  totalPaid?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Local YYYY-MM-DD bounds held by the custom date-range picker. */
export interface CustomDateRange {
  start: string;
  end: string;
}

/** ISO-8601 range sent to the API; either bound may be absent. */
export interface IsoDateRange {
  startDate?: string;
  endDate?: string;
}

export interface ExpenseTotals {
  totalExpensesAmount: number;
  totalExpensesDue: number;
  totalPurchasesAmount: number;
  totalPurchasesDue: number;
}
