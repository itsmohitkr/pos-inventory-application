import { describe, expect, it } from 'vitest';
import { getRefundStatus, getStatusDisplay } from './refundStatus';

describe('refundStatus utils', () => {
  it('returns none when there are no items', () => {
    expect(getRefundStatus([])).toBe('none');
    expect(getRefundStatus(null)).toBe('none');
  });

  it('returns full when all quantities are returned', () => {
    const items = [
      { quantity: 2, returnedQuantity: 2 },
      { quantity: 1, returnedQuantity: 1 },
    ];
    expect(getRefundStatus(items)).toBe('full');
  });

  it('returns partial when only some quantities are returned', () => {
    const items = [
      { quantity: 2, returnedQuantity: 1 },
      { quantity: 1, returnedQuantity: 0 },
    ];
    expect(getRefundStatus(items)).toBe('partial');
  });

  it('maps status values to display labels', () => {
    expect(getStatusDisplay('full').label).toBe('Fully Returned');
    expect(getStatusDisplay('partial').label).toBe('Partially Returned');
    expect(getStatusDisplay('none').label).toBe('Completed');
    expect(getStatusDisplay('other').label).toBe('Unknown');
  });
});
