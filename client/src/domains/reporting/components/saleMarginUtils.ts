import type { ReportSale } from '@/shared/types/models';

/** Cost price and profit margin (%) derived from a report sale's totals. */
export interface SaleMarginStats {
  cost: number;
  margin: number;
}

export const getSaleMarginStats = (
  sale: Pick<ReportSale, 'netTotalAmount' | 'profit'>
): SaleMarginStats => {
  const netTotalAmount = sale.netTotalAmount || 0;
  const profit = sale.profit || 0;
  const cost = netTotalAmount - profit;
  const margin = netTotalAmount > 0 ? (profit / netTotalAmount) * 100 : 0;
  return { cost, margin };
};
