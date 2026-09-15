import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Backspace as BackspaceIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import customerService, { Customer } from '@/shared/api/customerService';

interface CustomerMobileDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (phone: string, name?: string) => Promise<void> | void;
  initialPhone?: string;
  initialName?: string;
}

const CustomerMobileDialog = ({
  open,
  onClose,
  onConfirm,
  initialPhone = '',
  initialName = '',
}: CustomerMobileDialogProps) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);

  useEffect(() => {
    if (open) {
      const cleanPhone = initialPhone ? initialPhone.replace(/\D/g, '').slice(0, 10) : '';
      setPhone(cleanPhone);
      setName(initialName || '');
      setFoundCustomer(null);
      setIsNameFocused(false);
      setLoading(false);
    }
  }, [open, initialPhone, initialName]);

  // Live lookup when 10 digits are entered
  useEffect(() => {
    if (!open) return;
    if (phone.length === 10) {
      let active = true;
      setIsSearching(true);
      customerService
        .findByPhone(phone)
        .then((match) => {
          if (!active) return;
          setFoundCustomer(match);
          // Functional update reads the latest name at commit time rather
          // than the value closed over when this effect was created, so a
          // name typed while the lookup was in flight is never clobbered.
          if (match.name) {
            setName((prev) => prev || match.name || '');
          }
        })
        .catch(() => {
          // findByPhone rejects (404) when no customer matches this phone —
          // that's the expected "new customer" case, not just a network error.
          if (active) setFoundCustomer(null);
        })
        .finally(() => {
          if (active) setIsSearching(false);
        });

      return () => {
        active = false;
      };
    } else {
      setFoundCustomer(null);
      setIsSearching(false);
    }
  }, [open, phone]);

  const handleNumberClick = (num: number | string) => {
    setPhone((prev) => {
      if (prev.length >= 10) return prev;
      return prev + num;
    });
  };

  const handleClear = () => {
    setPhone('');
    setFoundCustomer(null);
  };

  const handleBackspace = () => {
    setPhone((prev) => prev.slice(0, -1));
  };

  const handleSubmit = useCallback(async () => {
    if (phone.length !== 10) return;
    setLoading(true);
    try {
      await onConfirm(phone, name.trim() || undefined);
      onClose();
    } finally {
      setLoading(false);
    }
  }, [phone, name, onConfirm, onClose]);

  // Keyboard support matching LooseSaleDialog
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in Name field, only handle Enter and Escape
      if (isNameFocused) {
        if (e.key === 'Enter' && phone.length === 10) {
          e.preventDefault();
          handleSubmit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
        return;
      }

      // Global/Phone field shortcuts
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter' && phone.length === 10) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, phone, name, isNameFocused, onClose, handleSubmit]);

  const numpadRows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ['Clear', 0, 'DEL'],
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { border: '1px solid #e2e8f0' },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Typography component="span" variant="h6" sx={{ fontWeight: 'bold' }}>
          Customer Mobile Number
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* Header Label above Mobile Display */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: -0.5, px: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Enter 10-digit mobile number
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                color: phone.length === 10 ? 'success.main' : 'text.disabled',
              }}
            >
              {phone.length}/10
            </Typography>
          </Box>

          {/* Row 1: Mobile Display */}
          <TextField
            fullWidth
            value={phone}
            placeholder="0000000000"
            InputProps={{
              readOnly: true,
              startAdornment: (
                <Typography
                  sx={{ mr: 1, fontWeight: '900', fontSize: '1.6rem', color: 'primary.main' }}
                >
                  +91
                </Typography>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(0,0,0,0.06)',
                fontWeight: '900',
                fontSize: '2.5rem',
                color: 'primary.main',
                '& input': {
                  caretColor: 'transparent',
                  textAlign: 'center',
                  py: 2,
                  letterSpacing: 2,
                },
              },
            }}
          />

          {/* Row 1.5: Status message */}
          <Box sx={{ textAlign: 'center', minHeight: 22 }}>
            {isSearching ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Checking customer records...
              </Typography>
            ) : phone.length === 10 ? (
              foundCustomer ? (
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
                  ✓ Existing Customer: {foundCustomer.name || 'Walk-in Customer'}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  + New Customer
                </Typography>
              )
            ) : null}
          </Box>

          {/* Row 2: Customer Name - appears on the border once name is found */}
          <TextField
            label={foundCustomer || name ? 'Customer Name' : undefined}
            placeholder={foundCustomer || name ? undefined : 'Customer Name (Optional)'}
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
            InputLabelProps={{
              shrink: Boolean(foundCustomer || name || isNameFocused),
              sx: {
                fontWeight: 600,
                ...(foundCustomer && {
                  color: 'success.main',
                  '&.Mui-focused': { color: 'success.main' },
                }),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(0,0,0,0.04)',
                '& input': { textAlign: 'left' },
                ...(foundCustomer && {
                  '& fieldset': { borderColor: 'success.main' },
                  '&:hover fieldset': { borderColor: 'success.dark' },
                  '&.Mui-focused fieldset': { borderColor: 'success.main' },
                }),
              },
            }}
          />

          {/* Rows 3-6: Numpad */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
            {numpadRows.flat().map((val, idx) => (
              <Button
                key={idx}
                variant="outlined"
                color={val === 'Clear' ? 'error' : 'inherit'}
                onClick={() => {
                  if (typeof val === 'number') handleNumberClick(val);
                  else if (val === 'Clear') handleClear();
                  else handleBackspace();
                }}
                sx={{
                  height: 70,
                  fontSize: val === 'Clear' ? '1.1rem' : '1.8rem',
                  fontWeight: 'bold',
                  borderColor: 'divider',
                  color: val === 'Clear' ? 'error.main' : 'text.primary',
                  '&:hover': { bgcolor: 'action.hover', filter: 'brightness(0.95)' },
                }}
              >
                {val === 'DEL' ? <BackspaceIcon /> : val}
              </Button>
            ))}
          </Box>

          {/* Row 7: Actions */}
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={onClose}
              sx={{
                height: 60,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || phone.length !== 10}
              sx={{
                height: 60,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
                '&.Mui-disabled': {
                  bgcolor: '#e2e8f0 !important',
                  background: '#e2e8f0 !important',
                  color: '#94a3b8 !important',
                },
              }}
            >
              {loading
                ? 'Processing...'
                : foundCustomer
                ? 'Apply Customer'
                : 'Save Customer'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerMobileDialog;
