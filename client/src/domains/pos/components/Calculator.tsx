import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  Box,
  IconButton,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Backspace as BackspaceIcon,
} from '@mui/icons-material';

const Calculator = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [expression, setExpression] = useState('');

  const result = useMemo(() => {
    if (!expression) {
      return '0';
    }
    try {
      if (/[^0-9+\-*/.]/.test(expression)) return '0';
      const evalResult = new Function('return (' + expression + ')')();
      if (typeof evalResult === 'number' && !isNaN(evalResult) && isFinite(evalResult)) {
        const roundedResult = Math.round(evalResult * 10000000) / 10000000;
        return roundedResult.toString();
      }
      return '0';
    } catch {
      return '0';
    }
  }, [expression]);

  const handleInput = useCallback((val: string) => {
    setExpression((prev) => {
      const lastChar = prev.slice(-1);
      const isOperator = ['+', '-', '*', '/'].includes(val);
      const isLastOperator = ['+', '-', '*', '/'].includes(lastChar);

      if (isOperator && isLastOperator) {
        return prev.slice(0, -1) + val;
      }

      if (
        val === '.' &&
        prev
          .split(/[+\-*/]/)
          .pop()
          ?.includes('.')
      ) {
        return prev;
      }

      return prev + val;
    });
  }, []);

  const calculateResult = useCallback(() => {
    if (!expression || result === 'Error' || (result === '0' && expression !== '0')) {
      return;
    }
    setExpression(result.toString());
  }, [expression, result]);

  const handleClear = useCallback(() => {
    setExpression('');
  }, []);

  const handleDelete = useCallback(() => {
    setExpression((prev) => prev.slice(0, -1));
  }, []);

  const handlePercentage = useCallback(() => {
    setExpression((prev) => {
      if (!prev) return prev;

      const parts = prev.split(/([+\-*/])/);
      if (parts.length === 0) return prev;

      const lastNumberStr = parts[parts.length - 1];
      if (!lastNumberStr || isNaN(Number(lastNumberStr))) return prev;

      const lastNumber = parseFloat(lastNumberStr);

      if (parts.length >= 3) {
        const operator = parts[parts.length - 2];
        const previousExpression = parts.slice(0, -2).join('');

        try {
          const previousValue = new Function('return (' + previousExpression + ')')();
          const percentageAmount = (previousValue * lastNumber) / 100;

          if (operator === '+' || operator === '-') {
            return previousExpression + operator + percentageAmount;
          }
          return previousExpression + operator + lastNumber / 100;
        } catch {
          return parts.slice(0, -1).join('') + lastNumber / 100;
        }
      } else {
        return (lastNumber / 100).toString();
      }
    });
  }, []);

  // Global keyboard support matching LooseSaleDialog and NumpadDialog
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculateResult();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      } else if (/[0-9+\-*/.]/.test(e.key)) {
        e.preventDefault();
        handleInput(e.key);
      } else if (e.key === '%') {
        e.preventDefault();
        handlePercentage();
      } else if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleInput('*');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, calculateResult, onClose, handleDelete, handleClear, handleInput, handlePercentage]);

  const buttons = [
    { label: 'C', onClick: handleClear, isClear: true },
    { label: <BackspaceIcon fontSize="small" />, onClick: handleDelete },
    { label: '%', onClick: handlePercentage },
    { label: '÷', onClick: () => handleInput('/') },

    { label: '7', onClick: () => handleInput('7') },
    { label: '8', onClick: () => handleInput('8') },
    { label: '9', onClick: () => handleInput('9') },
    { label: '×', onClick: () => handleInput('*') },

    { label: '4', onClick: () => handleInput('4') },
    { label: '5', onClick: () => handleInput('5') },
    { label: '6', onClick: () => handleInput('6') },
    { label: '-', onClick: () => handleInput('-') },

    { label: '1', onClick: () => handleInput('1') },
    { label: '2', onClick: () => handleInput('2') },
    { label: '3', onClick: () => handleInput('3') },
    { label: '+', onClick: () => handleInput('+') },

    { label: '00', onClick: () => handleInput('00') },
    { label: '0', onClick: () => handleInput('0') },
    { label: '.', onClick: () => handleInput('.') },
    { label: '=', onClick: calculateResult, isEquals: true },
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
          Calculator
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
          {/* Row 1: Amount / Result Display matching LooseSaleDialog TextField */}
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              value={result}
              InputProps={{
                readOnly: true,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(0,0,0,0.06)',
                  fontWeight: '900',
                  fontSize: '2.5rem',
                  color: 'primary.main',
                  pt: expression ? 2.5 : 2,
                  pb: expression ? 1 : 2,
                  '& input': {
                    caretColor: 'transparent',
                    textAlign: 'right',
                    py: 0,
                    pr: 1.5,
                  },
                },
              }}
            />
            {expression && (
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 20,
                  color: 'text.secondary',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {expression.replace(/\*/g, '×').replace(/\//g, '÷')}
              </Typography>
            )}
          </Box>

          {/* Rows 2-6: Keypad Grid matching LooseSaleDialog buttons */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1.5,
              }}
            >
              {buttons.map((btn, index) => {
                if (btn.isEquals) {
                  return (
                    <Button
                      key={index}
                      variant="contained"
                      color="primary"
                      onClick={btn.onClick}
                      sx={{
                        height: 60,
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          filter: 'brightness(0.95)',
                        },
                      }}
                    >
                      {btn.label}
                    </Button>
                  );
                }

                return (
                  <Button
                    key={index}
                    variant="outlined"
                    color={btn.isClear ? 'error' : 'inherit'}
                    onClick={btn.onClick}
                    sx={{
                      height: 60,
                      fontSize:
                        typeof btn.label === 'string' && btn.label.length > 1
                          ? '1.2rem'
                          : '1.6rem',
                      fontWeight: 'bold',
                      borderColor: 'divider',
                      color: btn.isClear ? 'error.main' : 'text.primary',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        filter: 'brightness(0.95)',
                      },
                    }}
                  >
                    {btn.label}
                  </Button>
                );
              })}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
  );
};

export default Calculator;
