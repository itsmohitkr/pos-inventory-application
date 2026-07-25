/**
 * Shared shapes for the inventory domain.
 *
 * Field names mirror server/prisma/schema.prisma (models Product and Batch).
 * The `total_*` fields are snake_case because the server computes them in raw
 * SQL aggregates (product.service.js) rather than mapping them to camelCase.
 */

export interface Batch {
  id: number;
  productId: number;
  batchCode?: string | null;
  quantity: number;
  mrp: number;
  costPrice: number;
  sellingPrice: number;
  wholesaleEnabled: boolean;
  wholesalePrice?: number | null;
  wholesaleMinQty?: number | null;
  expiryDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  name: string;
  barcode?: string | null;
  category?: string | null;
  batchTrackingEnabled: boolean;
  lowStockThreshold: number;
  lowStockWarningEnabled: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Present only on endpoints that include batches. */
  batches?: Batch[];
  /** Aggregates computed server-side by the raw-SQL product list query. */
  total_stock?: number;
  total_cost?: number;
  total_selling?: number;
  lastUpdatedAt?: string | null;
  /** Lowest active promotion price, when the endpoint resolves promotions. */
  promoPrice?: number | null;
  isOnSale?: boolean;
  [key: string]: unknown;
}

/** A node in the category tree returned by GET /api/categories. */
export interface CategoryNode {
  id: number;
  name: string;
  parentId: number | null;
  path: string;
  children: CategoryNode[];
}
