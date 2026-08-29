import React from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import BatchFormFields from '@/domains/inventory/components/BatchFormFields';
import { getBatchFormValidity, type BatchFormData } from '@/domains/inventory/components/batchFormValidation';

interface EditBatchFormProps {
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

const EditBatchForm = ({
  batchTrackingEnabled,
  formData,
  discountInput,
  onChange,
  submitted,
  errorMsg,
  isSaving,
  onCancel,
  onSave,
}: EditBatchFormProps) => {
  const validity = getBatchFormValidity(formData, { quantityMustBePositive: false });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: '6px',
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
        <EditIcon sx={{ fontSize: 16, color: '#2563eb' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e40af', fontSize: '0.75rem' }}>
          Edit Batch Details
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
          {isSaving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Save Details'}
        </Button>
      </Box>
    </Paper>
  );
};

export default EditBatchForm;
