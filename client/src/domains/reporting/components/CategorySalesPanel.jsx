import React from 'react';
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
import { FilterAlt } from '@mui/icons-material';
import useSortableTable from '@/shared/hooks/useSortableTable';
import SortableTableHead from '@/domains/reporting/components/SortableTableHead';

const CategorySalesPanel = ({ sales }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [selectedCategory, setSelectedCategory] = React.useState('All Categories');

  // Aggregate sales by category
  const categoryData = React.useMemo(() => {
    return (sales || []).reduce((acc, sale) => {
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
  }, [selectedCategory]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.role === 'combobox'
      )
        return;
      if (categoryList.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.min(prev + 1, categoryList.length - 1);
          document
            .getElementById(`cat-row-${next}`)
            ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const prevIdx = Math.max(prev - 1, 0);
          document
            .getElementById(`cat-row-${prevIdx}`)
            ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return prevIdx;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [categoryList]);

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
            p: 2,
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              Category Sales Performance
              <Box
                component="span"
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'primary.main',
                  bgcolor: 'primary.lighter',
                  px: 1,
                  borderRadius: 1,
                }}
              >
                ({sortedData.length})
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Performance metrics grouped by category
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Autocomplete
              size="small"
              options={['All Categories', ...allCategories]}
              value={selectedCategory}
              onChange={(event, newValue) => setSelectedCategory(newValue || 'All Categories')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Category"
                  placeholder="Type to filter..."
                  sx={{
                    minWidth: 240,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      bgcolor: '#f8fafc',
                      fontWeight: 600,
                      '& fieldset': { borderColor: '#e2e8f0' },
                      '&:hover fieldset': { borderColor: '#cbd5e1' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '2px' },
                    },
                    '& .MuiInputLabel-root': { fontWeight: 500, color: '#64748b' },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterAlt sx={{ fontSize: 18, color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              sx={{
                '& .MuiAutocomplete-option': {
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  py: 1,
                },
              }}
            />
          </Box>
        </Box>
        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 1200, tableLayout: 'fixed' }}>
            <SortableTableHead
              columns={[
                { id: 'name', label: 'CATEGORY NAME', sx: { width: '25%' } },
                { id: 'itemCount', label: 'ITEMS SOLD', align: 'center', sx: { width: '12%' } },
                { id: 'totalCost', label: 'TOTAL COST', align: 'right', sx: { width: '15%' } },
                { id: 'totalSales', label: 'TOTAL SALES', align: 'right', sx: { width: '15%' } },
                { id: 'totalProfit', label: 'TOTAL PROFIT', align: 'right', sx: { width: '15%' } },
                {
                  id: 'margin',
                  label: 'AVG. MARGIN',
                  align: 'right',
                  sx: { width: '18%' },
                  getter: (cat) =>
                    cat.totalSales > 0 ? (cat.totalProfit / cat.totalSales) * 100 : 0,
                },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {sortedData.map((cat, idx) => (
                <TableRow
                  key={cat.name}
                  id={`cat-row-${idx}`}
                  hover
                  selected={selectedIndex === idx}
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected': { bgcolor: 'rgba(25, 118, 210, 0.08)' },
                  }}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <TableCell sx={{ fontWeight: 700 }}>{cat.name}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{cat.itemCount}</TableCell>
                  <TableCell align="right" sx={{ color: '#64748b' }}>
                    ₹{cat.totalCost.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    ₹{cat.totalSales.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                    ₹{cat.totalProfit.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${((cat.totalProfit / cat.totalSales) * 100).toFixed(1)}%`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: cat.totalProfit / cat.totalSales > 0.2 ? '#e8f5e9' : '#f0f4f8',
                        color: cat.totalProfit / cat.totalSales > 0.2 ? '#2e7d32' : '#1a73e8',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {categoryList.length > 0 && (
                <TableRow
                  sx={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 2,
                    '&:hover': { bgcolor: 'transparent' },
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      color: '#475569',
                      py: 2,
                      bgcolor: '#f1f5f9',
                      borderTop: '2px solid #e2e8f0',
                    }}
                  >
                    TOTAL SUMMARY
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 800,
                      color: '#0f172a',
                      bgcolor: '#f1f5f9',
                      borderTop: '2px solid #e2e8f0',
                    }}
                  >
                    {totals.itemCount}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 800,
                      color: '#64748b',
                      bgcolor: '#f1f5f9',
                      borderTop: '2px solid #e2e8f0',
                    }}
                  >
                    ₹{totals.totalCost.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 800,
                      color: '#0f172a',
                      bgcolor: '#f1f5f9',
                      borderTop: '2px solid #e2e8f0',
                    }}
                  >
                    ₹{totals.totalSales.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 800,
                      color: '#16a34a',
                      bgcolor: '#f1f5f9',
                      borderTop: '2px solid #e2e8f0',
                    }}
                  >
                    ₹{totals.totalProfit.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ bgcolor: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}
                  >
                    <Chip
                      label={`${totals.totalSales > 0 ? ((totals.totalProfit / totals.totalSales) * 100).toFixed(1) : 0}%`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>
                </TableRow>
              )}
              {categoryList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      No category data available for this period.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default CategorySalesPanel;
