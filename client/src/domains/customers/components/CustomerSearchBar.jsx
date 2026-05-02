import React from 'react';
import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

const CustomerSearchBar = ({ value, onChange }) => (
  <Box sx={{ maxWidth: 800, mx: 'auto', width: '100%' }}>
    <TextField
      fullWidth
      size="small"
      placeholder="Search customers by name, phone number, or barcode barcode..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => onChange('')} sx={{ color: '#94a3b8' }}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
        sx: {
          borderRadius: '10px',
          bgcolor: '#ffffff',
          fontWeight: 600,
          '& fieldset': { borderColor: '#e2e8f0' },
          '&:hover fieldset': { borderColor: '#cbd5e1' },
          '&.Mui-focused fieldset': { borderColor: '#0f172a' }
        }
      }}
    />
  </Box>
);

export default CustomerSearchBar;
