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
  batch?: { id: number; batchCode?: string | null } | null;
}

/** Per-day movement totals, keyed by ISO date, sorted ascending. */
export interface StockMovementDaySummary extends StockMovementTotals {
  date: string;
}

export interface ProductHistory {
  totals: StockMovementTotals;
  movements: StockMovement[];
  summaryByDate: StockMovementDaySummary[];
}
