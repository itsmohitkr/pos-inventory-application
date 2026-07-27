import React from 'react';
import type { SxProps, Theme } from '@mui/material';
import type { InventoryRow } from '@/domains/inventory/components/inventoryExcelUtils';
import { Chip, Typography, Box } from '@mui/material';

/** Aggregates shown in the table's footer row. */
export interface InventoryTotals {
  totalStock?: number;
  totalValueCost?: number;
  totalValueSelling?: number;
  avgCp?: number;
  avgSp?: number;
  avgMargin?: number;
  avgWsPrice?: number;
  avgDiscRsVendor?: number;
  avgDiscPctVendor?: number;
  avgDiscRsCust?: number;
  avgDiscPctCust?: number;
}

/** Helpers the table passes to renderers that need them. */
export interface InventoryRenderHelpers {
  getExpiryColor: (expiry?: string | null) => string;
}

/** One column of the spreadsheet-style inventory table. */
export interface InventoryColumn {
  id: string;
  label: string;
  /** Pinned while the table scrolls horizontally. */
  sticky?: boolean;
  /** Left offset in px, required when sticky. */
  left?: number;
  width?: number;
  sortable?: boolean;
  bold?: boolean;
  align?: 'left' | 'right' | 'center';
  /** MUI palette path applied to the cell text. */
  color?: string;
  /** CSS font-family applied to the cell. */
  font?: string;
  render?: (row: InventoryRow, helpers: InventoryRenderHelpers) => React.ReactNode;
  /** Footer cell for this column, given the computed aggregates. */
  total?: (totals: InventoryTotals) => React.ReactNode;
  /** MUI sx applied to this column's footer cell only. */
  totalSx?: SxProps<Theme>;
}

export const INVENTORY_COLUMNS: InventoryColumn[] = [
  { id: 'sno', label: 'S.No', sticky: true, width: 45 },
  { id: 'name', label: 'Name', sticky: true, left: 45, sortable: true, bold: true },
  {
    id: 'stockStatus',
    label: 'Status',
    sortable: true,
    render: (row: InventoryRow) => (
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color:
            row.stockStatus === 'In Stock'
              ? 'success.main'
              : row.stockStatus === 'Low Stock'
                ? 'warning.main'
                : 'error.main',
        }}
      >
        {row.stockStatus}
      </Typography>
    ),
  },
  { id: 'batchCode', label: 'Batch Code', sortable: true },
  { id: 'category', label: 'Category', sortable: true },
  { id: 'mrp', label: 'MRP', sortable: true, render: (row: InventoryRow) => row.mrp.toFixed(2) },
  {
    id: 'sp',
    label: 'Selling Price',
    sortable: true,
    bold: true,
    color: 'primary.main',
    render: (row: InventoryRow) => row.sp?.toFixed(2),
    total: (totals: InventoryTotals) => totals.avgSp?.toFixed(2),
  },
  { id: 'cp', label: 'Cost Price', sortable: true, render: (row: InventoryRow) => row.cp?.toFixed(2), total: (totals: InventoryTotals) => totals.avgCp?.toFixed(2) },
  {
    id: 'profitRs',
    label: 'Profit Unit(Rs)',
    sortable: true,
    render: (row: InventoryRow) => (
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, color: row.profitRs > 0 ? 'success.main' : 'error.main' }}
      >
        {row.profitRs.toFixed(2)}
      </Typography>
    ),
    total: (totals: InventoryTotals) => (totals.avgSp && totals.avgCp ? (totals.avgSp - totals.avgCp).toFixed(2) : '0.00'),
  },
  { id: 'discRsVendor', label: 'Disc Vendor(Rs)', sortable: true, color: 'success.main', render: (row: InventoryRow) => row.discRsVendor.toFixed(2), total: (totals: InventoryTotals) => totals.avgDiscRsVendor?.toFixed(2) },
  { id: 'discPctVendor', label: 'Disc Vendor(%)', sortable: true, bold: true, color: 'success.main', render: (row: InventoryRow) => `${row.discPctVendor.toFixed(1)}%`, total: (totals: InventoryTotals) => `${totals.avgDiscPctVendor?.toFixed(1) || '0.0'}%` },
  { id: 'discRsCust', label: 'Disc Cust(Rs)', sortable: true, color: 'error.main', render: (row: InventoryRow) => row.discRsCust.toFixed(2), total: (totals: InventoryTotals) => totals.avgDiscRsCust?.toFixed(2) },
  { id: 'discPctCust', label: 'Disc Cust(%)', sortable: true, bold: true, render: (row: InventoryRow) => `${row.discPctCust.toFixed(1)}%`, total: (totals: InventoryTotals) => `${totals.avgDiscPctCust?.toFixed(1) || '0.0'}%` },
  {
    id: 'marginPct',
    label: 'Margin (%)',
    sortable: true,
    render: (row: InventoryRow) => (
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, color: row.marginPct > 15 ? 'success.main' : 'warning.main' }}
      >
        {row.marginPct.toFixed(1)}%
      </Typography>
    ),
    total: (totals: InventoryTotals) => `${totals.avgMargin?.toFixed(1) || '0.0'}%`,
  },
  { id: 'barcode', label: 'Barcode', sortable: true, font: 'monospace' },
  {
    id: 'expiry',
    label: 'Expiry',
    sortable: true,
    render: (row, { getExpiryColor }) => (
      <Box sx={{ bgcolor: getExpiryColor(row.expiry), p: 0.5, borderRadius: 1 }}>
        {row.expiry ? new Date(row.expiry).toLocaleDateString() : '—'}
      </Box>
    ),
  },
  { id: 'wsPrice', label: 'WS Price', sortable: true, render: (row: InventoryRow) => (row.wsPrice ? row.wsPrice.toFixed(2) : '—'), total: (totals: InventoryTotals) => totals.avgWsPrice?.toFixed(2) },
  { id: 'wsMinQty', label: 'WS Min Qty', sortable: true, render: (row: InventoryRow) => row.wsMinQty || '—' },
  {
    id: 'lowStockEnabled',
    label: 'Low Stock',
    sortable: true,
    align: 'center',
    render: (row: InventoryRow) => (
      <Chip
        label={row.lowStockEnabled ? 'Enabled' : 'Disabled'}
        size="small"
        color={row.lowStockEnabled ? 'warning' : 'default'}
        variant={row.lowStockEnabled ? 'filled' : 'outlined'}
        sx={{ height: 18, fontSize: '0.6rem' }}
      />
    ),
  },
  {
    id: 'batchTrackingEnabled',
    label: 'Batch Tracking',
    sortable: true,
    align: 'center',
    render: (row: InventoryRow) => (
      <Chip
        label={row.batchTrackingEnabled ? 'Enabled' : 'Disabled'}
        size="small"
        color={row.batchTrackingEnabled ? 'primary' : 'default'}
        variant={row.batchTrackingEnabled ? 'filled' : 'outlined'}
        sx={{ height: 18, fontSize: '0.6rem' }}
      />
    ),
  },
  {
    id: 'stock',
    label: 'Stock',
    sortable: true,
    render: (row: InventoryRow) => (
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          color: row.stock <= 5 ? 'error.main' : row.stock <= 15 ? 'warning.main' : 'success.main',
        }}
      >
        {row.stock}
      </Typography>
    ),
    total: (totals: InventoryTotals) => totals.totalStock || 0,
    totalSx: { color: '#1a237e' },
  },
  { id: 'totalValCp', label: 'Total Value (Cost)', sortable: true, bold: true, render: (row: InventoryRow) => row.totalValCp.toFixed(2), total: (totals: InventoryTotals) => totals.totalValueCost?.toFixed(2), totalSx: { color: 'error.main' } },
  { id: 'totalValSp', label: 'Total Rev (Selling)', sortable: true, bold: true, render: (row: InventoryRow) => row.totalValSp.toFixed(2), total: (totals: InventoryTotals) => totals.totalValueSelling?.toFixed(2), totalSx: { color: 'success.main' } },
  { id: 'createdAt', label: 'Added On', sortable: true, render: (row: InventoryRow) => (row.createdAt !== 'N/A' ? new Date(row.createdAt).toLocaleDateString() : 'N/A') },
];
