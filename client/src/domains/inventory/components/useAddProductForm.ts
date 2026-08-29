import { useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import inventoryService from '@/shared/api/inventoryService';
import { getApiErrorMessage, type ApiError } from '@/shared/api/api';
import { limitTwoDecimals } from '@/shared/utils/priceUtils';
import { computePricingSummary } from '@/domains/inventory/components/pricingSummary';
import type { Product } from '@/shared/types/models';

const INITIAL_BATCH = {
  batch_code: '', quantity: '', mrp: '', cost_price: '', selling_price: '',
  wholesaleEnabled: false, wholesalePrice: '', wholesaleMinQty: '', expiryDate: '',
};


/**
 * Batch fields bound to text inputs. Typed `string | number` because they start
 * as '' and are written back as numbers by the discount handlers — the form
 * genuinely holds both, and every read path coerces.
 */
export type BatchFormValue = string | number;

export interface InitialBatchForm {
  batch_code: BatchFormValue;
  quantity: BatchFormValue;
  mrp: BatchFormValue;
  cost_price: BatchFormValue;
  selling_price: BatchFormValue;
  wholesaleEnabled: boolean;
  wholesalePrice: BatchFormValue;
  wholesaleMinQty: BatchFormValue;
  expiryDate: string;
  [key: string]: unknown;
}

export interface AddProductFormState {
  name: string;
  barcodes: string[];
  category: string;
  enableBatchTracking: boolean;
  lowStockWarningEnabled: boolean;
  lowStockThreshold: BatchFormValue;
  initialBatch: InitialBatchForm;
  [key: string]: unknown;
}

const INITIAL_FORM: AddProductFormState = {
  name: '', barcodes: [], category: '',
  enableBatchTracking: false, lowStockWarningEnabled: true, lowStockThreshold: 2,
  initialBatch: { ...INITIAL_BATCH },
};

interface UseAddProductFormArgs {
  showSuccess: (message: string) => void;
  onProductAdded?: () => void;
  mode?: 'add' | 'edit';
  editingProduct?: Product | null;
  onProductUpdated?: () => void;
}

export default function useAddProductForm({
  showSuccess,
  onProductAdded,
  mode = 'add',
  editingProduct = null,
  onProductUpdated,
}: UseAddProductFormArgs) {
  const [formData, setFormData] = useState<AddProductFormState>(INITIAL_FORM);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [barcodeError, setBarcodeError] = useState('');
  const [barcodeChecking, setBarcodeChecking] = useState(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [discountInput, setDiscountInput] = useState('0');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    inventoryService.fetchSummary().then((data) => {
      const categoryCounts = data.data?.categoryCounts || {};
      setExistingCategories(Object.keys(categoryCounts).filter(Boolean).sort());
    }).catch(() => { });
  }, []);

  // Only the fields section 1 (name/category/barcodes) and the low-stock
  // switch in section 3 stay visible in edit mode (AddProductForm hides
  // initial-batch and wholesale sections there) — initialBatch is left at
  // its default since it's neither shown nor submitted for an edit.
  useEffect(() => {
    if (mode === 'edit' && editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        barcodes: editingProduct.barcode ? editingProduct.barcode.split('|').filter(Boolean) : [],
        category: editingProduct.category || '',
        enableBatchTracking: !!editingProduct.batchTrackingEnabled,
        lowStockWarningEnabled: !!editingProduct.lowStockWarningEnabled,
        lowStockThreshold: editingProduct.lowStockThreshold ?? 2,
        initialBatch: { ...INITIAL_BATCH },
      });
    }
  }, [mode, editingProduct]);

  const toTitleCase = (str: string): string =>
    str.toLowerCase().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'barcode') setBarcodeError('');
    setSubmitError('');
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });

    let finalValue = value;
    if (
      typeof value === 'string' &&
      [
        'initialBatch.mrp',
        'initialBatch.cost_price',
        'initialBatch.selling_price',
        'initialBatch.wholesalePrice',
      ].includes(name)
    ) {
      finalValue = limitTwoDecimals(value);
    }

    if (name === 'initialBatch.discount_percent') {
      setDiscountInput(finalValue);
      const val = parseFloat(String(finalValue));
      if (!isNaN(val)) {
        const currentMrp = parseFloat(String(formData.initialBatch.mrp)) || 0;
        const newSelling = currentMrp * (1 - val / 100);
        setFormData((prev) => ({ ...prev, initialBatch: { ...prev.initialBatch, selling_price: Math.max(0, Number(newSelling.toFixed(2))) } }));
      }
      return;
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...(prev[parent] as Record<string, unknown>), [child]: finalValue },
      }));
      if (name === 'initialBatch.mrp' || name === 'initialBatch.selling_price') {
        const m = name === 'initialBatch.mrp' ? parseFloat(String(finalValue)) : parseFloat(String(formData.initialBatch.mrp || 0));
        const s = name === 'initialBatch.selling_price' ? parseFloat(String(finalValue)) : parseFloat(String(formData.initialBatch.selling_price || 0));
        setDiscountInput(m > 0 ? (((m - s) / m) * 100).toFixed(1) : '0');
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: finalValue }));
    }
  };

  const addBarcode = async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return true;
    if (formData.barcodes.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      setBarcodeError('Barcode already added');
      return false;
    }
    setBarcodeChecking(true);
    try {
      try {
        const data = await inventoryService.fetchProductByBarcode(encodeURIComponent(trimmed));
        const existingProduct = data?.product || data;
        const belongsToEditingProduct =
          mode === 'edit' && editingProduct && String(existingProduct?.id) === String(editingProduct.id);
        if (!belongsToEditingProduct) {
          setBarcodeError(`Barcode '${trimmed}' is already associated with product '${existingProduct?.name || 'another product'}'`);
          return false;
        }
      } catch (err) {
        const apiErr = err as ApiError;
        if (!apiErr.response || apiErr.response.status !== 404) {
          setBarcodeError(
            apiErr.response
              ? getApiErrorMessage(err, 'Unable to verify barcode')
              : 'Network Error: Cannot reach server'
          );
          return false;
        }
      }
      setFormData((prev) => ({ ...prev, barcodes: [...prev.barcodes, trimmed] }));
      setManualBarcodeInput('');
      setBarcodeError('');
      return true;
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'inventory-barcode-verify' } });
      setBarcodeError('Unable to verify barcode');
      return false;
    } finally {
      setBarcodeChecking(false);
    }
  };

  const removeBarcode = (index: number) => {
    setFormData((prev) => ({ ...prev, barcodes: prev.barcodes.filter((_, i) => i !== index) }));
    setBarcodeError('');
  };

  const generateBarcode = () => {
    addBarcode(Math.floor(1000000000000 + Math.random() * 9000000000000).toString());
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Product Name is required.';
    }

    if (!formData.category.trim()) {
      errors.category = 'Product Category is required.';
    }

    if (formData.barcodes.length === 0 && !manualBarcodeInput.trim()) {
      setBarcodeError('At least one barcode is required.');
      errors.barcode = 'At least one barcode is required.';
    }

    // Initial-batch and wholesale fields aren't shown (or editable) in edit
    // mode — AddProductForm hides those sections there — so they can't be
    // validated or submitted for an edit.
    if (mode === 'add') {
      const b = formData.initialBatch;
      const mrpStr = String(b.mrp).trim();
      const costStr = String(b.cost_price).trim();
      const sellingStr = String(b.selling_price).trim();
      const qtyStr = String(b.quantity).trim();

      const mrp = Number(b.mrp);
      const costPrice = Number(b.cost_price);
      const sellingPrice = Number(b.selling_price);
      const quantity = Number(b.quantity);

      if (!mrpStr || isNaN(mrp)) {
        errors['initialBatch.mrp'] = 'MRP is required.';
      } else if (mrp < 0) {
        errors['initialBatch.mrp'] = 'MRP must be 0 or greater.';
      }

      if (!costStr || isNaN(costPrice)) {
        errors['initialBatch.cost_price'] = 'Cost Price is required.';
      } else if (costPrice < 0) {
        errors['initialBatch.cost_price'] = 'Cost Price must be 0 or greater.';
      }

      if (!qtyStr || isNaN(quantity)) {
        errors['initialBatch.quantity'] = 'Quantity is required.';
      } else if (quantity < 0) {
        errors['initialBatch.quantity'] = 'Quantity must be 0 or greater.';
      }

      if (!sellingStr || isNaN(sellingPrice)) {
        errors['initialBatch.selling_price'] = 'Selling Price is required.';
      } else if (!isNaN(mrp) && !isNaN(costPrice)) {
        if (sellingPrice < costPrice || sellingPrice > mrp) {
          errors['initialBatch.selling_price'] = 'Selling price must be ≤ MRP & ≥ Cost Price.';
        }
      }

      if (b.wholesaleEnabled) {
        const wPrice = Number(b.wholesalePrice);
        const wQty = Number(b.wholesaleMinQty);
        if (!b.wholesalePrice || String(b.wholesalePrice).trim() === '' || isNaN(wPrice) || wPrice < 0) {
          errors['initialBatch.wholesalePrice'] = 'Wholesale price is required and must be ≥ 0.';
        }
        if (!b.wholesaleMinQty || String(b.wholesaleMinQty).trim() === '' || isNaN(wQty) || wQty < 1) {
          errors['initialBatch.wholesaleMinQty'] = 'Minimum quantity is required and must be ≥ 1.';
        }
      }
    }

    if (formData.lowStockWarningEnabled) {
      const threshold = Number(formData.lowStockThreshold);
      if (formData.lowStockThreshold === '' || isNaN(threshold) || threshold < 0) {
        errors.lowStockThreshold = 'Low stock threshold is required.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (manualBarcodeInput.trim()) {
      const ok = await addBarcode(manualBarcodeInput);
      if (!ok) return;
    }
    if (barcodeChecking || barcodeError) return;

    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'edit') {
        if (!editingProduct?.id) return;

        await inventoryService.updateProduct(editingProduct.id, {
          name: toTitleCase(formData.name),
          barcode: formData.barcodes.length > 0 ? formData.barcodes.join('|') : null,
          category: formData.category,
          lowStockWarningEnabled: formData.lowStockWarningEnabled,
          lowStockThreshold: formData.lowStockWarningEnabled ? Number(formData.lowStockThreshold) : 0,
        });
        await showSuccess('Product updated successfully!');
        setManualBarcodeInput('');
        setFieldErrors({});
        setSubmitError('');
        if (onProductUpdated) onProductUpdated();
        return;
      }

      const b = formData.initialBatch;
      const mrp = Number(b.mrp) || 0, costPrice = Number(b.cost_price) || 0, sellingPrice = Number(b.selling_price) || 0, quantity = Number(b.quantity) || 0;

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
      setFieldErrors({});
      setSubmitError('');
      if (onProductAdded) onProductAdded();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: mode === 'edit' ? 'inventory-update-product' : 'inventory-create-product' } });
      console.error(error);
      if ((error as ApiError).response?.status === 409) {
        const msg = getApiErrorMessage(error, 'Barcode already exists');
        setBarcodeError(msg);
        return;
      }
      setSubmitError(getApiErrorMessage(error, mode === 'edit' ? 'Failed to update product' : 'Failed to add product'));
    }
  };

  // Derived pricing calculations
  const mrp = Number(formData.initialBatch.mrp) || 0;
  const sellingPrice = Number(formData.initialBatch.selling_price) || 0;
  const costPrice = Number(formData.initialBatch.cost_price) || 0;
  const sellingInvalid = sellingPrice < costPrice || sellingPrice > mrp;
  const {
    discountValue, discountPercent, marginValue, marginPercent,
    vendorDiscountValue, vendorDiscountPercent,
  } = computePricingSummary(mrp, costPrice, sellingPrice);

  return {
    formData, setFormData,
    existingCategories,
    barcodeError, barcodeChecking,
    manualBarcodeInput, setManualBarcodeInput,
    discountInput, fieldErrors, setFieldErrors, submitError, setSubmitError,
    handleChange, addBarcode, removeBarcode, generateBarcode, handleSubmit,
    sellingInvalid, discountValue, discountPercent, marginValue, marginPercent,
    vendorDiscountValue, vendorDiscountPercent,
  };
}
