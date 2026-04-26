import React from 'react';
import { Box, Typography, IconButton, Chip, ButtonBase } from '@mui/material';
import { LocalOffer as PromoIcon, Close as CloseIcon } from '@mui/icons-material';

const PromoGiftsList = ({
  show,
  activeConfig,
  eligibleFreeProducts,
  cart,
  onAddFreeProduct,
  onClose,
  totalProfit,
}) => {
  if (!show || !activeConfig || eligibleFreeProducts.length === 0) return null;

  return (
    <Box sx={{ p: 1.5, borderTop: '2px dashed #22ab7dff', bgcolor: '#f0fff4', flexShrink: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <PromoIcon fontSize="small" /> Eligible Free Gifts
          </Typography>
          <Chip
            label={`Min. Order: ≥ ₹${activeConfig.threshold}`}
            color="primary"
            size="small"
            sx={{
              fontWeight: 800,
              height: 24,
              fontSize: '0.75rem',
              bgcolor: 'success.main',
              color: 'white',
              px: 0.5,
            }}
          />
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: '#065f46',
            '&:hover': { bgcolor: 'rgba(6, 95, 70, 0.1)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pt: 1,
          pb: 1,
          '&::-webkit-scrollbar': { height: '6px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e0', borderRadius: '3px' },
        }}
      >
        {eligibleFreeProducts.map((product) => {
          const profitLimit = totalProfit * ((activeConfig.profitPercentage || 20) / 100);
          const minCost = activeConfig.minCostPrice || 0;
          const maxCost =
            activeConfig.maxCostPrice !== null ? activeConfig.maxCostPrice : profitLimit;
          const bestBatch = product.batches.find(
            (b) => b.costPrice >= minCost && b.costPrice <= maxCost && b.quantity > 0
          );
          const isSelected = cart.find((item) => item.isFree && item.product_id === product.id);

          return (
            <ButtonBase
              key={product.id}
              onClick={() => onAddFreeProduct(product)}
              sx={{
                flexShrink: 0,
                p: 2,
                py: 2.25,
                width: 160,
                minHeight: 110,
                bgcolor: isSelected ? '#ccfbf1' : 'white',
                border: isSelected ? '2px solid #22ab7dff' : '1px solid #c6f6d5',
                borderRadius: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.75,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: '#22ab7dff',
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  height: 38,
                  lineHeight: 1.2,
                  color: '#0b1d39',
                }}
              >
                {product.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Chip
                  label="FREE"
                  size="small"
                  sx={{
                    height: 18,
                    bgcolor: '#22ab7dff',
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '0.6rem',
                  }}
                />
                {bestBatch && (
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', ml: 0.5 }}
                  >
                    MRP: ₹{bestBatch.mrp}
                  </Typography>
                )}
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
};

export default PromoGiftsList;
