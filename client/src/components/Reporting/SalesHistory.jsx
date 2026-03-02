import React from "react";
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
} from "@mui/material";
import {
  ListAlt as OrdersIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { getRefundStatus, getStatusDisplay } from "../../utils/refundStatus";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from './ExportOptions';

const SalesHistory = ({ sales, timeframeLabel, onSelectSale }) => {
  const totals = React.useMemo(() => {
    if (!sales || sales.length === 0) return { amount: 0, profit: 0, cost: 0 };
    return sales.reduce((acc, sale) => ({
      amount: acc.amount + (sale.netTotalAmount || 0),
      profit: acc.profit + (sale.profit || 0),
      cost: acc.cost + ((sale.netTotalAmount || 0) - (sale.profit || 0))
    }), { amount: 0, profit: 0, cost: 0 });
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

    const tableColumn = ["Date & Time", "Order ID", "Cost", "Amount", "Profit", "Margin", "Payment", "Status"];
    const tableRows = [];

    sales.forEach(sale => {
      const refundStatus = getRefundStatus(sale.items);
      const display = getStatusDisplay(refundStatus);
      const cost = (sale.netTotalAmount || 0) - (sale.profit || 0);
      const margin = sale.netTotalAmount > 0 ? ((sale.profit / sale.netTotalAmount) * 100).toFixed(1) : 0;

      const rowData = [
        sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A',
        `#${sale.id}`,
        `Rs ${cost.toFixed(2)}`,
        `Rs ${(sale.netTotalAmount || 0).toFixed(2)}`,
        `Rs ${(sale.profit || 0).toFixed(2)}`,
        `${margin}%`,
        sale.paymentMethod || 'Cash',
        display.label
      ];
      tableRows.push(rowData);
    });

    // Add summary row to PDF
    const avgMargin = totals.amount > 0 ? ((totals.profit / totals.amount) * 100).toFixed(1) : 0;
    tableRows.push([
      { content: 'TOTAL SUMMARY', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: `Rs ${totals.cost.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: `Rs ${totals.amount.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: `Rs ${totals.profit.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: `${avgMargin}%`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: '', colSpan: 2, styles: { fillColor: [241, 245, 249] } }
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 118, 210] }
    });

    doc.save(`sales_history_${timeframeLabel.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  return (
    <Box
      className="report-print-area"
      sx={{
        bgcolor: "#ffffff",
        p: 4,
        borderRight: "1px solid #eeeeee",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        borderRadius: 1,
        "@media print": {
          p: 0,
          border: 'none',
          "& .MuiTableContainer-root": {
            overflow: "visible !important",
            height: "auto !important",
          },
          "& .MuiTableRow-root": {
            pageBreakInside: "avoid",
            position: "static !important",
          },
          "& .MuiTableCell-root": {
            position: "static !important",
            borderBottom: "1px solid #eee !important",
          }
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#333" }}>
          Sales History - {timeframeLabel}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }} className="no-print">
          <Chip
            label={`${sales?.length || 0} Transactions`}
            size="small"
            sx={{ bgcolor: "#f0f4f8", color: "#1a73e8", fontWeight: 700 }}
          />
          <ExportOptions
            onPrint={handlePrint}
            onExportPDF={handleExportPDF}
          />
        </Box>
      </Box>

      <TableContainer
        sx={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          border: "1px solid #edf2f7",
          borderRadius: 3,
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        }}
      >
        <Table stickyHeader sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 800,
                  bgcolor: "#f8fafc",
                  color: "#64748b",
                  width: "20%",
                  py: 2,
                }}
              >
                DATE & TIME
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 800,
                  bgcolor: "#f8fafc",
                  color: "#64748b",
                  width: "8%",
                  py: 2,
                }}
              >
                ORDER ID
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 800,
                  bgcolor: "#f8fafc",
                  color: "#64748b",
                  width: "8%",
                  py: 2,
                }}
              >
                PAYMENT
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 800,
                  bgcolor: "#f8fafc",
                  color: "#64748b",
                  width: "10%",
                  py: 2,
                }}
              >
                COST
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 800,
                  bgcolor: "#f8fafc",
                  color: "#64748b",
                  width: "10%",
                  py: 2,
                }}
              >
                AMOUNT
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 800,
                  bgcolor: "#f8fafc",
                  color: "#64748b",
                  width: "10%",
                  py: 2,
                }}
              >
                PROFIT
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 800,
                  bgcolor: "#f8fafc",
                  color: "#64748b",
                  width: "8%",
                  py: 2,
                }}
              >
                MARGIN
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 800,
                  bgcolor: "#f8fafc",
                  color: "#64748b",
                  width: "13%",
                  py: 2,
                }}
              >
                STATUS
              </TableCell>
              <TableCell
                className="no-print"
                align="center"
                sx={{
                  fontWeight: 800,
                  bgcolor: "#f8fafc",
                  color: "#64748b",
                  width: "13%",
                  py: 2,
                }}
              >
                ACTIONS
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales?.map((sale) => (
              <TableRow
                key={sale.id}
                hover
                sx={{ "&:hover": { bgcolor: "#f8fafc" } }}
              >
                <TableCell sx={{ py: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {sale?.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {sale?.createdAt ? new Date(sale.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : ''}
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
                      borderColor: sale.paymentMethod === 'Cash' ? '#16a34a' : '#cbd5e1'
                    }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "#64748b" }}>
                  ₹{((sale?.netTotalAmount || 0) - (sale?.profit || 0)).toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  ₹{(sale?.netTotalAmount || 0).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <Typography sx={{ color: "#2e7d32", fontWeight: 700 }}>
                    ₹{sale.profit.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${sale.netTotalAmount > 0 ? ((sale.profit / sale.netTotalAmount) * 100).toFixed(1) : 0}%`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: (sale.profit / sale.netTotalAmount) > 0.2 ? '#e8f5e9' : '#f8fafc',
                      color: (sale.profit / sale.netTotalAmount) > 0.2 ? '#2e7d32' : '#64748b',
                      fontSize: '0.7rem'
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                      <IconButton
                        size="small"
                        onClick={() => onSelectSale(sale)}
                        sx={{
                          bgcolor: 'rgba(26, 115, 232, 0.1)',
                          color: "#1a73e8",
                          '&:hover': {
                            bgcolor: 'rgba(26, 115, 232, 0.2)'
                          }
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1a73e8' }}>
                        View
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {sales && sales.length > 0 && (
              <TableRow sx={{
                position: "sticky",
                bottom: 0,
                zIndex: 2,
                "&:hover": { bgcolor: "transparent" }
              }}>
                <TableCell colSpan={3} sx={{ py: 2, fontWeight: 800, color: "#475569", bgcolor: "#f1f5f9", borderTop: "2px solid #e2e8f0" }}>
                  TOTAL SUMMARY
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", bgcolor: "#f1f5f9", borderTop: "2px solid #e2e8f0" }}>
                  ₹{totals.cost.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#0f172a", fontSize: '0.9rem', bgcolor: "#f1f5f9", borderTop: "2px solid #e2e8f0" }}>
                  ₹{totals.amount.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#16a34a", fontSize: '0.9rem', bgcolor: "#f1f5f9", borderTop: "2px solid #e2e8f0" }}>
                  ₹{totals.profit.toFixed(2)}
                </TableCell>
                <TableCell align="center" sx={{ bgcolor: "#f1f5f9", borderTop: "2px solid #e2e8f0" }}>
                  <Chip
                    label={`${totals.amount > 0 ? ((totals.profit / totals.amount) * 100).toFixed(1) : 0}%`}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell colSpan={2} sx={{ bgcolor: "#f1f5f9", borderTop: "2px solid #e2e8f0" }}></TableCell>
              </TableRow>
            )}
            {(!sales || sales.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 12 }}>
                  <Box sx={{ opacity: 0.5 }}>
                    <OrdersIcon
                      sx={{ fontSize: 48, mb: 1, color: "#94a3b8" }}
                    />
                    <Typography sx={{ color: "#64748b", fontWeight: 500 }}>
                      No transactions found for this period.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SalesHistory;
