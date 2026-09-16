import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CustomerMobileDialog from '@/domains/pos/components/CustomerMobileDialog';

vi.mock('@/shared/api/customerService', () => ({
  default: {
    findByPhone: vi.fn().mockResolvedValue({
      id: 1,
      phone: '9876543210',
      name: 'Rajesh Sharma',
      customerBarcode: '200000000011',
    }),
  },
}));

describe('CustomerMobileDialog', () => {
  it('renders modal matching LooseSaleDialog design with header and numpad', () => {
    render(
      <CustomerMobileDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Customer Mobile Number')).toBeInTheDocument();
    expect(screen.getByText('+91')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Customer Name (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save Customer')).toBeDisabled();
  });

  it('allows entering 10 digits via numpad and enables confirm button', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <CustomerMobileDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    // Click 9, 8, 7, 6, 5, 4, 3, 2, 1, 0
    const digits = ['9', '8', '7', '6', '5', '4', '3', '2', '1', '0'];
    for (const d of digits) {
      const btn = screen.getByRole('button', { name: d });
      await user.click(btn);
    }

    // After 10 digits, mock finds Rajesh Sharma
    await waitFor(() => {
      expect(screen.getByText(/Rajesh Sharma/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Apply Customer|Save Customer/i });
    expect(submitBtn).not.toBeDisabled();

    await user.click(submitBtn);
    expect(onConfirm).toHaveBeenCalledWith('9876543210', 'Rajesh Sharma');
  });

  it('supports Clear and DEL buttons', async () => {
    const user = userEvent.setup();

    render(
      <CustomerMobileDialog
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        initialPhone="987"
      />
    );

    expect(screen.getByText(/Enter 10-digit mobile number/i)).toBeInTheDocument();

    // DEL removes 1 digit
    const delBtn = screen.getByTestId('BackspaceIcon').closest('button')!;
    await user.click(delBtn);
    expect(screen.getByText('2/10')).toBeInTheDocument();

    // Clear resets completely
    const clearBtn = screen.getByRole('button', { name: 'Clear' });
    await user.click(clearBtn);
    expect(screen.getByText('0/10')).toBeInTheDocument();
  });
});
