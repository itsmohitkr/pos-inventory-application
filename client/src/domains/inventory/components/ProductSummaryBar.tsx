import type { InventorySummaryTotals } from '@/domains/inventory/components/inventoryTypes';
import React from 'react';
import { Box, Typography } from '@mui/material';

/** The two pre-formatted percentage strings the last two stats read. */
interface SummaryAverages {
  margin: string;
  discount: string;
}

interface StatConfig {
  label: string;
  getValue: (totals: InventorySummaryTotals, avg: SummaryAverages) => string | number;
  accentColor: string;
}

const STAT_CONFIGS: StatConfig[] = [
  { label: 'Products', getValue: (t) => t.productCount, accentColor: '#3b82f6' },
  { label: 'Total Stock', getValue: (t) => t.totalQty, accentColor: '#8b5cf6' },
  { label: 'Cost Value', getValue: (t) => `₹${t.totalCost.toFixed(2)}`, accentColor: '#f59e0b' },
  { label: 'Selling Value', getValue: (t) => `₹${t.totalSelling.toFixed(2)}`, accentColor: '#10b981' },
  { label: 'Avg Margin', getValue: (_, avg) => `${avg.margin}%`, accentColor: '#06b6d4' },
  { label: 'Avg Discount', getValue: (_, avg) => `${avg.discount}%`, accentColor: '#f43f5e' },
];

interface ProductSummaryBarProps {
  summaryTotals: InventorySummaryTotals;
  /** Percentages formatted to one decimal by useProductList, e.g. '24.5'. */
  averageMargin: string;
  averageDiscount: string;
}

const ProductSummaryBar = ({
  summaryTotals,
  averageMargin,
  averageDiscount,
}: ProductSummaryBarProps) => {
  const avg = { margin: averageMargin, discount: averageDiscount };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
        gap: 1.25,
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
            py: 1,
            px: 1.25,
            bgcolor: `${accentColor}0A`, // 4% opacity
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: `${accentColor}1A`, // 10% opacity
              borderColor: `${accentColor}66`, // 40% opacity
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: accentColor,
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              letterSpacing: '0.5px',
              fontWeight: 600,
              display: 'block',
              mb: 0.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="body2"
            sx={{ 
              fontWeight: 500, 
              fontSize: '0.88rem', 
              color: '#1e293b',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
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
