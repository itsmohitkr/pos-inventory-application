import React, { useState, useMemo } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
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

/** A product row from GET /api/reports/low-stock. */
export interface LowStockRow {
  id: number;
  name: string;
  category?: string | null;
  barcode?: string | null;
  totalQuantity: number;
  lowStockThreshold?: number;
  mrp?: number;
  [key: string]: unknown;
}

interface LowStockReportPanelProps {
  data?: LowStockRow[] | null;
  loading?: boolean;
}

const LowStockReportPanel = ({ data, loading }: LowStockReportPanelProps) => {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const categories = useMemo(() => {
    if (!data) return [];
    const uniqueCategories = new Set(data.map((p) => p.category).filter(Boolean));
    return ['All Categories', ...Array.from(uniqueCategories).sort()];
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (selectedCategory === 'All Categories') return data;
    return data.filter((p) => p.category === selectedCategory);
  }, [data, selectedCategory]);

  const handleToggleSelect = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedItems(filteredData.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const { items: sortedData } = useSortableTable(filteredData, {
    key: 'totalQuantity',
    direction: 'asc',
  });

  const {
    page,
    rowsPerPage,
    paginatedItems: paginatedData,
    setPage,
    handleRowsPerPageChange,
  } = usePagedTable(sortedData, [data, selectedCategory]);

  const zeroStockCount = useMemo(
    () => filteredData.filter((i) => (i.totalQuantity || 0) === 0).length,
    [filteredData]
  );
  const warningStockCount = useMemo(
    () => filteredData.filter((i) => (i.totalQuantity || 0) > 0).length,
    [filteredData]
  );

  const handleExportPDF = () => {
    const itemsToExport =
      selectedItems.length > 0
        ? filteredData.filter((item) => selectedItems.includes(item.id))
        : filteredData;

    if (itemsToExport.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Vendor Order List (Low Stock)', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Category: ${selectedCategory}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);

    const tableColumn = ['S.No', 'Product Name', 'Category', 'MRP (₹)', 'Current Stock'];
    const tableRows = itemsToExport.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.category || 'Uncategorized',
      item.mrp?.toFixed(2) || '0.00',
      item.totalQuantity.toString(),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [11, 29, 57] },
    });

    doc.save(`vendor_order_${selectedCategory.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const handlePrint = () => {
    if (selectedItems.length > 0) {
      handleExportPDF();
    } else {
      window.print();
    }
  };

  if (loading && !data) {
    return (
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="text.secondary">Loading low stock data...</Typography>
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
                Low Stock Report
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
                All Threshold Warnings ({filteredData.length})
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
              <ExportOptions
                onExportPDF={handleExportPDF}
                onPrint={handlePrint}
                selectedCount={selectedItems.length}
              />
            </Box>
          </Box>

          <ReportSummaryBar
            stats={[
              {
                label: 'Low Stock SKUs',
                value: filteredData.length.toLocaleString(),
                accentColor: '#f59e0b',
              },
              {
                label: 'Out of Stock (Zero)',
                value: zeroStockCount.toLocaleString(),
                accentColor: '#ef4444',
              },
              {
                label: 'Warning Stock',
                value: warningStockCount.toLocaleString(),
                accentColor: '#7c3aed',
              },
              {
                label: 'Selected for Order',
                value: `${selectedItems.length} items`,
                accentColor: '#3b82f6',
              },
            ]}
          />
        </Box>

        <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 1000, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell
                  padding="checkbox"
                  sx={{
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    py: 1.25,
                    px: 1.5,
                    width: '40px',
                    zIndex: 3,
                  }}
                >
                  <Checkbox
                    size="small"
                    indeterminate={
                      selectedItems.length > 0 && selectedItems.length < filteredData.length
                    }
                    checked={
                      filteredData.length > 0 && selectedItems.length === filteredData.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: '#475569',
                    bgcolor: '#f8fafc',
                    py: 1.25,
                    px: 1.5,
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    width: '5%',
                    minWidth: '50px',
                  }}
                >
                  S.NO
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: '#475569',
                    bgcolor: '#f8fafc',
                    py: 1.25,
                    px: 1.5,
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    width: '42%',
                  }}
                >
                  PRODUCT
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: '#475569',
                    bgcolor: '#f8fafc',
                    py: 1.25,
                    px: 1.5,
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    width: '18%',
                  }}
                >
                  CATEGORY
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: '#475569',
                    bgcolor: '#f8fafc',
                    py: 1.25,
                    px: 1.5,
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    width: '12%',
                  }}
                  align="right"
                >
                  MRP (₹)
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: '#475569',
                    bgcolor: '#f8fafc',
                    py: 1.25,
                    px: 1.5,
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    width: '11%',
                  }}
                  align="center"
                >
                  STOCK
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: '#475569',
                    bgcolor: '#f8fafc',
                    py: 1.25,
                    px: 1.5,
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    width: '12%',
                  }}
                  align="center"
                >
                  STATUS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.length === 0 ? (
                <ReportTableEmptyState
                  colSpan={7}
                  icon={<CheckCircleOutlineIcon sx={{ color: '#16a34a' }} />}
                  title="All stock levels are healthy"
                  subtitle="No products are currently below their minimum threshold"
                />
              ) : (
                paginatedData.map((item, index) => {
                  const isItemSelected = selectedItems.includes(item.id);
                  return (
                    <TableRow
                      key={item.id}
                      hover
                      selected={isItemSelected}
                      onClick={() => handleToggleSelect(item.id)}
                      sx={{
                        cursor: 'pointer',
                        '&.Mui-selected': { bgcolor: 'rgba(11, 29, 57, 0.08)' },
                        '&:hover': {
                          bgcolor: isItemSelected ? 'rgba(11, 29, 57, 0.12)' : '#f8fafc',
                        },
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ py: 1.25, px: 1.5 }}>
                        <Checkbox size="small" checked={isItemSelected} />
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 1.5, fontWeight: 600, color: '#64748b', fontSize: '0.78rem', width: '5%', minWidth: '50px' }}>
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 1.5, fontWeight: 700, fontSize: '0.85rem' }}>{item.name}</TableCell>
                      <TableCell sx={{ py: 1.25, px: 1.5, color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem' }}>
                        {item.category || 'Uncategorized'}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.25, px: 1.5, fontWeight: 700, fontSize: '0.85rem' }}>
                        ₹{item.mrp?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.25, px: 1.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: item.totalQuantity === 0 ? '#dc2626' : '#d97706',
                          }}
                        >
                          {item.totalQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.25, px: 1.5 }}>
                        <Chip
                          label={item.totalQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            height: 22,
                            bgcolor: item.totalQuantity === 0 ? '#fef2f2' : '#fff7ed',
                            color: item.totalQuantity === 0 ? '#dc2626' : '#d97706',
                            border: `1px solid ${item.totalQuantity === 0 ? '#fee2e2' : '#ffedd5'}`,
                          }}
                        />
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

export default LowStockReportPanel;
