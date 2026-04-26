import { useState, useEffect } from 'react';
import inventoryService from '@/shared/api/inventoryService';

const INITIAL_BATCH = {
  batch_code: '', quantity: '', mrp: '', cost_price: '', selling_price: '',
  wholesaleEnabled: false, wholesalePrice: '', wholesaleMinQty: '', expiryDate: '',
};

const INITIAL_FORM = {
  name: '', barcodes: [], category: '',
  enableBatchTracking: false, lowStockWarningEnabled: true, lowStockThreshold: 2,
  initialBatch: { ...INITIAL_BATCH },
};

export default function useAddProductForm({ showError, showSuccess, onProductAdded }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [existingCategories, setExistingCategories] = useState([]);
  const [barcodeError, setBarcodeError] = useState('');
  const [barcodeChecking, setBarcodeChecking] = useState(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [discountInput, setDiscountInput] = useState('0');

  useEffect(() => {
    inventoryService.fetchSummary().then((data) => {
      const categoryCounts = data.data?.categoryCounts || {};
      setExistingCategories(Object.keys(categoryCounts).filter(Boolean).sort());
    }).catch(() => {});
  }, []);

  const toTitleCase = (str) =>
    str.toLowerCase().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'barcode') setBarcodeError('');

    if (name === 'initialBatch.discount_percent') {
      setDiscountInput(value);
      const val = parseFloat(value);
      if (!isNaN(val)) {
        const currentMrp = parseFloat(formData.initialBatch.mrp) || 0;
        const newSelling = currentMrp * (1 - val / 100);
        setFormData((prev) => ({ ...prev, initialBatch: { ...prev.initialBatch, selling_price: Math.max(0, Number(newSelling.toFixed(2))) } }));
      }
      return;
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
      if (name === 'initialBatch.mrp' || name === 'initialBatch.selling_price') {
        const m = name === 'initialBatch.mrp' ? parseFloat(value) : parseFloat(formData.initialBatch.mrp || 0);
        const s = name === 'initialBatch.selling_price' ? parseFloat(value) : parseFloat(formData.initialBatch.selling_price || 0);
        setDiscountInput(m > 0 ? (((m - s) / m) * 100).toFixed(1) : '0');
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addBarcode = async (barcode) => {
    const trimmed = barcode.trim();
    if (!trimmed) return true;
    if (formData.barcodes.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      setBarcodeError('Barcode already added');
      return false;
    }
    setBarcodeChecking(true);
    try {
      try {
        const data = await inventoryService.fetchProductByBarcode(trimmed);
        const name = (data?.product || data)?.name || 'another product';
        setBarcodeError(`Barcode '${trimmed}' is already associated with product '${name}'`);
        return false;
      } catch (err) {
        if (!err.response || err.response.status !== 404) {
          setBarcodeError(err.response?.data?.error || (err.response ? 'Unable to verify barcode' : 'Network Error: Cannot reach server'));
          return false;
        }
      }
      setFormData((prev) => ({ ...prev, barcodes: [...prev.barcodes, trimmed] }));
      setManualBarcodeInput('');
      setBarcodeError('');
      return true;
    } catch {
      setBarcodeError('Unable to verify barcode');
      return false;
    } finally {
      setBarcodeChecking(false);
    }
  };

  const removeBarcode = (index) => {
    setFormData((prev) => ({ ...prev, barcodes: prev.barcodes.filter((_, i) => i !== index) }));
    setBarcodeError('');
  };

  const generateBarcode = () => {
    addBarcode(Math.floor(1000000000000 + Math.random() * 9000000000000).toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (manualBarcodeInput.trim()) {
      const ok = await addBarcode(manualBarcodeInput);
      if (!ok) return;
    }
    if (barcodeChecking || barcodeError) return;
    try {
      const b = formData.initialBatch;
      const mrp = Number(b.mrp) || 0, costPrice = Number(b.cost_price) || 0, sellingPrice = Number(b.selling_price) || 0, quantity = Number(b.quantity) || 0;
      if (mrp < 0 || costPrice < 0 || sellingPrice < 0 || quantity < 0) { await showError('Values must be zero or greater'); return; }
      if (sellingPrice < costPrice || sellingPrice > mrp) return;
      await inventoryService.createProduct({
        name: toTitleCase(formData.name),
        barcode: formData.barcodes.length > 0 ? formData.barcodes.join('|') : null,
        category: formData.category,
        enableBatchTracking: formData.enableBatchTracking,
        lowStockWarningEnabled: formData.lowStockWarningEnabled,
        lowStockThreshold: formData.lowStockWarningEnabled ? Number(formData.lowStockThreshold) : 0,
        initialBatch: { ...b, quantity, mrp, cost_price: costPrice, selling_price: sellingPrice, wholesaleEnabled: b.wholesaleEnabled, wholesalePrice: b.wholesaleEnabled ? Number(b.wholesalePrice) || 0 : null, wholesaleMinQty: b.wholesaleEnabled ? Number(b.wholesaleMinQty) || 0 : null },
      });
      await showSuccess('Product added successfully!');
      setFormData({ ...INITIAL_FORM, initialBatch: { ...INITIAL_BATCH } });
      setManualBarcodeInput('');
      setDiscountInput('0');
      if (onProductAdded) onProductAdded();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        const msg = error.response?.data?.error || 'Barcode already exists';
        setBarcodeError(msg);
        await showError(msg);
        return;
      }
      await showError('Failed to add product: ' + (error.response?.data?.error || error.message));
    }
  };

  // Derived pricing calculations
  const mrp = Number(formData.initialBatch.mrp) || 0;
  const sellingPrice = Number(formData.initialBatch.selling_price) || 0;
  const costPrice = Number(formData.initialBatch.cost_price) || 0;
  const sellingInvalid = sellingPrice < costPrice || sellingPrice > mrp;
  const discountValue = Math.max(0, mrp - sellingPrice);
  const discountPercent = mrp > 0 ? (discountValue / mrp) * 100 : 0;
  const marginValue = sellingPrice - costPrice;
  const marginPercent = sellingPrice > 0 ? (marginValue / sellingPrice) * 100 : 0;
  const vendorDiscountValue = Math.max(0, mrp - costPrice);
  const vendorDiscountPercent = mrp > 0 ? (vendorDiscountValue / mrp) * 100 : 0;

  return {
    formData, setFormData,
    existingCategories,
    barcodeError, barcodeChecking,
    manualBarcodeInput, setManualBarcodeInput,
    discountInput,
    handleChange, addBarcode, removeBarcode, generateBarcode, handleSubmit,
    sellingInvalid, discountValue, discountPercent, marginValue, marginPercent,
    vendorDiscountValue, vendorDiscountPercent,
  };
}
