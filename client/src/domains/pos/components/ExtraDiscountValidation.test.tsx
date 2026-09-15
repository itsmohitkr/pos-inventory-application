import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TransactionPanel from '@/domains/pos/components/TransactionPanel';
import NumpadDialog from '@/domains/pos/components/NumpadDialog';
import type { CartItem } from '@/domains/pos/types';

describe('Extra Discount Validation', () => {
  const defaultProps = {
    cart: [],
    discount: 0,
    onVoid: vi.fn(),
    onPay: vi.fn(),
    onPayAndPrint: vi.fn(),
    onRefund: vi.fn(),
    onSelectPaymentMethod: vi.fn(),
    selectedPaymentMethod: 'CASH',
    paymentSettings: null,
    extraDiscountEnabled: true,
    subTotal: 0,
    totalQty: 0,
    totalAmount: 0,
    totalSavings: 0,
    saleSavings: 0,
    changeCalculatorEnabled: false,
    paymentMethodsEnabled: false,
    onPrintLastReceipt: vi.fn(),
    hasLastSale: false,
    isPaying: false,
    receivedAmount: 0,
    setReceivedAmount: vi.fn(),
    setShowNumpad: vi.fn(),
    setShowDiscountNumpad: vi.fn(),
  };

  it('shows red error message and blocks dialog when clicking discount field with empty cart', async () => {
    const setShowDiscountNumpad = vi.fn();
    const user = userEvent.setup();

    render(
      <TransactionPanel
        {...defaultProps}
        cart={[]}
        setShowDiscountNumpad={setShowDiscountNumpad}
      />
    );

    const discountInput = screen.getByPlaceholderText('0.00');
    await user.click(discountInput);

    expect(setShowDiscountNumpad).not.toHaveBeenCalled();
    expect(
      screen.getByText('Please scan a product to apply an extra discount.')
    ).toBeInTheDocument();
  });

  it('opens discount dialog when clicking discount field with items in cart', async () => {
    const setShowDiscountNumpad = vi.fn();
    const user = userEvent.setup();
    const sampleItem: CartItem = {
      product_id: 1,
      batch_id: 1,
      name: 'Item 1',
      price: 100,
      sellingPrice: 100,
      mrp: 120,
      quantity: 1,
      max_quantity: 10,
      costPrice: 80,
      isOnSale: false,
      isFree: false,
    };

    render(
      <TransactionPanel
        {...defaultProps}
        cart={[sampleItem]}
        subTotal={100}
        totalAmount={100}
        setShowDiscountNumpad={setShowDiscountNumpad}
      />
    );

    const discountInput = screen.getByPlaceholderText('0.00');
    await user.click(discountInput);

    expect(setShowDiscountNumpad).toHaveBeenCalledWith(true);
    expect(
      screen.queryByText(
        'Scan first. You need to scan any product, then apply extra discount and then the dialog box will tell if the extra discount amount should be okay.'
      )
    ).not.toBeInTheDocument();
  });

  it('NumpadDialog displays validation status and blocks confirmation when discount exceeds total', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <NumpadDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        initialValue={0}
        maxAllowed={100}
        title="Extra Discount"
      />
    );

    // Initial state shows order total
    expect(screen.getByText('Order total: ₹100.00')).toBeInTheDocument();

    // Type 50 -> Valid discount
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '0' }));

    expect(
      screen.getByText(/✓ Extra discount amount is okay \(New Total: ₹50\.00\)/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter' })).toBeEnabled();

    // Type another 0 -> 500 (exceeds 100)
    await user.click(screen.getByRole('button', { name: '0' }));

    expect(
      screen.getByText(/⚠ Discount cannot exceed order total of ₹100\.00/i)
    ).toBeInTheDocument();
    const enterBtn = screen.getByRole('button', { name: /Amount Too High/i });
    expect(enterBtn).toBeDisabled();
  });
});
