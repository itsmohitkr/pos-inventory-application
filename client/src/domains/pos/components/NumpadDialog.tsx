import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Backspace as BackspaceIcon, Close as CloseIcon } from '@mui/icons-material';

interface NumpadDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  /** Seeded into the field; held as a string while editing. */
  initialValue?: string | number;
  title?: string;
  maxAllowed?: number;
  allowPercentageToggle?: boolean;
}

const NumpadDialog = ({
  open,
  onClose,
  onConfirm,
  initialValue = '',
  title = 'Enter Amount',
  maxAllowed,
  allowPercentageToggle,
}: NumpadDialogProps) => {
  // Percentage-mode availability is driven solely by this explicit flag, not
  // by matching the dialog's display title — a title change (i18n, copy
  // tweak) must not silently toggle this behavior on or off.
  const isDiscount = Boolean(allowPercentageToggle);
  const [discountMode, setDiscountMode] = useState<'amount' | 'percentage'>('amount');
  const [value, setValue] = useState(initialValue.toString());

  useEffect(() => {
    if (!open) return undefined;

    const frame = window.requestAnimationFrame(() => {
      setValue(initialValue.toString());
      setDiscountMode('amount');
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, initialValue]);

  const total = maxAllowed || 0;
  const numericVal = parseFloat(value) || 0;

  // Accurate discount amount calculation
  const discountAmount =
    discountMode === 'percentage'
      ? Math.round(((total * numericVal) / 100) * 100) / 100
      : numericVal;

  const isOverLimit =
    discountMode === 'percentage'
      ? numericVal > 100
      : total > 0 && numericVal > total;

  const isValidDiscount = total > 0 && numericVal > 0 && !isOverLimit;

  const handleModeToggle = useCallback(
    (_e: React.MouseEvent<HTMLElement>, newMode: 'amount' | 'percentage' | null) => {
      if (!newMode || newMode === discountMode) return;
      const currentNum = parseFloat(value) || 0;

      if (newMode === 'percentage') {
        // Converting from Rupee amount to Percentage
        if (currentNum > 0 && total > 0) {
          const pct = Math.round(((currentNum / total) * 100) * 100) / 100;
          setValue(pct > 100 ? '100' : pct.toString());
        } else {
          setValue('0');
        }
      } else {
        // Converting from Percentage to Rupee amount
        if (currentNum > 0 && total > 0) {
          const amt = Math.round(((total * currentNum) / 100) * 100) / 100;
          setValue(amt.toString());
        } else {
          setValue('0');
        }
      }
      setDiscountMode(newMode);
    },
    [discountMode, value, total]
  );

  const handleNumberClick = useCallback((num: string) => {
    setValue((prev) => (prev === '0' ? num.toString() : prev + num));
  }, []);

  const handleDecimalClick = useCallback(() => {
    setValue((prev) => (prev.includes('.') ? prev : prev === '' ? '0.' : prev + '.'));
  }, []);

  const handleBackspace = useCallback(() => {
    setValue((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  }, []);

  const handleClear = useCallback(() => {
    setValue('0');
  }, []);

  const handleConfirm = useCallback(() => {
    if (isOverLimit) return;
    onConfirm(discountAmount);
    onClose();
  }, [isOverLimit, discountAmount, onConfirm, onClose]);

  // Keyboard support
  useEffect(() => {
    if (!open) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumberClick(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleDecimalClick();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      } else if (e.key === '%' && isDiscount) {
        e.preventDefault();
        handleModeToggle({} as any, 'percentage');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    open,
    handleNumberClick,
    handleDecimalClick,
    handleBackspace,
    handleConfirm,
    handleClear,
    onClose,
    isDiscount,
    handleModeToggle,
  ]);

  const buttons = [
    { label: '1', action: () => handleNumberClick('1') },
    { label: '2', action: () => handleNumberClick('2') },
    { label: '3', action: () => handleNumberClick('3') },
    { label: '4', action: () => handleNumberClick('4') },
    { label: '5', action: () => handleNumberClick('5') },
    { label: '6', action: () => handleNumberClick('6') },
    { label: '7', action: () => handleNumberClick('7') },
    { label: '8', action: () => handleNumberClick('8') },
    { label: '9', action: () => handleNumberClick('9') },
    { label: '.', action: handleDecimalClick },
    { label: '0', action: () => handleNumberClick('0') },
    { label: 'Clear', action: handleClear, color: 'error' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          border: '1px solid #e2e8f0',
        },
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
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* Discount Mode Toggle - Vibrant Blue on soft gray track */}
          {isDiscount && (
            <ToggleButtonGroup
              value={discountMode}
              exclusive
              onChange={handleModeToggle}
              fullWidth
              size="small"
              sx={{
                bgcolor: '#f1f5f9',
                p: 0.5,
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                gap: 0.5,
                '& .MuiToggleButtonGroup-grouped': {
                  border: 'none !important',
                  borderRadius: '8px !important',
                },
                '& .MuiToggleButton-root': {
                  py: 1,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  color: '#64748b',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                  '&.Mui-selected': {
                    bgcolor: '#2563eb !important',
                    color: '#ffffff !important',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                    '&:hover': {
                      bgcolor: '#1d4ed8 !important',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="amount">₹ Rupee Discount</ToggleButton>
              <ToggleButton value="percentage">% Percentage Discount</ToggleButton>
            </ToggleButtonGroup>
          )}

          {/* Row 1: Amount / Percentage Display matching LooseSaleDialog */}
          <TextField
            fullWidth
            value={value}
            InputProps={{
              readOnly: true,
              startAdornment:
                discountMode === 'amount' ? (
                  <Typography
                    sx={{ mr: 1, fontWeight: '900', fontSize: '1.8rem', color: 'primary.main' }}
                  >
                    ₹
                  </Typography>
                ) : undefined,
              endAdornment:
                discountMode === 'percentage' ? (
                  <Typography
                    sx={{ ml: 1, fontWeight: '900', fontSize: '1.8rem', color: 'primary.main' }}
                  >
                    %
                  </Typography>
                ) : undefined,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(0,0,0,0.06)',
                fontWeight: '900',
                fontSize: '2.5rem',
                color: 'primary.main',
                '& input': { caretColor: 'transparent', textAlign: 'center', py: 2 },
              },
            }}
          />

          {maxAllowed != null && (
            <Box sx={{ textAlign: 'center', minHeight: 22 }}>
              {isOverLimit && (
                <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700 }}>
                  {discountMode === 'percentage'
                    ? '⚠ Percentage discount cannot exceed 100%'
                    : `⚠ Discount cannot exceed order total of ₹${maxAllowed.toFixed(2)}`}
                </Typography>
              )}
              {isValidDiscount && (
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
                  {discountMode === 'percentage'
                    ? `✓ ${numericVal}% discount = ₹${discountAmount.toFixed(2)} off (New Total: ₹${(total - discountAmount).toFixed(2)})`
                    : `✓ Extra discount amount is okay (New Total: ₹${(total - discountAmount).toFixed(2)})`}
                </Typography>
              )}
              {numericVal === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Order total: ₹{maxAllowed.toFixed(2)}
                </Typography>
              )}
            </Box>
          )}

          {/* Rows 2-5: Numpad Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1.5,
            }}
          >
            {buttons.map((btn, index) => (
              <Button
                key={index}
                variant="outlined"
                color={btn.color === 'error' ? 'error' : 'inherit'}
                onClick={btn.action}
                sx={{
                  height: 60,
                  fontSize:
                    typeof btn.label === 'string' && btn.label.length > 1 ? '1.2rem' : '1.6rem',
                  fontWeight: 'bold',
                  borderColor: 'divider',
                  color: btn.color === 'error' ? 'error.main' : 'text.primary',
                  '&:hover': { bgcolor: 'action.hover', filter: 'brightness(0.95)' },
                }}
              >
                {btn.label}
              </Button>
            ))}
          </Box>

          {/* Row 6: Actions matching LooseSaleDialog layout */}
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
              disabled={isOverLimit}
              color={isOverLimit ? 'error' : 'primary'}
              onClick={handleConfirm}
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
              {isOverLimit
                ? discountMode === 'percentage'
                  ? 'Percentage Too High'
                  : 'Amount Too High'
                : 'Enter'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default NumpadDialog;
