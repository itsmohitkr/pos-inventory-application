import React from 'react';
import { Paper, Box, TextField, InputAdornment, Chip } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const InventoryExcelFiltersBar = ({
  searchTerm,
  onSearchTermChange,
  localCategoryFilter,
  onCategoryFilterChange,
  uniqueCategories,
  filteredCount,
  totals,
}) => (
  <Paper
    className="no-print"
    elevation={0}
    sx={{
      p: 2,
      mb: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 2,
      border: '1px solid #e0e0e0',
    }}
  >
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <TextField
        size="small"
        placeholder="Search name, category or barcode..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        sx={{ width: 300 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />
      <TextField
        select
        size="small"
        value={localCategoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value)}
        SelectProps={{ native: true }}
        sx={{ width: 220 }}
      >
        {uniqueCategories.map((cat) => (
          <option key={cat} value={cat}>
            {cat === 'all' ? 'All Categories' : cat}
          </option>
        ))}
      </TextField>
    </Box>
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Chip label={`Rows: ${filteredCount}`} color="primary" variant="outlined" />
      <Chip label={`Total Stock: ${totals.totalStock || 0}`} color="success" variant="outlined" />
      <Chip
        label={`Selling Value: ₹${(totals.totalValueSelling || 0).toLocaleString()}`}
        color="info"
        variant="outlined"
      />
      <Chip
        label={`Cost Value: ₹${(totals.totalValueCost || 0).toLocaleString()}`}
        color="warning"
        variant="outlined"
      />
    </Box>
  </Paper>
);

export default InventoryExcelFiltersBar;
