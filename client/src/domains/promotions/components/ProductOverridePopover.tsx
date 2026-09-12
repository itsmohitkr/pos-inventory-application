import { Popover, Box, Typography, Stack, TextField, Alert, Button } from '@mui/material';
import type { OverridePopoverState } from '@/domains/promotions/components/useCategorySaleOverrides';

interface ProductOverridePopoverProps {
  overridePopover: OverridePopoverState | null;
  onClose: () => void;
  overrideDiscountInput: string;
  setOverrideDiscountInput: (value: string) => void;
  overrideReasonInput: string;
  setOverrideReasonInput: (value: string) => void;
  overrideError: string | null;
  hasExistingOverride: boolean;
  onRemove: () => void;
  onSave: () => void;
}

/**
 * Admin-gated per-product discount override editor, anchored to the row's
 * override icon in CategorySaleProductPreviewPanel.
 */
const ProductOverridePopover = ({
  overridePopover,
  onClose,
  overrideDiscountInput,
  setOverrideDiscountInput,
  overrideReasonInput,
  setOverrideReasonInput,
  overrideError,
  hasExistingOverride,
  onRemove,
  onSave,
}: ProductOverridePopoverProps) => {
  return (
    <Popover
      open={!!overridePopover}
      anchorEl={overridePopover?.anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      {overridePopover && (
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Admin override — {overridePopover.product.name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
            Bypasses the automatic margin floor. Use only for a deliberate
            pricing decision (e.g. a festival clearance sold below cost).
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              label="Discount Percentage (%)"
              type="number"
              size="small"
              fullWidth
              inputProps={{ min: 0, max: 100, step: 0.5 }}
              value={overrideDiscountInput}
              onChange={(e) => setOverrideDiscountInput(e.target.value)}
            />
            <TextField
              label="Reason"
              placeholder="e.g. Festival clearance, expiring stock"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={overrideReasonInput}
              onChange={(e) => setOverrideReasonInput(e.target.value)}
            />
            {overrideError && (
              <Alert severity="error" sx={{ py: 0 }}>
                {overrideError}
              </Alert>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              {hasExistingOverride ? (
                <Button size="small" color="error" onClick={onRemove}>
                  Remove Override
                </Button>
              ) : (
                <Box />
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={onClose}>
                  Cancel
                </Button>
                <Button size="small" variant="contained" onClick={onSave}>
                  Save
                </Button>
              </Box>
            </Box>
          </Stack>
        </Box>
      )}
    </Popover>
  );
};

export default ProductOverridePopover;
