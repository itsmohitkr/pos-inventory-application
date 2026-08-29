import type { Batch } from '@/shared/types/models';
import React from 'react';
import { Box, Typography, Chip, IconButton, Tooltip, Paper, Divider } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddStockIcon,
  Event as ExpiryIcon,
  Storefront as WholesaleIcon,
} from '@mui/icons-material';
import { formatPrice } from '@/shared/utils/priceUtils';
import QuickStockForm from '@/domains/inventory/components/QuickStockForm';
import EditBatchForm from '@/domains/inventory/components/EditBatchForm';
import DeleteConfirmForm from '@/domains/inventory/components/DeleteConfirmForm';
import { computePricingSummary } from '@/domains/inventory/components/pricingSummary';
import type { BatchFormData } from '@/domains/inventory/components/batchFormValidation';

type InlineMode = 'quick' | 'edit' | 'delete' | 'add' | null;

interface BatchCardProps {
  batch: Batch;
  batchTrackingEnabled: boolean;
  activeMode: InlineMode;
  isJustUpdated: boolean;
  onToggleQuick: (batch: Batch) => void;
  onToggleEdit: (batch: Batch) => void;
  onToggleDelete: (batch: Batch) => void;
  onCloseInline: () => void;

  // Quick stock
  addQty: string;
  onAddQtyChange: (value: string) => void;
  newCostPrice: string;
  onNewCostPriceChange: (value: string) => void;
  isAveragingEnabled: boolean;
  quickErrorMsg: string | null;
  isSaving: boolean;
  onSaveQuick: () => void;

  // Edit batch
  editFormData: BatchFormData;
  editDiscountInput: string;
  onEditChange: (name: string, value: string | boolean) => void;
  editSubmitted: boolean;
  editErrorMsg: string | null;
  isSavingEdit: boolean;
  onSaveEdit: () => void;

  // Delete
  deleteErrorMsg: string | null;
  isDeleting: boolean;
  onConfirmDelete: () => void;
}

const BatchCardImpl = ({
  batch,
  batchTrackingEnabled,
  activeMode,
  isJustUpdated,
  onToggleQuick,
  onToggleEdit,
  onToggleDelete,
  onCloseInline,
  addQty,
  onAddQtyChange,
  newCostPrice,
  onNewCostPriceChange,
  isAveragingEnabled,
  quickErrorMsg,
  isSaving,
  onSaveQuick,
  editFormData,
  editDiscountInput,
  onEditChange,
  editSubmitted,
  editErrorMsg,
  isSavingEdit,
  onSaveEdit,
  deleteErrorMsg,
  isDeleting,
  onConfirmDelete,
}: BatchCardProps) => {
  const isQuickActive = activeMode === 'quick';
  const isEditActive = activeMode === 'edit';
  const isDeleteActive = activeMode === 'delete';

  // Margin matches computePricingSummary's (unclamped) marginPercent exactly,
  // so it's reused from there. Discount is kept as its own inline formula
  // rather than computePricingSummary's discountPercent: that helper clamps
  // negative discounts to 0, which would change what's displayed for any
  // batch where sellingPrice > mrp (pre-existing data, or a batch saved
  // before that combination was validated against) — not a change to make
  // under a "no business logic changes" constraint.
  const { marginPercent } = computePricingSummary(batch.mrp, batch.costPrice, batch.sellingPrice);
  const margin = marginPercent.toFixed(1);
  const discount =
    batch.mrp > 0 ? (((batch.mrp - batch.sellingPrice) / batch.mrp) * 100).toFixed(1) : '0.0';

  return (
    <Paper
      key={batch.id}
      elevation={0}
      data-testid={`inventory-batch-row-${batch.id}`}
      sx={{
        p: 1.5,
        px: 2,
        borderRadius: '8px',
        border: isQuickActive
          ? '1px solid #10b981'
          : isEditActive
          ? '1px solid #2563eb'
          : isDeleteActive
          ? '1px solid #ef4444'
          : isJustUpdated
          ? '1.5px solid #10b981'
          : '1px solid #e2e8f0',
        bgcolor: isJustUpdated ? '#f0fdf4' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor:
            isQuickActive || isJustUpdated
              ? '#10b981'
              : isEditActive
              ? '#2563eb'
              : isDeleteActive
              ? '#ef4444'
              : '#94a3b8',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        },
      }}
    >
      {/* Batch Code & Quantity Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 500 }}>
            Batch ID:
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: '#334155',
              fontSize: '0.75rem',
              bgcolor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              px: 0.85,
              py: 0.25,
              borderRadius: '5px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {batchTrackingEnabled && batch.batchCode ? batch.batchCode : 'Standard Lot'}
          </Typography>

          {isJustUpdated && (
            <Chip
              label="Updated ✓"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 700,
                bgcolor: '#10b981',
                color: '#ffffff',
                borderRadius: '4px',
                px: 0.25,
                boxShadow: '0 1px 4px rgba(16,185,129,0.3)',
              }}
            />
          )}
        </Box>

        <Chip
          label={`${batch.quantity} in stock`}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 700,
            bgcolor: batch.quantity > 0 ? 'rgba(16, 185, 129, 0.12)' : '#fef2f2',
            color: batch.quantity > 0 ? '#059669' : '#ef4444',
            border: 'none',
          }}
        />
      </Box>

      {/* Unified Pricing & Financial Metrics Container */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#f8fafc',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* 5 Financial Metrics Grid: MRP, CP, SP, Margin, Discount */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 0.75,
            p: 1,
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
              MRP
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              ₹{formatPrice(batch.mrp)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
              Cost (CP)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#ea580c', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              ₹{formatPrice(batch.costPrice)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
              Selling (SP)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
              ₹{formatPrice(batch.sellingPrice)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
              Margin
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              {margin}%
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
              Discount
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              {discount}%
            </Typography>
          </Box>
        </Box>

        {/* Integrated Wholesale Rate Banner */}
        {batch.wholesaleEnabled && Boolean(batch.wholesalePrice) && (
          <Box
            sx={{
              bgcolor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              px: 1.25,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <WholesaleIcon sx={{ fontSize: 14, color: '#64748b' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Wholesale Price:
              </Typography>
            </Box>
            <Chip
              label={`Min ${batch.wholesaleMinQty || 1} Units @ ₹${formatPrice(batch.wholesalePrice)}`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 700,
                bgcolor: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '5px',
                px: 0.5,
              }}
            />
          </Box>
        )}
      </Paper>

      <Divider sx={{ borderColor: '#f1f5f9' }} />

      {/* Expiry & Action Buttons Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ExpiryIcon sx={{ fontSize: 13, color: batch.expiryDate ? '#64748b' : '#94a3b8' }} />
          <Typography variant="caption" sx={{ color: batch.expiryDate ? '#475569' : '#94a3b8', fontSize: '0.7rem', fontWeight: 500 }}>
            {batch.expiryDate
              ? `EXP: ${new Date(batch.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
              : 'EXP: N/A'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Tooltip title="Quick Stock Update (Inline)">
            <IconButton
              size="small"
              onClick={() => onToggleQuick(batch)}
              data-testid={`inventory-quick-stock-${batch.id}`}
              aria-label="Quick Stock Update"
              sx={{
                bgcolor: isQuickActive ? '#059669' : 'rgba(16, 185, 129, 0.1)',
                color: isQuickActive ? '#ffffff' : '#059669',
                borderRadius: '6px',
                '&:hover': { bgcolor: isQuickActive ? '#047857' : 'rgba(16, 185, 129, 0.2)' },
              }}
            >
              <AddStockIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit Batch Details (Inline)">
            <IconButton
              size="small"
              onClick={() => onToggleEdit(batch)}
              aria-label="Edit Batch Details"
              sx={{
                bgcolor: isEditActive ? '#2563eb' : 'rgba(37, 99, 235, 0.1)',
                color: isEditActive ? '#ffffff' : '#2563eb',
                borderRadius: '6px',
                '&:hover': { bgcolor: isEditActive ? '#1d4ed8' : 'rgba(37, 99, 235, 0.2)' },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete Batch (Inline)">
            <IconButton
              size="small"
              onClick={() => onToggleDelete(batch)}
              aria-label="Delete Batch"
              sx={{
                border: '1px solid #fecaca',
                color: isDeleteActive ? '#ffffff' : '#ef4444',
                bgcolor: isDeleteActive ? '#dc2626' : '#fef2f2',
                borderRadius: '6px',
                '&:hover': { bgcolor: isDeleteActive ? '#b91c1c' : '#fee2e2' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isQuickActive && (
        <QuickStockForm
          batch={batch}
          addQty={addQty}
          onAddQtyChange={onAddQtyChange}
          newCostPrice={newCostPrice}
          onNewCostPriceChange={onNewCostPriceChange}
          isAveragingEnabled={isAveragingEnabled}
          errorMsg={quickErrorMsg}
          isSaving={isSaving}
          onCancel={onCloseInline}
          onSave={onSaveQuick}
        />
      )}

      {isEditActive && (
        <EditBatchForm
          batchTrackingEnabled={batchTrackingEnabled}
          formData={editFormData}
          discountInput={editDiscountInput}
          onChange={onEditChange}
          submitted={editSubmitted}
          errorMsg={editErrorMsg}
          isSaving={isSavingEdit}
          onCancel={onCloseInline}
          onSave={onSaveEdit}
        />
      )}

      {isDeleteActive && (
        <DeleteConfirmForm
          batch={batch}
          errorMsg={deleteErrorMsg}
          isDeleting={isDeleting}
          onCancel={onCloseInline}
          onConfirm={onConfirmDelete}
        />
      )}
    </Paper>
  );
};

// Memoized so a keystroke in one row's inline form doesn't re-render every
// other row — relies on ProductBatchTable.tsx gating each row's form-state
// and save-handler props to stable constants/no-ops when that row isn't the
// active one (see the comment there), since those are the only props that
// would otherwise change identity on every keystroke regardless of row.
const BatchCard = React.memo(BatchCardImpl);

export default BatchCard;
