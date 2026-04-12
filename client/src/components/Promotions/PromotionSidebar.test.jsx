import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PromotionSidebar from './PromotionSidebar';

describe('PromotionSidebar', () => {
  it('renders promotion modules', () => {
    render(<PromotionSidebar activeTab="threshold" onChangeTab={vi.fn()} />);

    expect(screen.getByText('PROMOTION MODULES')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Order Thresholding' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scheduled Sales' })).toBeInTheDocument();
  });

  it('calls onChangeTab when module buttons are clicked', async () => {
    const onChangeTab = vi.fn();
    const user = userEvent.setup();

    render(<PromotionSidebar activeTab="threshold" onChangeTab={onChangeTab} />);

    await user.click(screen.getByRole('button', { name: 'Scheduled Sales' }));
    await user.click(screen.getByRole('button', { name: 'Order Thresholding' }));

    expect(onChangeTab).toHaveBeenNthCalledWith(1, 'sales');
    expect(onChangeTab).toHaveBeenNthCalledWith(2, 'threshold');
  });
});
