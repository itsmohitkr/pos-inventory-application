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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TableFooter,
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from '@/domains/reporting/components/ExportOptions';
import posService from '@/shared/api/posService';
import useSortableTable from '@/shared/hooks/useSortableTable';
import SortableTableHead from '@/domains/reporting/components/SortableTableHead';

const LooseSalesReportPanel = ({ data, loading, timeframeLabel, onRefresh }) => {
  const {
    items: sortedData,
    requestSort,
    sortConfig,
  } = useSortableTable(data || [], { key: 'createdAt', direction: 'desc' });
  const [deleteId, setDeleteId] = React.useState(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await posService.deleteLooseSale(deleteId);
      setDeleteId(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to delete loose sale:', error);
      alert('Failed to delete loose sale.');
    }
  };
  const handleExportPDF = () => {
    if (!data || data.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Loose Sales Report', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Timeframe: ${timeframeLabel}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

    const tableColumn = ['Date', 'Item Name', 'Price (₹)'];
    const tableRows = (data || []).map((item) => [
      new Date(item.createdAt).toLocaleString(),
      item.itemName || 'Loose Item',
      item.price.toFixed(2),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [245, 158, 11] },
    });

    doc.save(`loose_sales_report_${timeframeLabel.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="text.secondary">Loading loose sales data...</Typography>
      </Box>
    );
  }



  const totalRevenue = (data || []).reduce((sum, item) => sum + item.price, 0);

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
              Loose Sales History
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
              One-time sales bypassed from regular inventory
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ExportOptions onExportPDF={handleExportPDF} onPrint={handlePrint} />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 1000 }}>
            <SortableTableHead
              columns={[
                { id: 'createdAt', label: 'DATE & TIME' },
                { id: 'itemName', label: 'ITEM NAME / NOTES' },
                { id: 'price', label: 'PRICE (₹)', align: 'right' },
                { id: 'actions', label: 'ACTIONS', align: 'right' },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No loose sales found for this period.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{item.itemName || 'Loose Item'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      ₹{item.price.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter
              sx={{
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
                bgcolor: '#f1f5f9', // Slate background to match Profit & Margin
              }}
            >
              <TableRow sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                <TableCell
                  colSpan={2}
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    py: 1.5,
                    borderTop: '1px solid #e2e8f0'
                  }}
                >
                  Total Current Period
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    py: 1.5,
                    fontSize: '1rem',
                    borderTop: '1px solid #e2e8f0'
                  }}
                >
                  ₹ {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell sx={{ borderTop: '1px solid #e2e8f0' }} />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#b91c1c' }}>Delete Loose Sale</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this loose sale record?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteId(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ fontWeight: 600 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LooseSalesReportPanel;
