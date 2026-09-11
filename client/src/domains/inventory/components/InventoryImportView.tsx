import React from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import CustomDialog from '@/shared/components/CustomDialog';
import { useBulkImport } from '@/domains/inventory/components/useBulkImport';
import type {
  BulkImportResult,
  BulkImportRow,
  BulkImportValidationError,
} from '@/domains/inventory/components/useBulkImport';

interface InventoryImportViewProps {
  onImportComplete: () => void;
}

const ImportPreviewTable = ({
  preview,
  hasErrors,
  validationErrors,
}: {
  preview: BulkImportRow[];
  hasErrors: boolean;
  validationErrors: BulkImportValidationError[];
}) => (
  <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39' }}>
        Preview Rows ({preview.length} total)
      </Typography>
      {hasErrors ? (
        <Chip label={`${validationErrors.length} Error(s) detected`} color="error" size="small" />
      ) : (
        <Chip label="All Rows Valid" color="success" size="small" icon={<SuccessIcon />} />
      )}
    </Box>

    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        flex: 1,
        minHeight: 200,
        borderColor: '#e2e8f0',
        borderRadius: '8px',
        overflow: 'auto',
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Line</TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Barcode</TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Quantity</TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Cost Price</TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Selling Price</TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>MRP</TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {preview.map((row: BulkImportRow) => (
            <TableRow
              key={row.lineNumber}
              sx={{
                bgcolor: row.errors && row.errors.length > 0 ? 'rgba(239, 68, 68, 0.06)' : 'inherit',
                '&:hover': {
                  bgcolor: row.errors && row.errors.length > 0 ? 'rgba(239, 68, 68, 0.12)' : '#f8fafc',
                },
              }}
            >
              <TableCell>{row.lineNumber}</TableCell>
              <TableCell sx={{ fontWeight: 500 }}>{row.name || '-'}</TableCell>
              <TableCell>
                {row.barcode ? (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {row.barcode.split('|').map((bc: string, idx: number) => (
                      <Chip
                        key={idx}
                        label={bc.trim()}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: '0.725rem' }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">—</Typography>
                )}
              </TableCell>
              <TableCell>{row.category || '-'}</TableCell>
              <TableCell>{row.quantity || '0'}</TableCell>
              <TableCell>₹{row.cost_price || '0'}</TableCell>
              <TableCell>₹{row.selling_price || '0'}</TableCell>
              <TableCell>₹{row.mrp || '0'}</TableCell>
              <TableCell>
                {row.errors && row.errors.length > 0 ? (
                  <Chip
                    label="Error"
                    color="error"
                    size="small"
                    icon={<ErrorIcon />}
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                ) : (
                  <Chip
                    label="Valid"
                    color="success"
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    {validationErrors.length > 0 && (
      <Alert severity="error" sx={{ mt: 1.5, maxHeight: 120, overflow: 'auto', borderRadius: '8px' }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Validation Errors ({validationErrors.length}):
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {validationErrors.slice(0, 10).map((error: BulkImportValidationError, idx: number) => (
            <li key={idx}>
              <Typography variant="caption">
                <strong>Line {error.line}:</strong> {error.messages.join(', ')}
              </Typography>
            </li>
          ))}
          {validationErrors.length > 10 && (
            <li>
              <Typography variant="caption" fontStyle="italic">
                ...and {validationErrors.length - 10} more issues
              </Typography>
            </li>
          )}
        </Box>
      </Alert>
    )}
  </Box>
);

const ImportResultSection = ({
  result,
  onReset,
}: {
  result: BulkImportResult;
  onReset: () => void;
}) => (
  <Box sx={{ py: 3, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
    <Alert
      severity={result.success ? 'success' : 'error'}
      icon={result.success ? <SuccessIcon fontSize="inherit" /> : <ErrorIcon fontSize="inherit" />}
      sx={{ width: '100%', maxWidth: 640, borderRadius: '8px' }}
    >
      <Typography variant="subtitle1" fontWeight={700}>
        {result.success ? 'Import Completed Successfully' : 'Import Failed'}
      </Typography>
      <Typography variant="body2">
        {result.success ? (
          <>
            <strong>{result.imported}</strong> products added/updated in your inventory.
            {(result.failed ?? 0) > 0 && ` (${result.failed} failed)`}
          </>
        ) : (
          'No products were imported. Please review the errors below and try again.'
        )}
      </Typography>
    </Alert>

    {result.errors && result.errors.length > 0 && (
      <Box sx={{ width: '100%', maxWidth: 640, mt: 1 }}>
        <Typography variant="subtitle2" color="error.main" fontWeight={600} gutterBottom>
          Error Details ({result.errors.length}):
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 240, borderColor: '#fca5a5' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Line</TableCell>
                <TableCell>Error Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.errors.map((err, idx) => (
                <TableRow key={idx}>
                  <TableCell>{err.line}</TableCell>
                  <TableCell sx={{ color: 'error.main' }}>{err.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    )}

    <Button
      variant="contained"
      onClick={onReset}
      startIcon={<RefreshIcon />}
      sx={{ bgcolor: '#0b1d39', mt: 2, borderRadius: '8px', '&:hover': { bgcolor: '#162e56' } }}
    >
      Import Another CSV
    </Button>
  </Box>
);

const ImportInstructionAlert = ({ onDownloadTemplate }: { onDownloadTemplate: () => void }) => (
  <Alert severity="warning" sx={{ mb: 2, borderRadius: '8px', flexShrink: 0 }}>
    <Typography variant="body2" gutterBottom fontWeight={600}>
      CSV Format: name, barcode, category, quantity, mrp, cost_price, selling_price, batch_code, expiry_date
    </Typography>
    <Typography variant="caption" display="block" sx={{ mt: 1, lineHeight: 1.7 }}>
      • Product names with commas should be in quotes (e.g., &quot;Tea, 250g&quot;)
      <br />• Barcodes should be in quotes to prevent Excel decimals (e.g., &quot;8900000000001&quot;)
      <br />• All special characters are preserved as-is
      <br />• Use | (pipe) to separate multiple barcodes (e.g., &quot;123|456|789&quot;)
      <br />• Barcode is optional - leave empty if product doesn&apos;t have one
      <br />• Each barcode must be UNIQUE (case-insensitive) - duplicates will be rejected
      <br />• Leave batch_code empty to disable batch tracking (simple inventory mode)
      <br />• Provide batch_code to enable batch tracking for that product
      <br />• All rows must pass validation - a single error will prevent import
    </Typography>
    <Button
      size="small"
      variant="outlined"
      color="inherit"
      startIcon={<DownloadIcon />}
      onClick={onDownloadTemplate}
      sx={{ mt: 1.5, borderColor: 'rgba(0,0,0,0.25)', fontWeight: 600 }}
    >
      Download Template
    </Button>
  </Alert>
);

const InventoryImportView: React.FC<InventoryImportViewProps> = ({ onImportComplete }) => {
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

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        bgcolor: '#ffffff',
      }}
    >
      {/* Hidden file input used by the file picker */}
      <input
        accept=".csv"
        style={{ display: 'none' }}
        id="csv-file-upload-input"
        type="file"
        onChange={handleFileChange}
      />

      {/* Main Body */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {result ? (
          <ImportResultSection result={result} onReset={reset} />
        ) : (
          <>
            {/* Detailed Instructions Alert */}
            <ImportInstructionAlert onDownloadTemplate={handleDownloadTemplate} />

            {/* Single File Upload Picker if no file is yet selected */}
            {!file && !validating && (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 220,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  p: 4,
                  bgcolor: '#f8fafc',
                  textAlign: 'center',
                }}
              >
                <UploadIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={700} color="#0b1d39" gutterBottom>
                  Select a CSV file to import products in bulk
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, mb: 2.5 }}>
                  Choose your prepared CSV file to preview and validate product rows before importing into inventory.
                </Typography>
                <label htmlFor="csv-file-upload-input">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<UploadIcon />}
                    size="large"
                    sx={{
                      bgcolor: '#0b1d39',
                      borderRadius: '8px',
                      px: 3.5,
                      py: 1,
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#162e56' },
                    }}
                  >
                    Choose CSV File
                  </Button>
                </label>
              </Box>
            )}

            {/* In-Flight Validation Progress */}
            {validating && (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <LinearProgress sx={{ maxWidth: 400, mx: 'auto', mb: 1.5, borderRadius: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Validating all rows...
                </Typography>
              </Box>
            )}

            {/* File Selected Status Bar & Preview Table */}
            {file && preview.length > 0 && !validating && (
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip
                    label={`Selected: ${file.name}`}
                    onDelete={reset}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                  <label htmlFor="csv-file-upload-input">
                    <Button
                      size="small"
                      variant="text"
                      component="span"
                      sx={{ textTransform: 'none', color: '#64748b' }}
                    >
                      Choose another file
                    </Button>
                  </label>
                </Stack>
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
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <LinearProgress sx={{ maxWidth: 400, mx: 'auto', mb: 1.5, borderRadius: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Importing products into inventory...
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Bottom Footer when Preview Available and not yet imported */}
      {preview.length > 0 && !result && (
        <>
          <Divider sx={{ my: 1.5, borderColor: '#e2e8f0' }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {preview.length} rows parsed · {hasErrors ? 'Please correct errors before importing' : 'Ready to import'}
            </Typography>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={reset}
                sx={{
                  color: '#64748b',
                  borderColor: '#cbd5e1',
                  borderRadius: '8px',
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={!file || importing || validating || hasErrors}
                startIcon={hasErrors ? <ErrorIcon /> : <UploadIcon />}
                sx={{
                  bgcolor: hasErrors ? 'error.main' : '#0b1d39',
                  borderRadius: '8px',
                  fontWeight: 600,
                  '&:hover': { bgcolor: hasErrors ? 'error.dark' : '#162e56' },
                  '&.Mui-disabled': {
                    bgcolor: '#e2e8f0',
                    color: '#94a3b8',
                  },
                }}
              >
                {hasErrors ? 'Fix Errors to Import' : `Import ${preview.length} Products`}
              </Button>
            </Stack>
          </Box>
        </>
      )}

      <CustomDialog {...dialogState} onClose={closeDialog} />
    </Paper>
  );
};

export default InventoryImportView;
