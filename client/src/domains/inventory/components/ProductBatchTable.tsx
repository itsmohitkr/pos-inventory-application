import type { Batch, Product } from '@/shared/types/models';
import React from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import BatchCard from '@/domains/inventory/components/BatchCard';
import NewBatchForm from '@/domains/inventory/components/NewBatchForm';
import { useProductBatchTable } from '@/domains/inventory/components/useProductBatchTable';

interface ProductBatchTableProps {
  batches: Batch[];
  product?: Product | null;
  /** Shows the batch-code and expiry columns when true. */
  batchTrackingEnabled?: boolean;
  /** Must already be confirmed by the caller — this component's own inline
   * confirm card is the confirmation step, so this should reject on
   * failure rather than showing a second confirmation dialog. */
  onBatchDelete: (batchId: number) => Promise<void>;
  onBatchUpdated?: () => void;
}

const ProductBatchTable = ({
  batches,
  product,
  batchTrackingEnabled = false,
  onBatchDelete,
  onBatchUpdated,
}: ProductBatchTableProps) => {
  const t = useProductBatchTable({ product, batchTrackingEnabled, onBatchDelete, onBatchUpdated });

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Section Action Bar */}
      {batchTrackingEnabled && t.inlineAction?.mode !== 'add' && (
        <Box sx={{ py: 0.5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={t.handleToggleInlineAdd}
            sx={{
              height: '30px',
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderColor: 'rgba(37, 99, 235, 0.3)',
              color: '#2563eb',
              bgcolor: 'rgba(37, 99, 235, 0.1)',
              borderRadius: '6px',
              px: 1.25,
              py: 0.25,
              boxShadow: 'none',
              '&:hover': {
                borderColor: '#2563eb',
                bgcolor: 'rgba(37, 99, 235, 0.2)',
              },
            }}
          >
            New Batch
          </Button>
        </Box>
      )}

      {/* Batch Cards & Forms Container */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          overflowY: 'overlay',
          pr: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
          '&::-webkit-scrollbar': { width: '5px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
        }}
      >
        {t.inlineAction?.mode === 'add' && (
          <NewBatchForm
            product={product}
            batchTrackingEnabled={batchTrackingEnabled}
            formData={t.addForm.formData}
            discountInput={t.addForm.discountInput}
            onChange={t.addForm.handleChange}
            submitted={t.addForm.submitted}
            errorMsg={t.addBatchErrorMsg}
            isSaving={t.isSavingAddBatch}
            onCancel={t.closeInline}
            onSave={t.handleSaveAddBatch}
          />
        )}

        {batches.map((batch) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            batchTrackingEnabled={batchTrackingEnabled}
            activeMode={t.inlineAction?.batchId === batch.id ? t.inlineAction.mode : null}
            isJustUpdated={t.justUpdatedBatchId === batch.id}
            onToggleQuick={() => t.handleToggleInlineQuick(batch)}
            onToggleEdit={() => t.handleToggleInlineEdit(batch)}
            onToggleDelete={() => t.handleToggleInlineDelete(batch)}
            onCloseInline={t.closeInline}
            addQty={t.addQty}
            onAddQtyChange={t.setAddQty}
            newCostPrice={t.newCostPrice}
            onNewCostPriceChange={t.setNewCostPrice}
            isAveragingEnabled={t.isAveragingEnabled}
            quickErrorMsg={t.quickErrorMsg}
            isSaving={t.isSaving}
            onSaveQuick={() => t.handleSaveQuickStock(batch)}
            editFormData={t.editForm.formData}
            editDiscountInput={t.editForm.discountInput}
            onEditChange={t.editForm.handleChange}
            editSubmitted={t.editForm.submitted}
            editErrorMsg={t.editErrorMsg}
            isSavingEdit={t.isSavingEdit}
            onSaveEdit={() => t.handleSaveEditBatch(batch)}
            deleteErrorMsg={t.deleteErrorMsg}
            isDeleting={t.isDeleting}
            onConfirmDelete={() => t.handleConfirmDelete(batch.id)}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ProductBatchTable;
