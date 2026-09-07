import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Autocomplete,
  TextField,
  InputAdornment,
} from '@mui/material';
import { FilterAlt, Inventory2 as InventoryIcon } from '@mui/icons-material';
import ExportOptions from '@/domains/reporting/components/ExportOptions';
import useSortableTable from '@/shared/hooks/useSortableTable';
import SortableTableHead from '@/domains/reporting/components/SortableTableHead';
import ReportTableEmptyState from '@/domains/reporting/components/ReportTableEmptyState';
import ReportTablePagination from '@/domains/reporting/components/ReportTablePagination';
import { usePagedTable } from '@/domains/reporting/components/usePagedTable';
import { aggregateItemSales, exportItemSalesToPDF } from '@/domains/reporting/components/itemSalesUtils';
import type { AggregatedItemSale } from '@/domains/reporting/components/itemSalesUtils';
import type { ReportSale } from '@/shared/types/models';

const ItemSalesRow = ({ item, index }: { item: AggregatedItemSale; index: number }) => {
  const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
  return (
    <TableRow hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
      <TableCell sx={{ py: 1.25, px: 1.5, fontWeight: 600, color: '#64748b', fontSize: '0.78rem', width: '5%', minWidth: '50px', whiteSpace: 'nowrap' }}>
        {index + 1}
      </TableCell>
      <TableCell sx={{ py: 1.25, px: 1.5, fontWeight: 700, fontSize: '0.85rem' }}>{item.name}</TableCell>
      <TableCell sx={{ py: 1.25, px: 1.5, color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem' }}>
        {item.category}
      </TableCell>
      <TableCell align="center" sx={{ py: 1.25, px: 1.5, fontWeight: 700, fontSize: '0.85rem' }}>{item.quantity}</TableCell>
      <TableCell align="right" sx={{ py: 1.25, px: 1.5, color: '#64748b', fontSize: '0.85rem' }}>
        ₹{item.cost.toFixed(2)}
      </TableCell>
      <TableCell align="right" sx={{ py: 1.25, px: 1.5, fontWeight: 700, fontSize: '0.85rem' }}>
        ₹{item.revenue.toFixed(2)}
      </TableCell>
      <TableCell align="right" sx={{ py: 1.25, px: 1.5, color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>
        ₹{item.profit.toFixed(2)}
      </TableCell>
      <TableCell align="right" sx={{ py: 1.25, px: 1.5 }}>
        <Chip
          label={`${margin.toFixed(1)}%`}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.68rem',
            height: 22,
            bgcolor: margin > 20 ? '#dcfce7' : '#f0f9ff',
            color: margin > 20 ? '#15803d' : '#0369a1',
          }}
        />
      </TableCell>
    </TableRow>
  );
};

interface ItemSalesReportPanelProps {
  sales?: ReportSale[] | null;
  loading?: boolean;
  /** Human-readable range shown in the header and the PDF export. */
  timeframeLabel?: string;
}

const ItemSalesReportPanel = ({
  sales,
  loading,
  timeframeLabel,
}: ItemSalesReportPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const { aggregatedData } = useMemo(() => aggregateItemSales(sales), [sales]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(aggregatedData.map((item) => item.category).filter(Boolean));
    return ['All Categories', ...Array.from(uniqueCategories).sort()];
  }, [aggregatedData]);

  const filteredAggregatedData = useMemo(() => {
    if (selectedCategory === 'All Categories') return aggregatedData;
    return aggregatedData.filter((item) => item.category === selectedCategory);
  }, [aggregatedData, selectedCategory]);

  const filteredTotals = useMemo(() => {
    return filteredAggregatedData.reduce(
      (acc, item) => ({
        quantity: acc.quantity + item.quantity,
        revenue: acc.revenue + item.revenue,
        profit: acc.profit + item.profit,
        cost: acc.cost + item.cost,
      }),
      { quantity: 0, revenue: 0, profit: 0, cost: 0 }
    );
  }, [filteredAggregatedData]);

  const {
    items: sortedData,
    requestSort,
    sortConfig,
  } = useSortableTable(filteredAggregatedData, { key: 'revenue', direction: 'desc' });

  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedData,
    setPage,
    handleRowsPerPageChange,
  } = usePagedTable(sortedData, [sales, selectedCategory]);

  const handleExportPDF = () => exportItemSalesToPDF(filteredAggregatedData, filteredTotals, timeframeLabel || '');
  const handlePrint = () => window.print();

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="text.secondary">Loading item sales data...</Typography>
      </Box>
    );
  }

  return (
    <Box
      className="report-print-area"
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        '@media print': {
          p: 0,
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
              Item-Wise Sales
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
              All Products ({sortedData.length})
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Autocomplete
              size="small"
              options={categories}
              value={selectedCategory}
              onChange={(event, newValue) => setSelectedCategory(newValue || 'All Categories')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Filter Category..."
                  sx={{
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      height: '36px',
                      borderRadius: '6px',
                      bgcolor: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      '& fieldset': { borderColor: '#e2e8f0' },
                      '&:hover fieldset': { borderColor: '#cbd5e1' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '1px' },
                    },
                  }}
                />
              )}
              sx={{
                '& .MuiAutocomplete-option': {
                  fontSize: '0.85rem',
                  py: 0.75,
                },
              }}
            />
            <ExportOptions onExportPDF={handleExportPDF} onPrint={handlePrint} />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 1000, tableLayout: 'fixed' }}>
            <SortableTableHead
              columns={[
                { id: 'sno', label: 'S.NO.', sx: { width: '5%', minWidth: '50px' }, sortable: false },
                { id: 'name', label: 'PRODUCT', sx: { width: '25%' } },
                { id: 'category', label: 'CATEGORY', sx: { width: '13%' } },
                { id: 'quantity', label: 'QTY SOLD', align: 'center', sx: { width: '10%' } },
                { id: 'cost', label: 'COST', align: 'right', sx: { width: '12%' } },
                { id: 'revenue', label: 'REVENUE', align: 'right', sx: { width: '12%' } },
                { id: 'profit', label: 'PROFIT', align: 'right', sx: { width: '11%' } },
                {
                  id: 'margin',
                  label: 'MARGIN',
                  align: 'right',
                  sx: { width: '12%' },
                  getter: (item) => (item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0),
                },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {sortedData.length === 0 ? (
                <ReportTableEmptyState
                  colSpan={8}
                  icon={<InventoryIcon />}
                  title="No item sales found"
                  subtitle="Try adjusting your search query or timeframe"
                />
              ) : (
                <>
                  {paginatedData.map((item, idx) => (
                    <ItemSalesRow key={item.id} item={item} index={page * rowsPerPage + idx} />
                  ))}
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
                        borderTop: '1px solid #e2e8f0',
                        fontSize: '0.8rem',
                      }}
                    >
                      TOTAL SUMMARY
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        color: '#0f172a',
                        py: 1.25,
                        px: 1.5,
                        borderTop: '1px solid #e2e8f0',
                        fontSize: '0.85rem',
                      }}
                    >
                      {filteredTotals.quantity}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color: '#64748b',
                        py: 1.25,
                        px: 1.5,
                        borderTop: '1px solid #e2e8f0',
                        fontSize: '0.85rem',
                      }}
                    >
                      ₹{filteredTotals.cost.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color: '#0f172a',
                        py: 1.25,
                        px: 1.5,
                        borderTop: '1px solid #e2e8f0',
                        fontSize: '0.85rem',
                      }}
                    >
                      ₹{filteredTotals.revenue.toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color: '#16a34a',
                        py: 1.25,
                        px: 1.5,
                        borderTop: '1px solid #e2e8f0',
                        fontSize: '0.85rem',
                      }}
                    >
                      ₹{filteredTotals.profit.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, px: 1.5, borderTop: '1px solid #e2e8f0' }}>
                      <Chip
                        label={`${filteredTotals.revenue > 0 ? ((filteredTotals.profit / filteredTotals.revenue) * 100).toFixed(1) : 0}%`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 700, height: 22, fontSize: '0.68rem' }}
                      />
                    </TableCell>
                  </TableRow>
                </>
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
    </Box>
  );
};

export default ItemSalesReportPanel;
