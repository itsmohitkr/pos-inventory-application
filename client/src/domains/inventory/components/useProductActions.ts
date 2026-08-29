import React, { useState, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import inventoryService from '@/shared/api/inventoryService';
import { getApiErrorMessage } from '@/shared/api/api';
import type { Batch, Product } from '@/shared/types/models';

export const useProductActions = (
  fetchProducts: () => void,
  fetchSummary: () => void,
  fetchCategories: () => void,
  setSelectedProduct: (product: Product | null) => void,
  setSelectedProductDetails: (details: Product | null) => void,
  /** Bumped to force the detail panel to refetch its batches. */
  setSelectedProductRefresh: React.Dispatch<React.SetStateAction<number>>,
  showConfirm: (message: string, title?: string) => Promise<boolean> | boolean,
  showError: (message: string) => void,
  /** Auto-dismissing toast, not a blocking dialog — for confirmations that
   * don't need to interrupt the user (e.g. after they already confirmed the
   * action itself via showConfirm). */
  showNotification: (message: string) => void
) => {
  const [barcodePrintOpen, setBarcodePrintOpen] = useState(false);
  const [isTogglingBatchTracking, setIsTogglingBatchTracking] = useState(false);

  const handleDelete = useCallback(
    async (id: number) => {
      const confirmed = await showConfirm(
        'Deleting this product will also delete all associated batches and related data. This action cannot be undone. Are you sure you want to continue?'
      );
      if (confirmed) {
        try {
          await inventoryService.deleteProduct(id);
          setSelectedProduct(null);
          setSelectedProductDetails(null);
          fetchProducts();
          fetchSummary();
        } catch (error) {
          Sentry.captureException(error, { tags: { feature: 'inventory-delete-product' } });
          showError('Failed to delete product: ' + getApiErrorMessage(error));
        }
      }
    },
    [fetchProducts, fetchSummary, setSelectedProduct, setSelectedProductDetails, showConfirm, showError]
  );

  // Editing a product (name, category, barcodes, etc.) now happens fully
  // inline via InlineEditProductForm, owned by ProductDetailPanel — this
  // handler no longer opens anything itself. It stays as a stable,
  // no-op-bodied callback because ProductDetailPanel still uses its mere
  // presence (truthy `onEdit`) to decide whether to show the "Edit
  // Product" menu item at all.
  const handleEditClick = useCallback((_product: Product) => {}, []);

  const handleEditSave = async () => {
    fetchProducts();
    fetchSummary();
    fetchCategories();
    setSelectedProductRefresh((prev: number) => prev + 1);
  };

  // Same as handleEditClick: batch editing is fully inline in
  // ProductBatchTable now. Kept as a stable callback since
  // ProductBatchTable still calls onBatchEditClick as part of its own
  // inline-edit toggle.
  const handleBatchEditClick = (_batch: Batch) => {};

  /**
   * Deletes a batch and refreshes, with no confirmation step of its own and
   * no showError modal — for callers (like ProductBatchTable's inline
   * delete card) that already got explicit confirmation from the user and
   * surface failures inline themselves. Rethrows on failure so the
   * caller's own pending/loading state can react (e.g. keep an inline
   * confirm card open, and show the message inline, instead of closing it
   * as if it succeeded).
   */
  const deleteBatchConfirmed = async (batchId: number) => {
    try {
      const result = await inventoryService.deleteBatch(batchId);
      fetchProducts();
      fetchSummary();
      setSelectedProductRefresh((value: number) => value + 1);
      if (result?.data?.softDeleted) {
        showNotification('Batch retired — hidden from inventory, sales history preserved.');
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'inventory-delete-batch' } });
      throw error;
    }
  };

  const handleBatchDelete = async (batchId: number) => {
    const confirmed = await showConfirm(
      'Deleting this batch will remove it from the inventory view. If it still has stock, deletion will be blocked. If it has sales history, the batch will be retired (hidden from inventory) rather than erased — all existing sales, reports, and transaction history stay fully intact. Continue?'
    );
    if (!confirmed) return;
    try {
      await deleteBatchConfirmed(batchId);
    } catch (error) {
      showError('Failed to delete batch: ' + getApiErrorMessage(error));
    }
  };

  // Adding stock to an existing batch is fully inline in ProductBatchTable
  // now ("New Batch" form). Kept as a stable no-op callback since
  // ProductBatchTable also uses onAddStock's mere presence to decide
  // whether to show its "New Batch" button at all.
  const handleAddStock = (_product: Product) => {};

  const handleStockAdded = () => {
    fetchProducts();
    fetchSummary();
    setSelectedProductRefresh((value: number) => value + 1);
  };

  // Quick stock updates are fully inline in ProductBatchTable now. Kept as
  // a stable callback since ProductBatchTable still calls
  // onQuickInventoryOpen as part of its own inline-quick-update toggle.
  const handleQuickInventoryOpen = (_batch: Batch) => {};

  const handleToggleBatchTracking = useCallback(
    async (product: Product, enabled?: boolean) => {
      if (isTogglingBatchTracking) return;
      const targetState = enabled !== undefined ? enabled : !product.batchTrackingEnabled;
      setIsTogglingBatchTracking(true);
      try {
        await inventoryService.updateProduct(product.id, {
          batchTrackingEnabled: targetState,
        });
        fetchProducts();
        fetchSummary();
        setSelectedProductRefresh((prev: number) => prev + 1);
      } catch (error) {
        Sentry.captureException(error, { tags: { feature: 'inventory-toggle-batch-tracking' } });
        console.error('Failed to toggle batch tracking:', error);
        showError('Failed to update batch tracking: ' + getApiErrorMessage(error));
      } finally {
        setIsTogglingBatchTracking(false);
      }
    },
    [isTogglingBatchTracking, fetchProducts, fetchSummary, setSelectedProductRefresh, showError]
  );

  return {
    barcodePrintOpen, setBarcodePrintOpen,
    handleDelete, handleEditClick, handleEditSave,
    handleBatchEditClick, handleBatchDelete, deleteBatchConfirmed,
    handleAddStock, handleStockAdded,
    handleQuickInventoryOpen,
    handleToggleBatchTracking, isTogglingBatchTracking,
  };
};
