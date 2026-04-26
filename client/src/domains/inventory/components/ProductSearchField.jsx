import React from 'react';
import { TextField, InputAdornment, IconButton, Chip } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

const ProductSearchField = ({
  searchTerm,
  debouncedSearch,
  searchInputRef,
  onSearchChange,
  onBarcodeSearch,
  onClearSearch,
}) => {
  return (
    <>
      {searchTerm && (
        <Chip
          label={`Search: "${searchTerm}"`}
          onDelete={onClearSearch}
          size="small"
          sx={{
            bgcolor: 'rgba(31, 41, 55, 0.15)',
            color: '#1f2937',
            fontSize: '0.7rem',
            height: '24px',
            '& .MuiChip-deleteIcon': {
              color: 'rgba(31, 41, 55, 0.7)',
              fontSize: '1rem',
              '&:hover': { color: '#1f2937' },
            },
          }}
        />
      )}
      <TextField
        autoFocus
        variant="outlined"
        size="small"
        placeholder="Search name or barcode..."
        inputRef={searchInputRef}
        defaultValue={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onBarcodeSearch(e.target.value.trim());
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'rgba(31, 41, 55, 0.6)', fontSize: '1.1rem' }} />
            </InputAdornment>
          ),
          endAdornment: (debouncedSearch || searchTerm) && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={onClearSearch} edge="end">
                <ClearIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          width: { xs: '100%', sm: 220, md: 260, lg: 280 },
          maxWidth: 320,
          '& .MuiOutlinedInput-root': {
            color: '#1f2937',
            fontSize: '0.85rem',
            bgcolor: 'rgba(255, 255, 255, 0.5)',
            '& fieldset': { borderColor: 'rgba(31, 41, 55, 0.3)' },
            '&:hover fieldset': { borderColor: 'rgba(31, 41, 55, 0.5)' },
            '&.Mui-focused fieldset': { borderColor: '#d97706' },
          },
          '& .MuiOutlinedInput-input': {
            padding: '7px 10px',
            '&::placeholder': { color: 'rgba(31, 41, 55, 0.5)', opacity: 1 },
          },
        }}
      />
    </>
  );
};

export default ProductSearchField;
