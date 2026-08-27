/**
 * Shared shapes for the inventory domain.
 *
 * Product, Batch and CategoryNode are defined once in shared/types/models.ts
 * — several domains outside inventory read them — and re-exported here so
 * existing imports keep working.
 */

export type { Batch, CategoryNode, Product } from '@/shared/types/models';



/** Aggregates for the inventory summary bar, from GET /api/products/summary. */
export interface InventorySummaryTotals {
  productCount: number;
  totalQty: number;
  totalCost: number;
  totalSelling: number;
  totalMrp: number;
}

/** Running totals per movement type in the stock history dialog. */
export interface StockMovementTotals {
  added: number;
  sold: number;
  returned: number;
  adjustmentIn: number;
  adjustmentOut: number;
  net: number;
}

/** One ledger entry from GET /api/products/:id/history. */
export interface StockMovement {
  id: number;
  type: string;
  quantity: number;
  note?: string | null;
  createdAt: string;
  batch?: { id: number; batchCode?: string | null; sellingPrice?: number | null } | null;
  /** Set for 'sold'/'returned' movements — the sale that caused it. Null otherwise, and for rows predating this field. */
  saleId?: number | null;
}

/** Per-day movement totals, keyed by ISO date, sorted ascending. */
export interface StockMovementDaySummary extends StockMovementTotals {
  date: string;
}

export interface StockMovementPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ProductHistory {
  /** The resolved boundaries of the requested range/preset, ISO strings. */
  startDate?: string | null;
  endDate?: string | null;
  totals: StockMovementTotals;
  /** Only this page's rows — totals/summaryByDate cover the full range regardless. */
  movements: StockMovement[];
  summaryByDate: StockMovementDaySummary[];
  pagination?: StockMovementPagination;
}
