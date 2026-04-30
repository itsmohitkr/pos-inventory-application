import React, { useState, useMemo } from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  PersonSearch as PersonSearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';

const PHONE_RE = /^\d{10}$/;

const CustomerSearchField = ({
  activeCustomer,
  onSelect,
  onDetach,
  isLoading,
  searchResults = [],
  isSearching,
  onSearch,
  customerSearchValue,
  setCustomerSearchValue,
  customerNameValue,
  setCustomerNameValue,
  onRegister,
}) => {
  const [open, setOpen] = useState(false);

  // Filter input to only allow digits and max 10
  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setCustomerSearchValue(cleaned);
    onSearch(cleaned);
  };

  // Logic to determine if we should show the "New Customer" form
  const isPotentialNewCustomer = useMemo(() => {
    if (activeCustomer) return false;
    if (customerSearchValue.length !== 10) return false;

    // Check if this 10-digit number is NOT in the search results
    const match = searchResults.find(c => c.phone === customerSearchValue);
    return !match;
  }, [activeCustomer, customerSearchValue, searchResults]);

  if (activeCustomer) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.25,
          bgcolor: 'rgba(30, 41, 59, 0.05)',
          border: '1px solid rgba(30, 41, 59, 0.15)',
          borderRadius: 1,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'rgba(30, 41, 59, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <PersonIcon sx={{ color: '#334155', fontSize: 18 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5, display: 'block', mb: -0.2 }}
          >
            ACTIVE CUSTOMER
          </Typography>
          <Typography variant="body2" fontWeight="700" sx={{ color: '#1e293b' }} noWrap>
            {activeCustomer.name || 'Walk-in Customer'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
            {activeCustomer.phone}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onDetach}
          sx={{
            bgcolor: 'rgba(0,0,0,0.03)',
            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  const handleManualRegister = async () => {
    if (customerSearchValue.length === 10) {
      await onRegister(customerSearchValue, customerNameValue);
      setCustomerNameValue('');
      setCustomerSearchValue('');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight="600"
        sx={{ display: 'block', fontSize: '0.75rem' }}
      >
        Customer Mobile
      </Typography>
      <Autocomplete
        freeSolo
        open={open && customerSearchValue.length >= 2 && !isPotentialNewCustomer}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        options={searchResults}
        loading={isSearching || isLoading}
        inputValue={customerSearchValue}
        onInputChange={(_e, val) => handlePhoneChange(val)}
        onChange={(_e, selected) => {
          if (selected && typeof selected !== 'string') {
            onSelect(selected);
            setCustomerSearchValue('');
          }
        }}
        getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.phone)}
        slotProps={{
          popper: {
            sx: {
              '& .MuiPaper-root': {
                backdropFilter: 'blur(12px)',
                bgcolor: 'rgba(255, 255, 255, 0.98)',
                borderRadius: 1,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                mt: 0.5,
                minWidth: 400, // Broader width for a more expansive feel
              },
              '& .MuiAutocomplete-listbox': {
                p: 0,
                '& .MuiAutocomplete-option': {
                  p: 0,
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  '&:last-child': { borderBottom: 'none' },
                  '&[aria-selected="true"]': { bgcolor: 'rgba(59, 130, 246, 0.08)' },
                  '&.Mui-focused': { bgcolor: 'rgba(59, 130, 246, 0.04)' },
                }
              }
            }
          }
        }}
        renderOption={(props, opt) => {
          const { key, ...rest } = props;
          return (
            <Box
              component="li"
              key={key}
              {...rest}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: '8px !important', // Increased vertical space top and bottom
                pl: '20px !important',
                pr: '20px !important',
                width: '100%',
                minHeight: 40, // Broader row height
              }}
            >
              <Typography variant="body1" fontWeight="500" sx={{ color: '#0f172a', flexGrow: 1 }} noWrap>
                {opt.name || 'Walk-in Customer'}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  letterSpacing: 0.5,
                  ml: 3
                }}
              >
                {opt.phone}
              </Typography>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="Enter 10-digit number"
            error={customerSearchValue.length > 0 && customerSearchValue.length < 10 && !open}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start" sx={{ ml: 1 }}>
                  {isSearching || isLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <PersonSearchIcon fontSize="small" color="action" />
                  )}
                </InputAdornment>
              ),
              sx: {
                borderRadius: 1,
                fontSize: '0.875rem',
                bgcolor: 'white',
                '& .MuiInputBase-input': {
                  px: 1.5, // Added internal horizontal padding
                }
              }
            }}
          />
        )}
      />

      {isPotentialNewCustomer && (
        <Box
          sx={{
            p: 1.25,
            bgcolor: 'rgba(59, 130, 246, 0.08)',
            border: '1px dashed rgba(59, 130, 246, 0.3)',
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon sx={{ color: '#2563eb', fontSize: 16 }} />
            <Typography variant="caption" fontWeight="800" sx={{ color: '#2563eb', letterSpacing: 0.5 }}>
              NEW CUSTOMER
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Name (Optional)"
              value={customerNameValue}
              onChange={(e) => setCustomerNameValue(e.target.value)}
              sx={{
                '& .MuiInputBase-root': { height: 32, fontSize: '0.8rem', bgcolor: 'white', borderRadius: 1 }
              }}
            />
            <Tooltip title="Save Customer">
              <IconButton
                size="small"
                onClick={handleManualRegister}
                sx={{
                  bgcolor: '#2563eb',
                  color: 'white',
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#1d4ed8' }
                }}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CustomerSearchField;
