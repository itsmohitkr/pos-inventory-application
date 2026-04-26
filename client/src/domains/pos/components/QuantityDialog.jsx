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

const QuantityDialog = ({ open, onClose, onConfirm, itemName, initialValue = 1 }) => {
  const [value, setValue] = useState(initialValue.toString());

  useEffect(() => {
    if (!open) return undefined;

    const frame = window.requestAnimationFrame(() => {
      setValue(initialValue.toString());
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, initialValue]);

  const handleNumberClick = (num) => {
    if (value === '0') {
      setValue(num.toString());
    } else {
      setValue((prev) => (prev.length < 5 ? prev + num : prev));
    }
  };

  const handleClear = () => {
    setValue('0');
  };

  const handleConfirm = () => {
    const qty = parseInt(value) || 1;
    onConfirm(qty);
    onClose();
  };

  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'Confirm'];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 },
      }}
    >
      <DialogTitle
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Set Quantity
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {itemName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            bgcolor: 'action.hover',
            p: 3,
            borderRadius: 2,
            mb: 3,
            textAlign: 'center',
            border: '2px solid',
            borderColor: 'primary.main',
          }}
        >
          <Typography
            variant="h3"
            sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main' }}
          >
            {value}
          </Typography>
        </Box>
        <Grid container spacing={1.5}>
          {buttons.map((btn) => (
            <Grid size={{ xs: 4 }} key={btn}>
              <Button
                fullWidth
                variant={btn === 'Confirm' ? 'contained' : 'outlined'}
                color={btn === 'Confirm' ? 'primary' : btn === 'C' ? 'error' : 'inherit'}
                onClick={() => {
                  if (btn === 'C') handleClear();
                  else if (btn === 'Confirm') handleConfirm();
                  else handleNumberClick(btn);
                }}
                sx={{
                  height: 70,
                  fontSize: btn === 'Confirm' ? '1.1rem' : '1.5rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  color:
                    btn === 'Confirm'
                      ? 'primary.contrastText'
                      : btn === 'C'
                        ? 'error.main'
                        : 'text.primary',
                  borderColor:
                    btn === 'Confirm' ? 'primary.main' : btn === 'C' ? 'error.light' : 'divider',
                }}
              >
                {btn}
              </Button>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default QuantityDialog;
