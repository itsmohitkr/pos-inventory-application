import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  MenuItem,
  Checkbox,
  ListItemText,
  FormControlLabel,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  DescriptionOutlined as CsvIcon,
  PictureAsPdfOutlined as PdfIcon,
  ViewColumn as ColumnIcon,
  Category as CategoryIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import inventoryService from '@/shared/api/inventoryService';
import type { Product } from '@/shared/types/models';
import { getResponseArray } from '@/shared/utils/responseGuards';
import {
  flattenInventoryRows,
  type InventoryRow,
} from '@/domains/inventory/components/inventoryExcelUtils';
import {
  ALL_EXPORT_COLUMNS,
  filterInventoryRows,
  getRowColumnValue,
  downloadInventoryCsv,
  downloadInventoryPdf,
} from '@/domains/inventory/components/inventoryExportHelper';

interface InventoryExportViewProps {
  initialActiveColumns?: Record<string, boolean>;
}

// Export is scoped by category only, not a text search — you're exporting
// bulk data, not looking for one product. Its category selector is
// entirely its own, deliberately not wired to the main Products list or
// the Spreadsheet view's filters, so switching tabs never carries a
// filter over silently.
const InventoryExportView: React.FC<InventoryExportViewProps> = ({
  initialActiveColumns,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);

  // Initialize selected columns
  const [selectedColKeys, setSelectedColKeys] = useState<string[]>(() => {
    if (initialActiveColumns) {
      return Object.keys(initialActiveColumns).filter((k) => initialActiveColumns[k]);
    }
    return ALL_EXPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key);
  });

  // Fetch all products with batches when view mounts
  useEffect(() => {
    setLoading(true);
    inventoryService
      .fetchProducts({ includeBatches: 'true' })
      .then((data) => {
        setProducts(getResponseArray(data));
      })
      .catch((err) => {
        console.error('Failed to load inventory for export:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Extract unique category names
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Flatten and filter inventory rows
  const allRows: InventoryRow[] = useMemo(() => {
    return flattenInventoryRows(products, 'all');
  }, [products]);

  const filteredRows: InventoryRow[] = useMemo(() => {
    return filterInventoryRows(allRows, selectedCategories);
  }, [allRows, selectedCategories]);

  // Selected Column Definitions
  const selectedDefs = useMemo(() => {
    return ALL_EXPORT_COLUMNS.filter((col) => selectedColKeys.includes(col.key));
  }, [selectedColKeys]);

  // Summaries
  const totals = useMemo(() => {
    const stock = filteredRows.reduce((sum, r) => sum + (r.stock || 0), 0);
    const costVal = filteredRows.reduce((sum, r) => sum + (r.totalValCp || 0), 0);
    const sellVal = filteredRows.reduce((sum, r) => sum + (r.totalValSp || 0), 0);
    return { stock, costVal, sellVal };
  }, [filteredRows]);

  const handleCategoryChange = (val: string[]) => {
    if (val.length === 0) {
      setSelectedCategories(['all']);
      return;
    }
    if (val.includes('all') && !selectedCategories.includes('all')) {
      setSelectedCategories(['all']);
      return;
    }
    const withoutAll = val.filter((c) => c !== 'all');
    if (withoutAll.length === 0) {
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories(withoutAll);
    }
  };

  const handleSelectAllCols = () => {
    setSelectedColKeys(ALL_EXPORT_COLUMNS.map((c) => c.key));
  };

  const handleDeselectAllCols = () => {
    setSelectedColKeys(ALL_EXPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key));
  };

  const handleToggleColumn = (key: string) => {
    setSelectedColKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleExportCsv = () => {
    if (filteredRows.length === 0) return;
    setExporting(true);
    try {
      downloadInventoryCsv(filteredRows, selectedColKeys, 'inventory_export');
    } catch (err) {
      console.error('CSV Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    if (filteredRows.length === 0) return;
    setExporting(true);
    try {
      const categoryLabel = selectedCategories.includes('all')
        ? 'All Categories'
        : selectedCategories.join(', ');
      downloadInventoryPdf(filteredRows, selectedColKeys, categoryLabel, 'inventory_report');
    } catch (err) {
      console.error('PDF Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        bgcolor: '#ffffff',
      }}
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={36} sx={{ color: '#0b1d39' }} />
        </Box>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Controls Section */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' },
              gap: 3,
            }}
          >
            {/* Left Column: Category Selection */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: '10px',
                borderColor: '#e2e8f0',
                bgcolor: '#f8fafc',
                height: 'fit-content',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: '#0b1d39', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <CategoryIcon fontSize="small" /> Category Selection
              </Typography>

              <TextField
                select
                size="small"
                value={selectedCategories}
                onChange={(e) => {
                  const val = typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[]);
                  handleCategoryChange(val);
                }}
                sx={{
                  width: '100%',
                  bgcolor: '#ffffff',
                  borderRadius: '6px',
                }}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => {
                    const arr = selected as string[];
                    if (arr.includes('all')) {
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip
                            size="small"
                            label="All Categories"
                            sx={{
                              bgcolor: 'rgba(11, 29, 57, 0.08)',
                              color: '#0b1d39',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        </Box>
                      );
                    }
                    return (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {arr.map((cat) => (
                          <Chip
                            key={cat}
                            size="small"
                            label={cat}
                            sx={{
                              bgcolor: 'rgba(11, 29, 57, 0.08)',
                              color: '#0b1d39',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        ))}
                      </Box>
                    );
                  },
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        maxHeight: 340,
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                        border: '1px solid #e2e8f0',
                        '& .MuiMenuItem-root': {
                          fontSize: '0.82rem',
                          py: 0.75,
                          minHeight: 'auto',
                        },
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent',
                        '&::-webkit-scrollbar': {
                          width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#cbd5e1',
                          borderRadius: '4px',
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="all">
                  <Checkbox checked={selectedCategories.includes('all')} size="small" />
                  <ListItemText primary="All Categories" primaryTypographyProps={{ fontWeight: 700, fontSize: '0.82rem' }} />
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                {uniqueCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    <Checkbox checked={selectedCategories.includes(cat)} size="small" />
                    <ListItemText primary={cat} primaryTypographyProps={{ fontSize: '0.82rem' }} />
                  </MenuItem>
                ))}
              </TextField>
            </Paper>

            {/* Right Column: Column Selector Grid */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: '10px',
                borderColor: '#e2e8f0',
                bgcolor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: '#0b1d39', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <ColumnIcon fontSize="small" /> Select Included Columns ({selectedColKeys.length}/{ALL_EXPORT_COLUMNS.length})
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={handleSelectAllCols} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: '#0b1d39' }}>
                    Select All
                  </Button>
                  <Button size="small" onClick={handleDeselectAllCols} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: '#64748b' }}>
                    Reset
                  </Button>
                </Stack>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: '8px',
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 0.5 }}>
                  {ALL_EXPORT_COLUMNS.map((col) => {
                    const isChecked = selectedColKeys.includes(col.key);
                    return (
                      <Box key={col.key}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={isChecked}
                              onChange={() => handleToggleColumn(col.key)}
                              sx={{ py: 0.2 }}
                            />
                          }
                          label={
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.82rem',
                                color: isChecked ? '#0b1d39' : '#64748b',
                                fontWeight: isChecked ? 600 : 400,
                              }}
                            >
                              {col.label}
                            </Typography>
                          }
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Paper>
          </Box>

          {/* Live Data Export Preview Table */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              bgcolor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 380,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39', display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon fontSize="small" /> Live Export Data Preview
              </Typography>
              <Chip
                label={`${filteredRows.length} matching rows · ${selectedDefs.length} active columns`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, color: '#64748b', borderColor: '#cbd5e1' }}
              />
            </Box>

            <TableContainer
              sx={{
                flex: 1,
                minHeight: 320,
                maxHeight: 480,
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                overflow: 'auto',
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {selectedDefs.map((col) => (
                      <TableCell
                        key={col.key}
                        sx={{
                          fontWeight: 700,
                          bgcolor: '#f8fafc',
                          color: '#0b1d39',
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap',
                          borderBottom: '2px solid #e2e8f0',
                        }}
                      >
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={selectedDefs.length || 1} align="center" sx={{ py: 4, color: '#64748b' }}>
                        No products found matching the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.slice(0, 50).map((row, idx) => (
                      <TableRow key={row.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        {selectedDefs.map((col) => (
                          <TableCell key={col.key} sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: '#1e293b' }}>
                            {getRowColumnValue(row, col.key, idx)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {filteredRows.length > 50 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'right', display: 'block', fontStyle: 'italic' }}>
                Showing preview of first 50 of {filteredRows.length} rows. Full dataset will be included in the export.
              </Typography>
            )}
          </Paper>

          {/* Bottom Footer: Live Metrics Summary & Dual Export Action Buttons */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mt: 'auto',
              borderRadius: '10px',
              bgcolor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={1.5} flexWrap="wrap" rowGap={1}>
              <Chip label={`Matching Rows: ${filteredRows.length}`} sx={{ bgcolor: '#ffffff', fontWeight: 700, color: '#0b1d39', border: '1px solid #cbd5e1' }} />
              <Chip label={`Total Stock: ${totals.stock}`} sx={{ bgcolor: '#ffffff', fontWeight: 700, color: '#059669', border: '1px solid #cbd5e1' }} />
              <Chip label={`Selling Value: ₹${totals.sellVal.toLocaleString()}`} sx={{ bgcolor: '#ffffff', fontWeight: 700, color: '#0284c7', border: '1px solid #cbd5e1' }} />
              <Chip label={`Cost Value: ₹${totals.costVal.toLocaleString()}`} sx={{ bgcolor: '#ffffff', fontWeight: 700, color: '#d97706', border: '1px solid #cbd5e1' }} />
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                onClick={handleExportCsv}
                disabled={loading || exporting || filteredRows.length === 0 || selectedColKeys.length === 0}
                startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <CsvIcon />}
                sx={{
                  height: 40,
                  borderColor: '#cbd5e1',
                  color: '#0b1d39',
                  bgcolor: '#ffffff',
                  borderRadius: '8px',
                  px: 3,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  '&:hover': { borderColor: '#0b1d39', bgcolor: '#f8fafc' },
                  '&.Mui-disabled': {
                    borderColor: '#e2e8f0',
                    color: '#94a3b8',
                  },
                }}
              >
                Export CSV
              </Button>

              <Button
                variant="contained"
                onClick={handleExportPdf}
                disabled={loading || exporting || filteredRows.length === 0 || selectedColKeys.length === 0}
                startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
                sx={{
                  height: 40,
                  bgcolor: '#0b1d39',
                  color: '#ffffff',
                  borderRadius: '8px',
                  px: 3,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: '#162e56', boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
                  '&.Mui-disabled': {
                    bgcolor: '#cbd5e1',
                    color: '#94a3b8',
                  },
                }}
              >
                Export PDF
              </Button>
            </Stack>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

export default InventoryExportView;
