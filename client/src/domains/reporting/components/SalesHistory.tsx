import React from 'react';
import type { ReportSale } from '@/shared/types/models';
import {
  Box,
  Typography,
  Chip,
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from '@mui/material';
import { ListAlt as OrdersIcon, ReceiptLong as ReceiptIcon } from '@mui/icons-material';
import { getRefundStatus, getStatusDisplay } from '@/shared/utils/refundStatus';
import { getSaleMarginStats } from '@/domains/reporting/components/saleMarginUtils';
import ExportOptions from '@/domains/reporting/components/ExportOptions';
import useSortableTable from '@/shared/hooks/useSortableTable';
import SortableTableHead from '@/domains/reporting/components/SortableTableHead';
import { useResizablePanel } from '@/shared/hooks/useResizablePanel';
import SaleDetailPanel from '@/domains/reporting/components/SaleDetailPanel';
import ReportTableEmptyState from '@/domains/reporting/components/ReportTableEmptyState';
import ReportTablePagination from '@/domains/reporting/components/ReportTablePagination';
import { usePagedTable } from '@/domains/reporting/components/usePagedTable';
import type { SalesExportTotals } from './salesExportUtils';
import { exportSalesToPDF } from '@/domains/reporting/components/salesExportUtils';

interface SalesHistoryRowProps {
  sale: ReportSale;
  index: number;
  isSelected?: boolean;
  onSelectSale: (sale: ReportSale | null) => void;
}

const SalesHistoryRow = ({ sale, index, isSelected, onSelectSale }: SalesHistoryRowProps) => {
  const refundStatus = getRefundStatus(sale.items);
  const display = getStatusDisplay(refundStatus);
  const { cost, margin } = getSaleMarginStats(sale);

  return (
    <TableRow
      hover
      onClick={() => onSelectSale(isSelected ? null : sale)}
      sx={{
        cursor: 'pointer',
        bgcolor: isSelected ? 'rgba(11, 29, 57, 0.05)' : undefined,
        '&:hover': { bgcolor: isSelected ? 'rgba(11, 29, 57, 0.08)' : '#f8fafc' },
      }}
    >
      <TableCell
        sx={{
          py: 1.25,
          px: 1.5,
          fontWeight: 600,
          color: '#64748b',
          fontSize: '0.78rem',
          width: '5%',
          minWidth: '50px',
          whiteSpace: 'nowrap',
          borderLeft: isSelected ? '3px solid #0b1d39' : '3px solid transparent',
        }}
      >
        {index + 1}
      </TableCell>
      <TableCell sx={{ py: 1.25, px: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
          {sale?.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {sale?.createdAt
            ? new Date(sale.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 1.25, px: 1.5, fontWeight: 600, fontSize: '0.85rem' }}>#{sale.id}</TableCell>
      <TableCell align="right" sx={{ py: 1.25, px: 1.5, fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>
        {cost.toFixed(2)}
      </TableCell>
      <TableCell align="right" sx={{ py: 1.25, px: 1.5, fontWeight: 700, fontSize: '0.85rem' }}>
        {(sale?.netTotalAmount || 0).toFixed(2)}
      </TableCell>
      <TableCell align="right" sx={{ py: 1.25, px: 1.5 }}>
        <Typography sx={{ color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>
          {sale.profit.toFixed(2)}
        </Typography>
      </TableCell>
      <TableCell align="center" sx={{ py: 1.25, px: 1.5 }}>
        <Chip
          label={`${margin.toFixed(1)}%`}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: margin > 20 ? '#e8f5e9' : '#f8fafc',
            color: margin > 20 ? '#16a34a' : '#64748b',
            fontSize: '0.68rem',
            height: 22,
          }}
        />
      </TableCell>
      <TableCell align="left" sx={{ py: 1.25, px: 1.5 }}>
        <Chip
          label={display.label}
          size="small"
          sx={{
            bgcolor: display.bgcolor,
            color: display.color,
            fontWeight: 700,
            fontSize: '0.68rem',
            height: 22,
          }}
        />
      </TableCell>
    </TableRow>
  );
};

/** The reports endpoint's enriched sale row. */
type SaleRow = ReportSale;

interface SalesHistoryProps {
  sales?: SaleRow[] | null;
  timeframeLabel?: string;
  selectedSale?: SaleRow | null;
  onSelectSale?: (sale: SaleRow | null) => void;
}

const SalesHistory = ({
  sales,
  timeframeLabel,
  selectedSale: controlledSelectedSale,
  onSelectSale,
}: SalesHistoryProps) => {
  const [internalSelectedSale, setInternalSelectedSale] = React.useState<SaleRow | null>(null);
  const activeSelectedSale =
    controlledSelectedSale !== undefined ? controlledSelectedSale : internalSelectedSale;

  const handleSelectSale = (sale: SaleRow | null) => {
    if (onSelectSale) {
      onSelectSale(sale);
    }
    setInternalSelectedSale(sale);
  };

  const { width: rightPanelWidth, isResizing, startResizing } = useResizablePanel({
    storageKey: 'reportSaleDetailRightPanelWidth',
    defaultWidth: 480,
    min: 340,
    maxRatio: 0.6,
  });

  const {
    items: sortedData,
    requestSort,
    sortConfig,
  } = useSortableTable(sales || [], { key: 'createdAt', direction: 'desc' });

  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedData,
    setPage,
    handleRowsPerPageChange,
  } = usePagedTable(sortedData, [sales]);

  const totals = React.useMemo(() => {
    if (!sales || sales.length === 0) return { amount: 0, profit: 0, cost: 0 };
    return sales.reduce<SalesExportTotals>(
      (acc, sale) => ({
        amount: acc.amount + (sale.netTotalAmount || 0),
        profit: acc.profit + (sale.profit || 0),
        cost: acc.cost + ((sale.netTotalAmount || 0) - (sale.profit || 0)),
      }),
      { amount: 0, profit: 0, cost: 0 }
    );
  }, [sales]);

  const handlePrint = () => window.print();

  const handleExportPDF = () => exportSalesToPDF(sales, timeframeLabel || '', totals);

  return (
    <Box
      className="report-print-area"
      sx={{
        flex: 1,
        display: 'flex',
        gap: 2,
        minHeight: 0,
        overflow: 'hidden',
        '@media print': {
          p: 0,
          border: 'none',
          '& .MuiTableContainer-root': { overflow: 'visible !important', height: 'auto !important' },
          '& .MuiTableRow-root': { pageBreakInside: 'avoid', position: 'static !important' },
          '& .MuiTableCell-root': {
            position: 'static !important',
            borderBottom: '1px solid #eee !important',
          },
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        <Box
          className="no-print"
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            justifyContent: 'space-between',
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: '#0b1d39',
                lineHeight: 1.2,
              }}
            >
              Profit & Margin Report
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: '#64748b',
                fontSize: '0.75rem',
                lineHeight: 1,
              }}
            >
              All Transactions ({sales?.length || 0})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExportOptions onPrint={handlePrint} onExportPDF={handleExportPDF} />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 850, tableLayout: 'fixed' }}>
            <SortableTableHead
              columns={[
                { id: 'sno', label: 'S.NO.', sx: { width: '5%', minWidth: '50px' }, sortable: false },
                { id: 'createdAt', label: 'DATE & TIME', sx: { width: '20%' } },
                { id: 'id', label: 'ORDER ID', sx: { width: '11%' } },
                {
                  id: 'cost',
                  label: 'COST PRICE (₹)',
                  align: 'right',
                  sx: { width: '14%' },
                  getter: (sale) => (sale.netTotalAmount || 0) - (sale.profit || 0),
                },
                { id: 'netTotalAmount', label: 'SELLING PRICE (₹)', align: 'right', sx: { width: '14%' } },
                { id: 'profit', label: 'PROFIT (₹)', align: 'right', sx: { width: '13%' } },
                {
                  id: 'margin',
                  label: 'MARGIN',
                  align: 'center',
                  sx: { width: '9%' },
                  getter: (sale) =>
                    sale.netTotalAmount > 0 ? (sale.profit / sale.netTotalAmount) * 100 : 0,
                },
                {
                  id: 'status',
                  label: 'STATUS',
                  align: 'left',
                  sx: { width: '14%' },
                  getter: (sale) => getStatusDisplay(getRefundStatus(sale.items)).label,
                },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {paginatedData?.map((sale, idx) => (
                <SalesHistoryRow
                  key={sale.id}
                  sale={sale}
                  index={page * rowsPerPage + idx}
                  isSelected={activeSelectedSale?.id === sale.id}
                  onSelectSale={handleSelectSale}
                />
              ))}
              {sales && sales.length > 0 && (
                <TableRow
                  sx={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 2,
                    bgcolor: '#f8fafc',
                    '&:hover': { bgcolor: '#f8fafc' },
                  }}
                >
                  <TableCell
                    colSpan={3}
                    sx={{
                      py: 1.25,
                      px: 1.5,
                      fontWeight: 700,
                      color: '#475569',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      fontSize: '0.8rem',
                    }}
                  >
                    Total Current Period
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      py: 1.25,
                      px: 1.5,
                      fontWeight: 700,
                      color: '#64748b',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      fontSize: '0.85rem',
                    }}
                  >
                    {totals.cost.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      py: 1.25,
                      px: 1.5,
                      fontWeight: 700,
                      color: '#1e293b',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      fontSize: '0.85rem',
                    }}
                  >
                    {totals.amount.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      py: 1.25,
                      px: 1.5,
                      fontWeight: 700,
                      color: '#16a34a',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      fontSize: '0.85rem',
                    }}
                  >
                    {totals.profit.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ py: 1.25, px: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
                  >
                    <Chip
                      label={`${totals.amount > 0 ? ((totals.profit / totals.amount) * 100).toFixed(1) : 0}%`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 700, height: 22, fontSize: '0.68rem' }}
                    />
                  </TableCell>
                  <TableCell
                    sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                  />
                </TableRow>
              )}
              {(!sales || sales.length === 0) && (
                <ReportTableEmptyState
                  colSpan={8}
                  icon={<ReceiptIcon />}
                  title="No transactions found"
                  subtitle="Try selecting a different timeframe or date range"
                />
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <ReportTablePagination
          count={sortedData.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* Resizer Handle */}
      {activeSelectedSale && (
        <Box
          onMouseDown={startResizing}
          sx={{
            display: { xs: 'none', lg: 'flex' },
            width: '12px',
            mx: -1.5,
            cursor: 'col-resize',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            flexShrink: 0,
            '&:hover .handle': {
              bgcolor: '#0b1d39',
              width: '4px',
            },
          }}
        >
          <Box
            className="handle"
            sx={{
              width: '2px',
              height: '60px',
              bgcolor: isResizing ? '#0b1d39' : 'divider',
              borderRadius: '4px',
              transition: 'all 0.2s',
              ...(isResizing && { width: '4px' }),
            }}
          />
        </Box>
      )}

      {/* Right Detail Card */}
      {activeSelectedSale && (
        <Box
          sx={{
            width: { xs: '100%', lg: rightPanelWidth },
            minWidth: { lg: 340 },
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <SaleDetailPanel
            selectedSale={activeSelectedSale}
            onClose={() => handleSelectSale(null)}
          />
        </Box>
      )}
    </Box>
  );
};

export default SalesHistory;
