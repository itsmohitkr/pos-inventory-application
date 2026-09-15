import type { CartItem } from '@/domains/pos/types';

export const getCartRowId = (batchId: number): string => `cart-row-${batchId}`;

export const shouldHighlightCartRow = (
  itemBatchId: number,
  lastAddedItemId: number | null
): boolean => {
  return itemBatchId === lastAddedItemId;
};

export const getCartItemDiscount = (item: CartItem): number => {
  const discountPerUnit = item.mrp - item.price;
  return discountPerUnit * item.quantity;
};

export const getCartItemTotal = (item: CartItem): number => {
  return item.price * item.quantity;
};

/**
 * Single source of truth for "is wholesale pricing applicable to this item,"
 * shared by CartTable.tsx (the cart row's quick-apply button/chip) and
 * QuantityDialog.tsx (the numpad's quick-apply button) — these used to be
 * two separately-written conditions that had already drifted apart (one
 * used loose truthiness on wholesaleMinQty, the other an explicit `> 0`
 * check; only one excluded free items).
 */
export const isWholesaleApplicable = (params: {
  wholesaleEnabled?: boolean;
  wholesaleMinQty?: number | null;
  wholesalePrice?: number | null;
  isFree?: boolean;
}): boolean =>
  Boolean(
    !params.isFree &&
      params.wholesaleEnabled &&
      params.wholesaleMinQty != null &&
      params.wholesaleMinQty > 0 &&
      params.wholesalePrice != null
  );
