import type { Batch, Product } from '@/shared/types/models';

/**
 * One row of the spreadsheet-style inventory view: a product/batch pair
 * flattened into a single record, with the derived money columns
 * precomputed. A product with no batches yields one row with zeroed figures.
 */
export interface InventoryRow {
  /** `${productId}-${batchId}`, or `${productId}-none` when there is no batch. */
  id: string;
  name: string;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' | string;
  batchCode: string;
  category: string;
  mrp: number;
  sp: number;
  cp: number;
  profitRs: number;
  /** Vendor-side discount: MRP minus cost. */
  discRsVendor: number;
  discPctVendor: number;
  /** Customer-side discount: MRP minus selling price. */
  discRsCust: number;
  discPctCust: number;
  marginPct: number;
  barcode: string;
  expiry?: string | null;
  wsPrice?: number | null;
  wsMinQty?: number | null;
  lowStockEnabled?: boolean;
  batchTrackingEnabled?: boolean;
  stock: number;
  totalValCp: number;
  totalValSp: number;
  createdAt: string;
}

/** The low-stock cutoff used by the spreadsheet view. See the note below. */
const EXCEL_LOW_STOCK_THRESHOLD = 5;

export const flattenInventoryRows = (
  products: Product[],
  localCategoryFilter: string
): InventoryRow[] => {
  const rows: InventoryRow[] = [];

  const filteredProducts =
    localCategoryFilter === 'all'
      ? products
      : products.filter((product: Product) => product.category === localCategoryFilter);

  filteredProducts.forEach((product: Product) => {
    if (product.batches && product.batches.length > 0) {
      product.batches.forEach((batch: Batch) => {
        const discRsVendor = Math.max(0, batch.mrp - batch.costPrice);
        const discPctVendor = batch.mrp > 0 ? (discRsVendor / batch.mrp) * 100 : 0;

        const discRsCust = Math.max(0, batch.mrp - batch.sellingPrice);
        const discPctCust = batch.mrp > 0 ? (discRsCust / batch.mrp) * 100 : 0;

        let stockStatus = 'In Stock';
        if (batch.quantity <= 0) stockStatus = 'Out of Stock';
        // NOTE: this read `product.minStockLevel || 5`, but Product has no
        // `minStockLevel` field — the column is `lowStockThreshold`, and
        // `minStockLevel` appears nowhere else in the codebase. The expression
        // was therefore always 5. Kept as the constant it actually was rather
        // than silently switching this view to per-product thresholds, which
        // would reclassify rows in existing inventory. See the note in the
        // commit message.
        else if (batch.quantity <= EXCEL_LOW_STOCK_THRESHOLD) stockStatus = 'Low Stock';

        const marginPct =
          batch.sellingPrice > 0
            ? ((batch.sellingPrice - batch.costPrice) / batch.sellingPrice) * 100
            : 0;

        rows.push({
          id: `${product.id}-${batch.id}`,
          name: product.name,
          stockStatus,
          batchCode: batch.batchCode || 'N/A',
          category: product.category || 'Uncategorized',
          mrp: batch.mrp,
          sp: batch.sellingPrice,
          cp: batch.costPrice,
          profitRs: batch.sellingPrice - batch.costPrice,
          discRsVendor,
          discPctVendor,
          discRsCust,
          discPctCust,
          marginPct,
          barcode: product.barcode || 'N/A',
          expiry: batch.expiryDate,
          wsPrice: batch.wholesalePrice,
          wsMinQty: batch.wholesaleMinQty,
          lowStockEnabled: product.lowStockWarningEnabled,
          batchTrackingEnabled: product.batchTrackingEnabled,
          stock: batch.quantity,
          totalValCp: batch.quantity * batch.costPrice,
          totalValSp: batch.quantity * batch.sellingPrice,
          createdAt: batch.createdAt || product.createdAt || 'N/A',
        });
      });
      return;
    }

    rows.push({
      id: `${product.id}-none`,
      name: product.name,
      stockStatus: 'Out of Stock',
      batchCode: 'N/A',
      category: product.category || 'Uncategorized',
      mrp: 0,
      sp: 0,
      cp: 0,
      profitRs: 0,
      discRsVendor: 0,
      discPctVendor: 0,
      discRsCust: 0,
      discPctCust: 0,
      marginPct: 0,
      barcode: product.barcode || 'N/A',
      wsPrice: null,
      wsMinQty: null,
      lowStockEnabled: product.lowStockWarningEnabled,
      batchTrackingEnabled: product.batchTrackingEnabled,
      stock: 0,
      totalValCp: 0,
      totalValSp: 0,
      createdAt: product.createdAt || 'N/A',
    });
  });

  return rows;
};

export const applyInventorySearch = (rows: InventoryRow[], searchTerm: string): InventoryRow[] => {
  if (!searchTerm || !searchTerm.trim()) {
    return rows;
  }

  const query = searchTerm.toLowerCase().trim();
  const namePrefix: InventoryRow[] = [];
  const barcodePrefix: InventoryRow[] = [];
  const nameContains: InventoryRow[] = [];
  const barcodeContains: InventoryRow[] = [];

  for (const row of rows) {
    const name = (row.name || '').toLowerCase();
    const barcodes =
      row.barcode && row.barcode !== 'N/A'
        ? row.barcode
          .toLowerCase()
          .split('|')
          .map((barcode: string) => barcode.trim())
        : [];

    if (name.startsWith(query)) {
      namePrefix.push(row);
    } else if (barcodes.some((barcode: string) => barcode.startsWith(query))) {
      barcodePrefix.push(row);
    } else if (name.includes(query)) {
      nameContains.push(row);
    } else if (barcodes.some((barcode: string) => barcode.includes(query))) {
      barcodeContains.push(row);
    }
  }

  return [...namePrefix, ...barcodePrefix, ...nameContains, ...barcodeContains];
};

/** One level of the multi-column sort, applied in array order. */
export interface InventorySortConfig {
  key: keyof InventoryRow;
  direction: 'asc' | 'desc';
}

export const applyInventorySort = (
  rows: InventoryRow[],
  sortConfigs: InventorySortConfig[]
): InventoryRow[] => {
  if (!sortConfigs.length) {
    return rows;
  }

  return [...rows].sort((a: InventoryRow, b: InventoryRow) => {
    for (const config of sortConfigs) {
      let valA = a[config.key];
      let valB = b[config.key];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      const isDesc = config.direction === 'desc';

      if (valA == null && valB == null) continue;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (valA < valB) return isDesc ? 1 : -1;
      if (valA > valB) return isDesc ? -1 : 1;
    }

    return 0;
  });
};

export const calculateInventoryTotals = (rows: InventoryRow[]) => {
  const sumBy = (fn: (row: InventoryRow) => number) =>
    rows.reduce((sum: number, row: InventoryRow) => sum + fn(row), 0);

  const totalStock = sumBy((row) => row.stock);
  const totalValueCost = sumBy((row) => row.stock * row.cp);
  const totalValueSelling = sumBy((row) => row.stock * row.sp);
  const totalValueMrp = sumBy((row) => row.stock * (row.mrp || row.sp));

  return {
    totalStock,
    avgSp: totalStock > 0 ? totalValueSelling / totalStock : 0,
    avgCp: totalStock > 0 ? totalValueCost / totalStock : 0,
    avgDiscRsVendor: totalStock > 0 ? (totalValueMrp - totalValueCost) / totalStock : 0,
    avgDiscPctVendor:
      totalValueMrp > 0 ? ((totalValueMrp - totalValueCost) / totalValueMrp) * 100 : 0,
    avgDiscRsCust: totalStock > 0 ? (totalValueMrp - totalValueSelling) / totalStock : 0,
    avgDiscPctCust:
      totalValueMrp > 0 ? ((totalValueMrp - totalValueSelling) / totalValueMrp) * 100 : 0,
    avgMargin:
      totalValueSelling > 0 ? ((totalValueSelling - totalValueCost) / totalValueSelling) * 100 : 0,
    avgWsPrice:
      rows.length > 0 ? rows.reduce((sum, row) => sum + (row.wsPrice || 0), 0) / rows.length : 0,
    totalValueCost,
    totalValueSelling,
  };
};

export const buildInventoryCsv = (
  /** Which columns are visible, keyed by InventoryColumn id. */
  cols: Record<string, boolean>,
  rows: InventoryRow[]
): string => {
  const headers: string[] = [];
  if (cols.sno) headers.push('S.No');
  if (cols.name) headers.push('Name');
  if (cols.stockStatus) headers.push('Status');
  if (cols.batchCode) headers.push('Batch Code');
  if (cols.category) headers.push('Category');
  if (cols.mrp) headers.push('MRP');
  if (cols.sp) headers.push('Selling Price');
  if (cols.cp) headers.push('Cost Price');
  if (cols.profitRs) headers.push('Profit Unit(Rs)');
  if (cols.discRsVendor) headers.push('Disc Vendor(Rs)');
  if (cols.discPctVendor) headers.push('Disc Vendor(%)');
  if (cols.discRsCust) headers.push('Disc Cust(Rs)');
  if (cols.discPctCust) headers.push('Disc Cust(%)');
  if (cols.marginPct) headers.push('Margin(%)');
  if (cols.barcode) headers.push('Barcode');
  if (cols.expiry) headers.push('Expiry');
  if (cols.wsPrice) headers.push('WS Price');
  if (cols.wsMinQty) headers.push('WS Min Qty');
  if (cols.stock) headers.push('Stock');
  if (cols.totalValCp) headers.push('Total Value (Cost)');
  if (cols.totalValSp) headers.push('Total Rev (Selling)');
  if (cols.createdAt) headers.push('Added On');

  return [
    headers.join(','),
    ...rows.map((row: InventoryRow, idx: number) => {
      const rowData: (string | number)[] = [];
      if (cols.sno) rowData.push(idx + 1);
      if (cols.name) rowData.push(`"${row.name}"`);
      if (cols.stockStatus) rowData.push(`"${row.stockStatus}"`);
      if (cols.batchCode) rowData.push(`"${row.batchCode}"`);
      if (cols.category) rowData.push(`"${row.category}"`);
      if (cols.mrp) rowData.push(row.mrp);
      if (cols.sp) rowData.push(row.sp);
      if (cols.cp) rowData.push(row.cp);
      if (cols.profitRs) rowData.push(row.profitRs.toFixed(2));
      if (cols.discRsVendor) rowData.push(row.discRsVendor.toFixed(2));
      if (cols.discPctVendor) rowData.push(row.discPctVendor.toFixed(2));
      if (cols.discRsCust) rowData.push(row.discRsCust.toFixed(2));
      if (cols.discPctCust) rowData.push(row.discPctCust.toFixed(2));
      if (cols.marginPct) rowData.push(row.marginPct.toFixed(2));
      if (cols.barcode) rowData.push(`"${row.barcode}"`);
      if (cols.expiry) rowData.push(row.expiry ? new Date(row.expiry).toLocaleDateString() : 'N/A');
      if (cols.wsPrice) rowData.push(row.wsPrice || 0);
      if (cols.wsMinQty) rowData.push(row.wsMinQty || 0);
      if (cols.stock) rowData.push(row.stock);
      if (cols.totalValCp) rowData.push(row.totalValCp.toFixed(2));
      if (cols.totalValSp) rowData.push(row.totalValSp.toFixed(2));
      if (cols.createdAt)
        rowData.push(
          row.createdAt !== 'N/A' ? new Date(row.createdAt).toLocaleDateString() : 'N/A'
        );
      return rowData.join(',');
    }),
  ].join('\n');
};

export const getInventoryExpiryColor = (expiryStr?: string | null): string => {
  if (!expiryStr || expiryStr === 'N/A' || expiryStr === '—') return 'inherit';

  const expDate = new Date(expiryStr);
  const today = new Date();
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '#ffebee';
  if (diffDays <= 30) return '#fff3e0';
  return 'inherit';
};
