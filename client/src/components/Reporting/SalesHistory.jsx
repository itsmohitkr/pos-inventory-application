import React from 'react';
import {
  Box,
  Typography,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Paper,
} from '@mui/material';
import { ListAlt as OrdersIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { getRefundStatus, getStatusDisplay } from '../../shared/utils/refundStatus';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from './ExportOptions';
import useSortableTable from '../../shared/hooks/useSortableTable';
import SortableTableHead from './SortableTableHead';
const SalesHistory = ({ sales, timeframeLabel, onSelectSale }) => {
  const {
    items: sortedData,
    requestSort,
    sortConfig,
  } = useSortableTable(sales || [], { key: 'createdAt', direction: 'desc' });
  const totals = React.useMemo(() => {
    if (!sales || sales.length === 0) return { amount: 0, profit: 0, cost: 0 };
    return sales.reduce(
      (acc, sale) => ({
        amount: acc.amount + (sale.netTotalAmount || 0),
        profit: acc.profit + (sale.profit || 0),
        cost: acc.cost + ((sale.netTotalAmount || 0) - (sale.profit || 0)),
      }),
      { amount: 0, profit: 0, cost: 0 }
    );
  }, [sales]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!sales || sales.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Sales History', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Timeframe: ${timeframeLabel}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

    const tableColumn = [
      'Date & Time',
      'Order ID',
      'Cost',
      'Amount',
      'Profit',
      'Margin',
      'Payment',
      'Status',
    ];
    const tableRows = [];

    sales.forEach((sale) => {
      const refundStatus = getRefundStatus(sale.items);
      const display = getStatusDisplay(refundStatus);
      const cost = (sale.netTotalAmount || 0) - (sale.profit || 0);
      const margin =
        sale.netTotalAmount > 0 ? ((sale.profit / sale.netTotalAmount) * 100).toFixed(1) : 0;

      const rowData = [
        sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A',
        `#${sale.id}`,
        `Rs ${cost.toFixed(2)}`,
        `Rs ${(sale.netTotalAmount || 0).toFixed(2)}`,
        `Rs ${(sale.profit || 0).toFixed(2)}`,
        `${margin}%`,
        sale.paymentMethod || 'Cash',
        display.label,
      ];
      tableRows.push(rowData);
    });

    // Add summary row to PDF
    const avgMargin = totals.amount > 0 ? ((totals.profit / totals.amount) * 100).toFixed(1) : 0;
    tableRows.push([
      {
        content: 'TOTAL SUMMARY',
        colSpan: 2,
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
      },
      {
        content: `Rs ${totals.cost.toFixed(2)}`,
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
      },
      {
        content: `Rs ${totals.amount.toFixed(2)}`,
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
      },
      {
        content: `Rs ${totals.profit.toFixed(2)}`,
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
      },
      { content: `${avgMargin}%`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: '', colSpan: 2, styles: { fillColor: [241, 245, 249] } },
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 118, 210] },
    });

    doc.save(`sales_history_${timeframeLabel.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

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
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
            Sales History - {timeframeLabel}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`${sales?.length || 0} Transactions`}
              size="small"
              sx={{ bgcolor: '#f0f4f8', color: '#1a73e8', fontWeight: 700 }}
            />
            <ExportOptions onPrint={handlePrint} onExportPDF={handleExportPDF} />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 1000, tableLayout: 'fixed' }}>
            <SortableTableHead
              columns={[
                { id: 'createdAt', label: 'DATE & TIME', sx: { width: '20%' } },
                { id: 'id', label: 'ORDER ID', sx: { width: '8%' } },
                { id: 'paymentMethod', label: 'PAYMENT', align: 'center', sx: { width: '8%' } },
                {
                  id: 'cost',
                  label: 'COST',
                  align: 'right',
                  sx: { width: '10%' },
                  getter: (sale) => (sale.netTotalAmount || 0) - (sale.profit || 0),
                },
                { id: 'netTotalAmount', label: 'AMOUNT', align: 'right', sx: { width: '10%' } },
                { id: 'profit', label: 'PROFIT', align: 'right', sx: { width: '10%' } },
                {
                  id: 'margin',
                  label: 'MARGIN',
                  align: 'center',
                  sx: { width: '8%' },
                  getter: (sale) =>
                    sale.netTotalAmount > 0 ? (sale.profit / sale.netTotalAmount) * 100 : 0,
                },
                {
                  id: 'status',
                  label: 'STATUS',
                  align: 'center',
                  sx: { width: '13%' },
                  getter: (sale) => getStatusDisplay(getRefundStatus(sale.items)).label,
                },
                {
                  id: 'actions',
                  label: 'ACTIONS',
                  align: 'center',
                  sx: { width: '13%' },
                  sortable: false,
                  className: 'no-print',
                },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {sortedData?.map((sale) => (
                <TableRow key={sale.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                  <TableCell sx={{ fontWeight: 500 }}>#{sale.id}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={sale.paymentMethod || 'Cash'}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        color: sale.paymentMethod === 'Cash' ? '#16a34a' : '#1e293b',
                        borderColor: sale.paymentMethod === 'Cash' ? '#16a34a' : '#cbd5e1',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>
                    ₹{((sale?.netTotalAmount || 0) - (sale?.profit || 0)).toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    ₹{(sale?.netTotalAmount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ color: '#2e7d32', fontWeight: 700 }}>
                      ₹{sale.profit.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${sale.netTotalAmount > 0 ? ((sale.profit / sale.netTotalAmount) * 100).toFixed(1) : 0}%`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: sale.profit / sale.netTotalAmount > 0.2 ? '#e8f5e9' : '#f8fafc',
                        color: sale.profit / sale.netTotalAmount > 0.2 ? '#2e7d32' : '#64748b',
                        fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      const refundStatus = getRefundStatus(sale.items);
                      const display = getStatusDisplay(refundStatus);
                      return (
                        <Chip
                          label={display.label}
                          sx={{
                            bgcolor: display.bgcolor,
                            color: display.color,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            height: 'auto',
                            py: 0.5,
                          }}
                        />
                      );
                    })()}
                  </TableCell>
                  <TableCell align="center" className="no-print">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.3,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => onSelectSale(sale)}
                          sx={{
                            bgcolor: 'rgba(26, 115, 232, 0.1)',
                            color: '#1a73e8',
                            '&:hover': {
                              bgcolor: 'rgba(26, 115, 232, 0.2)',
                            },
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1a73e8' }}
                        >
                          View
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {sales && sales.length > 0 && (
                <TableRow
                  sx={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 2,
                    '&:hover': { bgcolor: 'transparent' },
                  }}
                >
                  <TableCell
                    colSpan={3}
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
                      fontSize: '0.9rem',
                      bgcolor: '#f1f5f9',
                      borderTop: '2px solid #e2e8f0',
                    }}
                  >
                    ₹{totals.amount.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 800,
                      color: '#16a34a',
                      fontSize: '0.9rem',
                      bgcolor: '#f1f5f9',
                      borderTop: '2px solid #e2e8f0',
                    }}
                  >
                    ₹{totals.profit.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ bgcolor: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}
                  >
                    <Chip
                      label={`${totals.amount > 0 ? ((totals.profit / totals.amount) * 100).toFixed(1) : 0}%`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    sx={{ bgcolor: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}
                  ></TableCell>
                </TableRow>
              )}
              {(!sales || sales.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 12 }}>
                    <Box sx={{ opacity: 0.5 }}>
                      <OrdersIcon sx={{ fontSize: 48, mb: 1, color: '#94a3b8' }} />
                      <Typography sx={{ color: '#64748b', fontWeight: 500 }}>
                        No transactions found for this period.
                      </Typography>
                    </Box>
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

export default SalesHistory;
