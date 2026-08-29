import type { Product } from '@/shared/types/models';
import React from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material';
import { AddCircleOutline as AddStockIcon } from '@mui/icons-material';
import BatchFormFields from '@/domains/inventory/components/BatchFormFields';
import { getBatchFormValidity, type BatchFormData } from '@/domains/inventory/components/batchFormValidation';

interface NewBatchFormProps {
  product?: Product | null;
  batchTrackingEnabled: boolean;
  formData: BatchFormData;
  discountInput: string;
  onChange: (name: string, value: string | boolean) => void;
  submitted: boolean;
  errorMsg: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

const NewBatchForm = ({
  product,
  batchTrackingEnabled,
  formData,
  discountInput,
  onChange,
  submitted,
  errorMsg,
  isSaving,
  onCancel,
  onSave,
}: NewBatchFormProps) => {
  const validity = getBatchFormValidity(formData, { quantityMustBePositive: true });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: '8px',
        bgcolor: '#eff6ff',
        border: '1px solid #bfdbfe',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        animation: 'inlineExpand 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
        '@keyframes inlineExpand': {
          '0%': { opacity: 0, transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <AddStockIcon sx={{ fontSize: 18, color: '#2563eb' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.825rem' }}>
          Create New Batch {product?.name ? `for ${product.name}` : ''}
        </Typography>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ py: 0.25, px: 1, fontSize: '0.72rem' }}>
          {errorMsg}
        </Alert>
      )}

      <BatchFormFields
        formData={formData}
        discountInput={discountInput}
        onChange={onChange}
        batchTrackingEnabled={batchTrackingEnabled}
        validity={validity}
        showErrors={submitted}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0.5 }}>
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
          onClick={onSave}
          disabled={isSaving || validity.formInvalid}
          sx={{
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: 700,
            bgcolor: '#2563eb !important',
            color: '#ffffff !important',
            '&:hover': { bgcolor: '#1d4ed8 !important' },
            '&.Mui-disabled': {
              bgcolor: '#94a3b8 !important',
              color: '#ffffff !important',
            },
            borderRadius: '6px',
            height: 28,
            px: 1.5,
          }}
        >
          {isSaving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Create Batch'}
        </Button>
      </Box>
    </Paper>
  );
};

export default NewBatchForm;
