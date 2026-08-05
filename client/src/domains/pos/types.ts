import type { Batch, Product } from '@/shared/types/models';

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
  /**
   * Never actually set — getAvailablePaymentMethods returns only id/label/color
   * and PaymentMethodButtons resolves its icons from the id at render time.
   * Declared because usePOSSale destructures it off before JSON.stringify-ing
   * the method into paymentDetails, a guard against a React element reaching
   * the server. Kept so that guard keeps compiling.
   */
  icon?: unknown;
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

/**
 * A product awaiting batch/price selection after a scan.
 *
 * `mode` decides which dialog the POS shows: 'batch' when batch tracking is on
 * and several batches have stock, 'price' when tracking is off but the batches
 * carry different MRPs.
 */
export interface ScannedProduct {
  product: Product;
  batches: Batch[];
  mode: 'batch' | 'price';
}

/**
 * A sale as the receipt renders it.
 *
 * Deliberately structural rather than reusing `Sale`: the same components
 * print three different shapes — the sale processSale just returned, a
 * ReportSale reprinted from Sales History, and a loose sale (which has
 * `itemName` and `price` instead of `items` and `totalAmount`). Every field
 * the receipt reads is optional here for that reason.
 *
 * Field list derived from what Receipt.tsx and receiptUtils.ts actually
 * access; adding a field to either means adding it here too.
 */
export interface ReceiptSaleItem {
  quantity: number;
  sellingPrice: number;
  mrp?: number;
  productName?: string;
  isFree?: boolean;
  isWholesale?: boolean;
  batch?: {
    mrp?: number;
    expiryDate?: string | null;
    product?: { name?: string; barcode?: string | null };
  } | null;
}

export interface ReceiptSale {
  id?: number;
  createdAt?: string;
  items?: ReceiptSaleItem[];
  totalAmount?: number;
  discount?: number;
  extraDiscount?: number;
  customer?: { name?: string | null; phone?: string } | null;
  /** Loose sales carry these instead of items/totalAmount. */
  itemName?: string;
  price?: number;
}
