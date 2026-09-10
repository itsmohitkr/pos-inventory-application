import { Box, Typography, Chip, Tooltip } from '@mui/material';

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

  const [firstBarcode, ...remainingBarcodes] = barcodes;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          fontFamily: 'Inter, monospace',
          fontSize: size === 'small' ? '0.78rem' : '0.85rem',
          fontWeight: 500,
          color: '#1f2937',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {firstBarcode}
      </Typography>
      {remainingBarcodes.length > 0 && (
        <Tooltip title={remainingBarcodes.join(', ')}>
          <Chip
            label={`+${remainingBarcodes.length}`}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: '#eef2f7',
              color: '#475569',
              flexShrink: 0,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
};

export default BarcodeChips;
