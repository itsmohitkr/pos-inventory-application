import React, { useMemo } from 'react';
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
} from '@mui/material';
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
  const { aggregatedData, totals } = useMemo(() => aggregateItemSales(sales), [sales]);

  const {
    items: sortedData,
    requestSort,
    sortConfig,
  } = useSortableTable(aggregatedData, { key: 'revenue', direction: 'desc' });

  const handleExportPDF = () => exportItemSalesToPDF(aggregatedData, totals, timeframeLabel);
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
                      {totals.quantity}
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
                      ₹{totals.cost.toFixed(2)}
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
                      ₹{totals.revenue.toFixed(2)}
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
                      ₹{totals.profit.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ bgcolor: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}>
                      <Chip
                        label={`${totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0}%`}
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
