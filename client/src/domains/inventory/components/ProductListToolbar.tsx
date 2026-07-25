import React from 'react';
import { Box, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';

const ProductListToolbar = ({
  stockFilter, onStockFilterChange,
  onReset,
  displayedProductCount,
}) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>

    <Button
      size="small"
      variant="outlined"
      startIcon={<RestartAltIcon />}
      onClick={onReset}
      sx={{
        color: '#1f2937',
        borderColor: '#e2e8f0',
        fontSize: '0.8rem',
        height: '36px',
        textTransform: 'none',
        '&:hover': { borderColor: '#cbd5e1', bgcolor: 'rgba(31, 41, 55, 0.05)' },
      }}
    >
      Reset
    </Button>
    <ToggleButtonGroup
      value={stockFilter}
      exclusive
      onChange={(_, value) => { if (value) onStockFilterChange(value); }}
      size="small"
      sx={{ ml: 1, height: '36px' }}
    >
      <ToggleButton value="all" sx={{ fontSize: '0.75rem', px: 2 }}>All</ToggleButton>
      <ToggleButton value="low" sx={{ fontSize: '0.75rem', px: 2 }}>
        Low Stock
        {stockFilter === 'low' && (
          <Box component="span" sx={{ ml: 1, fontWeight: 700, color: '#7c3aed' }}>
            ({displayedProductCount})
          </Box>
        )}
      </ToggleButton>
      <ToggleButton value="zero" sx={{ fontSize: '0.75rem', px: 2 }}>
        Zero Stock
        {stockFilter === 'zero' && (
          <Box component="span" sx={{ ml: 1, fontWeight: 700, color: '#ef4444' }}>
            ({displayedProductCount})
          </Box>
        )}
      </ToggleButton>
    </ToggleButtonGroup>
  </Box>
);

export default ProductListToolbar;
