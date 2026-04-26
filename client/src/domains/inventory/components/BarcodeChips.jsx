import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

const BarcodeChips = ({ barcode, size = 'small' }) => {
  if (!barcode)
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );

  const barcodes = barcode
    .split('|')
    .map((b) => b.trim())
    .filter(Boolean);

  if (barcodes.length === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {barcodes.map((bc, idx) => (
        <Chip
          key={idx}
          label={bc}
          size={size}
          variant="outlined"
          sx={{
            fontFamily: 'monospace',
            fontSize: size === 'small' ? '0.75rem' : '0.875rem',
          }}
        />
      ))}
    </Box>
  );
};

export default BarcodeChips;
