import { useState } from 'react';
import { limitTwoDecimals } from '@/shared/utils/priceUtils';
import { EMPTY_BATCH_FORM, type BatchFormData } from '@/domains/inventory/components/batchFormValidation';

/**
 * Form state + change handling for one batch form (New Batch or Edit Batch
 * Details). Previously duplicated as handleAddBatchFormChange/
 * handleEditFormChange — byte-for-byte identical logic operating on
 * parallel state — now shared by instantiating this hook twice.
 */
export const useBatchFormState = () => {
  const [formData, setFormData] = useState<BatchFormData>(EMPTY_BATCH_FORM);
  const [discountInput, setDiscountInput] = useState('0');
  /** Set true on the first save attempt, so wholesale required-field
   * errors only show once the user has tried to submit (matching the
   * deleted AddStockDialog's formSubmitted-gated showErrors behavior). */
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (name: string, value: string | boolean) => {
    let finalValue: string | boolean | number = value;
    if (
      typeof value === 'string' &&
      ['mrp', 'costPrice', 'sellingPrice', 'wholesalePrice'].includes(name)
    ) {
      finalValue = limitTwoDecimals(value);
    }

    if (name === 'discount_percent') {
      setDiscountInput(String(finalValue));
      const val = parseFloat(String(finalValue));
      if (!isNaN(val)) {
        const m = parseFloat(String(formData.mrp)) || 0;
        const newS = m * (1 - val / 100);
        setFormData((prev) => ({
          ...prev,
          sellingPrice: Math.max(0, Number(newS.toFixed(2))),
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    if (name === 'mrp' || name === 'sellingPrice') {
      const m = name === 'mrp' ? parseFloat(String(finalValue)) : parseFloat(String(formData.mrp || 0));
      const s =
        name === 'sellingPrice' ? parseFloat(String(finalValue)) : parseFloat(String(formData.sellingPrice || 0));
      if (m > 0) {
        setDiscountInput((((m - s) / m) * 100).toFixed(1));
      } else {
        setDiscountInput('0');
      }
    }
  };

  const reset = (next: BatchFormData = EMPTY_BATCH_FORM, discount = '0') => {
    setFormData(next);
    setDiscountInput(discount);
    setSubmitted(false);
  };

  return { formData, setFormData, discountInput, handleChange, reset, submitted, setSubmitted };
};
