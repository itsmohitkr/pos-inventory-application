import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const PriceBreakdownSection = ({ subTotal, discount, totalAmount }) => {
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
    </>
  );
};

export default React.memo(PriceBreakdownSection);
