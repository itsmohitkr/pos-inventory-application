import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface PricingSummaryCardProps {
  label: string;
  /** Pre-formatted, e.g. "₹123.00". */
  value: string;
  /** Pre-formatted, e.g. "12.5%" or "12.5% less". */
  percent: string;
  bgcolor: string;
  borderColor: string;
  labelColor: string;
  valueColor: string;
  /** Denser padding/type scale for compact inline contexts (batch cards). */
  compact?: boolean;
}

/**
 * One of the small Discount/Margin/Vendor-Discount (or Wholesale
 * Savings/Margin) summary cards shown under a pricing form. Shared between
 * ProductInitialBatchSection.tsx (Add Product) and BatchFormFields.tsx
 * (New Batch / Edit Batch) so a future copy or styling fix only needs to
 * be made once — each caller keeps its own grid/wrapper and layout, only
 * the card body itself is shared.
 */
const PricingSummaryCard = ({
  label,
  value,
  percent,
  bgcolor,
  borderColor,
  labelColor,
  valueColor,
  compact = false,
}: PricingSummaryCardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: compact ? 0.75 : 1.25,
      px: compact ? 1 : 1.5,
      bgcolor,
      borderRadius: compact ? '5px' : '6px',
      border: '1px solid',
      borderColor,
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? 0.15 : 0.25,
    }}
  >
    <Typography
      variant="caption"
      sx={{ fontWeight: 600, color: labelColor, fontSize: compact ? '0.68rem' : '0.75rem' }}
    >
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: compact ? 0.25 : 0.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: valueColor, fontSize: compact ? '0.78rem' : '0.88rem' }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 700, color: labelColor, fontSize: compact ? '0.68rem' : '0.75rem' }}>
        {percent}
      </Typography>
    </Box>
  </Paper>
);

export default PricingSummaryCard;
