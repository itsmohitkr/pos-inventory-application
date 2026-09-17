import React from 'react';
import type { ReportSale } from '@/shared/types/models';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Autocomplete,
  TextField,
  InputAdornment,
} from '@mui/material';
import useSortableTable from '@/shared/hooks/useSortableTable';
import SortableTableHead from '@/domains/reporting/components/SortableTableHead';
import { Category as CategoryIcon } from '@mui/icons-material';
import ReportTableEmptyState from '@/domains/reporting/components/ReportTableEmptyState';
import ReportTablePagination from '@/domains/reporting/components/ReportTablePagination';
import { usePagedTable } from '@/domains/reporting/components/usePagedTable';

/** Sale rows from /api/reports; shape firms up once the server is typed. */
/** The reports endpoint's enriched sale row. */
type SaleRow = ReportSale;

/** Per-category totals accumulated from every sale item. */
interface CategoryTotals {
  name: string;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  itemCount: number;
}

interface CategorySalesPanelProps {
  sales?: SaleRow[] | null;
}

const columnTypographySx = {
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#334155',
};

const CategorySalesPanel = ({ sales }: CategorySalesPanelProps) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [selectedCategory, setSelectedCategory] = React.useState('All Categories');

  // Aggregate sales by category
  const categoryData = React.useMemo(() => {
    return (sales || []).reduce<Record<string, CategoryTotals>>((acc, sale) => {
      (sale?.items || []).forEach((item) => {
        if (!item) return;
        const category = item.batch?.product?.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = {
            name: category,
            totalSales: 0,
            totalCost: 0,
            totalProfit: 0,
            itemCount: 0,
          };
        }
        acc[category].totalSales += (item.sellingPrice || 0) * (item.netQuantity || 0);
        acc[category].totalCost +=
          (item.sellingPrice || 0) * (item.netQuantity || 0) - (item.profit || 0);
        acc[category].totalProfit += item.profit || 0;
        acc[category].itemCount += item.netQuantity || 0;
      });
      return acc;
    }, {});
  }, [sales]);

  const allCategories = React.useMemo(() => Object.keys(categoryData).sort(), [categoryData]);

  const categoryList = React.useMemo(() => {
    let list = Object.values(categoryData);
    if (selectedCategory !== 'All Categories') {
      list = list.filter((cat) => cat.name === selectedCategory);
    }
    return list;
  }, [categoryData, selectedCategory]);

  const {
    items: sortedData,
    requestSort,
    sortConfig,
  } = useSortableTable(categoryList, { key: 'totalSales', direction: 'desc' });

  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedData,
    setPage,
    handleRowsPerPageChange,
  } = usePagedTable(sortedData, [sales, selectedCategory]);

  const totals = React.useMemo(() => {
    return categoryList.reduce(
      (acc, cat) => ({
        itemCount: acc.itemCount + (cat.itemCount || 0),
        totalSales: acc.totalSales + (cat.totalSales || 0),
        totalCost: acc.totalCost + (cat.totalCost || 0),
        totalProfit: acc.totalProfit + (cat.totalProfit || 0),
      }),
      { itemCount: 0, totalSales: 0, totalCost: 0, totalProfit: 0 }
    );
  }, [categoryList]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [selectedCategory, page]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.role === 'combobox'
      )
        return;
      if (paginatedData.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectedIndex < paginatedData.length - 1) {
          const next = selectedIndex + 1;
          setSelectedIndex(next);
          document
            .getElementById(`cat-row-${next}`)
            ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else if ((page + 1) * rowsPerPage < categoryList.length) {
          setPage(page + 1);
          setSelectedIndex(0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedIndex > 0) {
          const prevIdx = selectedIndex - 1;
          setSelectedIndex(prevIdx);
          document
            .getElementById(`cat-row-${prevIdx}`)
            ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else if (page > 0) {
          setPage(page - 1);
          setSelectedIndex(rowsPerPage - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedData, selectedIndex, page, rowsPerPage, categoryList.length, setPage]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          '@media print': {
            p: 0,
            border: 'none',
            '& .MuiTableContainer-root': {
              overflow: 'visible !important',
              height: 'auto !important',
            },
            '& .MuiTableRow-root': {
              pageBreakInside: 'avoid',
              position: 'static !important',
            },
            '& .MuiTableCell-root': {
              position: 'static !important',
              borderBottom: '1px solid #eee !important',
            },
          },
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
              Category Sales Performance
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
              All Categories ({sortedData.length})
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Autocomplete
              size="small"
              options={['All Categories', ...allCategories]}
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
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 1000, tableLayout: 'fixed' }}>
            <SortableTableHead
              columns={[
                { id: 'sno', label: 'S.NO.', sx: { width: '5%', minWidth: '50px' }, sortable: false },
                { id: 'name', label: 'CATEGORY', sx: { width: '25%' } },
                { id: 'itemCount', label: 'ITEMS', align: 'center', sx: { width: '12%' } },
                { id: 'totalCost', label: 'COST (₹)', align: 'right', sx: { width: '14%' } },
                { id: 'totalSales', label: 'SALES (₹)', align: 'right', sx: { width: '14%' } },
                { id: 'totalProfit', label: 'PROFIT (₹)', align: 'right', sx: { width: '14%' } },
                {
                  id: 'margin',
                  label: 'MARGIN',
                  align: 'right',
                  sx: { width: '16%' },
                  getter: (cat) =>
                    cat.totalSales > 0 ? (cat.totalProfit / cat.totalSales) * 100 : 0,
                },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {paginatedData.map((cat, idx) => {
                const globalIdx = page * rowsPerPage + idx;
                return (
                  <TableRow
                    key={cat.name}
                    id={`cat-row-${idx}`}
                    hover
                    selected={selectedIndex === idx}
                    sx={{
                      cursor: 'pointer',
                      '&.Mui-selected': { bgcolor: 'rgba(11, 29, 57, 0.08)' },
                      '&:hover': { bgcolor: selectedIndex === idx ? 'rgba(11, 29, 57, 0.12)' : '#f8fafc' },
                    }}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <TableCell sx={{ py: 1.25, px: 1.5, ...columnTypographySx, width: '5%', minWidth: '50px', whiteSpace: 'nowrap' }}>
                      {globalIdx + 1}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5, fontWeight: 600, fontSize: '0.85rem', color: 'text.primary', textTransform: 'capitalize' }}>
                      {cat.name}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.25, px: 1.5, ...columnTypographySx }}>
                      {cat.itemCount}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, px: 1.5, ...columnTypographySx }}>
                      {cat.totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, px: 1.5, ...columnTypographySx }}>
                      {cat.totalSales.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, px: 1.5, ...columnTypographySx }}>
                      {cat.totalProfit.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, px: 1.5 }}>
                      <Chip
                        label={`${((cat.totalProfit / cat.totalSales) * 100).toFixed(1)}%`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          height: 22,
                          bgcolor: cat.totalProfit / cat.totalSales > 0.2 ? '#e8f5e9' : '#f0f4f8',
                          color: cat.totalProfit / cat.totalSales > 0.2 ? '#16a34a' : '#0b1d39',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {categoryList.length > 0 && (
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
                    colSpan={2}
                    sx={{
                      fontWeight: 700,
                      color: '#475569',
                      py: 1.25,
                      px: 1.5,
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
                    {totals.itemCount}
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
                    {totals.totalCost.toFixed(2)}
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
                    {totals.totalSales.toFixed(2)}
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
                    {totals.totalProfit.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ py: 1.25, px: 1.5, borderTop: '1px solid #e2e8f0' }}
                  >
                    <Chip
                      label={`${totals.totalSales > 0 ? ((totals.totalProfit / totals.totalSales) * 100).toFixed(1) : 0}%`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 700, height: 22, fontSize: '0.68rem' }}
                    />
                  </TableCell>
                </TableRow>
              )}
              {categoryList.length === 0 && (
                <ReportTableEmptyState
                  colSpan={7}
                  icon={<CategoryIcon />}
                  title="No category sales found"
                  subtitle="Try selecting a different timeframe or category filter"
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
    </Box>
  );
};

export default CategorySalesPanel;
