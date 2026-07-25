import React from 'react';
import { Chip, Typography, Box } from '@mui/material';

export const INVENTORY_COLUMNS = [
  { id: 'sno', label: 'S.No', sticky: true, width: 45 },
  { id: 'name', label: 'Name', sticky: true, left: 45, sortable: true, bold: true },
  {
    id: 'stockStatus',
    label: 'Status',
    sortable: true,
    render: (row) => (
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
  { id: 'mrp', label: 'MRP', sortable: true, render: (row) => row.mrp.toFixed(2) },
  {
    id: 'sp',
    label: 'Selling Price',
    sortable: true,
    bold: true,
    color: 'primary.main',
    render: (row) => row.sp?.toFixed(2),
    total: (totals) => totals.avgSp?.toFixed(2),
  },
  { id: 'cp', label: 'Cost Price', sortable: true, render: (row) => row.cp?.toFixed(2), total: (totals) => totals.avgCp?.toFixed(2) },
  {
    id: 'profitRs',
    label: 'Profit Unit(Rs)',
    sortable: true,
    render: (row) => (
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, color: row.profitRs > 0 ? 'success.main' : 'error.main' }}
      >
        {row.profitRs.toFixed(2)}
      </Typography>
    ),
    total: (totals) => (totals.avgSp && totals.avgCp ? (totals.avgSp - totals.avgCp).toFixed(2) : '0.00'),
  },
  { id: 'discRsVendor', label: 'Disc Vendor(Rs)', sortable: true, color: 'success.main', render: (row) => row.discRsVendor.toFixed(2), total: (totals) => totals.avgDiscRsVendor?.toFixed(2) },
  { id: 'discPctVendor', label: 'Disc Vendor(%)', sortable: true, bold: true, color: 'success.main', render: (row) => `${row.discPctVendor.toFixed(1)}%`, total: (totals) => `${totals.avgDiscPctVendor?.toFixed(1) || '0.0'}%` },
  { id: 'discRsCust', label: 'Disc Cust(Rs)', sortable: true, color: 'error.main', render: (row) => row.discRsCust.toFixed(2), total: (totals) => totals.avgDiscRsCust?.toFixed(2) },
  { id: 'discPctCust', label: 'Disc Cust(%)', sortable: true, bold: true, render: (row) => `${row.discPctCust.toFixed(1)}%`, total: (totals) => `${totals.avgDiscPctCust?.toFixed(1) || '0.0'}%` },
  {
    id: 'marginPct',
    label: 'Margin (%)',
    sortable: true,
    render: (row) => (
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, color: row.marginPct > 15 ? 'success.main' : 'warning.main' }}
      >
        {row.marginPct.toFixed(1)}%
      </Typography>
    ),
    total: (totals) => `${totals.avgMargin?.toFixed(1) || '0.0'}%`,
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
  { id: 'wsPrice', label: 'WS Price', sortable: true, render: (row) => (row.wsPrice ? row.wsPrice.toFixed(2) : '—'), total: (totals) => totals.avgWsPrice?.toFixed(2) },
  { id: 'wsMinQty', label: 'WS Min Qty', sortable: true, render: (row) => row.wsMinQty || '—' },
  {
    id: 'lowStockEnabled',
    label: 'Low Stock',
    sortable: true,
    align: 'center',
    render: (row) => (
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
    render: (row) => (
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
    render: (row) => (
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
    total: (totals) => totals.totalStock || 0,
    totalSx: { color: '#1a237e' },
  },
  { id: 'totalValCp', label: 'Total Value (Cost)', sortable: true, bold: true, render: (row) => row.totalValCp.toFixed(2), total: (totals) => totals.totalValueCost?.toFixed(2), totalSx: { color: 'error.main' } },
  { id: 'totalValSp', label: 'Total Rev (Selling)', sortable: true, bold: true, render: (row) => row.totalValSp.toFixed(2), total: (totals) => totals.totalValueSelling?.toFixed(2), totalSx: { color: 'success.main' } },
  { id: 'createdAt', label: 'Added On', sortable: true, render: (row) => (row.createdAt !== 'N/A' ? new Date(row.createdAt).toLocaleDateString() : 'N/A') },
];
