import React from 'react';
import { Box, Typography } from '@mui/material';

const STAT_CONFIGS = [
  { label: 'Products', getValue: (t) => t.productCount, accentColor: '#3b82f6' },
  { label: 'Total Stock', getValue: (t) => t.totalQty, accentColor: '#8b5cf6' },
  { label: 'Cost Value', getValue: (t) => `₹${t.totalCost.toFixed(2)}`, accentColor: '#f59e0b' },
  { label: 'Selling Value', getValue: (t) => `₹${t.totalSelling.toFixed(2)}`, accentColor: '#10b981' },
  { label: 'Avg Margin', getValue: (_, avg) => `${avg.margin}%`, accentColor: '#06b6d4' },
  { label: 'Avg Discount', getValue: (_, avg) => `${avg.discount}%`, accentColor: '#f43f5e' },
];

const ProductSummaryBar = ({ summaryTotals, averageMargin, averageDiscount }) => {
  const avg = { margin: averageMargin, discount: averageDiscount };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.25,
        flexWrap: 'wrap',
        alignItems: 'center',
        pt: 1.5,
        borderTop: '1px solid #e2e8f0',
      }}
    >
      {STAT_CONFIGS.map(({ label, getValue, accentColor }) => (
        <Box
          key={label}
          sx={{
            border: '1px solid',
            borderColor: `${accentColor}33`, // 20% opacity
            borderRadius: '8px',
            p: 1.25,
            bgcolor: `${accentColor}0A`, // 4% opacity
            minWidth: label.includes('Value') ? 130 : 100,
            flex: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: `${accentColor}1A`, // 10% opacity
              borderColor: `${accentColor}66`, // 40% opacity
            }
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: accentColor,
              textTransform: 'uppercase',
              fontSize: '0.85rem',
              letterSpacing: '0.5px',
              fontWeight: 500,
              display: 'block',
              mb: 0.5,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="body1"
            sx={{ 
              fontWeight: 500, 
              fontSize: '0.85rem', 
              color: '#0b1d39',
              lineHeight: 1
            }}
          >
            {getValue(summaryTotals, avg)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default ProductSummaryBar;
