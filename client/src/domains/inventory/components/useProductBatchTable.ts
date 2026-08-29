import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import type { Batch, Product } from '@/shared/types/models';
import api, { getApiErrorMessage } from '@/shared/api/api';
import inventoryService from '@/shared/api/inventoryService';
import { getWeightedAverageCostEnabled } from '@/shared/utils/paymentSettings';
import { useBatchFormState } from '@/domains/inventory/components/useBatchFormState';
import { useJustUpdatedFlash } from '@/domains/inventory/components/useJustUpdatedFlash';
import {
  EMPTY_BATCH_FORM,
  getBatchFormValidity,
  getBatchFormErrorMessage,
  type BatchFormData,
} from '@/domains/inventory/components/batchFormValidation';

type InlineMode = 'quick' | 'edit' | 'delete' | 'add';
interface InlineAction {
  batchId: number;
  mode: InlineMode;
}

const batchToFormData = (batch: Batch): BatchFormData => ({
  batchCode: batch.batchCode || '',
  quantity: batch.quantity ?? '',
  mrp: batch.mrp ?? '',
  costPrice: batch.costPrice ?? '',
  sellingPrice: batch.sellingPrice ?? '',
  wholesaleEnabled: batch.wholesaleEnabled || false,
  wholesalePrice: batch.wholesalePrice ?? '',
  wholesaleMinQty: batch.wholesaleMinQty ?? '',
  expiryDate: batch.expiryDate ? batch.expiryDate.split('T')[0] : '',
});

interface UseProductBatchTableArgs {
  product?: Product | null;
  batchTrackingEnabled?: boolean;
  onBatchDelete: (batchId: number) => Promise<void>;
  onBatchUpdated?: () => void;
}

export const useProductBatchTable = ({
  product,
  batchTrackingEnabled = false,
  onBatchDelete,
  onBatchUpdated,
}: UseProductBatchTableArgs) => {
  const [inlineAction, setInlineAction] = useState<InlineAction | null>(null);

  // Weighted average cost setting — a synchronous localStorage read (see
  // shared/utils/paymentSettings.ts), not an API call, and kept live via
  // the same pos-settings-updated event usePOSData.ts listens for. This
  // used to be a one-shot `api.get('/api/settings')` on mount with no
  // live-update, so toggling the setting elsewhere while this panel
  // stayed open (without switching products) never took effect.
  const [isAveragingEnabled, setIsAveragingEnabled] = useState(getWeightedAverageCostEnabled());
  useEffect(() => {
    const handleSettingsUpdated = () => setIsAveragingEnabled(getWeightedAverageCostEnabled());
    window.addEventListener('pos-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('pos-settings-updated', handleSettingsUpdated);
  }, []);

  // Quick Stock form state
  const [addQty, setAddQty] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [quickErrorMsg, setQuickErrorMsg] = useState<string | null>(null);

  // Delete confirmation state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  const editForm = useBatchFormState();
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  const addForm = useBatchFormState();
  const [isSavingAddBatch, setIsSavingAddBatch] = useState(false);
  const [addBatchErrorMsg, setAddBatchErrorMsg] = useState<string | null>(null);

  const { justUpdatedId: justUpdatedBatchId, flash } = useJustUpdatedFlash();

  // Automatically close inline New Batch form if batch tracking is toggled OFF
  useEffect(() => {
    if (!batchTrackingEnabled && inlineAction?.mode === 'add') {
      setInlineAction(null);
      setAddBatchErrorMsg(null);
    }
  }, [batchTrackingEnabled, inlineAction?.mode]);

  const toggleInline = (batchId: number, mode: InlineMode, onOpen?: () => void) => {
    if (inlineAction?.batchId === batchId && inlineAction.mode === mode) {
      setInlineAction(null);
    } else {
      setInlineAction({ batchId, mode });
      onOpen?.();
    }
  };

  const handleToggleInlineAdd = () => {
    toggleInline(0, 'add', () => {
      setAddBatchErrorMsg(null);
      addForm.reset(EMPTY_BATCH_FORM, '0');
    });
  };

  const handleToggleInlineQuick = (batch: Batch) => {
    toggleInline(batch.id, 'quick', () => {
      setAddQty('');
      setNewCostPrice(batch.costPrice ? String(batch.costPrice) : '');
      setQuickErrorMsg(null);
    });
  };

  const handleToggleInlineEdit = (batch: Batch) => {
    toggleInline(batch.id, 'edit', () => {
      setEditErrorMsg(null);
      const m = batch.mrp || 0;
      const s = batch.sellingPrice || 0;
      const initialDiscount = m > 0 ? (((m - s) / m) * 100).toFixed(1) : '0';
      editForm.reset(batchToFormData(batch), initialDiscount);
    });
  };

  const handleToggleInlineDelete = (batch: Batch) => {
    toggleInline(batch.id, 'delete', () => setDeleteErrorMsg(null));
  };

  const closeInline = () => setInlineAction(null);

  const handleSaveAddBatch = async () => {
    setAddBatchErrorMsg(null);
    addForm.setSubmitted(true);
    const validity = getBatchFormValidity(addForm.formData, { quantityMustBePositive: true });
    if (validity.formInvalid) {
      setAddBatchErrorMsg(getBatchFormErrorMessage(validity, addForm.formData, { quantityMustBePositive: true }));
      return;
    }

    setIsSavingAddBatch(true);
    try {
      const productId = product?.id;
      if (!productId) {
        throw new Error('Product context missing');
      }

      const payload = {
        product_id: productId,
        batch_code: addForm.formData.batchCode,
        quantity: Number(addForm.formData.quantity) || 0,
        mrp: Number(addForm.formData.mrp) || 0,
        cost_price: Number(addForm.formData.costPrice) || 0,
        selling_price: Number(addForm.formData.sellingPrice) || 0,
        wholesaleEnabled: addForm.formData.wholesaleEnabled,
        wholesalePrice: addForm.formData.wholesaleEnabled ? Number(addForm.formData.wholesalePrice) || 0 : null,
        wholesaleMinQty: addForm.formData.wholesaleEnabled ? Number(addForm.formData.wholesaleMinQty) || 0 : null,
        expiryDate: addForm.formData.expiryDate ? new Date(addForm.formData.expiryDate) : null,
      };

      const result = await inventoryService.addBatch(payload);
      closeInline();
      if (result?.id) flash(result.id);
      onBatchUpdated?.();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'inline-add-batch-save' } });
      console.error('Failed to create batch:', error);
      setAddBatchErrorMsg(getApiErrorMessage(error, 'Failed to create new batch'));
    } finally {
      setIsSavingAddBatch(false);
    }
  };

  const handleSaveEditBatch = async (batch: Batch) => {
    setEditErrorMsg(null);
    editForm.setSubmitted(true);
    const validity = getBatchFormValidity(editForm.formData, { quantityMustBePositive: false });
    if (validity.formInvalid) {
      setEditErrorMsg(getBatchFormErrorMessage(validity, editForm.formData, { quantityMustBePositive: false }));
      return;
    }

    setIsSavingEdit(true);
    try {
      await inventoryService.updateBatch(batch.id, {
        ...editForm.formData,
        quantity: Number(editForm.formData.quantity),
        mrp: Number(editForm.formData.mrp) || 0,
        costPrice: Number(editForm.formData.costPrice) || 0,
        sellingPrice: Number(editForm.formData.sellingPrice) || 0,
        wholesaleEnabled: editForm.formData.wholesaleEnabled,
        wholesalePrice: editForm.formData.wholesaleEnabled ? Number(editForm.formData.wholesalePrice) || 0 : null,
        wholesaleMinQty: editForm.formData.wholesaleEnabled ? Number(editForm.formData.wholesaleMinQty) || 0 : null,
        expiryDate: editForm.formData.expiryDate ? new Date(editForm.formData.expiryDate) : null,
      });

      closeInline();
      flash(batch.id);
      onBatchUpdated?.();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'inline-edit-batch-save' } });
      console.error('Failed to update batch:', error);
      setEditErrorMsg(getApiErrorMessage(error, 'Failed to update batch details'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSaveQuickStock = async (batch: Batch) => {
    setQuickErrorMsg(null);
    const qtyToAdd = Number(addQty);
    if (!Number.isFinite(qtyToAdd) || qtyToAdd <= 0 || !Number.isInteger(qtyToAdd)) {
      setQuickErrorMsg('Enter a positive whole number quantity');
      return;
    }

    setIsSaving(true);
    try {
      const nextQuantity = Number(batch.quantity || 0) + qtyToAdd;
      const updateData: Record<string, unknown> = { quantity: nextQuantity };

      if (isAveragingEnabled && newCostPrice) {
        const currentCost = Number(batch.costPrice || 0);
        const currentQty = Number(batch.quantity || 0);
        const addedCost = Number(newCostPrice);
        const averagedPrice = (currentQty * currentCost + qtyToAdd * addedCost) / nextQuantity;
        updateData.costPrice = Math.round(averagedPrice * 100) / 100;
      }

      await api.put(`/api/batches/${batch.id}`, updateData);
      closeInline();
      flash(batch.id);
      onBatchUpdated?.();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'inline-quick-inventory-save' } });
      console.error('Failed inline stock update:', error);
      setQuickErrorMsg(getApiErrorMessage(error, 'Failed to update stock quantity'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (batchId: number) => {
    setDeleteErrorMsg(null);
    setIsDeleting(true);
    try {
      await onBatchDelete(batchId);
      closeInline();
    } catch (error) {
      console.error('Inline delete error:', error);
      setDeleteErrorMsg(getApiErrorMessage(error, 'Failed to delete batch'));
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    inlineAction,
    closeInline,
    handleToggleInlineAdd,
    handleToggleInlineQuick,
    handleToggleInlineEdit,
    handleToggleInlineDelete,
    justUpdatedBatchId,

    // Quick stock
    addQty, setAddQty, newCostPrice, setNewCostPrice, isSaving, quickErrorMsg,
    isAveragingEnabled, handleSaveQuickStock,

    // Edit batch
    editForm, isSavingEdit, editErrorMsg, handleSaveEditBatch,

    // Add batch
    addForm, isSavingAddBatch, addBatchErrorMsg, handleSaveAddBatch,

    // Delete
    isDeleting, deleteErrorMsg, handleConfirmDelete,
  };
};
