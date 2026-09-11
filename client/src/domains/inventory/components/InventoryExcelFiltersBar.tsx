import React from 'react';
import { Box, TextField, InputAdornment, MenuItem, IconButton, Tooltip, Chip } from '@mui/material';
import { Search as SearchIcon, ViewColumn as ViewColumnIcon } from '@mui/icons-material';

interface InventoryExcelFiltersBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  /** 'all' or a category name. */
  localCategoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  uniqueCategories: string[];
  filteredCount?: number;
  onOpenColumnsMenu?: (event: React.MouseEvent<HTMLElement>) => void;
}

const InventoryExcelFiltersBar = ({
  searchTerm,
  onSearchTermChange,
  localCategoryFilter,
  onCategoryFilterChange,
  uniqueCategories,
  filteredCount,
  onOpenColumnsMenu,
}: InventoryExcelFiltersBarProps) => (
  <Box
    className="no-print"
    sx={{
      mb: 1.5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 1.5,
    }}
  >
    {/* Left: Search input & Category dropdown */}
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        size="small"
        placeholder="Search name or barcode..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        sx={{
          width: { xs: '100%', sm: 260 },
          bgcolor: '#ffffff',
          borderRadius: '6px',
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <TextField
        select
        size="small"
        value={localCategoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value)}
        sx={{
          width: { xs: '100%', sm: 200 },
          bgcolor: '#ffffff',
          borderRadius: '6px',
        }}
        SelectProps={{
          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: 340,
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                border: '1px solid #e2e8f0',
                '& .MuiMenuItem-root': {
                  fontSize: '0.82rem',
                  py: 0.75,
                  minHeight: 'auto',
                },
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 transparent',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#cbd5e1',
                  borderRadius: '4px',
                },
              },
            },
          },
        }}
      >
        {uniqueCategories.map((cat) => (
          <MenuItem key={cat} value={cat}>
            {cat === 'all' ? 'All Categories' : cat}
          </MenuItem>
        ))}
      </TextField>

      {filteredCount !== undefined && (
        <Chip
          label={`Rows: ${filteredCount}`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      )}
    </Box>

    {/* Right: Filter Columns icon button */}
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
      {onOpenColumnsMenu && (
        <Tooltip title="Filter Columns">
          <IconButton
            onClick={onOpenColumnsMenu}
            size="small"
            aria-label="Filter Columns"
            sx={{
              width: 38,
              height: 38,
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              bgcolor: '#ffffff',
              color: '#0b1d39',
              '&:hover': {
                borderColor: '#0b1d39',
                bgcolor: '#f8fafc',
              },
            }}
          >
            <ViewColumnIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  </Box>
);

export default InventoryExcelFiltersBar;
