import React from 'react';
import { Box, Typography } from '@mui/material';

const STAT_CONFIGS = [
  {
    label: 'Products',
    getValue: (t) => t.productCount,
    borderColor: '#3b82f6',
    colorLabel: '#1e40af',
    colorValue: '#1e3a8a',
    bgColor: 'rgba(59, 130, 246, 0.08)',
  },
  {
    label: 'Total Stock',
    getValue: (t) => t.totalQty,
    borderColor: '#8b5cf6',
    colorLabel: '#6d28d9',
    colorValue: '#5b21b6',
    bgColor: 'rgba(139, 92, 246, 0.08)',
  },
  {
    label: 'Cost Value',
    getValue: (t) => `₹${t.totalCost.toFixed(2)}`,
    borderColor: '#f59e0b',
    colorLabel: '#d97706',
    colorValue: '#b45309',
    bgColor: 'rgba(245, 158, 11, 0.08)',
  },
  {
    label: 'Selling Value',
    getValue: (t) => `₹${t.totalSelling.toFixed(2)}`,
    borderColor: '#10b981',
    colorLabel: '#059669',
    colorValue: '#047857',
    bgColor: 'rgba(16, 185, 129, 0.08)',
  },
  {
    label: 'Avg Margin',
    getValue: (_, avg) => `${avg.margin}%`,
    borderColor: '#ec4899',
    colorLabel: '#db2777',
    colorValue: '#be185d',
    bgColor: 'rgba(236, 72, 153, 0.08)',
  },
  {
    label: 'Avg Discount',
    getValue: (_, avg) => `${avg.discount}%`,
    borderColor: '#f43f5e',
    colorLabel: '#e11d48',
    colorValue: '#9f1239',
    bgColor: 'rgba(244, 63, 94, 0.08)',
  },
];

const ProductSummaryBar = ({ summaryTotals, averageMargin, averageDiscount }) => {
  const avg = { margin: averageMargin, discount: averageDiscount };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2.5,
        flexWrap: 'wrap',
        alignItems: 'center',
        pt: 1.5,
        borderTop: '1px solid rgba(31, 41, 55, 0.2)',
      }}
    >
      {STAT_CONFIGS.map(({ label, getValue, borderColor, colorLabel, colorValue, bgColor }) => (
        <Box
          key={label}
          sx={{
            border: `2px dotted ${borderColor}`,
            borderRadius: 1,
            p: 1.5,
            bgcolor: bgColor,
            minWidth: label === 'Cost Value' || label === 'Selling Value' ? 110 : 100,
            flex: `1 1 ${label === 'Cost Value' || label === 'Selling Value' ? 130 : 120}px`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: colorLabel,
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              letterSpacing: '0.3px',
              fontWeight: 600,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3, color: colorValue }}
          >
            {getValue(summaryTotals, avg)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default ProductSummaryBar;
