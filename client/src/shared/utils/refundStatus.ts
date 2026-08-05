/** The three refund states a sale can be in. */
export type RefundStatus = 'full' | 'partial' | 'none';

/** Minimal shape needed to compute refund status — a subset of SaleItem. */
export interface RefundableItem {
  quantity: number;
  returnedQuantity?: number | null;
}

/** Visual treatment for a refund status chip. */
export interface StatusDisplay {
  label: string;
  color: string;
  bgcolor: string;
}

/**
 * Determines the refund status of a sale based on returned items.
 */
export const getRefundStatus = (items: RefundableItem[] | null | undefined): RefundStatus => {
  if (!items || items.length === 0) return 'none';

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const returnedQty = items.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0);

  if (returnedQty === 0) return 'none';
  if (returnedQty === totalQty) return 'full';
  return 'partial';
};

/**
 * Get status display label and color.
 *
 * Accepts `string` rather than `RefundStatus` because callers may pass a value
 * read from an untyped API response; the `default` branch is the guard for that.
 */
export const getStatusDisplay = (status: RefundStatus | string): StatusDisplay => {
  switch (status) {
    case 'full':
      return {
        label: 'Fully Returned',
        color: '#d32f2f',
        bgcolor: '#ffebee',
      };
    case 'partial':
      return {
        label: 'Partially Returned',
        color: '#ed6c02',
        bgcolor: '#fff3e0',
      };
    case 'none':
      return {
        label: 'Completed',
        color: '#2e7d32',
        bgcolor: '#e8f5e9',
      };
    default:
      return {
        label: 'Unknown',
        color: '#666',
        bgcolor: '#f5f5f5',
      };
  }
};
