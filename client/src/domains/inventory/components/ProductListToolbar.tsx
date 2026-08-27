import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Badge,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  RestartAlt as RestartAltIcon,
  Check as CheckIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Inventory2Outlined as InventoryIcon,
  WarningAmberOutlined as WarningIcon,
  RemoveCircleOutline as OutOfStockIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface ProductListToolbarProps {
  /** 'all' | 'low' | 'zero'. */
  stockFilter: string;
  onStockFilterChange: (value: string) => void;
  onReset: () => void;
  displayedProductCount: number;
  /** True when category/search/sort/stock differ from their defaults —
   * onReset clears all of them, not just the stock filter, so the Reset
   * control must stay visible whenever any of them is active. */
  hasActiveFilters: boolean;
  onAddProduct?: () => void;
}

const ProductListToolbar = ({
  stockFilter,
  onStockFilterChange,
  onReset,
  displayedProductCount,
  hasActiveFilters,
  onAddProduct,
}: ProductListToolbarProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleOpenFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const handleSelectFilter = (value: string) => {
    onStockFilterChange(value);
    handleCloseFilter();
  };

  const getFilterLabel = () => {
    if (stockFilter === 'low') return `Low Stock (${displayedProductCount})`;
    if (stockFilter === 'zero') return `Zero Stock (${displayedProductCount})`;
    return 'Filter';
  };

  const isFilterActive = stockFilter !== 'all';

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
      {/* Filter Button */}
      <Button
        size="small"
        variant={isFilterActive ? 'contained' : 'outlined'}
        color={isFilterActive ? 'primary' : 'inherit'}
        startIcon={
          <Badge
            color="secondary"
            variant="dot"
            invisible={!isFilterActive}
            sx={{ '& .MuiBadge-badge': { right: -2, top: -2 } }}
          >
            <FilterListIcon fontSize="small" />
          </Badge>
        }
        endIcon={<KeyboardArrowDownIcon fontSize="small" />}
        onClick={handleOpenFilter}
        aria-controls={isMenuOpen ? 'stock-filter-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={isMenuOpen ? 'true' : undefined}
        sx={{
          height: '36px',
          textTransform: 'none',
          fontSize: '0.8rem',
          fontWeight: isFilterActive ? 600 : 500,
          borderColor: isFilterActive ? undefined : '#e2e8f0',
          color: isFilterActive ? undefined : '#1f2937',
          borderRadius: '6px',
          px: 1.5,
          whiteSpace: 'nowrap',
          '&:hover': {
            borderColor: isFilterActive ? undefined : '#cbd5e1',
            bgcolor: isFilterActive ? undefined : 'rgba(31, 41, 55, 0.05)',
          },
        }}
      >
        {getFilterLabel()}
      </Button>

      {/* Filter Dropdown Menu */}
      <Menu
        id="stock-filter-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleCloseFilter}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              minWidth: 200,
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              mt: 0.5,
              py: 0.5,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              fontSize: '0.65rem',
            }}
          >
            Stock Level Filters
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          selected={stockFilter === 'all'}
          onClick={() => handleSelectFilter('all')}
          sx={{ py: 1, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 'auto', color: '#64748b' }}>
              <InventoryIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="All Items"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: stockFilter === 'all' ? 600 : 400 }}
            />
          </Box>
          {stockFilter === 'all' && <CheckIcon fontSize="small" color="primary" sx={{ ml: 1.5 }} />}
        </MenuItem>

        <MenuItem
          selected={stockFilter === 'low'}
          onClick={() => handleSelectFilter('low')}
          sx={{ py: 1, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 'auto', color: '#7c3aed' }}>
              <WarningIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Low Stock Warning"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: stockFilter === 'low' ? 600 : 400 }}
            />
          </Box>
          {stockFilter === 'low' && <CheckIcon fontSize="small" sx={{ color: '#7c3aed', ml: 1.5 }} />}
        </MenuItem>

        <MenuItem
          selected={stockFilter === 'zero'}
          onClick={() => handleSelectFilter('zero')}
          sx={{ py: 1, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 'auto', color: '#ef4444' }}>
              <OutOfStockIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Zero Stock"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: stockFilter === 'zero' ? 600 : 400 }}
            />
          </Box>
          {stockFilter === 'zero' && <CheckIcon fontSize="small" sx={{ color: '#ef4444', ml: 1.5 }} />}
        </MenuItem>
      </Menu>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Tooltip title="Reset Filters">
          <IconButton
            size="small"
            onClick={onReset}
            sx={{
              height: '36px',
              width: '36px',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              flexShrink: 0,
              '&:hover': { borderColor: '#cbd5e1', bgcolor: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' },
            }}
          >
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Add New Product Button */}
      {onAddProduct && (
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<AddIcon fontSize="small" />}
          onClick={onAddProduct}
          sx={{
            height: '36px',
            textTransform: 'none',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '6px',
            px: 1.5,
            whiteSpace: 'nowrap',
            bgcolor: '#0b1d39',
            '&:hover': {
              bgcolor: '#1e293b',
            },
          }}
        >
          Add Product
        </Button>
      )}
    </Box>
  );
};

export default ProductListToolbar;
