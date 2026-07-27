import type { ReportSale, ReportSaleItem } from '@/shared/types/models';

/**
 * Discount breakdown for one sale.
 *
 * `discountPercent` is a formatted string when a subtotal exists and the
 * number 0 otherwise — preserved as-is because the panels render it directly.
 */
export interface SaleStats {
  total: number;
  mrpDiscount: number;
  extraDiscount: number;
  totalDiscount?: number;
  discountPercent: string | number;
}

export const calculateSaleStats = (sale?: ReportSale | null): SaleStats => {
  if (!sale) return { total: 0, mrpDiscount: 0, extraDiscount: 0, discountPercent: 0 };

  let mrpDiscount = 0;
  sale.items?.forEach((item: ReportSaleItem) => {
    const mrp = item.mrp || item.sellingPrice;
    mrpDiscount += (mrp - item.sellingPrice) * item.quantity;
  });

  const extraDiscount = sale.extraDiscount || 0;
  const totalDiscount = mrpDiscount + extraDiscount;

  let subtotal = 0;
  sale.items?.forEach((item: ReportSaleItem) => {
    const mrp = item.mrp || item.sellingPrice;
    subtotal += mrp * item.quantity;
  });

  const discountPercent = subtotal > 0 ? ((totalDiscount / subtotal) * 100).toFixed(2) : 0;

  return {
    total: sale.netTotalAmount || sale.totalAmount,
    mrpDiscount,
    extraDiscount,
    totalDiscount,
    discountPercent,
  };
};
