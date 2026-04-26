import React from 'react';
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
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import CustomDialog from '@/shared/components/CustomDialog';
import { useBulkImport } from '@/domains/inventory/components/useBulkImport';

const ImportInstructionAlert = ({ onDownloadTemplate }) => (
  <Alert severity="warning" sx={{ mb: 2 }}>
    <Typography variant="body2" gutterBottom fontWeight={600}>
      CSV Format: name, barcode, category, quantity, mrp, cost_price, selling_price,
      batch_code, expiry_date
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
      onClick={onDownloadTemplate}
      sx={{ mt: 1 }}
    >
      Download Template
    </Button>
  </Alert>
);

const ImportPreviewTable = ({ preview, hasErrors, validationErrors }) => (
  <>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Typography variant="subtitle2">All Rows ({preview.length} total):</Typography>
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
                '&:hover': {
                  bgcolor: row.errors && row.errors.length > 0 ? 'error.light' : 'action.hover',
                },
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
                        sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
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
                  <Chip label="Error" color="error" size="small" icon={<ErrorIcon />} />
                ) : (
                  <Chip label="Valid" color="success" size="small" variant="outlined" />
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
);

const ImportResultSection = ({ result, onClose }) => (
  <Box>
    <Alert
      severity={result.success ? 'success' : 'error'}
      icon={result.success ? <SuccessIcon /> : <ErrorIcon />}
    >
      <Typography variant="body1" gutterBottom>
        {result.success ? (
          <><strong>{result.imported}</strong> products imported successfully</>
        ) : (
          <>Import Failed. No products were added.</>
        )}
        {result.failed > 0 && result.success && (
          <>, <strong>{result.failed}</strong> failed</>
        )}
      </Typography>
    </Alert>

    {result.errors && result.errors.length > 0 && (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom color="error">Errors:</Typography>
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
                    <Typography variant="body2" color="error">{error.message}</Typography>
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
);

const BulkImportDialog = ({ open, onClose, onImportComplete }) => {
  const { dialogState, showError, closeDialog } = useCustomDialog();
  const {
    file,
    preview,
    importing,
    result,
    validating,
    validationErrors,
    hasErrors,
    handleFileChange,
    handleImport,
    reset,
  } = useBulkImport(onImportComplete, showError);

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
    reset();
    onClose();
  };

  const handleKeyDown = (event) => {
    if (event.defaultPrevented) return;
    if (event.key !== 'Enter' || event.shiftKey) return;
    if (event.target?.tagName === 'TEXTAREA') return;
    event.preventDefault();
    if (result) {
      handleClose();
    } else if (file && !importing && !validating && !hasErrors) {
      handleImport();
    }
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
              <ImportInstructionAlert onDownloadTemplate={handleDownloadTemplate} />

              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="csv-file-input"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="csv-file-input">
                  <Button variant="outlined" component="span" startIcon={<UploadIcon />} size="large">
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
                <ImportPreviewTable
                  preview={preview}
                  hasErrors={hasErrors}
                  validationErrors={validationErrors}
                />
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
            <ImportResultSection result={result} onClose={handleClose} />
          )}
        </DialogContent>

        <DialogActions>
          {!result ? (
            <>
              <Button onClick={handleClose} startIcon={<CloseIcon />}>Cancel</Button>
              <Button
                onClick={handleImport}
                variant="contained"
                disabled={!file || importing || validating || hasErrors}
                startIcon={hasErrors ? <ErrorIcon /> : <UploadIcon />}
              >
                {hasErrors ? 'Fix Errors to Import' : 'Import All'}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} variant="contained" startIcon={<CloseIcon />}>Close</Button>
          )}
        </DialogActions>
      </Dialog>
      <CustomDialog {...dialogState} onClose={closeDialog} />
    </>
  );
};

export default BulkImportDialog;
