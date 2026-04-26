import { useState, useCallback } from 'react';
import inventoryService from '@/shared/api/inventoryService';

export const useProductActions = (fetchProducts, fetchSummary, fetchCategories, setSelectedProduct, setSelectedProductDetails, setSelectedProductRefresh, showConfirm, showError) => {
  const [editOpen, setEditOpen] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [quickInventoryOpen, setQuickInventoryOpen] = useState(false);
  const [quickInventoryBatch, setQuickInventoryBatch] = useState(null);
  const [barcodePrintOpen, setBarcodePrintOpen] = useState(false);

  const handleDelete = useCallback(
    async (id) => {
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
          showError('Failed to delete product: ' + (error.response?.data?.error || error.message));
        }
      }
    },
    [fetchProducts, fetchSummary, setSelectedProduct, setSelectedProductDetails, showConfirm, showError]
  );

  const handleEditClick = useCallback((product) => {
    setCurrentProduct(product);
    setEditOpen(true);
  }, []);

  const handleEditSave = async () => {
    fetchProducts();
    fetchSummary();
    fetchCategories();
    setSelectedProductRefresh((prev) => prev + 1);
    setEditOpen(false);
  };

  const handleBatchEditClick = (batch) => {
    setCurrentBatch({
      ...batch,
      expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : '',
    });
    setBatchEditOpen(true);
  };

  const handleBatchEditSave = async () => {
    fetchProducts();
    fetchSummary();
    setSelectedProductRefresh((value) => value + 1);
    setBatchEditOpen(false);
  };

  const handleBatchDelete = async (batchId) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this batch? This action cannot be undone.'
    );
    if (!confirmed) return;
    try {
      await inventoryService.deleteBatch(batchId);
      fetchProducts();
      fetchSummary();
      setSelectedProductRefresh((value) => value + 1);
    } catch (error) {
      showError('Failed to delete batch: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddStock = (product) => {
    setCurrentProduct(product);
    setAddStockOpen(true);
  };

  const handleStockAdded = () => {
    fetchProducts();
    fetchSummary();
    setSelectedProductRefresh((value) => value + 1);
  };

  const handleQuickInventoryOpen = (batch) => {
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
