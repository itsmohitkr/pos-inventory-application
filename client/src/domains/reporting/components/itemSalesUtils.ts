import jsPDF from 'jspdf';
import type { ReportSaleItem } from '@/shared/types/models';

/** One product's totals across every sale in the selected range. */
export interface AggregatedItemSale {
  id: number | string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  profit: number;
  cost: number;
}
import autoTable from 'jspdf-autotable';
import type { RowInput } from 'jspdf-autotable';

/**
 * A sale row with its items, as returned by /api/reports.
 * Typed loosely until server/src/domains/report is converted.
 */
type SaleWithItems = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** One product's aggregated sales across the reporting period. */
export interface AggregatedItem {
  id: number | string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  profit: number;
  cost: number;
}

export interface ItemSalesTotals {
  quantity: number;
  revenue: number;
  profit: number;
  cost: number;
}

export interface ItemSalesResult {
  aggregatedData: AggregatedItem[];
  totals: ItemSalesTotals;
}

export const aggregateItemSales = (sales: SaleWithItems[] | null | undefined): ItemSalesResult => {
  if (!sales)
    return { aggregatedData: [], totals: { quantity: 0, revenue: 0, profit: 0, cost: 0 } };

  // Keyed by product id, or the literal 'unknown' when a sale item's batch
  // relation was not included in the response.
  const itemsMap: Record<string, AggregatedItemSale> = {};
  const sums = { quantity: 0, revenue: 0, profit: 0, cost: 0 };

  sales.forEach((sale) => {
    sale.items.forEach((item: ReportSaleItem) => {
      const productId = item.batch?.product?.id || 'unknown';
      const productName = item.productName || 'Unknown Product';
      const category = item.batch?.product?.category || 'Uncategorized';
      const qty = item.netQuantity || 0;
      const rev = item.sellingPrice * qty;
      const prof = item.profit || 0;
      const cost = rev - prof;

      if (!itemsMap[productId]) {
        itemsMap[productId] = {
          id: productId,
          name: productName,
          category: category,
          quantity: 0,
          revenue: 0,
          profit: 0,
          cost: 0,
        };
      }

      itemsMap[productId].quantity += qty;
      itemsMap[productId].revenue += rev;
      itemsMap[productId].profit += prof;
      itemsMap[productId].cost += cost;

      sums.quantity += qty;
      sums.revenue += rev;
      sums.profit += prof;
      sums.cost += cost;
    });
  });

  return {
    aggregatedData: Object.values(itemsMap),
    totals: sums,
  };
};

export const exportItemSalesToPDF = (
  aggregatedData: AggregatedItem[],
  totals: ItemSalesTotals,
  timeframeLabel: string
): void => {
  if (aggregatedData.length === 0) return;

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Item-Wise Sales Report', 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Timeframe: ${timeframeLabel}`, 14, 28);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

  const tableColumn = [
    'Product Name',
    'Category',
    'Quantity',
    'Cost',
    'Revenue',
    'Profit',
    'Margin',
  ];
  const tableRows: RowInput[] = aggregatedData.map((item) => [
    item.name,
    item.category,
    item.quantity.toString(),
    `Rs ${item.cost.toFixed(2)}`,
    `Rs ${item.revenue.toFixed(2)}`,
    `Rs ${item.profit.toFixed(2)}`,
    `${item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(2) : '0.00'}%`,
  ]);

  const avgMargin =
    totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(2) : '0.00';
  tableRows.push([
    {
      content: 'TOTAL SUMMARY',
      colSpan: 2,
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
    },
    {
      content: totals.quantity.toString(),
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'center' },
    },
    {
      content: `Rs ${totals.cost.toFixed(2)}`,
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'right' },
    },
    {
      content: `Rs ${totals.revenue.toFixed(2)}`,
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'right' },
    },
    {
      content: `Rs ${totals.profit.toFixed(2)}`,
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'right' },
    },
    {
      content: `${avgMargin}%`,
      styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'right' },
    },
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [25, 118, 210] },
  });

  doc.save(`item_sales_report_${timeframeLabel.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};
