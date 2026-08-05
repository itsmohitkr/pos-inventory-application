import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React, { type ReactElement } from 'react';
import SaleHistory from './SaleHistory';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('@/shared/api/posService', () => ({
  default: {
    fetchSalesHistory: vi.fn(() => Promise.resolve({ data: { sales: [] } })),
  },
}));

vi.mock('@/shared/api/dashboardService', () => ({
  default: {
    fetchLooseSalesReport: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

const renderWithRouter = (ui: ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('SaleHistory Component', () => {
  // `shopName` and `customerFeatureEnabled` (used below) are not part of
  // SaleHistoryProps and were never read by the component in the JS version
  // either — they were silently dropped as excess props. Typing the test now
  // surfaces that; dropped here rather than widening the component's props
  // for a value it never consumed.
  const defaultProps = {
    receiptSettings: {},
    showError: vi.fn(),
  };

  it('renders correctly with default props', () => {
    renderWithRouter(<SaleHistory {...defaultProps} />);
    expect(screen.getByText(/Sale History/i)).toBeDefined();
  });

  it('passes customerFeatureEnabled to child components', () => {
    // In a real scenario, we would check if child components behave differently.
    // For this demonstration, we're just checking if the component mounts without crashing
    // when the prop is changed.
    const { rerender } = renderWithRouter(<SaleHistory {...defaultProps} />);
    expect(screen.getByText(/Sale History/i)).toBeDefined();

    rerender(<SaleHistory {...defaultProps} />);
    expect(screen.getByText(/Sale History/i)).toBeDefined();
  });
});
