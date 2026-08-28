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

  // Group barcodes into rows of up to 2 barcodes per line
  const rows: string[][] = [];
  for (let i = 0; i < barcodes.length; i += 2) {
    rows.push(barcodes.slice(i, i + 2));
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      {rows.map((rowBarcodes, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {rowBarcodes.map((bc, idx) => (
            <React.Fragment key={idx}>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'Inter, monospace',
                  fontSize: size === 'small' ? '0.78rem' : '0.85rem',
                  fontWeight: 500,
                  color: '#1f2937',
                  whiteSpace: 'nowrap',
                }}
              >
                {bc}
              </Typography>
              {idx < rowBarcodes.length - 1 && (
                <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 300 }}>
                  |
                </Typography>
              )}
            </React.Fragment>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default BarcodeChips;
