import { useState, useEffect } from 'react';
import type {
  CategorySale,
  CategorySaleInput,
  CategorySaleProductOverride,
  CategorySaleProductPreview,
} from '@/domains/promotions/types';
import type { ApiError } from '@/shared/api/api';
import type { ProductOverride } from '@/domains/promotions/components/useCategorySaleOverrides';

interface UseCategorySaleFormArgs {
  open: boolean;
  saleToEdit?: CategorySale | null;
  categories: string[];
  onSave: (saleData: CategorySaleInput) => Promise<void>;
  onClose: () => void;
}

/**
 * Owns the category-sale's own fields (name, category, discount, schedule,
 * status) and submission — validation, date formatting, and talking to
 * onSave. The product-selection/override data it needs to build the payload
 * lives in sibling hooks, so handleSubmit takes it as call-time arguments
 * rather than as a hook dependency.
 */
export function useCategorySaleForm({ open, saleToEdit, categories, onSave, onClose }: UseCategorySaleFormArgs) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<string>('10');
  const [isIndefinite, setIsIndefinite] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'paused'>('active');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (saleToEdit) {
      setName(saleToEdit.name);
      setCategory(saleToEdit.category);
      setDiscountPercentage(String(saleToEdit.discountPercentage));
      setIsIndefinite(saleToEdit.isIndefinite);
      setStartDate(
        saleToEdit.startDate ? new Date(saleToEdit.startDate).toISOString().slice(0, 10) : ''
      );
      setEndDate(
        saleToEdit.endDate ? new Date(saleToEdit.endDate).toISOString().slice(0, 10) : ''
      );
      setStatus(saleToEdit.status);
    } else {
      setName('');
      setCategory(categories[0] || '');
      setDiscountPercentage('10');
      setIsIndefinite(true);
      setStartDate('');
      setEndDate('');
      setStatus('active');
    }
    setFormError(null);
  }, [saleToEdit, open, categories]);

  const handleSubmit = async (
    isDraft: boolean,
    previewProducts: CategorySaleProductPreview[],
    selectedProductIds: Set<number>,
    productOverrides: Map<number, ProductOverride>
  ) => {
    setFormError(null);
    const discount = parseFloat(discountPercentage);

    if (!name.trim()) {
      setFormError('Sale name is required.');
      return;
    }
    if (!category) {
      setFormError('Please select a product category.');
      return;
    }
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      setFormError('Discount percentage must be between 0.01% and 100%.');
      return;
    }
    if (!isIndefinite && !isDraft) {
      if (!startDate || !endDate) {
        setFormError('Start and end dates are required for scheduled sales.');
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setFormError('End date must be on or after start date.');
        return;
      }
    }

    if (selectedProductIds.size === 0 && !isDraft) {
      setFormError('Please select at least one product to include in the sale.');
      return;
    }

    const excludedProductIds = previewProducts
      .map((p) => p.id)
      .filter((id) => !selectedProductIds.has(id));

    // Only overrides on products still selected (an excluded product's
    // override, if any, is dropped rather than sent to the server).
    const productOverridesPayload: CategorySaleProductOverride[] = Array.from(
      productOverrides.entries()
    )
      .filter(([productId]) => selectedProductIds.has(productId))
      .map(([productId, o]) => ({ productId, ...o }));

    setSaving(true);
    try {
      // Default scheduled start to 12:00 AM midnight, end to 11:59:59 PM end of day
      const formattedStartDate =
        !isIndefinite && startDate ? new Date(`${startDate}T00:00:00.000`).toISOString() : null;
      const formattedEndDate =
        !isIndefinite && endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : null;

      await onSave({
        name: name.trim(),
        category,
        discountPercentage: discount,
        isIndefinite,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        status: isDraft ? 'draft' : status === 'draft' ? 'active' : status,
        excludedProductIds,
        productOverrides: productOverridesPayload,
      });
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.response?.status === 401 || apiErr.response?.status === 403) {
        setFormError(
          'This sale includes an admin-approved product override — verify as admin and try again.'
        );
      } else {
        setFormError(apiErr.response?.data?.message || 'Failed to save category sale.');
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    name,
    setName,
    category,
    setCategory,
    discountPercentage,
    setDiscountPercentage,
    isIndefinite,
    setIsIndefinite,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    status,
    saving,
    formError,
    setFormError,
    handleSubmit,
  };
}
