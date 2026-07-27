import React, { useState, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import inventoryService from '@/shared/api/inventoryService';
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
  showError: (message: string) => void
) => {
  const [editOpen, setEditOpen] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [quickInventoryOpen, setQuickInventoryOpen] = useState(false);
  const [quickInventoryBatch, setQuickInventoryBatch] = useState<Batch | null>(null);
  const [barcodePrintOpen, setBarcodePrintOpen] = useState(false);

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
          showError('Failed to delete product: ' + (error.response?.data?.error || error.message));
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
      'Are you sure you want to delete this batch? This action cannot be undone.'
    );
    if (!confirmed) return;
    try {
      await inventoryService.deleteBatch(batchId);
      fetchProducts();
      fetchSummary();
      setSelectedProductRefresh((value: number) => value + 1);
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'inventory-delete-batch' } });
      showError('Failed to delete batch: ' + (error.response?.data?.error || error.message));
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
  };
};
