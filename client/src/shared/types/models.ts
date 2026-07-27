/**
 * The entities the API returns, as the renderer receives them.
 *
 * These mirror the Prisma models in server/prisma/schema.prisma, with two
 * deliberate differences:
 *
 *  - Dates are strings. They arrive as JSON, so `createdAt` and `expiryDate`
 *    are ISO strings here even though they are DateTime columns server-side.
 *  - Only the relations the server actually includes are present. The sale
 *    reads include `items.batch.product`; anything deeper is not fetched.
 *
 * Keep these in step with the server's include shapes (sale.service's
 * saleItemsInclude, report.service's detailedSales) — a field that is not
 * selected there will be undefined at runtime no matter what is declared here.
 */

/** The product projection attached to a batch on every sale read. */
export interface ProductSummary {
  id: number;
  name: string;
  barcode?: string | null;
  category?: string | null;
}

/** The batch projection attached to every sale item. */
export interface BatchRef {
  id: number;
  batchCode?: string | null;
  expiryDate?: string | null;
  product: ProductSummary;
}

export interface SaleItem {
  id: number;
  saleId?: number;
  batchId: number;
  quantity: number;
  returnedQuantity: number;
  sellingPrice: number;
  costPrice: number;
  mrp: number;
  isWholesale: boolean;
  isFree: boolean;
  batch?: BatchRef;
}

export interface Customer {
  id: number;
  name: string | null;
  phone: string;
  customerBarcode?: string | null;
  createdAt?: string;
}

export interface Sale {
  id: number;
  totalAmount: number;
  discount: number;
  extraDiscount: number;
  paymentMethod: string;
  customerId?: number | null;
  createdAt: string;
  items: SaleItem[];
  /** processSale includes the customer; getSaleById does not. */
  customer?: Customer | null;
}

/**
 * A sale item as the reports endpoint returns it — the stored row plus the
 * figures report.service computes per line.
 */
export interface ReportSaleItem extends SaleItem {
  productName: string;
  profit: number;
  /** Percentage, already formatted to two decimals by the server. */
  margin: string;
  netQuantity: number;
}

/** A sale as the reports endpoint returns it. */
export interface ReportSale extends Omit<Sale, 'items'> {
  netTotalAmount: number;
  profit: number;
  items: ReportSaleItem[];
}

export interface LooseSale {
  id: number;
  itemName: string;
  price: number;
  createdAt: string;
}

export interface Batch {
  id: number;
  productId: number;
  batchCode?: string | null;
  quantity: number;
  mrp: number;
  costPrice: number;
  sellingPrice: number;
  wholesaleEnabled?: boolean;
  wholesalePrice?: number | null;
  wholesaleMinQty?: number | null;
  expiryDate?: string | null;
  createdAt?: string;
}

export interface Product {
  id: number;
  name: string;
  barcode?: string | null;
  category?: string | null;
  batchTrackingEnabled?: boolean;
  lowStockWarningEnabled?: boolean;
  lowStockThreshold?: number;
  isDeleted?: boolean;
  batches?: Batch[];
}
