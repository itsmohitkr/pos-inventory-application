export const getCartRowId = (batchId) => `cart-row-${batchId}`;

export const shouldHighlightCartRow = (itemBatchId, lastAddedItemId) => {
  return itemBatchId === lastAddedItemId;
};

export const getBatchCodeDisplay = (batchCode) => {
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

export const getCartItemDiscount = (item) => {
  const discountPerUnit = item.mrp - item.price;
  return discountPerUnit * item.quantity;
};

export const getCartItemTotal = (item) => {
  return item.price * item.quantity;
};
