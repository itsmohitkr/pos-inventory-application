import React from 'react';
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
import ExportOptions from '@/domains/reporting/components/ExportOptions';
import useSortableTable from '@/shared/hooks/useSortableTable';
import SortableTableHead from '@/domains/reporting/components/SortableTableHead';

const ExpiryReportPanel = ({ data, loading, timeframeLabel }) => {
  const {
    items: sortedData,
    requestSort,
    sortConfig,
  } = useSortableTable(data || [], { key: 'expiryDate', direction: 'asc' });

  const handleExportPDF = () => {
    if (!data || data.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Expiring Products Report', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Timeframe: ${timeframeLabel}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

    const tableColumn = ['Product Name', 'Category', 'Batch Code', 'Quantity', 'Expiry Date'];
    const tableRows = [];

    data.forEach((batch) => {
      const rowData = [
        batch.productName,
        batch.category,
        batch.batchCode || 'N/A',
        batch.quantity.toString(),
        new Date(batch.expiryDate).toLocaleDateString(),
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 118, 210] }, // MUI Primary color
    });

    doc.save(`expiry_report_${timeframeLabel.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="text.secondary">Loading expiry data...</Typography>
      </Box>
    );
  }

  return (
    <Box
      className="report-print-area"
      sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
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
              Expiring Products
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
              Inventory items reaching their expiration date soon
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ExportOptions onExportPDF={handleExportPDF} onPrint={handlePrint} />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 1100, tableLayout: 'fixed' }}>
            <SortableTableHead
              columns={[
                { id: 'productName', label: 'PRODUCT' },
                { id: 'category', label: 'CATEGORY' },
                { id: 'batchCode', label: 'BATCH' },
                { id: 'quantity', label: 'QNTY LEFT', align: 'center' },
                { id: 'expiryDate', label: 'EXPIRY DATE', align: 'right' },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No products expiring in this timeframe.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((batch) => {
                  const daysUntilExpiry = Math.ceil(
                    (new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  const isCritical = daysUntilExpiry <= 7;

                  return (
                    <TableRow key={batch.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{batch.productName}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {batch.category}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {batch.batchCode || '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: batch.quantity <= 5 ? '#d32f2f' : 'inherit' }}
                        >
                          {batch.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: isCritical ? '#d32f2f' : 'inherit' }}
                          >
                            {new Date(batch.expiryDate).toLocaleDateString()}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isCritical ? '#d32f2f' : 'text.secondary',
                              fontWeight: isCritical ? 700 : 400,
                            }}
                          >
                            {daysUntilExpiry > 0 ? `in ${daysUntilExpiry} days` : 'Expired'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ExpiryReportPanel;
