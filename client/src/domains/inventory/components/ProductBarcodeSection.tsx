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

const ProductBarcodeSection = ({
  manualBarcodeInput, setManualBarcodeInput,
  barcodes, barcodeError, barcodeChecking,
  onAddBarcode, onRemoveBarcode, onGenerate,
}: ProductBarcodeSectionProps) => (
  <Box sx={{ mb: 2 }}>
    <Grid container spacing={1} alignItems="center">
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
          InputProps={{ startAdornment: <InputAdornment position="start"><QrCodeIcon color="action" /></InputAdornment> }}
        />
      </Grid>
      <Grid>
        <Button type="button" variant="contained" size="medium" startIcon={<RefreshIcon />} onClick={onGenerate} disabled={barcodeChecking}>
          Generate
        </Button>
      </Grid>
    </Grid>
    {barcodes.length > 0 && (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        {barcodes.map((barcode, index) => (
          <Chip
            key={index}
            label={barcode}
            sx={{ backgroundColor: '#2196F3', color: 'white', fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 600 }}
            onDelete={() => onRemoveBarcode(index)}
            deleteIcon={<CloseIcon />}
          />
        ))}
      </Box>
    )}
  </Box>
);

export default ProductBarcodeSection;
