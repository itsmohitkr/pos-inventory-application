import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RowInput } from 'jspdf-autotable';
import type { InventoryRow } from '@/domains/inventory/components/inventoryExcelUtils';

export interface ColumnOption {
  key: string;
  label: string;
  defaultSelected: boolean;
}

export const ALL_EXPORT_COLUMNS: ColumnOption[] = [
  { key: 'sno', label: 'S.No', defaultSelected: true },
  { key: 'name', label: 'Product Name', defaultSelected: true },
  { key: 'category', label: 'Category', defaultSelected: true },
  { key: 'stockStatus', label: 'Status', defaultSelected: false },
  { key: 'stock', label: 'Stock', defaultSelected: true },
  { key: 'batchCode', label: 'Batch Code', defaultSelected: false },
  { key: 'barcode', label: 'Barcode', defaultSelected: false },
  { key: 'mrp', label: 'MRP', defaultSelected: true },
  { key: 'sp', label: 'Selling Price (SP)', defaultSelected: true },
  { key: 'cp', label: 'Cost Price (CP)', defaultSelected: true },
  { key: 'profitRs', label: 'Profit Unit (₹)', defaultSelected: false },
  { key: 'marginPct', label: 'Margin (%)', defaultSelected: false },
  { key: 'discRsVendor', label: 'Disc Vendor (₹)', defaultSelected: false },
  { key: 'discPctVendor', label: 'Disc Vendor (%)', defaultSelected: false },
  { key: 'discRsCust', label: 'Disc Cust (₹)', defaultSelected: false },
  { key: 'discPctCust', label: 'Disc Cust (%)', defaultSelected: false },
  { key: 'expiry', label: 'Expiry Date', defaultSelected: false },
  { key: 'totalValCp', label: 'Total Val (Cost)', defaultSelected: false },
  { key: 'totalValSp', label: 'Total Val (Selling)', defaultSelected: false },
  { key: 'wsPrice', label: 'WS Price', defaultSelected: false },
  { key: 'wsMinQty', label: 'WS Min Qty', defaultSelected: false },
  { key: 'createdAt', label: 'Added On', defaultSelected: false },
];

export const getRowColumnValue = (
  row: InventoryRow,
  key: string,
  index: number
): string | number => {
  switch (key) {
    case 'sno':
      return index + 1;
    case 'name':
      return row.name || 'N/A';
    case 'category':
      return row.category || 'Uncategorized';
    case 'stockStatus':
      return row.stockStatus || 'In Stock';
    case 'stock':
      return row.stock ?? 0;
    case 'batchCode':
      return row.batchCode || 'N/A';
    case 'barcode':
      return row.barcode || 'N/A';
    case 'mrp':
      return (row.mrp || 0).toFixed(2);
    case 'sp':
      return (row.sp || 0).toFixed(2);
    case 'cp':
      return (row.cp || 0).toFixed(2);
    case 'profitRs':
      return (row.profitRs || 0).toFixed(2);
    case 'marginPct':
      return `${(row.marginPct || 0).toFixed(1)}%`;
    case 'discRsVendor':
      return (row.discRsVendor || 0).toFixed(2);
    case 'discPctVendor':
      return `${(row.discPctVendor || 0).toFixed(1)}%`;
    case 'discRsCust':
      return (row.discRsCust || 0).toFixed(2);
    case 'discPctCust':
      return `${(row.discPctCust || 0).toFixed(1)}%`;
    case 'expiry':
      return row.expiry ? new Date(row.expiry).toLocaleDateString() : 'N/A';
    case 'totalValCp':
      return (row.totalValCp || 0).toFixed(2);
    case 'totalValSp':
      return (row.totalValSp || 0).toFixed(2);
    case 'wsPrice':
      return row.wsPrice != null ? row.wsPrice.toFixed(2) : 'N/A';
    case 'wsMinQty':
      return row.wsMinQty != null ? row.wsMinQty : 'N/A';
    case 'createdAt':
      return row.createdAt && row.createdAt !== 'N/A'
        ? new Date(row.createdAt).toLocaleDateString()
        : 'N/A';
    default:
      return 'N/A';
  }
};

/** Filters InventoryRows by selected categories — export is category-scoped only, not a search. */
export const filterInventoryRows = (
  rows: InventoryRow[],
  selectedCategories: string[]
): InventoryRow[] => {
  if (selectedCategories.length === 0 || selectedCategories.includes('all')) {
    return rows;
  }
  return rows.filter((row) => selectedCategories.includes(row.category));
};

/** Generates CSV file content */
export const generateInventoryCsv = (
  rows: InventoryRow[],
  selectedColKeys: string[]
): string => {
  const selectedDefs = ALL_EXPORT_COLUMNS.filter((col) => selectedColKeys.includes(col.key));
  const headers = selectedDefs.map((col) => `"${col.label.replace(/"/g, '""')}"`);

  const csvRows = rows.map((row, idx) => {
    return selectedDefs
      .map((col) => {
        const val = getRowColumnValue(row, col.key, idx);
        if (typeof val === 'number') return val;
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [headers.join(','), ...csvRows].join('\n');
};

/** Downloads CSV file */
export const downloadInventoryCsv = (
  rows: InventoryRow[],
  selectedColKeys: string[],
  filenamePrefix: string = 'inventory_export'
): void => {
  const csvContent = generateInventoryCsv(rows, selectedColKeys);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];

  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** Generates and downloads PDF file using jsPDF & autoTable */
export const downloadInventoryPdf = (
  rows: InventoryRow[],
  selectedColKeys: string[],
  selectedCategoriesLabel: string = 'All Categories',
  filenamePrefix: string = 'inventory_report'
): void => {
  const selectedDefs = ALL_EXPORT_COLUMNS.filter((col) => selectedColKeys.includes(col.key));
  if (selectedDefs.length === 0 || rows.length === 0) return;

  // Use landscape if many columns selected
  const isLandscape = selectedDefs.length > 7;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Title & Meta
  doc.setFontSize(16);
  doc.setTextColor(11, 29, 57);
  doc.text('Inventory Management Report', 14, 15);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Categories: ${selectedCategoriesLabel}`, 14, 21);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
  doc.text(`Total Records: ${rows.length}`, 14, 31);

  // Table Headers & Rows
  const tableHeaders = selectedDefs.map((col) => col.label);
  const tableRows: RowInput[] = rows.map((row, idx) => {
    return selectedDefs.map((col) => getRowColumnValue(row, col.key, idx));
  });

  // Summary row calculations
  const totalStock = rows.reduce((acc, r) => acc + (r.stock || 0), 0);
  const totalCost = rows.reduce((acc, r) => acc + (r.totalValCp || 0), 0);
  const totalSelling = rows.reduce((acc, r) => acc + (r.totalValSp || 0), 0);

  // Summary Row Construction
  const summaryRow: RowInput = selectedDefs.map((col) => {
    if (col.key === 'sno') return 'TOTAL';
    if (col.key === 'name') return `Items: ${rows.length}`;
    if (col.key === 'stock') return totalStock;
    if (col.key === 'totalValCp') return `₹${totalCost.toFixed(2)}`;
    if (col.key === 'totalValSp') return `₹${totalSelling.toFixed(2)}`;
    return '';
  });

  tableRows.push(summaryRow);

  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: 36,
    theme: 'striped',
    styles: {
      fontSize: selectedDefs.length > 10 ? 7 : 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [11, 29, 57],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    didParseCell: (data) => {
      // Style the summary row at the end
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [11, 29, 57];
      }
    },
  });

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`${filenamePrefix}_${dateStr}.pdf`);
};
