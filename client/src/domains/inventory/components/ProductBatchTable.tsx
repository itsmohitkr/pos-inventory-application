import type { Batch, Product } from '@/shared/types/models';
import React from 'react';
import { Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import BatchCard from '@/domains/inventory/components/BatchCard';
import NewBatchForm from '@/domains/inventory/components/NewBatchForm';
import { useProductBatchTable } from '@/domains/inventory/components/useProductBatchTable';
import { EMPTY_BATCH_FORM } from '@/domains/inventory/components/batchFormValidation';

/** Stable no-op passed to every inactive row's save/change callbacks, so
 * those props stay reference-equal across renders (see BatchCard.tsx's
 * React.memo) even though the real handlers change identity on every
 * keystroke in whichever row is actually active. */
const NOOP = () => {};

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

        {batches.map((batch) => {
          const isRowActive = t.inlineAction?.batchId === batch.id;
          const activeMode = isRowActive ? t.inlineAction!.mode : null;
          const isQuickActive = activeMode === 'quick';
          const isEditActive = activeMode === 'edit';
          const isDeleteActive = activeMode === 'delete';

          return (
            <BatchCard
              key={batch.id}
              batch={batch}
              batchTrackingEnabled={batchTrackingEnabled}
              activeMode={activeMode}
              isJustUpdated={t.justUpdatedBatchId === batch.id}
              onToggleQuick={t.toggleQuick}
              onToggleEdit={t.toggleEdit}
              onToggleDelete={t.toggleDelete}
              onCloseInline={t.closeInline}
              // Quick-stock/edit/delete form state and save handlers below
              // are gated to this row's active mode: an inactive row always
              // gets the same constant/no-op values, so its BatchCard props
              // stay reference-equal across renders (see React.memo in
              // BatchCard.tsx) even while the active row's live values
              // change on every keystroke.
              addQty={isQuickActive ? t.addQty : ''}
              onAddQtyChange={t.setAddQty}
              newCostPrice={isQuickActive ? t.newCostPrice : ''}
              onNewCostPriceChange={t.setNewCostPrice}
              isAveragingEnabled={t.isAveragingEnabled}
              quickErrorMsg={isQuickActive ? t.quickErrorMsg : null}
              isSaving={isQuickActive ? t.isSaving : false}
              onSaveQuick={isQuickActive ? () => t.handleSaveQuickStock(batch) : NOOP}
              editFormData={isEditActive ? t.editForm.formData : EMPTY_BATCH_FORM}
              editDiscountInput={isEditActive ? t.editForm.discountInput : '0'}
              onEditChange={isEditActive ? t.editForm.handleChange : NOOP}
              editSubmitted={isEditActive ? t.editForm.submitted : false}
              editErrorMsg={isEditActive ? t.editErrorMsg : null}
              isSavingEdit={isEditActive ? t.isSavingEdit : false}
              onSaveEdit={isEditActive ? () => t.handleSaveEditBatch(batch) : NOOP}
              deleteErrorMsg={isDeleteActive ? t.deleteErrorMsg : null}
              isDeleting={isDeleteActive ? t.isDeleting : false}
              onConfirmDelete={isDeleteActive ? () => t.handleConfirmDelete(batch.id) : NOOP}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default ProductBatchTable;
