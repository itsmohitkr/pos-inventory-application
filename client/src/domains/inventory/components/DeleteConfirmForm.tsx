import type { Batch } from '@/shared/types/models';
import React from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material';
import { WarningOutlined as WarningIcon } from '@mui/icons-material';

interface DeleteConfirmFormProps {
  batch: Batch;
  errorMsg: string | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmForm = ({ batch, errorMsg, isDeleting, onCancel, onConfirm }: DeleteConfirmFormProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.25,
      borderRadius: '6px',
      bgcolor: '#fef2f2',
      border: '1px solid #fecaca',
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
        <WarningIcon sx={{ fontSize: 16, color: '#dc2626' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#991b1b', fontSize: '0.75rem' }}>
          Delete Batch {batch.batchCode ? `(${batch.batchCode})` : `#${batch.id}`}?
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: '#b91c1c', fontSize: '0.72rem', fontWeight: 600 }}>
        Current stock: {batch.quantity} units
      </Typography>
    </Box>

    <Typography variant="caption" sx={{ color: '#7f1d1d', fontSize: '0.72rem' }}>
      This action cannot be undone. If it has sales history, the batch will be retired rather than erased. Continue?
    </Typography>

    {errorMsg && (
      <Alert severity="error" sx={{ py: 0.25, px: 1, fontSize: '0.72rem' }}>
        {errorMsg}
      </Alert>
    )}

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
        color="error"
        onClick={onConfirm}
        disabled={isDeleting}
        sx={{
          textTransform: 'none',
          fontSize: '0.75rem',
          fontWeight: 700,
          bgcolor: '#dc2626',
          '&:hover': { bgcolor: '#b91c1c' },
          borderRadius: '6px',
          height: 28,
          px: 1.5,
        }}
      >
        {isDeleting ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Confirm Delete'}
      </Button>
    </Box>
  </Paper>
);

export default DeleteConfirmForm;
