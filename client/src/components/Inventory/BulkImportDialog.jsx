import React, { useState } from 'react';
import api from '../../api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../hooks/useCustomDialog';

const BulkImportDialog = ({ open, onClose, onImportComplete }) => {
  const { dialogState, showError, closeDialog } = useCustomDialog();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [hasErrors, setHasErrors] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setValidationErrors([]);
      setHasErrors(false);
      parseCSV(selectedFile);
    }
  };

  // Proper RFC 4180 CSV parser that handles quoted values with commas and special characters
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote ("")
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Column separator (only if not inside quotes)
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last column
    result.push(current.trim());
    return result;
  };

  const parseCSV = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        showError('CSV file is empty or invalid');
        return;
      }

      // Parse header and data using proper CSV parser
      const headerValues = parseCSVLine(lines[0]);
      const headers = headerValues.map(h => h.trim().toLowerCase());

      const allData = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        const row = { lineNumber: index + 2, errors: [] };
        headers.forEach((header, i) => {
          let value = values[i] ? values[i].trim() : '';

          // If barcode looks like a number with decimals (e.g., "7622202346385.00"), remove the .00
          if (header === 'barcode' && value && /^\d+\.00$/.test(value)) {
            value = value.replace('.00', '');
          }

          row[header] = value;
        });
        return row;
      });

      // Validate all rows
      await validateAllRows(allData);

      setPreview(allData); // Show ALL rows with validation status
    };
    reader.readAsText(file);
  };

  const validateAllRows = async (allData) => {
    setValidating(true);
    const errors = [];
    const seenBarcodes = new Map(); // Track duplicate barcodes within CSV

    // First pass: validate each row and check for duplicates within CSV
    for (const row of allData) {
      const rowErrors = [];

      // Validate required fields (only name is required, barcode is optional)
      if (!row.name || !row.name.trim()) {
        rowErrors.push('Missing product name');
      }

      // Check for duplicate barcode within CSV (only if barcode is provided)
      if (row.barcode && row.barcode.trim()) {
        const barcode = row.barcode.trim().toLowerCase();
        if (seenBarcodes.has(barcode)) {
          rowErrors.push(`Duplicate barcode in CSV (also at line ${seenBarcodes.get(barcode)})`);
        } else {
          seenBarcodes.set(barcode, row.lineNumber);
        }
      }

      // Pricing validation removed - users can set their own pricing strategy

      row.errors = rowErrors;
      if (rowErrors.length > 0) {
        errors.push({ line: row.lineNumber, messages: rowErrors });
      }
    }

    // Second pass: check for existing barcodes in database (only for non-empty barcodes)
    try {
      const uniqueBarcodes = Array.from(seenBarcodes.keys()).filter(b => b);

      if (uniqueBarcodes.length > 0) {
        // Send original barcode values (not lowercase) for database check
        const originalBarcodes = allData
          .filter(row => row.barcode && row.barcode.trim())
          .map(row => row.barcode.trim());

        const response = await api.post('/api/products/validate-barcodes', {
          barcodes: originalBarcodes
        });

        const { existingBarcodes } = response.data;

        // Mark rows with existing barcodes as errors (case-insensitive comparison)
        for (const row of allData) {
          if (row.barcode && row.barcode.trim()) {
            const rowBarcode = row.barcode.trim().toLowerCase();
            const exists = existingBarcodes.some(eb => eb.toLowerCase() === rowBarcode);
            if (exists) {
              const error = 'Barcode already exists in database';
              row.errors.push(error);

              const existingError = errors.find(e => e.line === row.lineNumber);
              if (existingError) {
                existingError.messages.push(error);
              } else {
                errors.push({ line: row.lineNumber, messages: [error] });
              }
            }
          }
        }
      }
    } catch (_error) {
      console.error('Failed to validate barcodes against database:', _error);
    }

    setValidationErrors(errors);
    setHasErrors(errors.length > 0);
    setValidating(false);
  };

  const handleImport = async () => {
    if (!file || hasErrors) return;

    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;
      setResult(data);

      if (data.success && onImportComplete) {
        setTimeout(() => {
          onImportComplete();
        }, 2000);
      }
    } catch {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{ line: 0, message: 'Failed to connect to server' }]
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = `name,barcode,category,quantity,mrp,cost_price,selling_price,batch_code,expiry_date
"Tea Powder, 250g","8900000000001",Beverages,50,120,80,100,BATCH001,2025-12-31
"Rice, Premium 5kg","8900000000002",Groceries,100,450,350,400,BATCH002,
"Soap Bar (Pack of 3)","8900000000003","Personal Care, Hygiene",200,45,28,35,,
Loose Vegetables,,Groceries,0,100,60,80,,`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    setValidationErrors([]);
    setHasErrors(false);
    onClose();
  };

  const handleKeyDown = (event) => {
    if (event.defaultPrevented) return;
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return;
    if (event.target?.tagName === 'TEXTAREA') return;
    event.preventDefault();
    if (result) {
      handleClose();
      return;
    }
    if (!file || importing || validating || hasErrors) return;
    handleImport();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth onKeyDown={handleKeyDown}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Import Products from CSV</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {!result ? (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom fontWeight={600}>
                  CSV Format: name, barcode, category, quantity, mrp, cost_price, selling_price, batch_code, expiry_date
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  • Product names with commas should be in quotes (e.g., "Tea, 250g")
                  <br />• Barcodes should be in quotes to prevent Excel decimals (e.g., "8900000000001")
                  <br />• All special characters are preserved as-is
                  <br />• Use | (pipe) to separate multiple barcodes (e.g., "123|456|789")
                  <br />• Barcode is optional - leave empty if product doesn't have one
                  <br />• Each barcode must be UNIQUE (case-insensitive) - duplicates will be rejected
                  <br />• Leave batch_code empty to disable batch tracking (simple inventory mode)
                  <br />• Provide batch_code to enable batch tracking for that product
                  <br />• All rows must pass validation - a single error will prevent import
                </Typography>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadTemplate}
                  sx={{ mt: 1 }}
                >
                  Download Template
                </Button>
              </Alert>

              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="csv-file-input"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="csv-file-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    size="large"
                  >
                    Choose CSV File
                  </Button>
                </label>
                {file && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Selected: {file.name}
                  </Typography>
                )}
              </Box>

              {validating && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    Validating all rows...
                  </Typography>
                </Box>
              )}

              {preview.length > 0 && !validating && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      All Rows ({preview.length} total):
                    </Typography>
                    {hasErrors ? (
                      <Chip label={`${validationErrors.length} Error(s)`} color="error" size="small" />
                    ) : (
                      <Chip label="All Valid" color="success" size="small" icon={<SuccessIcon />} />
                    )}
                  </Box>

                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, mb: 2 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Line</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Barcode</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>MRP</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {preview.map((row) => (
                          <TableRow
                            key={row.lineNumber}
                            sx={{
                              bgcolor: row.errors && row.errors.length > 0 ? 'error.lighter' : 'inherit',
                              '&:hover': { bgcolor: row.errors && row.errors.length > 0 ? 'error.light' : 'action.hover' }
                            }}
                          >
                            <TableCell>{row.lineNumber}</TableCell>
                            <TableCell>{row.name || '-'}</TableCell>
                            <TableCell>
                              {row.barcode ? (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {row.barcode.split('|').map((bc, idx) => (
                                    <Chip
                                      key={idx}
                                      label={bc.trim()}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.75rem'
                                      }}
                                    />
                                  ))}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">—</Typography>
                              )}
                            </TableCell>
                            <TableCell>{row.quantity || '0'}</TableCell>
                            <TableCell>₹{row.mrp || '0'}</TableCell>
                            <TableCell>
                              {row.errors && row.errors.length > 0 ? (
                                <Chip
                                  label="Error"
                                  color="error"
                                  size="small"
                                  icon={<ErrorIcon />}
                                />
                              ) : (
                                <Chip
                                  label="Valid"
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {validationErrors.length > 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Validation Errors ({validationErrors.length}):
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {validationErrors.map((error, idx) => (
                          <li key={idx}>
                            <Typography variant="caption">
                              <strong>Line {error.line}:</strong> {error.messages.join(', ')}
                            </Typography>
                          </li>
                        ))}
                      </Box>
                    </Alert>
                  )}
                </>
              )}

              {importing && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    Importing products...
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Box>
              <Alert severity={result.success ? "success" : "error"} icon={result.success ? <SuccessIcon /> : <ErrorIcon />}>
                <Typography variant="body1" gutterBottom>
                  {result.success ? (
                    <><strong>{result.imported}</strong> products imported successfully</>
                  ) : (
                    <>Import Failed. No products were added.</>
                  )}
                  {result.failed > 0 && result.success && <>, <strong>{result.failed}</strong> failed</>}
                </Typography>
              </Alert>

              {result.errors && result.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="error">
                    Errors:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Line</TableCell>
                          <TableCell>Error</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.errors.slice(0, 20).map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.line}</TableCell>
                            <TableCell>
                              <Typography variant="body2" color="error">
                                {error.message}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {result.errors.length > 20 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      ... and {result.errors.length - 20} more errors
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          {!result ? (
            <>
              <Button onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleImport}
                variant="contained"
                disabled={!file || importing || validating || hasErrors}
                startIcon={hasErrors ? <ErrorIcon /> : undefined}
              >
                {hasErrors ? 'Fix Errors to Import' : 'Import All'}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} variant="contained">
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <CustomDialog {...dialogState} onClose={closeDialog} />
    </>
  );
};

export default BulkImportDialog;
