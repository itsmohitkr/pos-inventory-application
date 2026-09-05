import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Sort as SortIcon,
  RestartAlt as RestartAltIcon,
  Check as CheckIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingBagOutlined as ShoppingBagIcon,
  AccessTime as TimeIcon,
  PersonOutline as PersonIcon,
} from '@mui/icons-material';

interface CustomerListToolbarProps {
  sortBy: string;
  order: 'asc' | 'desc';
  onSortChange: (sortBy: string, order: 'asc' | 'desc') => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const sortOptions = [
  { id: 'createdAt', label: 'Recently Added', icon: <TimeIcon fontSize="small" />, defaultOrder: 'desc' as const },
  { id: 'totalSpend', label: 'Highest Spend', icon: <MoneyIcon fontSize="small" />, defaultOrder: 'desc' as const },
  { id: 'purchases', label: 'Most Purchases', icon: <ShoppingBagIcon fontSize="small" />, defaultOrder: 'desc' as const },
  { id: 'name', label: 'Customer Name', icon: <PersonIcon fontSize="small" />, defaultOrder: 'asc' as const },
];

export const CustomerListToolbar = ({
  sortBy,
  order,
  onSortChange,
  onReset,
  hasActiveFilters,
}: CustomerListToolbarProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleOpenSort = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseSort = () => {
    setAnchorEl(null);
  };

  const handleSelectSort = (item: typeof sortOptions[0]) => {
    if (sortBy === item.id) {
      onSortChange(item.id, order === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(item.id, item.defaultOrder);
    }
    handleCloseSort();
  };

  const currentSortLabel = sortOptions.find((s) => s.id === sortBy)?.label || 'Sort';

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
      {/* Sort Button */}
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<SortIcon fontSize="small" />}
        endIcon={<KeyboardArrowDownIcon fontSize="small" />}
        onClick={handleOpenSort}
        aria-controls={isMenuOpen ? 'customer-sort-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={isMenuOpen ? 'true' : undefined}
        sx={{
          height: '36px',
          textTransform: 'none',
          fontSize: '0.8rem',
          fontWeight: 600,
          borderColor: '#e2e8f0',
          color: '#1f2937',
          borderRadius: '6px',
          px: 1.5,
          whiteSpace: 'nowrap',
          '&:hover': {
            borderColor: '#cbd5e1',
            bgcolor: 'rgba(31, 41, 55, 0.05)',
          },
        }}
      >
        {currentSortLabel}
      </Button>

      {/* Sort Menu */}
      <Menu
        id="customer-sort-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleCloseSort}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              minWidth: 180,
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
        {sortOptions.map((opt) => {
          const isSelected = sortBy === opt.id;
          return (
            <MenuItem
              key={opt.id}
              selected={isSelected}
              onClick={() => handleSelectSort(opt)}
              sx={{ py: 1, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 'auto', color: isSelected ? '#0b1d39' : '#64748b' }}>
                  {opt.icon}
                </ListItemIcon>
                <ListItemText
                  primary={opt.label}
                  primaryTypographyProps={{
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#0b1d39' : '#1f2937',
                  }}
                />
              </Box>
              {isSelected && <CheckIcon fontSize="small" sx={{ color: '#0b1d39', ml: 1.5 }} />}
            </MenuItem>
          );
        })}
      </Menu>

      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <Tooltip title="Reset Filters">
          <IconButton
            size="small"
            onClick={onReset}
            aria-label="Reset Filters"
            sx={{
              height: '36px',
              width: '36px',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              flexShrink: 0,
              '&:hover': {
                borderColor: '#cbd5e1',
                bgcolor: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
              },
            }}
          >
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default CustomerListToolbar;
