import { useState, useEffect, useCallback } from 'react';
import inventoryService from '@/shared/api/inventoryService';

export const useEditProduct = ({ product, open, onClose, onProductUpdated, showError }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    barcode: '',
    batchTrackingEnabled: false,
    lowStockWarningEnabled: false,
    lowStockThreshold: 2,
  });
  const [batches, setBatches] = useState([]);
  const [existingCategories, setExistingCategories] = useState([]);
  const [barcodes, setBarcodes] = useState([]);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [barcodeError, setBarcodeError] = useState('');
  const [barcodeChecking, setBarcodeChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProductDetails = useCallback(async () => {
    if (!product?.id) return;
    try {
      const data = await inventoryService.fetchProductById(product.id);
      const fullProduct = data.data;
      if (fullProduct) {
        setFormData({
          name: fullProduct.name || '',
          category: fullProduct.category || '',
          barcode: fullProduct.barcode || '',
          batchTrackingEnabled: !!fullProduct.batchTrackingEnabled,
          lowStockWarningEnabled: !!fullProduct.lowStockWarningEnabled,
          lowStockThreshold: fullProduct.lowStockThreshold || 2,
        });
        setBarcodes(fullProduct.barcode ? fullProduct.barcode.split('|').filter(Boolean) : []);
        setBatches(fullProduct.batches || []);
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    }
  }, [product?.id]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await inventoryService.fetchCategories();
        setExistingCategories(data.map((c) => c.name).filter(Boolean).sort());
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    if (open) {
      fetchCategories();
      fetchProductDetails();
      setManualBarcodeInput('');
      setBarcodeError('');
      setIsSaving(false);
    }
  }, [open, fetchProductDetails]);

  const addBarcode = async (barcode) => {
    const trimmed = barcode.trim();
    if (!trimmed) return true;

    if (barcodes.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      setBarcodeError('Barcode already added');
      return false;
    }

    setBarcodeChecking(true);
    try {
      try {
        const data = await inventoryService.fetchProductByBarcode(encodeURIComponent(trimmed));
        const existingProduct = data?.product;
        if (existingProduct && String(existingProduct.id) !== String(product.id)) {
          setBarcodeError(`Barcode '${trimmed}' is already associated with product '${existingProduct.name}'`);
          return false;
        }
      } catch (error) {
        if (error.response?.status === 404) {
          // Safe to add
        } else {
          console.error('Barcode verification failed:', error);
        }
      }

      const updatedBarcodes = [...barcodes, trimmed];
      setBarcodes(updatedBarcodes);
      setManualBarcodeInput('');
      setBarcodeError('');
      setFormData((prev) => ({ ...prev, barcode: updatedBarcodes.join('|') }));
      return true;
    } finally {
      setBarcodeChecking(false);
    }
  };

  const removeBarcode = (index) => {
    const updatedBarcodes = barcodes.filter((_, i) => i !== index);
    setBarcodes(updatedBarcodes);
    setBarcodeError('');
    setFormData((prev) => ({
      ...prev,
      barcode: updatedBarcodes.length > 0 ? updatedBarcodes.join('|') : null,
    }));
  };

  const generateBarcode = () => {
    const newBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    addBarcode(newBarcode);
  };

  const handleSave = async () => {
    if (!product?.id) return;

    if (manualBarcodeInput.trim()) {
      const success = await addBarcode(manualBarcodeInput);
      if (!success) return;
    }

    if (barcodeChecking || barcodeError) return;

    setIsSaving(true);
    try {
      await inventoryService.updateProduct(product.id, formData);
      if (onProductUpdated) onProductUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error.response?.data?.error || error.message;
      if (error.response?.status === 409) {
        setBarcodeError(errorMessage);
        showError('Conflict: ' + errorMessage);
      } else {
        showError('Failed to update product: ' + errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    setFormData,
    batches,
    existingCategories,
    barcodes,
    manualBarcodeInput,
    setManualBarcodeInput,
    barcodeError,
    barcodeChecking,
    isSaving,
    addBarcode,
    removeBarcode,
    generateBarcode,
    handleSave,
    fetchProductDetails,
  };
};
