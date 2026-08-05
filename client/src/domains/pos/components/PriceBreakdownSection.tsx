import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface PriceBreakdownSectionProps {
  subTotal: number;
  discount: number;
  totalAmount: number;
  /** Extra saved from active promotions/category sales, not the broader MRP margin. */
  saleSavings?: number;
}

const PriceBreakdownSection = ({
  subTotal,
  discount,
  totalAmount,
  saleSavings = 0,
}: PriceBreakdownSectionProps) => {
  return (
    <>
      {/* Price Breakdown */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body1" color="text.secondary" fontWeight="bold">
            Subtotal
          </Typography>
          <Typography variant="body1" fontWeight="bold" data-testid="pos-subtotal">
            ₹{subTotal.toFixed(2)}
          </Typography>
        </Box>
        {discount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body1" color="error.main" fontWeight="bold">
              Discount
            </Typography>
            <Typography variant="body1" color="error.main" fontWeight="bold" data-testid="pos-discount">
              - ₹{discount.toFixed(2)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Net Payable - More Compact */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          bgcolor: 'rgba(31, 138, 91, 0.12)',
          border: '1px solid rgba(31, 138, 91, 0.2)',
          borderRadius: 1,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="caption"
          color="success.main"
          fontWeight="bold"
          sx={{ fontSize: '0.7rem' }}
        >
          NET PAYABLE
        </Typography>
        <Typography
          variant="h4"
          fontWeight="bold"
          color="success.dark"
          sx={{ letterSpacing: -0.5 }}
          data-testid="pos-net-payable"
        >
          ₹{totalAmount.toFixed(2)}
        </Typography>
      </Paper>

      {saleSavings > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ color: '#7c3aed', fontWeight: 700, fontSize: '0.75rem' }}
            data-testid="pos-sale-savings"
          >
            You save ₹{saleSavings.toFixed(2)} more on the sale product
          </Typography>
        </Box>
      )}
    </>
  );
};

export default React.memo(PriceBreakdownSection);
