import React, { forwardRef } from 'react';
import { Box, Typography } from '@mui/material';
import Barcode from 'react-barcode';

const CustomerCard = forwardRef(({ customer, shopName }, ref) => {
  if (!customer) return null;

  return (
    <Box
      ref={ref}
      sx={{
        width: 500,
        height: 315, // Exact CR80 ratio
        borderRadius: '20px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        p: 4,
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.6)',
        color: 'white',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Premium Glossy Effect */}
      <Box
        sx={{
          position: 'absolute',
          top: '-40%',
          left: '-10%',
          width: '120%',
          height: '100%',
          background: 'linear-gradient(120deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 60%)',
          transform: 'rotate(-15deg)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 'auto' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 900,
            color: '#D4AF37',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {shopName || 'Bachat Bazar'}
        </Typography>
        <Box
          sx={{
            border: '1px solid rgba(212, 175, 55, 0.5)',
            px: 1.5,
            py: 0.5,
            borderRadius: '6px',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '3px',
              color: '#D4AF37',
              textTransform: 'uppercase',
            }}
          >
            Premium Member
          </Typography>
        </Box>
      </Box>

      {/* Middle Section: Card Holder */}
      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontSize: '0.65rem',
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '3px',
            fontWeight: 600,
            mb: 0.5,
          }}
        >
          CARD HOLDER
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            mb: 0.5,
            fontSize: '1.8rem',
            letterSpacing: '1px',
          }}
        >
          {customer.name || 'Valued Customer'}
        </Typography>
        <Typography
          sx={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.8)',
            fontFamily: 'monospace',
            letterSpacing: '2px',
          }}
        >
          {customer.phone}
        </Typography>
      </Box>

      {/* Bottom Section: Barcode */}
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: '12px',
          p: 1.5,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
        }}
      >
        <Barcode
          value={customer.customerBarcode}
          width={1.8}
          height={40}
          fontSize={10}
          margin={0}
          displayValue={true}
        />
      </Box>
    </Box>
  );
});

export default CustomerCard;
