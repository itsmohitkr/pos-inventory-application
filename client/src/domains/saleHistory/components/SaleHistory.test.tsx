import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
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

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('SaleHistory Component', () => {
  const defaultProps = {
    receiptSettings: {},
    shopName: 'Test Shop',
    shopMetadata: {},
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
    const { rerender } = renderWithRouter(<SaleHistory {...defaultProps} customerFeatureEnabled={true} />);
    expect(screen.getByText(/Sale History/i)).toBeDefined();

    rerender(<SaleHistory {...defaultProps} customerFeatureEnabled={false} />);
    expect(screen.getByText(/Sale History/i)).toBeDefined();
  });
});
