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
  const [editOpen, setEditOpen] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [quickInventoryOpen, setQuickInventoryOpen] = useState(false);
  const [quickInventoryBatch, setQuickInventoryBatch] = useState<Batch | null>(null);
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

  const handleEditClick = useCallback((product: Product) => {
    setCurrentProduct(product);
    setEditOpen(true);
  }, []);

  const handleEditSave = async () => {
    fetchProducts();
    fetchSummary();
    fetchCategories();
    setSelectedProductRefresh((prev: number) => prev + 1);
    setEditOpen(false);
  };

  const handleBatchEditClick = (batch: Batch) => {
    setCurrentBatch({
      ...batch,
      expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : '',
    });
    setBatchEditOpen(true);
  };

  const handleBatchEditSave = async () => {
    fetchProducts();
    fetchSummary();
    setSelectedProductRefresh((value: number) => value + 1);
    setBatchEditOpen(false);
  };

  const handleBatchDelete = async (batchId: number) => {
    const confirmed = await showConfirm(
      'Deleting this batch will remove it from the inventory view. If it still has stock, deletion will be blocked. If it has sales history, the batch will be retired (hidden from inventory) rather than erased — all existing sales, reports, and transaction history stay fully intact. Continue?'
    );
    if (!confirmed) return;
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
      showError('Failed to delete batch: ' + getApiErrorMessage(error));
    }
  };

  const handleAddStock = (product: Product) => {
    setCurrentProduct(product);
    setAddStockOpen(true);
  };

  const handleStockAdded = () => {
    fetchProducts();
    fetchSummary();
    setSelectedProductRefresh((value: number) => value + 1);
  };

  const handleQuickInventoryOpen = (batch: Batch) => {
    setQuickInventoryBatch(batch);
    setQuickInventoryOpen(true);
  };

  const handleQuickInventoryClose = () => setQuickInventoryOpen(false);

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
    editOpen, setEditOpen,
    batchEditOpen, setBatchEditOpen,
    addStockOpen, setAddStockOpen,
    quickInventoryOpen, setQuickInventoryOpen,
    barcodePrintOpen, setBarcodePrintOpen,
    currentProduct, setCurrentProduct,
    currentBatch, setCurrentBatch,
    quickInventoryBatch, setQuickInventoryBatch,
    handleDelete, handleEditClick, handleEditSave,
    handleBatchEditClick, handleBatchEditSave, handleBatchDelete,
    handleAddStock, handleStockAdded,
    handleQuickInventoryOpen, handleQuickInventoryClose,
    handleToggleBatchTracking, isTogglingBatchTracking,
  };
};
