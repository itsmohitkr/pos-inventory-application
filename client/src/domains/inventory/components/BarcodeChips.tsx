import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

interface BarcodeChipsProps {
  /** Pipe-separated barcodes, as stored on Product.barcode. */
  barcode?: string | null;
  size?: 'small' | 'medium';
}

const BarcodeChips = ({ barcode, size = 'small' }: BarcodeChipsProps) => {
  if (!barcode)
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );

  const barcodes = barcode
    .split('|')
    .map((b: string) => b.trim())
    .filter(Boolean);

  if (barcodes.length === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );

  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
      {barcodes.map((bc: string, idx: number) => (
        <React.Fragment key={idx}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'Inter, monospace',
              fontSize: size === 'small' ? '0.8rem' : '0.9rem',
              fontWeight: 500,
              color: '#1f2937',
            }}
          >
            {bc}
          </Typography>
          {idx < barcodes.length - 1 && (
            <Typography sx={{ color: '#e2e8f0', fontWeight: 300 }}>|</Typography>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default BarcodeChips;
