import React, { useMemo, useState } from 'react';
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
import { FilterAlt } from '@mui/icons-material';
import ExportOptions from '@/domains/reporting/components/ExportOptions';
import useSortableTable from '@/shared/hooks/useSortableTable';
import SortableTableHead from '@/domains/reporting/components/SortableTableHead';
import { aggregateItemSales, exportItemSalesToPDF } from '@/domains/reporting/components/itemSalesUtils';

const ItemSalesRow = ({ item }) => {
  const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
  return (
    <TableRow hover>
      <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
      <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {item.category}
      </TableCell>
      <TableCell align="center">{item.quantity}</TableCell>
      <TableCell align="right" sx={{ color: '#64748b' }}>
        ₹{item.cost.toFixed(2)}
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: 700 }}>
        ₹{item.revenue.toFixed(2)}
      </TableCell>
      <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 700 }}>
        ₹{item.profit.toFixed(2)}
      </TableCell>
      <TableCell align="right">
        <Chip
          label={`${margin.toFixed(1)}%`}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: margin > 20 ? '#dcfce7' : '#f0f9ff',
            color: margin > 20 ? '#15803d' : '#0369a1',
          }}
        />
      </TableCell>
    </TableRow>
  );
};

const ItemSalesReportPanel = ({ sales, loading, timeframeLabel }) => {
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

  const handleExportPDF = () => exportItemSalesToPDF(filteredAggregatedData, filteredTotals, timeframeLabel);
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
              Item-Wise Sales
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
              Detailed analysis of sales performance by individual product
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Autocomplete
              size="small"
              options={categories}
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
            <ExportOptions onExportPDF={handleExportPDF} onPrint={handlePrint} />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 1300, tableLayout: 'fixed' }}>
            <SortableTableHead
              columns={[
                { id: 'name', label: 'PRODUCT', sx: { width: '22%' } },
                { id: 'category', label: 'CATEGORY', sx: { width: '12%' } },
                { id: 'quantity', label: 'QTY SOLD', align: 'center', sx: { width: '10%' } },
                { id: 'cost', label: 'COST', align: 'right', sx: { width: '12%' } },
                { id: 'revenue', label: 'REVENUE', align: 'right', sx: { width: '14%' } },
                { id: 'profit', label: 'PROFIT', align: 'right', sx: { width: '12%' } },
                {
                  id: 'margin',
                  label: 'MARGIN',
                  align: 'right',
                  sx: { width: '18%' },
                  getter: (item) => (item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0),
                },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No sales data found for this period.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {sortedData.map((item) => (
                    <ItemSalesRow key={item.id} item={item} />
                  ))}
                  <TableRow
                    sx={{
                      position: 'sticky',
                      bottom: 0,
                      zIndex: 2,
                      '&:hover': { bgcolor: 'transparent' },
                    }}
                  >
                    <TableCell
                      colSpan={2}
                      sx={{
                        py: 2,
                        fontWeight: 800,
                        color: '#475569',
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
                      {filteredTotals.quantity}
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
                      ₹{filteredTotals.cost.toFixed(2)}
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
                      ₹{filteredTotals.revenue.toFixed(2)}
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
                      ₹{filteredTotals.profit.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ bgcolor: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}>
                      <Chip
                        label={`${filteredTotals.revenue > 0 ? ((filteredTotals.profit / filteredTotals.revenue) * 100).toFixed(1) : 0}%`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 800 }}
                      />
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ItemSalesReportPanel;
