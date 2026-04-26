import React, { useState, useRef } from 'react';
import { Box, TextField, InputAdornment, Chip, IconButton, CircularProgress, Typography } from '@mui/material';
import { PersonSearch as PersonSearchIcon, Close as CloseIcon, Person as PersonIcon } from '@mui/icons-material';

const CustomerSearchField = ({ activeCustomer, onLookup, onDetach, isLoading, value = '', onChange }) => {
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onLookup(value.trim());
      if (onChange) onChange('');
    }
  };

  if (activeCustomer) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          bgcolor: 'rgba(21, 128, 61, 0.08)',
          border: '1px solid rgba(21, 128, 61, 0.3)',
          borderRadius: 1,
        }}
      >
        <PersonIcon sx={{ color: '#15803d', fontSize: 18 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 700, display: 'block', lineHeight: 1.2 }}>
            CUSTOMER
          </Typography>
          <Typography variant="body2" fontWeight="600" noWrap>
            {activeCustomer.name || activeCustomer.phone}
          </Typography>
          {activeCustomer.name && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {activeCustomer.phone}
            </Typography>
          )}
        </Box>
        <Chip
          label={activeCustomer.customerBarcode}
          size="small"
          sx={{ fontSize: '0.65rem', fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.06)' }}
        />
        <IconButton size="small" onClick={onDetach} aria-label="remove customer">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  return (
    <TextField
      fullWidth
      size="small"
      inputRef={inputRef}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Phone or scan customer barcode"
      label="Customer (optional)"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            {isLoading ? (
              <CircularProgress size={16} />
            ) : (
              <PersonSearchIcon fontSize="small" color="action" />
            )}
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => onChange && onChange('')}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      sx={{ '& .MuiInputLabel-root': { fontSize: '0.8rem' } }}
    />
  );
};

export default CustomerSearchField;
