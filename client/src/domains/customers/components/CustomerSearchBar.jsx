import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

const CustomerSearchBar = ({ value, onChange }) => (
  <TextField
    fullWidth
    size="small"
    placeholder="Search by name, phone, or barcode…"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon fontSize="small" color="action" />
        </InputAdornment>
      ),
      endAdornment: value ? (
        <InputAdornment position="end">
          <IconButton size="small" onClick={() => onChange('')}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </InputAdornment>
      ) : null,
    }}
  />
);

export default CustomerSearchBar;
