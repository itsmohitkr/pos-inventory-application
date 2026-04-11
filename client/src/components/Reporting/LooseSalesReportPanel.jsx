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
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from './ExportOptions';
import posService from '../../shared/api/posService';
import useSortableTable from '../../shared/hooks/useSortableTable';
import SortableTableHead from './SortableTableHead';

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

  if (!data || data.length === 0) {
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
            No loose sales found for this period.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.price, 0);

  return (
    <Box
      className="report-print-area"
      sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      {/* Summary Card */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            flex: 1,
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.06)',
            bgcolor: '#fffbeb',
          }}
        >
          <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 'bold' }}>
            TOTAL LOOSE REVENUE
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#92400e' }}>
            ₹{totalRevenue.toFixed(2)}
          </Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            flex: 1,
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.06)',
            bgcolor: '#f8fafc',
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight="bold">
            TOTAL TRANSACTIONS
          </Typography>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            {data.length}
          </Typography>
        </Paper>
      </Box>

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
              Loose Sales History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              One-time sales bypassed from regular inventory
            </Typography>
          </Box>

          <ExportOptions onExportPDF={handleExportPDF} onPrint={handlePrint} />
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 600 }}>
            <SortableTableHead
              columns={[
                { id: 'createdAt', label: 'DATE & TIME' },
                { id: 'itemName', label: 'ITEM NAME / NOTES' },
                { id: 'price', label: 'PRICE (₹)', align: 'right' },
                { id: 'actions', label: '', align: 'right' },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {sortedData.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{item.itemName || 'Loose Item'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    ₹{item.price.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}>
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
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
