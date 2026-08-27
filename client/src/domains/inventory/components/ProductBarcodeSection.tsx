interface ProductBarcodeSectionProps {
  manualBarcodeInput: string;
  setManualBarcodeInput: (value: string) => void;
  barcodes: string[];
  /** Empty string when the entered barcode is valid. */
  barcodeError: string;
  barcodeChecking: boolean;
  onAddBarcode: (barcode: string) => void;
  onRemoveBarcode: (index: number) => void;
  onGenerate: () => void;
}

import React from 'react';
import { Box, TextField, Button, Chip, Grid, InputAdornment } from '@mui/material';
import { QrCode as QrCodeIcon, Refresh as RefreshIcon, Close as CloseIcon } from '@mui/icons-material';
import { inputFieldSx } from '@/domains/inventory/components/inventoryFormStyles';

const ProductBarcodeSection = ({
  manualBarcodeInput, setManualBarcodeInput,
  barcodes, barcodeError, barcodeChecking,
  onAddBarcode, onRemoveBarcode, onGenerate,
}: ProductBarcodeSectionProps) => (
  <Box sx={{ mb: 1 }}>
    <Grid container spacing={1.5} alignItems="center">
      <Grid size="grow">
        <TextField
          fullWidth
          size="small"
          label="Add Barcode"
          value={manualBarcodeInput}
          onChange={(e) => setManualBarcodeInput(e.target.value)}
          onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddBarcode(manualBarcodeInput); } }}
          error={Boolean(barcodeError)}
          helperText={barcodeError}
          disabled={barcodeChecking}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <QrCodeIcon sx={{ color: '#64748b', fontSize: '1.1rem' }} />
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiOutlinedInput-root': inputFieldSx }}
        />
      </Grid>
      <Grid>
        <Button
          type="button"
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon fontSize="small" />}
          onClick={onGenerate}
          disabled={barcodeChecking}
          sx={{
            height: '40px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            borderColor: '#cbd5e1',
            color: '#0b1d39',
            borderRadius: '6px',
            '&:hover': { borderColor: '#0b1d39', bgcolor: '#f8fafc' },
          }}
        >
          Generate
        </Button>
      </Grid>
    </Grid>
    {barcodes.length > 0 && (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
        {barcodes.map((barcode, index) => (
          <Chip
            key={index}
            label={barcode}
            size="small"
            sx={{
              bgcolor: '#f1f5f9',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              '& .MuiChip-deleteIcon': {
                color: '#64748b',
                fontSize: '0.9rem',
                '&:hover': { color: '#ef4444' },
              },
            }}
            onDelete={() => onRemoveBarcode(index)}
            deleteIcon={<CloseIcon />}
          />
        ))}
      </Box>
    )}
  </Box>
);

export default ProductBarcodeSection;
