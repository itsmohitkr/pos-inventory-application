import { computePurchaseFinancials } from '../../src/domains/purchase/purchaseFinancials';

describe('computePurchaseFinancials', () => {
  it('marks a purchase with no payments as Unpaid, with the full amount due', () => {
    const result = computePurchaseFinancials({ totalAmount: 1000, payments: [] });

    expect(result.totalPaid).toBe(0);
    expect(result.dueAmount).toBe(1000);
    expect(result.paymentStatus).toBe('Unpaid');
  });

  it('marks a fully paid purchase as Paid, with zero due', () => {
    const result = computePurchaseFinancials({
      totalAmount: 1000,
      payments: [{ amount: 400 }, { amount: 600 }],
    });

    expect(result.totalPaid).toBe(1000);
    expect(result.dueAmount).toBe(0);
    expect(result.paymentStatus).toBe('Paid');
  });

  it('marks a partially paid purchase as Due, with the remainder outstanding', () => {
    const result = computePurchaseFinancials({
      totalAmount: 1000,
      payments: [{ amount: 300 }],
    });

    expect(result.totalPaid).toBe(300);
    expect(result.dueAmount).toBe(700);
    expect(result.paymentStatus).toBe('Due');
  });

  it('never reports a negative due amount when overpaid', () => {
    const result = computePurchaseFinancials({
      totalAmount: 1000,
      payments: [{ amount: 1200 }],
    });

    expect(result.totalPaid).toBe(1200);
    expect(result.dueAmount).toBe(0);
    expect(result.paymentStatus).toBe('Paid');
  });

  it('treats a zero-total purchase with no payments as Paid', () => {
    const result = computePurchaseFinancials({ totalAmount: 0, payments: [] });

    expect(result.dueAmount).toBe(0);
    expect(result.paymentStatus).toBe('Paid');
  });
});
