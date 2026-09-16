import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseSidebar from '@/domains/expenses/components/ExpenseSidebar';
import PurchasePaymentHistoryCard from '@/domains/expenses/components/PurchasePaymentHistoryCard';
import PurchaseListTab from '@/domains/expenses/components/PurchaseListTab';
import type { Purchase } from '@/domains/expenses/components/expenseTypes';

describe('ExpenseSidebar', () => {
  it('renders Operating Expenses and Inventory Purchases navigation tabs cleanly', () => {
    const onTabChange = vi.fn();
    render(
      <ExpenseSidebar
        activeTab="operating_expenses"
        onTabChange={onTabChange}
      />
    );

    expect(screen.getByText('EXPENSE MANAGEMENT')).toBeInTheDocument();
    expect(screen.getByText('Operating Expenses')).toBeInTheDocument();
    expect(screen.getByText('Inventory Purchases')).toBeInTheDocument();
    // Counts should not be in sidebar
    expect(screen.queryByText('12')).toBeNull();
    expect(screen.queryByText('5')).toBeNull();
  });

  it('triggers onTabChange when a sidebar item is clicked', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    render(
      <ExpenseSidebar
        activeTab="operating_expenses"
        onTabChange={onTabChange}
      />
    );

    await user.click(screen.getByText('Inventory Purchases'));
    expect(onTabChange).toHaveBeenCalledWith('inventory_purchases');
  });
});

describe('PurchasePaymentHistoryCard', () => {
  const samplePurchase: Purchase = {
    id: 101,
    vendor: 'Supreme Spices Ltd',
    totalAmount: 15000,
    totalPaid: 10000,
    dueAmount: 5000,
    paymentStatus: 'Due',
    date: '2026-09-10T10:00:00.000Z',
    note: 'Initial batch delivery',
    payments: [
      {
        id: 1,
        amount: 6000,
        paymentMethod: 'Cash',
        date: '2026-09-10T10:30:00.000Z',
        note: 'Advance',
      },
      {
        id: 2,
        amount: 4000,
        paymentMethod: 'UPI',
        date: '2026-09-12T14:00:00.000Z',
        note: 'Part payment',
      },
    ],
  };

  it('renders purchase information, metrics, and recorded payments', () => {
    const onClose = vi.fn();
    const onOpenPaymentDialog = vi.fn();
    const onOpenPaymentMenu = vi.fn();

    render(
      <PurchasePaymentHistoryCard
        purchase={samplePurchase}
        onClose={onClose}
        onOpenPaymentDialog={onOpenPaymentDialog}
        onOpenPaymentMenu={onOpenPaymentMenu}
      />
    );

    expect(screen.getByText('Payment History')).toBeInTheDocument();
    expect(screen.getByText(/Supreme Spices Ltd/)).toBeInTheDocument();
    expect(screen.getByText('15,000.00')).toBeInTheDocument();
    expect(screen.getByText('10,000.00')).toBeInTheDocument();
    expect(screen.getByText('5,000.00')).toBeInTheDocument();
    expect(screen.getByText('DUE')).toBeInTheDocument();
    expect(screen.getByText('Initial batch delivery')).toBeInTheDocument();
    expect(screen.getByText('Recorded Payments (2)')).toBeInTheDocument();
    expect(screen.getByText('6,000.00')).toBeInTheDocument();
    expect(screen.getByText('4,000.00')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onOpenPaymentDialog = vi.fn();
    const onOpenPaymentMenu = vi.fn();

    render(
      <PurchasePaymentHistoryCard
        purchase={samplePurchase}
        onClose={onClose}
        onOpenPaymentDialog={onOpenPaymentDialog}
        onOpenPaymentMenu={onOpenPaymentMenu}
      />
    );

    await user.click(screen.getByRole('button', { name: /Close payment history/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onOpenPaymentDialog when Record Payment button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onOpenPaymentDialog = vi.fn();
    const onOpenPaymentMenu = vi.fn();

    render(
      <PurchasePaymentHistoryCard
        purchase={samplePurchase}
        onClose={onClose}
        onOpenPaymentDialog={onOpenPaymentDialog}
        onOpenPaymentMenu={onOpenPaymentMenu}
      />
    );

    await user.click(screen.getByRole('button', { name: /Record Payment/i }));
    expect(onOpenPaymentDialog).toHaveBeenCalledWith(samplePurchase);
  });

  it('renders expense information, metrics, and recorded payments when expense is provided', () => {
    const sampleExpense = {
      id: 301,
      category: 'Electricity',
      description: 'Main office electricity bill',
      amount: 4500,
      totalPaid: 2000,
      dueAmount: 2500,
      paymentStatus: 'Due',
      date: '2026-09-15T09:00:00.000Z',
      payments: [
        {
          id: 11,
          amount: 2000,
          paymentMethod: 'UPI',
          date: '2026-09-15T11:00:00.000Z',
          note: 'Partial bill payment',
        },
      ],
    };

    const onClose = vi.fn();
    const onOpenPaymentDialog = vi.fn();
    const onOpenPaymentMenu = vi.fn();

    render(
      <PurchasePaymentHistoryCard
        expense={sampleExpense}
        onClose={onClose}
        onOpenPaymentDialog={onOpenPaymentDialog}
        onOpenPaymentMenu={onOpenPaymentMenu}
      />
    );

    expect(screen.getByText('Payment History')).toBeInTheDocument();
    expect(screen.getByText(/Electricity/)).toBeInTheDocument();
    expect(screen.getByText('4,500.00')).toBeInTheDocument();
    expect(screen.getAllByText('2,000.00')).toHaveLength(2);
    expect(screen.getByText('2,500.00')).toBeInTheDocument();
    expect(screen.getByText('Main office electricity bill')).toBeInTheDocument();
    expect(screen.getByText('Recorded Payments (1)')).toBeInTheDocument();
  });
});

describe('PurchaseListTab', () => {
  const samplePurchase: Purchase = {
    id: 201,
    vendor: 'Global Food Supplies',
    totalAmount: 25000,
    totalPaid: 15000,
    dueAmount: 10000,
    paymentStatus: 'Due',
    date: '2026-09-14T08:00:00.000Z',
    note: 'Weekly provisions',
  };

  it('renders row with three-dot action button and allows editing from menu', async () => {
    const user = userEvent.setup();
    const onEditPurchase = vi.fn();
    const onDeletePurchase = vi.fn();

    render(
      <PurchaseListTab
        filteredPurchases={[samplePurchase]}
        vendorOptions={['Global Food Supplies']}
        purchaseStatusFilter="All"
        setPurchaseStatusFilter={vi.fn()}
        purchaseVendorFilter="All"
        setPurchaseVendorFilter={vi.fn()}
        purchaseSearchFilter=""
        setPurchaseSearchFilter={vi.fn()}
        totalPurchasesAmount={25000}
        totalPurchasesDue={10000}
        onAddPurchase={vi.fn()}
        onEditPurchase={onEditPurchase}
        onDeletePurchase={onDeletePurchase}
      />
    );

    // Verify row info
    expect(screen.getByText('Global Food Supplies')).toBeInTheDocument();

    // Three-dot action button
    const actionBtn = screen.getByRole('button', { name: /Purchase options/i });
    expect(actionBtn).toBeInTheDocument();

    // Click to open menu
    await user.click(actionBtn);

    const editMenuItem = await screen.findByRole('menuitem', { name: /Edit/i });
    const deleteMenuItem = await screen.findByRole('menuitem', { name: /Delete/i });

    expect(editMenuItem).toBeInTheDocument();
    expect(deleteMenuItem).toBeInTheDocument();

    // Click Edit
    await user.click(editMenuItem);
    expect(onEditPurchase).toHaveBeenCalledWith(samplePurchase);
  });

  it('opens filter popover when clicking filter options button', async () => {
    const user = userEvent.setup();
    const setPurchaseStatusFilter = vi.fn();
    const setPurchaseVendorFilter = vi.fn();

    render(
      <PurchaseListTab
        filteredPurchases={[samplePurchase]}
        vendorOptions={['Global Food Supplies']}
        purchaseStatusFilter="All"
        setPurchaseStatusFilter={setPurchaseStatusFilter}
        purchaseVendorFilter="All"
        setPurchaseVendorFilter={setPurchaseVendorFilter}
        purchaseSearchFilter=""
        setPurchaseSearchFilter={vi.fn()}
        totalPurchasesAmount={25000}
        totalPurchasesDue={10000}
        onAddPurchase={vi.fn()}
        onEditPurchase={vi.fn()}
        onDeletePurchase={vi.fn()}
      />
    );

    const filterBtn = screen.getByRole('button', { name: /Filter options/i });
    expect(filterBtn).toBeInTheDocument();

    await user.click(filterBtn);

    expect(await screen.findByText('Filter Purchases')).toBeInTheDocument();
    expect(screen.getByText('Vendor')).toBeInTheDocument();
    expect(screen.getByText('Payment Status')).toBeInTheDocument();
  });
});
