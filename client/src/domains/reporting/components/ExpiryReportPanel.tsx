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
  Autocomplete,
  TextField,
  InputAdornment,
} from '@mui/material';
import { FilterAlt, CheckCircleOutline as CheckCircleOutlineIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptions from '@/domains/reporting/components/ExportOptions';
import useSortableTable from '@/shared/hooks/useSortableTable';
import SortableTableHead from '@/domains/reporting/components/SortableTableHead';
import ReportTableEmptyState from '@/domains/reporting/components/ReportTableEmptyState';
import ReportTablePagination from '@/domains/reporting/components/ReportTablePagination';
import ReportSummaryBar from '@/domains/reporting/components/ReportSummaryBar';
import { usePagedTable } from '@/domains/reporting/components/usePagedTable';

/**
 * A batch row from GET /api/reports/expiry — batch fields plus the product
 * name/category/barcode flattened in by report.service.
 */
export interface ExpiryRow {
  id: number;
  productName: string;
  category: string;
  barcode?: string | null;
  batchCode?: string | null;
  expiryDate: string | null;
  quantity: number;
  mrp?: number;
  sellingPrice?: number;
  costPrice?: number;
  [key: string]: unknown;
}

interface ExpiryReportPanelProps {
  data?: ExpiryRow[] | null;
  loading?: boolean;
  timeframeLabel?: string;
}

const ExpiryReportPanel = ({ data, loading, timeframeLabel }: ExpiryReportPanelProps) => {
  const [selectedCategory, setSelectedCategory] = React.useState('All Categories');

  const categories = React.useMemo(() => {
    if (!data) return [];
    const uniqueCategories = new Set(data.map((p) => p.category).filter(Boolean));
    return ['All Categories', ...Array.from(uniqueCategories).sort()];
  }, [data]);

  const filteredData = React.useMemo(() => {
    if (!data) return [];
    if (selectedCategory === 'All Categories') return data;
    return data.filter((p) => p.category === selectedCategory);
  }, [data, selectedCategory]);

  const {
    items: sortedData,
    requestSort,
    sortConfig,
  } = useSortableTable(filteredData || [], { key: 'expiryDate', direction: 'asc' });

  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedData,
    setPage,
    handleRowsPerPageChange,
  } = usePagedTable(sortedData, [data, selectedCategory]);

  // Reference point for "days until expiry". Read once per data load rather
  // than per row during render: reading the clock inside the row map made every
  // row's countdown depend on when React happened to re-render it, so two rows
  // in the same table could straddle the 7-day "critical" threshold.
  const [nowMs, setNowMs] = React.useState(() => Date.now());
  React.useEffect(() => {
    setNowMs(Date.now());
  }, [data]);

  const handleExportPDF = () => {
    if (!filteredData || filteredData.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Expiring Products Report', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Category: ${selectedCategory}`, 14, 28);
    doc.text(`Timeframe: ${timeframeLabel || ''}`, 14, 34);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

    const tableColumn = ['Product Name', 'Category', 'Batch Code', 'Quantity', 'Expiry Date'];
    const tableRows = filteredData.map((batch) => [
      batch.productName,
      batch.category,
      batch.batchCode || 'N/A',
      batch.quantity.toString(),
      new Date(batch.expiryDate as string).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 46,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [11, 29, 57] },
    });

    doc.save(`expiry_report_${selectedCategory.toLowerCase().replace(/\s+/g, '_')}_${(timeframeLabel || '').replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const stats = React.useMemo(() => {
    let expired = 0;
    let critical = 0;
    let soon = 0;
    let totalUnits = 0;

    (filteredData || []).forEach((batch) => {
      const days = Math.ceil(
        (new Date(batch.expiryDate as string).getTime() - nowMs) / (1000 * 60 * 60 * 24)
      );
      totalUnits += batch.quantity || 0;
      if (days <= 0) expired += 1;
      else if (days <= 7) critical += 1;
      else if (days <= 30) soon += 1;
    });

    return { expired, critical, soon, totalUnits };
  }, [filteredData, nowMs]);

  if (loading && !data) {
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
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
              justifyContent: 'space-between',
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
                Expiring Products
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
                All Expiring Batches ({sortedData.length})
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Autocomplete
                size="small"
                options={categories}
                value={selectedCategory}
                onChange={(event, newValue) => setSelectedCategory(newValue || 'All Categories')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Filter Category..."
                    sx={{
                      minWidth: 200,
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                        borderRadius: '6px',
                        bgcolor: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                        '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '1px' },
                      },
                    }}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-option': {
                    fontSize: '0.85rem',
                    py: 0.75,
                  },
                }}
              />
              <ExportOptions onExportPDF={handleExportPDF} onPrint={handlePrint} />
            </Box>
          </Box>

          <ReportSummaryBar
            stats={[
              {
                label: 'Already Expired',
                value: stats.expired.toLocaleString(),
                accentColor: '#ef4444',
              },
              {
                label: 'Critical (< 7 Days)',
                value: stats.critical.toLocaleString(),
                accentColor: '#d97706',
              },
              {
                label: 'Expiring in 30 Days',
                value: stats.soon.toLocaleString(),
                accentColor: '#7c3aed',
              },
              {
                label: 'Units at Risk',
                value: stats.totalUnits.toLocaleString(),
                accentColor: '#3b82f6',
              },
            ]}
          />
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 1000, tableLayout: 'fixed' }}>
            <SortableTableHead
              columns={[
                { id: 'sno', label: 'S.NO.', sx: { width: '5%', minWidth: '50px' }, sortable: false },
                { id: 'productName', label: 'PRODUCT', sx: { width: '32%' } },
                { id: 'category', label: 'CATEGORY', sx: { width: '18%' } },
                { id: 'batchCode', label: 'BATCH CODE', sx: { width: '15%' } },
                { id: 'quantity', label: 'QTY LEFT', align: 'center', sx: { width: '12%' } },
                { id: 'expiryDate', label: 'EXPIRY DATE', align: 'right', sx: { width: '18%' } },
              ]}
              sortConfig={sortConfig}
              requestSort={requestSort}
            />
            <TableBody>
              {sortedData.length === 0 ? (
                <ReportTableEmptyState
                  colSpan={6}
                  icon={<CheckCircleOutlineIcon sx={{ color: '#16a34a' }} />}
                  title="No expiring batches found"
                  subtitle="No products are expiring within the selected window"
                />
              ) : (
                paginatedData.map((batch, index) => {
                  const daysUntilExpiry = Math.ceil(
                    (new Date(batch.expiryDate as string).getTime() - nowMs) /
                    (1000 * 60 * 60 * 24)
                  );
                  const isCritical = daysUntilExpiry <= 7;

                  return (
                    <TableRow key={batch.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                      <TableCell sx={{ py: 1.25, px: 1.5, fontWeight: 600, color: '#64748b', fontSize: '0.78rem', width: '5%', minWidth: '50px', whiteSpace: 'nowrap' }}>
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 1.5, fontWeight: 700, fontSize: '0.85rem' }}>{batch.productName}</TableCell>
                      <TableCell sx={{ py: 1.25, px: 1.5, color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem' }}>
                        {batch.category}
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 1.5, color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem' }}>
                        {batch.batchCode || '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.25, px: 1.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, fontSize: '0.85rem', color: batch.quantity <= 5 ? '#dc2626' : 'inherit' }}
                        >
                          {batch.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.25, px: 1.5 }}>
                        <Box
                          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, fontSize: '0.85rem', color: isCritical ? '#dc2626' : 'inherit' }}
                          >
                            {new Date(batch.expiryDate as string).toLocaleDateString()}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isCritical ? '#dc2626' : 'text.secondary',
                              fontWeight: isCritical ? 700 : 500,
                              fontSize: '0.72rem',
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
        <ReportTablePagination
          count={sortedData.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>
    </Box>
  );
};

export default ExpiryReportPanel;
