import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Chip,
} from '@mui/material';

const InventoryExcelTable = ({
  cols,
  sortConfigs,
  handleSort,
  filteredAndSortedData,
  getExpiryColor,
  totals,
}) => {
  return (
    <TableContainer
      component={Paper}
      sx={{ maxHeight: 'calc(100vh - 250px)', borderRadius: 2, border: '1px solid #ccc' }}
    >
      <Table
        stickyHeader
        size="small"
        sx={{
          minWidth: 1200,
          '& .MuiTableCell-root': {
            border: '1px solid #e0e0e0',
            whiteSpace: 'nowrap',
            padding: '4px 8px',
          },
          '& .MuiTableRow-root:nth-of-type(odd)': {
            bgcolor: 'rgba(0, 0, 0, 0.02)',
          },
        }}
      >
        <TableHead>
          <TableRow>
            {cols.sno && (
              <TableCell
                sx={{
                  bgcolor: '#e8eaf6',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  borderRight: '2px solid #ccc',
                }}
              >
                S.No
              </TableCell>
            )}
            {cols.name && (
              <TableCell
                sx={{
                  bgcolor: '#e8eaf6',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  left: cols.sno ? 45 : 0,
                  zIndex: 3,
                  borderRight: '2px solid #ccc',
                }}
              >
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'name')}
                  direction={sortConfigs.find((c) => c.key === 'name')?.direction || 'asc'}
                  onClick={(e) => handleSort('name', e)}
                >
                  Name
                </TableSortLabel>
              </TableCell>
            )}
            {cols.stockStatus && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'stockStatus')}
                  direction={sortConfigs.find((c) => c.key === 'stockStatus')?.direction || 'asc'}
                  onClick={(e) => handleSort('stockStatus', e)}
                >
                  Status
                </TableSortLabel>
              </TableCell>
            )}
            {cols.batchCode && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'batchCode')}
                  direction={sortConfigs.find((c) => c.key === 'batchCode')?.direction || 'asc'}
                  onClick={(e) => handleSort('batchCode', e)}
                >
                  Batch Code
                </TableSortLabel>
              </TableCell>
            )}
            {cols.category && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'category')}
                  direction={sortConfigs.find((c) => c.key === 'category')?.direction || 'asc'}
                  onClick={(e) => handleSort('category', e)}
                >
                  Category
                </TableSortLabel>
              </TableCell>
            )}
            {cols.mrp && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'mrp')}
                  direction={sortConfigs.find((c) => c.key === 'mrp')?.direction || 'asc'}
                  onClick={(e) => handleSort('mrp', e)}
                >
                  MRP
                </TableSortLabel>
              </TableCell>
            )}
            {cols.sp && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'sp')}
                  direction={sortConfigs.find((c) => c.key === 'sp')?.direction || 'asc'}
                  onClick={(e) => handleSort('sp', e)}
                >
                  Selling Price
                </TableSortLabel>
              </TableCell>
            )}
            {cols.cp && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'cp')}
                  direction={sortConfigs.find((c) => c.key === 'cp')?.direction || 'asc'}
                  onClick={(e) => handleSort('cp', e)}
                >
                  Cost Price
                </TableSortLabel>
              </TableCell>
            )}
            {cols.profitRs && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'profitRs')}
                  direction={sortConfigs.find((c) => c.key === 'profitRs')?.direction || 'asc'}
                  onClick={(e) => handleSort('profitRs', e)}
                >
                  Profit Unit(Rs)
                </TableSortLabel>
              </TableCell>
            )}
            {cols.discRsVendor && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'discRsVendor')}
                  direction={sortConfigs.find((c) => c.key === 'discRsVendor')?.direction || 'asc'}
                  onClick={(e) => handleSort('discRsVendor', e)}
                >
                  Disc Vendor(Rs)
                </TableSortLabel>
              </TableCell>
            )}
            {cols.discPctVendor && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'discPctVendor')}
                  direction={sortConfigs.find((c) => c.key === 'discPctVendor')?.direction || 'asc'}
                  onClick={(e) => handleSort('discPctVendor', e)}
                >
                  Disc Vendor(%)
                </TableSortLabel>
              </TableCell>
            )}
            {cols.discRsCust && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'discRsCust')}
                  direction={sortConfigs.find((c) => c.key === 'discRsCust')?.direction || 'asc'}
                  onClick={(e) => handleSort('discRsCust', e)}
                >
                  Disc Cust(Rs)
                </TableSortLabel>
              </TableCell>
            )}
            {cols.discPctCust && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'discPctCust')}
                  direction={sortConfigs.find((c) => c.key === 'discPctCust')?.direction || 'asc'}
                  onClick={(e) => handleSort('discPctCust', e)}
                >
                  Disc Cust(%)
                </TableSortLabel>
              </TableCell>
            )}
            {cols.marginPct && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'marginPct')}
                  direction={sortConfigs.find((c) => c.key === 'marginPct')?.direction || 'asc'}
                  onClick={(e) => handleSort('marginPct', e)}
                >
                  Margin (%)
                </TableSortLabel>
              </TableCell>
            )}
            {cols.barcode && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'barcode')}
                  direction={sortConfigs.find((c) => c.key === 'barcode')?.direction || 'asc'}
                  onClick={(e) => handleSort('barcode', e)}
                >
                  Barcode
                </TableSortLabel>
              </TableCell>
            )}
            {cols.expiry && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'expiry')}
                  direction={sortConfigs.find((c) => c.key === 'expiry')?.direction || 'asc'}
                  onClick={(e) => handleSort('expiry', e)}
                >
                  Expiry
                </TableSortLabel>
              </TableCell>
            )}
            {cols.wsPrice && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'wsPrice')}
                  direction={sortConfigs.find((c) => c.key === 'wsPrice')?.direction || 'asc'}
                  onClick={(e) => handleSort('wsPrice', e)}
                >
                  WS Price
                </TableSortLabel>
              </TableCell>
            )}
            {cols.wsMinQty && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'wsMinQty')}
                  direction={sortConfigs.find((c) => c.key === 'wsMinQty')?.direction || 'asc'}
                  onClick={(e) => handleSort('wsMinQty', e)}
                >
                  WS Min Qty
                </TableSortLabel>
              </TableCell>
            )}
            {cols.lowStockEnabled && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'lowStockEnabled')}
                  direction={
                    sortConfigs.find((c) => c.key === 'lowStockEnabled')?.direction || 'asc'
                  }
                  onClick={(e) => handleSort('lowStockEnabled', e)}
                >
                  Low Stock
                </TableSortLabel>
              </TableCell>
            )}
            {cols.batchTrackingEnabled && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'batchTrackingEnabled')}
                  direction={
                    sortConfigs.find((c) => c.key === 'batchTrackingEnabled')?.direction || 'asc'
                  }
                  onClick={(e) => handleSort('batchTrackingEnabled', e)}
                >
                  Batch Tracking
                </TableSortLabel>
              </TableCell>
            )}
            {cols.stock && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'stock')}
                  direction={sortConfigs.find((c) => c.key === 'stock')?.direction || 'asc'}
                  onClick={(e) => handleSort('stock', e)}
                >
                  Stock
                </TableSortLabel>
              </TableCell>
            )}
            {cols.totalValCp && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'totalValCp')}
                  direction={sortConfigs.find((c) => c.key === 'totalValCp')?.direction || 'asc'}
                  onClick={(e) => handleSort('totalValCp', e)}
                >
                  Total Value (Cost)
                </TableSortLabel>
              </TableCell>
            )}
            {cols.totalValSp && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'totalValSp')}
                  direction={sortConfigs.find((c) => c.key === 'totalValSp')?.direction || 'asc'}
                  onClick={(e) => handleSort('totalValSp', e)}
                >
                  Total Rev (Selling)
                </TableSortLabel>
              </TableCell>
            )}
            {cols.createdAt && (
              <TableCell sx={{ bgcolor: '#e8eaf6', fontWeight: 800, whiteSpace: 'nowrap' }}>
                <TableSortLabel
                  active={sortConfigs.some((c) => c.key === 'createdAt')}
                  direction={sortConfigs.find((c) => c.key === 'createdAt')?.direction || 'asc'}
                  onClick={(e) => handleSort('createdAt', e)}
                >
                  Added On
                </TableSortLabel>
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredAndSortedData.map((row, index) => (
            <TableRow
              hover
              key={row.id}
              sx={{
                '&:hover .MuiTableCell-root:not(.sticky-col)': {
                  bgcolor: 'rgba(25, 118, 210, 0.15) !important',
                },
              }}
            >
              {cols.sno && (
                <TableCell
                  className="sticky-col"
                  sx={{
                    fontWeight: 500,
                    color: 'text.secondary',
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                    borderRight: '2px solid #ccc',
                    transition: 'background-color 0.2s',
                    '.MuiTableRow-hover:hover &': { bgcolor: '#f5f5f5' },
                  }}
                >
                  {index + 1}
                </TableCell>
              )}
              {cols.name && (
                <TableCell
                  className="sticky-col"
                  sx={{
                    fontWeight: 700,
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    left: cols.sno ? 45 : 0,
                    zIndex: 2,
                    borderRight: '2px solid #ccc',
                    transition: 'background-color 0.2s',
                    '.MuiTableRow-hover:hover &': { bgcolor: '#f5f5f5' },
                  }}
                >
                  {row.name}
                </TableCell>
              )}
              {cols.stockStatus && (
                <TableCell
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
                </TableCell>
              )}
              {cols.batchCode && <TableCell sx={{ py: 0.5 }}>{row.batchCode}</TableCell>}
              {cols.category && <TableCell sx={{ py: 0.5 }}>{row.category}</TableCell>}
              {cols.mrp && <TableCell sx={{ py: 0.5 }}>{row.mrp.toFixed(2)}</TableCell>}
              {cols.sp && (
                <TableCell sx={{ py: 0.5, color: 'primary.main', fontWeight: 600 }}>
                  {row.sp?.toFixed(2)}
                </TableCell>
              )}
              {cols.cp && <TableCell sx={{ py: 0.5 }}>{row.cp?.toFixed(2)}</TableCell>}
              {cols.profitRs && (
                <TableCell
                  sx={{
                    py: 0.5,
                    fontWeight: 700,
                    color: row.profitRs > 0 ? 'success.main' : 'error.main',
                  }}
                >
                  {row.profitRs.toFixed(2)}
                </TableCell>
              )}
              {cols.discRsVendor && (
                <TableCell sx={{ py: 0.5, color: 'success.main' }}>
                  {row.discRsVendor.toFixed(2)}
                </TableCell>
              )}
              {cols.discPctVendor && (
                <TableCell sx={{ py: 0.5, fontWeight: 700, color: 'success.main' }}>
                  {row.discPctVendor.toFixed(1)}%
                </TableCell>
              )}
              {cols.discRsCust && (
                <TableCell sx={{ py: 0.5, color: 'error.main' }}>
                  {row.discRsCust.toFixed(2)}
                </TableCell>
              )}
              {cols.discPctCust && (
                <TableCell sx={{ py: 0.5, fontWeight: 700 }}>
                  {row.discPctCust.toFixed(1)}%
                </TableCell>
              )}
              {cols.marginPct && (
                <TableCell
                  sx={{
                    py: 0.5,
                    fontWeight: 700,
                    color: row.marginPct > 15 ? 'success.main' : 'warning.main',
                  }}
                >
                  {row.marginPct.toFixed(1)}%
                </TableCell>
              )}
              {cols.barcode && (
                <TableCell sx={{ py: 0.5, fontFamily: 'monospace' }}>{row.barcode}</TableCell>
              )}
              {cols.expiry && (
                <TableCell sx={{ py: 0.5, bgcolor: getExpiryColor(row.expiry) }}>
                  {row.expiry ? new Date(row.expiry).toLocaleDateString() : '—'}
                </TableCell>
              )}
              {cols.wsPrice && (
                <TableCell>{row.wsPrice ? `${row.wsPrice.toFixed(2)}` : '—'}</TableCell>
              )}
              {cols.wsMinQty && <TableCell>{row.wsMinQty || '—'}</TableCell>}
              {cols.lowStockEnabled && (
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                  <Chip
                    label={row.lowStockEnabled ? 'Enabled' : 'Disabled'}
                    size="small"
                    color={row.lowStockEnabled ? 'warning' : 'default'}
                    variant={row.lowStockEnabled ? 'filled' : 'outlined'}
                    sx={{ height: 18, fontSize: '0.6rem' }}
                  />
                </TableCell>
              )}
              {cols.batchTrackingEnabled && (
                <TableCell sx={{ py: 0.5, textAlign: 'center' }}>
                  <Chip
                    label={row.batchTrackingEnabled ? 'Enabled' : 'Disabled'}
                    size="small"
                    color={row.batchTrackingEnabled ? 'primary' : 'default'}
                    variant={row.batchTrackingEnabled ? 'filled' : 'outlined'}
                    sx={{ height: 18, fontSize: '0.6rem' }}
                  />
                </TableCell>
              )}
              {cols.stock && (
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: row.stock <= 5 ? '#ffebee' : row.stock <= 15 ? '#fff3e0' : '#e8f5e9',
                    color:
                      row.stock <= 5
                        ? 'error.main'
                        : row.stock <= 15
                          ? 'warning.main'
                          : 'success.main',
                  }}
                >
                  {row.stock}
                </TableCell>
              )}
              {cols.totalValCp && (
                <TableCell sx={{ fontWeight: 600 }}>{row.totalValCp.toFixed(2)}</TableCell>
              )}
              {cols.totalValSp && (
                <TableCell sx={{ fontWeight: 600 }}>{row.totalValSp.toFixed(2)}</TableCell>
              )}
              {cols.createdAt && (
                <TableCell>
                  {row.createdAt !== 'N/A' ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>

        <TableBody>
          <TableRow
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 4,
              '& .MuiTableCell-root': {
                bgcolor: '#e1e3f1',
                borderTop: '2px solid #ccc',
              },
            }}
          >
            <TableCell
              colSpan={cols.sno ? 2 : 1}
              sx={{
                fontWeight: 800,
                py: 1.5,
                position: 'sticky',
                left: 0,
                zIndex: 5,
                borderRight: '2px solid #ccc',
              }}
            >
              TOTALS / AVERAGES
            </TableCell>
            {cols.stockStatus && <TableCell sx={{ fontWeight: 800 }} />}
            {cols.batchCode && <TableCell sx={{ fontWeight: 800 }} />}
            {cols.category && <TableCell sx={{ fontWeight: 800 }} />}
            {cols.mrp && <TableCell sx={{ fontWeight: 800 }} />}
            {cols.sp && (
              <TableCell sx={{ fontWeight: 800 }}>{totals.avgSp?.toFixed(2) || '0.00'}</TableCell>
            )}
            {cols.cp && (
              <TableCell sx={{ fontWeight: 800 }}>{totals.avgCp?.toFixed(2) || '0.00'}</TableCell>
            )}
            {cols.profitRs && (
              <TableCell sx={{ fontWeight: 800 }}>
                {totals.avgSp && totals.avgCp ? (totals.avgSp - totals.avgCp).toFixed(2) : '0.00'}
              </TableCell>
            )}
            {cols.discRsVendor && (
              <TableCell sx={{ fontWeight: 800 }}>
                {totals.avgDiscRsVendor?.toFixed(2) || '0.00'}
              </TableCell>
            )}
            {cols.discPctVendor && (
              <TableCell sx={{ fontWeight: 800 }}>
                {totals.avgDiscPctVendor?.toFixed(1) || '0.0'}%
              </TableCell>
            )}
            {cols.discRsCust && (
              <TableCell sx={{ fontWeight: 800 }}>
                {totals.avgDiscRsCust?.toFixed(2) || '0.00'}
              </TableCell>
            )}
            {cols.discPctCust && (
              <TableCell sx={{ fontWeight: 800 }}>
                {totals.avgDiscPctCust?.toFixed(1) || '0.0'}%
              </TableCell>
            )}
            {cols.marginPct && (
              <TableCell sx={{ fontWeight: 800 }}>
                {totals.avgMargin?.toFixed(1) || '0.0'}%
              </TableCell>
            )}
            {cols.barcode && <TableCell sx={{ fontWeight: 800 }} />}
            {cols.expiry && <TableCell sx={{ fontWeight: 800 }} />}
            {cols.wsPrice && (
              <TableCell sx={{ fontWeight: 800 }}>
                {totals.avgWsPrice?.toFixed(2) || '0.00'}
              </TableCell>
            )}
            {cols.wsMinQty && <TableCell sx={{ fontWeight: 800 }} />}
            {cols.lowStockEnabled && <TableCell sx={{ fontWeight: 800 }} />}
            {cols.batchTrackingEnabled && <TableCell sx={{ fontWeight: 800 }} />}
            {cols.stock && (
              <TableCell sx={{ fontWeight: 900, fontSize: '1rem', color: '#1a237e' }}>
                {totals.totalStock || 0}
              </TableCell>
            )}
            {cols.totalValCp && (
              <TableCell sx={{ fontWeight: 900, fontSize: '1rem', color: 'error.main' }}>
                {totals.totalValueCost?.toFixed(2) || '0.00'}
              </TableCell>
            )}
            {cols.totalValSp && (
              <TableCell sx={{ fontWeight: 900, fontSize: '1rem', color: 'success.main' }}>
                {totals.totalValueSelling?.toFixed(2) || '0.00'}
              </TableCell>
            )}
            {cols.createdAt && <TableCell sx={{ fontWeight: 800 }} />}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InventoryExcelTable;
