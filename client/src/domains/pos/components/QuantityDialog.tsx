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
} from '@mui/material';
import {
  Close as CloseIcon,
  FlashOn as FlashOnIcon,
} from '@mui/icons-material';
import { isWholesaleApplicable } from '@/domains/pos/components/cartTableUtils';
import NumpadGrid from '@/domains/pos/components/NumpadGrid';

interface QuantityDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  itemName?: string;
  initialValue?: number;
  wholesaleEnabled?: boolean;
  wholesaleMinQty?: number | null;
  wholesalePrice?: number | null;
  /** Defense in depth: CartTable already prevents opening this dialog for a
   * free item, but the dialog shouldn't rely solely on the caller for that. */
  isFree?: boolean;
}

const QuantityDialog = ({
  open,
  onClose,
  onConfirm,
  itemName,
  initialValue = 1,
  wholesaleEnabled,
  wholesaleMinQty,
  wholesalePrice,
  isFree,
}: QuantityDialogProps) => {
  const [value, setValue] = useState(initialValue.toString());

  useEffect(() => {
    if (!open) return undefined;

    const frame = window.requestAnimationFrame(() => {
      setValue(initialValue.toString());
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, initialValue]);

  const handleNumberClick = useCallback((num: number | string) => {
    setValue((prev) => {
      if (prev === '0') return String(num);
      if (prev.length >= 5) return prev;
      return prev + num;
    });
  }, []);

  const handleClear = useCallback(() => {
    setValue('0');
  }, []);

  const handleBackspace = useCallback(() => {
    setValue((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    const qty = parseInt(value) || 1;
    onConfirm(qty);
    onClose();
  }, [value, onConfirm, onClose]);

  // Keyboard support matching LooseSaleDialog and NumpadDialog
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleNumberClick, handleBackspace, handleClear, handleConfirm, onClose]);

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
        <Box>
          <Typography component="span" variant="h6" sx={{ fontWeight: 'bold' }}>
            Set Quantity
          </Typography>
          {itemName && (
            <Typography
              variant="caption"
              sx={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}
            >
              {itemName}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
          {/* Amount / Quantity Display matching LooseSaleDialog */}
          <TextField
            fullWidth
            value={value}
            InputProps={{
              readOnly: true,
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

          {/* Wholesale quick-action button */}
          {isWholesaleApplicable({ wholesaleEnabled, wholesaleMinQty, wholesalePrice, isFree }) && (
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setValue(wholesaleMinQty!.toString())}
              startIcon={<FlashOnIcon sx={{ fontSize: '16px !important' }} />}
              sx={{
                py: 0.5,
                minHeight: 34,
                borderColor: '#2563eb',
                color: '#2563eb',
                bgcolor: 'transparent !important',
                backgroundColor: 'transparent !important',
                fontWeight: 700,
                fontSize: '0.8rem',
                textTransform: 'none',
                borderWidth: 1.5,
                borderRadius: '6px',
                '&:hover': {
                  borderColor: '#1d4ed8',
                  borderWidth: 1.5,
                  bgcolor: '#2563eb !important',
                  backgroundColor: '#2563eb !important',
                  color: '#ffffff !important',
                  '& .MuiButton-startIcon': {
                    color: '#ffffff !important',
                  },
                },
              }}
            >
              Apply Wholesale: {wholesaleMinQty} Units (₹{wholesalePrice?.toFixed(2)} / unit)
            </Button>
          )}

          {/* 3x4 Numpad Grid matching LooseSaleDialog */}
          <NumpadGrid onDigit={handleNumberClick} onClear={handleClear} onBackspace={handleBackspace} />

          {/* Action Row matching LooseSaleDialog */}
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
              onClick={handleConfirm}
              sx={{
                height: 60,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textTransform: 'none',
              }}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QuantityDialog;
