import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Autocomplete,
  FormControlLabel,
  Switch,
  Box,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import EditBatchDialog from '@/domains/inventory/components/EditBatchDialog';
import CustomDialog from '@/shared/components/CustomDialog';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import { useEditProduct } from '@/domains/inventory/components/useEditProduct';

const EditProductDialog = ({ open, onClose, product, onProductUpdated }) => {
  const { dialogState, showError, closeDialog } = useCustomDialog();
  
  const {
    formData,
    setFormData,
    batches,
    existingCategories,
    barcodes,
    manualBarcodeInput,
    setManualBarcodeInput,
    barcodeError,
    barcodeChecking,
    isSaving,
    addBarcode,
    removeBarcode,
    generateBarcode,
    handleSave,
    fetchProductDetails,
  } = useEditProduct({ product, open, onClose, onProductUpdated, showError });

  const [editBatchOpen, setEditBatchOpen] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(null);

  const handleEditBatch = (batch) => {
    setCurrentBatch(batch);
    setEditBatchOpen(true);
  };

  const handleBatchUpdated = () => {
    fetchProductDetails();
    setEditBatchOpen(false);
    if (onProductUpdated) onProductUpdated();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Product Information</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Product Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Barcodes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
              <TextField
                size="small"
                label="Add Barcode"
                value={manualBarcodeInput}
                onChange={(e) => setManualBarcodeInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBarcode(manualBarcodeInput);
                  }
                }}
                error={Boolean(barcodeError)}
                helperText={barcodeError || 'Enter barcode and press Enter or click Generate'}
                disabled={barcodeChecking}
                sx={{ flex: 1, minWidth: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCodeIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={generateBarcode}
                disabled={barcodeChecking}
                sx={{ mt: 0.5, whiteSpace: 'nowrap', height: 'fit-content' }}
              >
                Generate
              </Button>
            </Box>
            {barcodes.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {barcodes.map((barcode, index) => (
                  <Chip
                    key={index}
                    label={barcode}
                    sx={{
                      backgroundColor: '#2196F3',
                      color: 'white',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                    onDelete={() => removeBarcode(index)}
                    deleteIcon={<CloseIcon />}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Autocomplete
            freeSolo
            options={existingCategories}
            value={formData.category}
            onChange={(event, newValue) => {
              setFormData({ ...formData, category: newValue || '' });
            }}
            onInputChange={(event, newInputValue) => {
              setFormData({ ...formData, category: newInputValue });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label="Category"
                placeholder="Select or type new"
                fullWidth
              />
            )}
            sx={{ mt: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.batchTrackingEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, batchTrackingEnabled: e.target.checked })
                }
              />
            }
            label="Enable batch tracking"
            sx={{ mt: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.lowStockWarningEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, lowStockWarningEnabled: e.target.checked })
                }
              />
            }
            label="Enable low stock warning"
            sx={{ mt: 2 }}
          />
          {formData.lowStockWarningEnabled && (
            <TextField
              margin="dense"
              label="Low Stock Threshold"
              type="number"
              fullWidth
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              InputProps={{ inputProps: { min: 0, step: 1 } }}
              helperText={`Less than or equal to ${formData.lowStockThreshold || 2} quantity will be under the low stock warning`}
              sx={{ mt: 1 }}
            />
          )}

          {batches.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Batches
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell>Code</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">MRP</TableCell>
                      <TableCell align="right">SP</TableCell>
                      <TableCell align="right">CP</TableCell>
                      <TableCell>Expiry</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>{batch.batchCode || 'N/A'}</TableCell>
                        <TableCell align="right">{batch.quantity}</TableCell>
                        <TableCell align="right">{batch.mrp}</TableCell>
                        <TableCell align="right">{batch.sellingPrice}</TableCell>
                        <TableCell align="right">{batch.costPrice}</TableCell>
                        <TableCell>
                          {batch.expiryDate ? batch.expiryDate.split('T')[0] : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleEditBatch(batch)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving || barcodeChecking}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isSaving || barcodeChecking || Boolean(barcodeError)}
          >
            {isSaving ? 'Saving...' : 'Save Product'}
          </Button>
        </DialogActions>

        {editBatchOpen && currentBatch && (
          <EditBatchDialog
            open={editBatchOpen}
            onClose={() => setEditBatchOpen(false)}
            batch={currentBatch}
            onBatchUpdated={handleBatchUpdated}
          />
        )}
      </Dialog>
      <CustomDialog {...dialogState} onClose={closeDialog} />
    </>
  );
};

export default EditProductDialog;
