import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import OnboardingWizard from './OnboardingWizard';

vi.mock('@/shared/api/authService', () => ({
  default: {
    completeOnboarding: vi.fn(),
  },
}));

vi.mock('@/shared/api/settingsService', () => ({
  default: {
    fetchSettings: vi.fn(() =>
      Promise.resolve({ data: {} })
    ),
  },
}));

import authService from '@/shared/api/authService';

describe('OnboardingWizard', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders step 1 on mount', () => {
    render(<OnboardingWizard onComplete={onComplete} />);
    expect(screen.getByText('Shop Profile')).toBeTruthy();
    expect(screen.getByLabelText(/Shop Name/i)).toBeTruthy();
  });

  it('Next button is disabled when shopName is empty', () => {
    render(<OnboardingWizard onComplete={onComplete} />);
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeDisabled();
  });

  it('advances to step 2 when shopName is filled and Next is clicked', async () => {
    render(<OnboardingWizard onComplete={onComplete} />);
    fireEvent.change(screen.getByLabelText(/Shop Name/i), {
      target: { value: 'My Shop' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByLabelText(/New Admin Password/i)).toBeTruthy();
  });

  it('Finish Setup is disabled when passwords do not match', async () => {
    const { container } = render(<OnboardingWizard onComplete={onComplete} />);
    fireEvent.change(screen.getByLabelText(/Shop Name/i), { target: { value: 'My Shop' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByText('Admin Password');
    const [pwInput] = container.querySelectorAll('input[type="password"]');
    await act(async () => {
      fireEvent.change(pwInput, { target: { value: 'password123' } });
    });

    expect(screen.getByRole('button', { name: /finish setup/i })).toBeDisabled();
  });

  it('calls completeOnboarding and onComplete on successful submit', async () => {
    authService.completeOnboarding.mockResolvedValue({});

    const { container } = render(<OnboardingWizard onComplete={onComplete} />);
    fireEvent.change(screen.getByLabelText(/Shop Name/i), { target: { value: 'My Shop' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByText('Admin Password');
    const [pwInput, confirmInput] = container.querySelectorAll('input[type="password"]');
    fireEvent.change(pwInput, { target: { value: 'securePass123' } });
    fireEvent.change(confirmInput, { target: { value: 'securePass123' } });

    // Wait for button to become enabled (state settled)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /finish setup/i })).not.toBeDisabled()
    );
    fireEvent.click(screen.getByRole('button', { name: /finish setup/i }));

    await waitFor(() => {
      expect(authService.completeOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({ shopName: 'My Shop', adminPassword: 'securePass123' })
      );
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('shows error alert when API call fails', async () => {
    authService.completeOnboarding.mockRejectedValue({
      response: { data: { message: 'Server error' } },
    });

    const { container } = render(<OnboardingWizard onComplete={onComplete} />);
    fireEvent.change(screen.getByLabelText(/Shop Name/i), { target: { value: 'My Shop' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByText('Admin Password');
    const [pwInput, confirmInput] = container.querySelectorAll('input[type="password"]');
    fireEvent.change(pwInput, { target: { value: 'securePass123' } });
    fireEvent.change(confirmInput, { target: { value: 'securePass123' } });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /finish setup/i })).not.toBeDisabled()
    );
    fireEvent.click(screen.getByRole('button', { name: /finish setup/i }));

    expect(await screen.findByText('Server error')).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
