import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CartTable from '@/domains/pos/components/CartTable';
import type { CartItem } from '@/domains/pos/types';

const baseItem: CartItem = {
  product_id: 1,
  batch_id: 101,
  name: 'Test Product',
  price: 12.0,
  sellingPrice: 12.0,
  mrp: 15.0,
  quantity: 1,
  max_quantity: 50,
  costPrice: 8.0,
  isOnSale: false,
  isFree: false,
  wholesaleEnabled: true,
  wholesaleMinQty: 6,
  wholesalePrice: 9.5,
};

describe('CartTable Wholesale UX', () => {
  it('renders "Add 6 Units (₹9.5 per unit)" button when quantity is below wholesale minimum', () => {
    render(
      <CartTable
        cart={[baseItem]}
        onUpdateQuantity={vi.fn()}
        onSetQuantity={vi.fn()}
        onRemoveFromCart={vi.fn()}
        onQuantityClick={vi.fn()}
        lastAddedItemId={null}
      />
    );

    const wholesaleBtn = screen.getByRole('button', {
      name: /Add 6 Units \(₹9\.50 \/ unit\)/i,
    });
    expect(wholesaleBtn).toBeInTheDocument();
    expect(wholesaleBtn).toBeEnabled();
  });

  it('calls onSetQuantity with the wholesale minimum when the button is clicked', async () => {
    const onSetQuantity = vi.fn();
    const user = userEvent.setup();

    render(
      <CartTable
        cart={[baseItem]}
        onUpdateQuantity={vi.fn()}
        onSetQuantity={onSetQuantity}
        onRemoveFromCart={vi.fn()}
        onQuantityClick={vi.fn()}
        lastAddedItemId={null}
      />
    );

    const wholesaleBtn = screen.getByRole('button', {
      name: /Add 6 Units \(₹9\.50 \/ unit\)/i,
    });
    await user.click(wholesaleBtn);

    expect(onSetQuantity).toHaveBeenCalledWith(101, 6);
  });

  it('renders WHOLESALE APPLIED chip and strikethrough price when quantity is at or above minimum', () => {
    const wholesaleActiveItem: CartItem = {
      ...baseItem,
      quantity: 6,
      price: 9.5,
    };

    render(
      <CartTable
        cart={[wholesaleActiveItem]}
        onUpdateQuantity={vi.fn()}
        onSetQuantity={vi.fn()}
        onRemoveFromCart={vi.fn()}
        onQuantityClick={vi.fn()}
        lastAddedItemId={null}
      />
    );

    expect(
      screen.queryByRole('button', { name: /Add 6 Units/i })
    ).not.toBeInTheDocument();

    expect(screen.getByText('WHOLESALE APPLIED')).toBeInTheDocument();
    expect(screen.getByText('₹9.50/unit')).toBeInTheDocument();
    expect(
      screen.queryByText(/Wholesale Applied: 6 units/i)
    ).not.toBeInTheDocument();
  });

  it('disables the button when stock is less than wholesale minimum', () => {
    const lowStockItem: CartItem = {
      ...baseItem,
      max_quantity: 4,
    };

    render(
      <CartTable
        cart={[lowStockItem]}
        onUpdateQuantity={vi.fn()}
        onSetQuantity={vi.fn()}
        onRemoveFromCart={vi.fn()}
        onQuantityClick={vi.fn()}
        lastAddedItemId={null}
      />
    );

    const wholesaleBtn = screen.getByRole('button', {
      name: /Add 6 Units \(₹9\.50 \/ unit\)/i,
    });
    expect(wholesaleBtn).toBeDisabled();
  });
});
