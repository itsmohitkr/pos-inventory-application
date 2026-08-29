import type { Product } from '@/shared/types/models';
import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
  FormControlLabel,
  Switch,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import { useEditProduct } from '@/domains/inventory/components/useEditProduct';
import CustomDialog from '@/shared/components/CustomDialog';
import useCustomDialog from '@/shared/hooks/useCustomDialog';

interface InlineEditProductFormProps {
  product: Product;
  onClose: () => void;
  onProductUpdated: () => void;
}

export const InlineEditProductForm: React.FC<InlineEditProductFormProps> = ({
  product,
  onClose,
  onProductUpdated,
}) => {
  const { dialogState, showError, closeDialog } = useCustomDialog();

  const {
    formData,
    setFormData,
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
  } = useEditProduct({
    product,
    open: true,
    onClose,
    onProductUpdated,
    showError,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        px: 2,
        borderRadius: '8px',
        bgcolor: '#eff6ff',
        border: '1px solid #bfdbfe',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        animation: 'inlineExpand 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
        '@keyframes inlineExpand': {
          '0%': { opacity: 0, transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      }}
    >
      {/* Form Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <EditIcon sx={{ fontSize: 18, color: '#2563eb' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.825rem' }}>
          Edit Product Information
        </Typography>
      </Box>

      {/* Product Name */}
      <TextField
        size="small"
        label="Product Name"
        fullWidth
        InputLabelProps={{ shrink: true }}
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        sx={{
          '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
          '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb', fontWeight: 700 },
          '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
        }}
      />

      {/* Barcodes Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, fontSize: '0.72rem' }}>
          Barcodes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            size="small"
            label="Add Barcode"
            InputLabelProps={{ shrink: true }}
            value={manualBarcodeInput}
            onChange={(e) => setManualBarcodeInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addBarcode(manualBarcodeInput);
              }
            }}
            error={Boolean(barcodeError)}
            helperText={barcodeError || 'Press Enter or click Generate'}
            disabled={barcodeChecking}
            sx={{
              flex: 1,
              '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
              '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb', fontWeight: 700 },
              '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <QrCodeIcon sx={{ fontSize: 16, color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
            onClick={generateBarcode}
            disabled={barcodeChecking}
            sx={{
              height: 38,
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              bgcolor: '#2563eb',
              color: '#ffffff',
              '&:hover': { bgcolor: '#1d4ed8' },
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            Generate
          </Button>
        </Box>

        {barcodes.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
            {barcodes.map((barcode, index) => (
              <Chip
                key={index}
                label={barcode}
                size="small"
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  borderRadius: '4px',
                  '& .MuiChip-deleteIcon': { color: '#64748b', '&:hover': { color: '#ef4444' } },
                }}
                onDelete={() => removeBarcode(index)}
                deleteIcon={<CloseIcon sx={{ fontSize: '14px !important' }} />}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Category Dropdown / FreeSolo */}
      <Autocomplete
        freeSolo
        size="small"
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
            size="small"
            label="Category"
            InputLabelProps={{ shrink: true }}
            placeholder="Select or type new category"
            fullWidth
            sx={{
              '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
              '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb', fontWeight: 700 },
              '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
            }}
          />
        )}
      />

      {/* Switches & Low Stock Threshold */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={formData.batchTrackingEnabled}
              onChange={(e) => setFormData({ ...formData, batchTrackingEnabled: e.target.checked })}
            />
          }
          label={<Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Enable batch tracking</Typography>}
        />

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={formData.lowStockWarningEnabled}
              onChange={(e) => setFormData({ ...formData, lowStockWarningEnabled: e.target.checked })}
            />
          }
          label={<Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Enable low stock warning</Typography>}
        />

        {formData.lowStockWarningEnabled && (
          <TextField
            size="small"
            label="Low Stock Threshold"
            type="number"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.lowStockThreshold}
            onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
            InputProps={{ inputProps: { min: 0, step: 1 } }}
            helperText={`Less than or equal to ${formData.lowStockThreshold || 2} quantity will trigger low stock warning`}
            sx={{
              mt: 0.5,
              '& .MuiInputLabel-root': { color: '#475569', fontWeight: 600 },
              '& .MuiInputLabel-root.Mui-focused': { color: '#2563eb', fontWeight: 700 },
              '& .MuiOutlinedInput-root': { bgcolor: '#ffffff', borderRadius: '6px' },
            }}
          />
        )}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0.5 }}>
        <Button
          size="small"
          onClick={onClose}
          disabled={isSaving || barcodeChecking}
          sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#64748b' }}
        >
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={isSaving || barcodeChecking || Boolean(barcodeError) || !formData.name?.trim()}
          sx={{
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: 700,
            bgcolor: '#2563eb !important',
            color: '#ffffff !important',
            '&:hover': { bgcolor: '#1d4ed8 !important' },
            '&.Mui-disabled': {
              bgcolor: '#94a3b8 !important',
              color: '#ffffff !important',
            },
            borderRadius: '6px',
            height: 28,
            px: 1.5,
          }}
        >
          {isSaving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Save Product'}
        </Button>
      </Box>

      <CustomDialog {...dialogState} onClose={closeDialog} />
    </Paper>
  );
};

export default InlineEditProductForm;
