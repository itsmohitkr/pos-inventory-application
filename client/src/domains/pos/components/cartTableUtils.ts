import type { CartItem } from '@/domains/pos/types';

export const getCartRowId = (batchId: number): string => `cart-row-${batchId}`;

export const shouldHighlightCartRow = (
  itemBatchId: number,
  lastAddedItemId: number | null
): boolean => {
  return itemBatchId === lastAddedItemId;
};

/** How the cart renders a batch code, which is elided when long. */
export interface BatchCodeDisplay {
  type: 'missing' | 'full' | 'short';
  label: string;
  /** Only present for 'short' — the untruncated code, shown on hover. */
  fullLabel?: string;
}

export const getBatchCodeDisplay = (batchCode?: string | null): BatchCodeDisplay => {
  if (!batchCode || batchCode === 'N/A') {
    return { type: 'missing', label: 'No batch' };
  }

  if (batchCode.length <= 8) {
    return { type: 'full', label: batchCode };
  }

  return {
    type: 'short',
    label: `${batchCode.substring(0, 6)}...`,
    fullLabel: batchCode,
  };
};

export const getCartItemDiscount = (item: CartItem): number => {
  const discountPerUnit = item.mrp - item.price;
  return discountPerUnit * item.quantity;
};

export const getCartItemTotal = (item: CartItem): number => {
  return item.price * item.quantity;
};
