import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { Backspace as BackspaceIcon, Close as CloseIcon } from '@mui/icons-material';

const NumpadDialog = ({ open, onClose, onConfirm, initialValue = '', title = 'Enter Amount' }) => {
  const [value, setValue] = useState(initialValue.toString());

  useEffect(() => {
    if (open) {
      setValue(initialValue.toString());
    }
  }, [open, initialValue]);

  const handleNumberClick = (num) => {
    if (value === '0') {
      setValue(num.toString());
    } else {
      setValue((prev) => prev + num);
    }
  };

  const handleDecimalClick = () => {
    if (!value.includes('.')) {
      setValue((prev) => (prev === '' ? '0.' : prev + '.'));
    }
  };

  const handleBackspace = () => {
    setValue((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleClear = () => {
    setValue('0');
  };

  const handleConfirm = () => {
    onConfirm(parseFloat(value) || 0);
    onClose();
  };

  // Keyboard support
  useEffect(() => {
    if (!open) return;

    const handleGlobalKeyDown = (e) => {
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
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [open, value, onConfirm, onClose]);

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
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box
          sx={{
            bgcolor: 'grey.100',
            color: 'text.primary',
            p: 3,
            borderRadius: 2,
            mb: 3,
            textAlign: 'right',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <Typography variant="h3" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1.5,
            mb: 1.5,
          }}
        >
          {buttons.map((btn, index) => (
            <Button
              key={index}
              fullWidth
              variant="outlined"
              color={btn.color || 'inherit'}
              onClick={btn.action}
              sx={{
                height: 75,
                fontSize:
                  typeof btn.label === 'string' && btn.label.length > 3 ? '1.1rem' : '1.8rem',
                fontWeight: 'bold',
                borderRadius: 2,
                color: btn.color ? `${btn.color}.main` : 'text.primary',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                  filter: 'brightness(0.95)',
                  borderColor: btn.color ? `${btn.color}.main` : 'primary.main',
                },
              }}
            >
              {btn.label}
            </Button>
          ))}
        </Box>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          sx={{
            height: 75,
            fontSize: '1.6rem',
            fontWeight: 'bold',
            borderRadius: 2,
            boxShadow: 4,
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Enter
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default NumpadDialog;
