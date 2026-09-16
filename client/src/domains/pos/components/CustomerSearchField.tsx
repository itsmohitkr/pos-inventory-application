import type { Customer } from '@/shared/api/customerService';
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
  Dialpad as DialpadIcon,
} from '@mui/icons-material';
import CustomerMobileDialog from '@/domains/pos/components/CustomerMobileDialog';
import { isCustomerBarcode } from '@/shared/utils/customerBarcode';

const PHONE_RE = /^\d{10}$/;

const CustomerSearchField = ({
  activeCustomer,
  onSelect,
  onDetach,
  isLoading,
  searchResults = [],
  isSearching,
  onSearch,
  onLookup,
  customerSearchValue,
  setCustomerSearchValue,
  customerNameValue,
  setCustomerNameValue,
  onRegister,
}: Record<string, any>) => {
  const [open, setOpen] = useState(false);
  const [showMobileDialog, setShowMobileDialog] = useState(false);

  // Filter input to only allow digits — up to 12, so a scanned 12-digit
  // customer barcode isn't truncated before it can be recognized (a typed
  // phone number is still just 10 digits and unaffected).
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 12);
    setCustomerSearchValue(cleaned);
    onSearch(cleaned);
  };

  // A scanner "types" the barcode then sends Enter — intercept that here the
  // same way the main POS search bar does, so this field doubles as a
  // barcode scan target without disturbing normal phone-number typing.
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    if (!isCustomerBarcode(customerSearchValue)) return;
    event.preventDefault();
    event.stopPropagation();
    onLookup(customerSearchValue);
    setCustomerSearchValue('');
  };

  // Logic to determine if we should show the "New Customer" form
  const isPotentialNewCustomer = useMemo(() => {
    if (activeCustomer) return false;
    if (customerSearchValue.length !== 10) return false;

    // Check if this 10-digit number is NOT in the search results
    const match = searchResults.find((c: Customer) => c.phone === customerSearchValue);
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
          onClick={() => setShowMobileDialog(true)}
          sx={{
            bgcolor: 'rgba(30, 41, 59, 0.07)',
            borderRadius: 1,
            mr: 0.5,
            p: 0.5,
            color: 'primary.main',
            '&:hover': { bgcolor: 'rgba(30, 41, 59, 0.14)' },
          }}
        >
          <DialpadIcon sx={{ fontSize: 18 }} />
        </IconButton>
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
        <CustomerMobileDialog
          open={showMobileDialog}
          onClose={() => setShowMobileDialog(false)}
          onConfirm={async (phone, name) => {
            await onRegister(phone, name);
            setShowMobileDialog(false);
          }}
          initialPhone={activeCustomer.phone}
          initialName={activeCustomer.name || ''}
        />
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

  const handleDialogConfirm = async (phone: string, name?: string) => {
    await onRegister(phone, name);
    setCustomerSearchValue('');
    setCustomerNameValue('');
    setShowMobileDialog(false);
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
      <Autocomplete<any, false, false, true>
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
            onKeyDown={handleKeyDown}
            error={customerSearchValue.length > 0 && customerSearchValue.length < 10 && !open}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  {isSearching || isLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <PersonSearchIcon fontSize="small" color="action" />
                  )}
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: -0.5 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMobileDialog(true);
                    }}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: 'rgba(30, 41, 59, 0.07)',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'rgba(30, 41, 59, 0.14)',
                      },
                    }}
                  >
                    <DialpadIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 1,
                fontSize: '0.875rem',
                bgcolor: 'white',
                '&.MuiOutlinedInput-root': {
                  pr: 1.25,
                },
                '& .MuiInputBase-input': {
                  px: 1,
                },
              },
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
            gap: 1,
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
                '& .MuiInputBase-root': { height: 32, fontSize: '0.8rem', bgcolor: 'white', borderRadius: 1 },
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
                  '&:hover': { bgcolor: '#1d4ed8' },
                }}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      <CustomerMobileDialog
        open={showMobileDialog}
        onClose={() => setShowMobileDialog(false)}
        onConfirm={handleDialogConfirm}
        initialPhone={customerSearchValue}
        initialName={customerNameValue}
      />
    </Box>
  );
};

export default CustomerSearchField;
