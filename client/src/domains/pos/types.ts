/**
 * Types for the POS domain.
 *
 * The cart is the money path: these shapes are what the Pay and Pay & Print
 * handlers serialise into POST /api/sale, so they mirror the fields
 * usePOSTabs actually writes rather than the Prisma models.
 *
 * Note the snake_case keys (product_id, batch_id, batch_code, max_quantity).
 * They are persisted to sessionStorage under `posOrderTabs` and read back on
 * reload, so renaming them would orphan any cart a cashier had open.
 */

/** One line in the cart. */
export interface CartItem {
  product_id: number;
  batch_id: number;
  name: string;
  /**
   * The effective unit price actually charged — wholesale, promo, or the
   * batch's selling price, whichever applies at the current quantity.
   * `sellingPrice` below is the unmodified batch price, kept for comparison.
   */
  price: number;
  quantity: number;
  batch_code?: string | null;
  mrp: number;
  /** Stock available in the batch; the quantity dialog clamps to this. */
  max_quantity: number;
  sellingPrice: number;
  wholesaleEnabled?: boolean;
  wholesalePrice?: number | null;
  wholesaleMinQty?: number | null;
  isOnSale: boolean;
  promoPrice?: number | null;
  costPrice: number;
  /** Free items are charged 0 and excluded from discount maths. */
  isFree: boolean;
}

/**
 * A payment method the cashier can select, as produced by
 * getAvailablePaymentMethods in components/transactionPanelUtils.ts — the
 * built-ins from PAYMENT_METHOD_CONFIG plus any the shop has defined.
 */
export interface PaymentMethod {
  id: string;
  label: string;
  color: string;
}

/**
 * One order tab. Multiple tabs let a cashier park a sale and start another;
 * the whole array is persisted to sessionStorage.
 */
export interface OrderTab {
  id: number;
  name: string;
  cart: CartItem[];
  discount: number;
}
