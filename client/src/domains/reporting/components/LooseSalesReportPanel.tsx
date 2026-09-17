import React from 'react';
import * as Sentry from '@sentry/react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Receipt as ReceiptIcon, DeleteOutline } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from '@/domains/reporting/components/ExportOptions';
import posService from '@/shared/api/posService';
import useSortableTable from '@/shared/hooks/useSortableTable';
import SortableTableHead from '@/domains/reporting/components/SortableTableHead';
import ReportTableEmptyState from '@/domains/reporting/components/ReportTableEmptyState';
import ReportTablePagination from '@/domains/reporting/components/ReportTablePagination';
import { usePagedTable } from '@/domains/reporting/components/usePagedTable';

/** A loose-sale row from GET /api/reports/loose-sales. */
export interface LooseSaleRow {
  id: number;
  itemName: string;
  price: number;
  createdAt: string;
  [key: string]: unknown;
}

interface LooseSalesReportPanelProps {
  data?: LooseSaleRow[] | null;
  loading?: boolean;
  timeframeLabel?: string;
  onRefresh?: () => void;
}

const columnTypographySx = {
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#334155',
};

const LooseSalesReportPanel = ({
  data,
  loading,
  timeframeLabel,
  onRefresh,
}: LooseSalesReportPanelProps) => {
  const {
    items: sortedData,
    requestSort,
    sortConfig,
  } = useSortableTable(data || [], { key: 'createdAt', direction: 'desc' });

  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedData,
    setPage,
    handleRowsPerPageChange,
  } = usePagedTable(sortedData, [data]);

  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await posService.deleteLooseSale(deleteId);
      setDeleteId(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'loose-sale-delete' } });
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
    doc.text(`Timeframe: ${timeframeLabel || ''}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

    const tableColumn = ['S.No.', 'Date', 'Item Name', 'Price (₹)'];
    const tableRows = (data || []).map((item, index) => [
      index + 1,
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
      headStyles: { fillColor: [11, 29, 57] },
    });

    doc.save(`loose_sales_report_${(timeframeLabel || '').replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
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
            p: 1.5,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            justifyContent: 'space-between',
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: '#0b1d39',
                lineHeight: 1.2,
              }}
            >
              Loose Sales History
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: '#64748b',
                fontSize: '0.75rem',
                lineHeight: 1,
              }}
            >
              One-time sales ({sortedData.length})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExportOptions onExportPDF={handleExportPDF} onPrint={handlePrint} />
          </Box>
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
            <SortableTableHead
              columns={[
                { id: 'sno', label: 'S.NO.', sx: { width: '5%' } },
                { id: 'createdAt', label: 'DATE & TIME' },
                { id: 'itemName', label: 'ITEM' },
                { id: 'price', label: 'PRICE (₹)', align: 'right' },
                { id: 'actions', label: '', align: 'center', sortable: false, sx: { width: '8%' } },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {sortedData.length === 0 ? (
                <ReportTableEmptyState
                  colSpan={5}
                  icon={<ReceiptIcon />}
                  title="No loose sales recorded"
                  subtitle="No one-time sales were bypassed during this period"
                />
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ py: 1.25, px: 1.5, ...columnTypographySx, width: '5%' }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5 }}>
                      <Typography variant="body2" sx={columnTypographySx}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 1.5, fontWeight: 600, fontSize: '0.85rem', color: 'text.primary', textTransform: 'capitalize' }}>
                      {item.itemName || 'Loose Item'}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, px: 1.5, ...columnTypographySx }}>
                      {item.price.toFixed(2)}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.25, px: 1.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteId(item.id)}
                        sx={{ color: '#dc2626' }}
                        aria-label="Delete loose sale"
                      >
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
                bgcolor: '#f8fafc',
              }}
            >
              <TableRow sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                <TableCell
                  colSpan={3}
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    py: 1.25,
                    px: 1.5,
                    fontSize: '0.8125rem',
                    borderTop: '2px solid #e2e8f0',
                  }}
                >
                  Total Current Period
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    color: '#0b1d39',
                    py: 1.25,
                    px: 1.5,
                    fontSize: '0.875rem',
                    borderTop: '2px solid #e2e8f0',
                  }}
                >
                  {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell sx={{ borderTop: '2px solid #e2e8f0' }} />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
        <ReportTablePagination
          count={sortedData.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Loose Sale</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this loose sale entry? This cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LooseSalesReportPanel;
