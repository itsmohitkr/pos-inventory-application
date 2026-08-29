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
