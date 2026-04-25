import { useState, useEffect, useCallback } from 'react';
import inventoryService from '@/shared/api/inventoryService';

export const useAddStock = ({ product, open, onClose, onStockAdded, showError, showSuccess }) => {
  const [stockData, setStockData] = useState({
    batch_code: '',
    quantity: '',
    mrp: '',
    cost_price: '',
    selling_price: '',
    wholesaleEnabled: false,
    wholesalePrice: '',
    wholesaleMinQty: '',
    expiryDate: '',
  });
  const [discountInput, setDiscountInput] = useState('0');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const isFieldEmpty = (val) => val === undefined || val === null || val.toString().trim() === '';

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      const firstBatch = product?.batches?.[0];
      if (product && !product.batchTrackingEnabled && firstBatch) {
        setStockData((prev) => ({
          ...prev,
          batch_code: '',
          quantity: '',
          mrp: firstBatch.mrp ?? prev.mrp,
          cost_price: firstBatch.costPrice ?? prev.cost_price,
          selling_price: firstBatch.sellingPrice ?? prev.selling_price,
          wholesaleEnabled: firstBatch.wholesaleEnabled ?? false,
          wholesalePrice: firstBatch.wholesalePrice ?? '',
          wholesaleMinQty: firstBatch.wholesaleMinQty ?? '',
          expiryDate: '',
        }));
        const m = firstBatch.mrp || 0;
        const s = firstBatch.sellingPrice || 0;
        if (m > 0) {
          setDiscountInput((((m - s) / m) * 100).toFixed(1));
        }
      } else if (product && product.batchTrackingEnabled) {
        setStockData({
          batch_code: '',
          quantity: '',
          mrp: '',
          cost_price: '',
          selling_price: '',
          wholesaleEnabled: false,
          wholesalePrice: '',
          wholesaleMinQty: '',
          expiryDate: '',
        });
        setDiscountInput('0');
        setFormSubmitted(false);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, product]);

  const handleChange = useCallback((name, value) => {
    if (name === 'discount_percent') {
      setDiscountInput(value);
      const val = parseFloat(value);
      if (!isNaN(val)) {
        setStockData((prev) => {
          const m = parseFloat(prev.mrp) || 0;
          const newS = m * (1 - val / 100);
          return {
            ...prev,
            selling_price: Math.max(0, Number(newS.toFixed(2))),
          };
        });
      }
      return;
    }

    setStockData((prev) => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'mrp' || name === 'selling_price') {
        const m = name === 'mrp' ? parseFloat(value) : parseFloat(prev.mrp || 0);
        const s = name === 'selling_price' ? parseFloat(value) : parseFloat(prev.selling_price || 0);
        if (m > 0) {
          setDiscountInput((((m - s) / m) * 100).toFixed(1));
        } else {
          setDiscountInput('0');
        }
      }
      return newData;
    });
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormSubmitted(true);

    const requiredFields = ['quantity', 'mrp', 'cost_price', 'selling_price'];
    const hasEmptyFields = requiredFields.some(field => isFieldEmpty(stockData[field]));

    if (hasEmptyFields) return;

    if (stockData.wholesaleEnabled) {
      if (isFieldEmpty(stockData.wholesalePrice) || isFieldEmpty(stockData.wholesaleMinQty)) {
        return;
      }
    }

    const mrp = Number(stockData.mrp) || 0;
    const costPrice = Number(stockData.cost_price) || 0;
    const sellingPrice = Number(stockData.selling_price) || 0;
    const quantity = Number(stockData.quantity) || 0;

    if (mrp < 0 || costPrice < 0 || sellingPrice < 0 || quantity < 0) {
      await showError('Values must be zero or greater');
      return;
    }
    if (sellingPrice < costPrice || sellingPrice > mrp) {
      return;
    }

    try {
      const payload = {
        product_id: product.id,
        batch_code: stockData.batch_code,
        quantity: parseInt(stockData.quantity) || 0,
        mrp: parseFloat(stockData.mrp) || 0,
        cost_price: parseFloat(stockData.cost_price) || 0,
        selling_price: parseFloat(stockData.selling_price) || 0,
        wholesaleEnabled: stockData.wholesaleEnabled,
        wholesalePrice: stockData.wholesaleEnabled ? parseFloat(stockData.wholesalePrice) || 0 : null,
        wholesaleMinQty: stockData.wholesaleEnabled ? parseInt(stockData.wholesaleMinQty) || 0 : null,
        expiryDate: stockData.expiryDate || null,
      };

      await inventoryService.addBatch(payload);
      await showSuccess('Stock added successfully!');
      
      setFormSubmitted(false);
      if (onStockAdded) onStockAdded();
      onClose();
    } catch (error) {
      console.error(error);
      await showError('Failed to add stock: ' + (error.response?.data?.error || error.message));
    }
  };

  const mrpVal = Number(stockData.mrp) || 0;
  const sellingPriceVal = Number(stockData.selling_price) || 0;
  const costPriceVal = Number(stockData.cost_price) || 0;

  const calculations = {
    sellingBelowCost: sellingPriceVal < costPriceVal,
    sellingAboveMrp: sellingPriceVal > mrpVal,
    discountValue: Math.max(0, mrpVal - sellingPriceVal),
    discountPercent: mrpVal > 0 ? ((mrpVal - sellingPriceVal) / mrpVal) * 100 : 0,
    marginValue: sellingPriceVal - costPriceVal,
    marginPercent: sellingPriceVal > 0 ? ((sellingPriceVal - costPriceVal) / sellingPriceVal) * 100 : 0,
    vendorDiscountValue: Math.max(0, mrpVal - costPriceVal),
    vendorDiscountPercent: mrpVal > 0 ? ((mrpVal - costPriceVal) / mrpVal) * 100 : 0,
  };

  return {
    stockData,
    discountInput,
    formSubmitted,
    handleChange,
    handleSubmit,
    calculations,
    isFieldEmpty,
  };
};
