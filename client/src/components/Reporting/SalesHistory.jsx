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

    const tableColumn = ["Date & Time", "Order ID", "Amount", "Profit", "Status"];
    const tableRows = [];

    sales.forEach(sale => {
      const refundStatus = getRefundStatus(sale.items);
      const display = getStatusDisplay(refundStatus);

      const rowData = [
        sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A',
        `#${sale.id}`,
        `Rs ${(sale.netTotalAmount || 0).toFixed(2)}`,
        `Rs ${(sale.profit || 0).toFixed(2)}`,
        display.label
      ];
      tableRows.push(rowData);
    });

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
                  width: "25%",
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
                  width: "12%",
                  py: 2,
                }}
              >
                ORDER ID
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 800,
                  bgcolor: "#f8fafc",
                  color: "#64748b",
                  width: "18%",
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
                  width: "18%",
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
                  width: "15%",
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
                  width: "12%",
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
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  ₹{(sale?.netTotalAmount || 0).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <Typography sx={{ color: "#2e7d32", fontWeight: 700 }}>
                    ₹{sale.profit.toFixed(2)}
                  </Typography>
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
                  <IconButton
                    size="small"
                    onClick={() => onSelectSale(sale)}
                    sx={{ color: "#1a73e8" }}
                  >
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
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
