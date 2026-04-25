import React from 'react';
import { Box, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';

const ProductListToolbar = ({
  showCategories, onToggleCategories,
  stockFilter, onStockFilterChange,
  onReset,
  displayedProductCount,
}) => (
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
    <Button
      size="small"
      variant="outlined"
      startIcon={showCategories ? <VisibilityOffIcon /> : <VisibilityIcon />}
      onClick={onToggleCategories}
      sx={{
        color: '#1f2937',
        borderColor: 'rgba(31, 41, 55, 0.4)',
        fontSize: '0.75rem',
        padding: '4px 12px',
        '&:hover': { borderColor: 'rgba(31, 41, 55, 0.7)', bgcolor: 'rgba(31, 41, 55, 0.1)' },
      }}
    >
      {showCategories ? 'Hide Categories' : 'Show Categories'}
    </Button>
    <Button
      size="small"
      variant="outlined"
      startIcon={<RestartAltIcon />}
      onClick={onReset}
      sx={{
        color: '#1f2937',
        borderColor: 'rgba(31, 41, 55, 0.4)',
        fontSize: '0.75rem',
        padding: '4px 12px',
        '&:hover': { borderColor: 'rgba(31, 41, 55, 0.7)', bgcolor: 'rgba(31, 41, 55, 0.1)' },
      }}
    >
      Reset
    </Button>
    <ToggleButtonGroup
      value={stockFilter}
      exclusive
      onChange={(_, value) => { if (value) onStockFilterChange(value); }}
      size="small"
      sx={{ ml: 1 }}
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
