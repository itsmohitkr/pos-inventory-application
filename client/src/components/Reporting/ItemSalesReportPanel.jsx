import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from './ExportOptions';
import useSortableTable from '../../shared/hooks/useSortableTable';
import SortableTableHead from './SortableTableHead';

const ItemSalesReportPanel = ({ sales, loading, timeframeLabel }) => {
  // Aggregate data by product
  const { aggregatedData, totals } = useMemo(() => {
    if (!sales)
      return { aggregatedData: [], totals: { quantity: 0, revenue: 0, profit: 0, cost: 0 } };

    const itemsMap = {};
    const sums = { quantity: 0, revenue: 0, profit: 0, cost: 0 };

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const productId = item.batch?.product?.id || 'unknown';
        const productName = item.productName || 'Unknown Product';
        const category = item.batch?.product?.category || 'Uncategorized';
        const qty = item.netQuantity || 0;
        const rev = item.sellingPrice * qty;
        const prof = item.profit || 0;
        const cost = rev - prof;

        if (!itemsMap[productId]) {
          itemsMap[productId] = {
            id: productId,
            name: productName,
            category: category,
            quantity: 0,
            revenue: 0,
            profit: 0,
            cost: 0,
          };
        }

        itemsMap[productId].quantity += qty;
        itemsMap[productId].revenue += rev;
        itemsMap[productId].profit += prof;
        itemsMap[productId].cost += cost;

        sums.quantity += qty;
        sums.revenue += rev;
        sums.profit += prof;
        sums.cost += cost;
      });
    });

    return {
      aggregatedData: Object.values(itemsMap),
      totals: sums,
    };
  }, [sales]);

  const {
    items: sortedData,
    requestSort,
    sortConfig,
  } = useSortableTable(aggregatedData, { key: 'revenue', direction: 'desc' });

  const handleExportPDF = () => {
    if (aggregatedData.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Item-Wise Sales Report', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Timeframe: ${timeframeLabel}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

    const tableColumn = [
      'Product Name',
      'Category',
      'Quantity',
      'Cost',
      'Revenue',
      'Profit',
      'Margin',
    ];
    const tableRows = aggregatedData.map((item) => [
      item.name,
      item.category,
      item.quantity.toString(),
      `Rs ${item.cost.toFixed(2)}`,
      `Rs ${item.revenue.toFixed(2)}`,
      `Rs ${item.profit.toFixed(2)}`,
      `${item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(2) : '0.00'}%`,
    ]);

    // Add summary row to PDF
    const avgMargin =
      totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(2) : '0.00';
    tableRows.push([
      {
        content: 'TOTAL SUMMARY',
        colSpan: 2,
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
      },
      {
        content: totals.quantity.toString(),
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'center' },
      },
      {
        content: `Rs ${totals.cost.toFixed(2)}`,
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'right' },
      },
      {
        content: `Rs ${totals.revenue.toFixed(2)}`,
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'right' },
      },
      {
        content: `Rs ${totals.profit.toFixed(2)}`,
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'right' },
      },
      {
        content: `${avgMargin}%`,
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'right' },
      },
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 118, 210] },
    });

    doc.save(`item_sales_report_${timeframeLabel.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="text.secondary">Loading item sales data...</Typography>
      </Box>
    );
  }

  if (aggregatedData.length === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden',
            p: 4,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No sales data found for this period.
          </Typography>
        </Paper>
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
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <Box
          className="no-print"
          sx={{
            p: 3,
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Item-Wise Sales
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sales performance by product: {timeframeLabel}
            </Typography>
          </Box>
          <ExportOptions onExportPDF={handleExportPDF} onPrint={handlePrint} />
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 900, tableLayout: 'fixed' }}>
            <SortableTableHead
              columns={[
                { id: 'name', label: 'PRODUCT', sx: { width: '25%' } },
                { id: 'category', label: 'CATEGORY', sx: { width: '15%' } },
                { id: 'quantity', label: 'QTY SOLD', align: 'center', sx: { width: '10%' } },
                { id: 'cost', label: 'COST', align: 'right', sx: { width: '15%' } },
                { id: 'revenue', label: 'REVENUE', align: 'right', sx: { width: '15%' } },
                { id: 'profit', label: 'PROFIT', align: 'right', sx: { width: '12%' } },
                {
                  id: 'margin',
                  label: 'MARGIN',
                  align: 'right',
                  sx: { width: '8%' },
                  getter: (item) => (item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0),
                },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {sortedData.map((item) => {
                const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                return (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                    <TableCell>
                      <Chip label={item.category} size="small" variant="outlined" />
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
              })}
              {aggregatedData.length > 0 && (
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
                  <TableCell
                    align="right"
                    sx={{ bgcolor: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}
                  >
                    <Chip
                      label={`${totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0}%`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 800 }}
                    />
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

export default ItemSalesReportPanel;
