import type { Batch } from '@/shared/types/models';
import React from 'react';
import { Box, Typography, Paper, Button, TextField, Alert, CircularProgress } from '@mui/material';
import { FlashOn as QuickIcon } from '@mui/icons-material';
import { formatPrice, limitTwoDecimals } from '@/shared/utils/priceUtils';
import { blurNumberInputOnWheel } from '@/shared/utils/numberInputScroll';
import { themedFieldSx } from '@/domains/inventory/components/inventoryFormStyles';

const GREEN = '#059669';
const GREEN_BORDER = '#a7f3d0';
const greenFieldSx = themedFieldSx(GREEN, GREEN_BORDER);

interface QuickStockFormProps {
  batch: Batch;
  addQty: string;
  onAddQtyChange: (value: string) => void;
  newCostPrice: string;
  onNewCostPriceChange: (value: string) => void;
  isAveragingEnabled: boolean;
  errorMsg: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

const QuickStockForm = ({
  batch,
  addQty,
  onAddQtyChange,
  newCostPrice,
  onNewCostPriceChange,
  isAveragingEnabled,
  errorMsg,
  isSaving,
  onCancel,
  onSave,
}: QuickStockFormProps) => {
  const addQtyNum = Number(addQty) || 0;
  const currentQty = Number(batch.quantity || 0);
  const currentCost = Number(batch.costPrice || 0);
  const addedCost = isAveragingEnabled && newCostPrice ? Number(newCostPrice) || currentCost : currentCost;
  const calculatedAvgCost =
    isAveragingEnabled && addQtyNum > 0 && currentQty + addQtyNum > 0
      ? (currentQty * currentCost + addQtyNum * addedCost) / (currentQty + addQtyNum)
      : currentCost;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: '6px',
        bgcolor: '#f0fdf4',
        border: '1px solid #a7f3d0',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        animation: 'inlineExpand 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
        '@keyframes inlineExpand': {
          '0%': { opacity: 0, transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <QuickIcon sx={{ fontSize: 16, color: '#059669' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#065f46', fontSize: '0.75rem' }}>
            Quick Stock Addition
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600, fontSize: '0.72rem' }}>
          Current: {batch.quantity} units {addQtyNum > 0 ? `➔ ${batch.quantity + addQtyNum} units` : ''}
        </Typography>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ py: 0.25, px: 1, fontSize: '0.72rem' }}>
          {errorMsg}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap', mt: 1.5 }}>
        <TextField
          size="small"
          type="number"
          label="Add Quantity"
          placeholder="e.g. 10"
          value={addQty}
          onChange={(e) => onAddQtyChange(e.target.value)}
          inputProps={{ onWheel: blurNumberInputOnWheel }}
          autoFocus
          sx={greenFieldSx}
        />

        {isAveragingEnabled && (
          <TextField
            size="small"
            type="number"
            label="New Cost Price (₹)"
            value={newCostPrice}
            onChange={(e) => onNewCostPriceChange(limitTwoDecimals(e.target.value))}
            inputProps={{ onWheel: blurNumberInputOnWheel }}
            sx={greenFieldSx}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pt: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600, fontSize: '0.75rem' }}>
          New Avg Cost: <Box component="span" sx={{ fontWeight: 800, color: '#065f46' }}>₹{formatPrice(calculatedAvgCost)}</Box>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            onClick={onCancel}
            sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={onSave}
            disabled={isSaving}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              bgcolor: '#059669 !important',
              color: '#ffffff !important',
              '&:hover': { bgcolor: '#047857 !important' },
              '&.MuiButton-contained': { bgcolor: '#059669 !important', color: '#ffffff !important' },
              '&.MuiButton-containedSuccess': { bgcolor: '#059669 !important', color: '#ffffff !important' },
              '&.Mui-disabled': {
                bgcolor: '#94a3b8 !important',
                color: '#ffffff !important',
              },
              borderRadius: '6px',
              height: 28,
              px: 1.5,
            }}
          >
            {isSaving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Update Stock'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default QuickStockForm;
