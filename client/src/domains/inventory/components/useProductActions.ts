import React, { useState, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import inventoryService from '@/shared/api/inventoryService';
import { getApiErrorMessage } from '@/shared/api/api';
import type { Product } from '@/shared/types/models';

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

  const handleEditSave = async () => {
    fetchProducts();
    fetchSummary();
    fetchCategories();
    setSelectedProductRefresh((prev: number) => prev + 1);
  };

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

  const handleStockAdded = () => {
    fetchProducts();
    fetchSummary();
    setSelectedProductRefresh((value: number) => value + 1);
  };

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
    handleDelete, handleEditSave,
    deleteBatchConfirmed,
    handleStockAdded,
    handleToggleBatchTracking, isTogglingBatchTracking,
  };
};
