import React, { useState, useEffect } from 'react';
import type { CategorySale, CategorySaleProductPreview } from '@/domains/promotions/types';

export interface OverridePopoverState {
  anchorEl: HTMLElement;
  product: CategorySaleProductPreview;
}

export interface ProductOverride {
  discountPercentage: number;
  reason: string;
}

interface UseCategorySaleOverridesArgs {
  open: boolean;
  saleToEdit?: CategorySale | null;
}

/**
 * Owns the admin-gated per-product override map and the popover used to
 * edit it. Draft state only — overrides are sent to the server on submit,
 * same as CategorySaleFormDialog's excludedProductIds.
 */
export function useCategorySaleOverrides({ open, saleToEdit }: UseCategorySaleOverridesArgs) {
  const [productOverrides, setProductOverrides] = useState<Map<number, ProductOverride>>(new Map());
  const [overridePopover, setOverridePopover] = useState<OverridePopoverState | null>(null);
  const [overrideDiscountInput, setOverrideDiscountInput] = useState('');
  const [overrideReasonInput, setOverrideReasonInput] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  useEffect(() => {
    if (saleToEdit) {
      // Re-seeding draft state from a prop whenever the dialog opens for a
      // (possibly different) sale — not derivable at render time, since the
      // draft must stay independently editable afterwards.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProductOverrides(
        new Map(
          (saleToEdit.productOverrides ?? []).map((o) => [
            o.productId,
            { discountPercentage: o.discountPercentage, reason: o.reason },
          ])
        )
      );
    } else {
      setProductOverrides(new Map());
    }
  }, [saleToEdit, open]);

  /**
   * The same "MRP discount, no floor, no comparison to current price" math
   * category-sale.service.ts's previewCategorySaleProducts and
   * sale.service.ts's getCategorySalePrice use for a saved override —
   * mirrored here purely for instant preview feedback while the admin is
   * typing. The server remains authoritative at save/checkout time.
   */
  const computeOverridePreview = (product: CategorySaleProductPreview, discountPct: number) => {
    const basePrice = product.mrp > 0 ? product.mrp : product.currentSellingPrice;
    const price = Math.round(basePrice * (1 - discountPct / 100) * 100) / 100;
    const profitAmount = Math.round((price - product.costPrice) * 100) / 100;
    const profitMargin = price > 0 ? Math.round(((price - product.costPrice) / price) * 1000) / 10 : 0;
    return { price, profitAmount, profitMargin };
  };

  const openOverridePopover = (event: React.MouseEvent<HTMLElement>, product: CategorySaleProductPreview) => {
    const existing = productOverrides.get(product.id);
    setOverrideDiscountInput(existing ? String(existing.discountPercentage) : String(product.discountPercentage));
    setOverrideReasonInput(existing?.reason ?? '');
    setOverrideError(null);
    setOverridePopover({ anchorEl: event.currentTarget, product });
  };

  const closeOverridePopover = () => {
    setOverridePopover(null);
    setOverrideError(null);
  };

  const handleSaveOverride = () => {
    if (!overridePopover) return;
    const pct = parseFloat(overrideDiscountInput);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setOverrideError('Discount percentage must be between 0 and 100.');
      return;
    }
    if (overrideReasonInput.trim().length < 3) {
      setOverrideError('A reason is required (at least 3 characters).');
      return;
    }
    setProductOverrides((prev) => {
      const next = new Map(prev);
      next.set(overridePopover.product.id, {
        discountPercentage: pct,
        reason: overrideReasonInput.trim(),
      });
      return next;
    });
    closeOverridePopover();
  };

  const handleRemoveOverride = () => {
    if (!overridePopover) return;
    setProductOverrides((prev) => {
      const next = new Map(prev);
      next.delete(overridePopover.product.id);
      return next;
    });
    closeOverridePopover();
  };

  return {
    productOverrides,
    setProductOverrides,
    overridePopover,
    overrideDiscountInput,
    setOverrideDiscountInput,
    overrideReasonInput,
    setOverrideReasonInput,
    overrideError,
    computeOverridePreview,
    openOverridePopover,
    closeOverridePopover,
    handleSaveOverride,
    handleRemoveOverride,
  };
}
