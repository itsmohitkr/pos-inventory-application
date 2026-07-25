/**
 * Shared shapes for the POS domain.
 *
 * Cart items carry both product and batch fields because the POS flattens a
 * selected batch onto the product when adding to the cart.
 */

export interface CartItem {
  /** Batch id — this is what processSale consumes as `batch_id`. */
  batch_id: number;
  productId?: number;
  name: string;
  barcode?: string | null;
  quantity: number;
  sellingPrice: number;
  mrp?: number;
  costPrice?: number;
  batchCode?: string | null;
  expiryDate?: string | null;
  isFree?: boolean;
  wholesaleEnabled?: boolean;
  wholesalePrice?: number | null;
  wholesaleMinQty?: number | null;
  [key: string]: unknown;
}

/**
 * A payment method the cashier can select, as produced by
 * getAvailablePaymentMethods() in shared/utils/paymentSettings.
 */
export interface PaymentMethod {
  id: string;
  label: string;
  color?: string;
  [key: string]: unknown;
}
