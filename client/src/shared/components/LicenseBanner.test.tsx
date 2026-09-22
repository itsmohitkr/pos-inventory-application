import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useLicenseStatus from '@/shared/hooks/useLicenseStatus';
import { IPC } from '@/shared/ipcChannels';
import type { LicenseStatusDto } from '@/shared/types/license';
import LicenseBanner, { LicenseBannerView } from './LicenseBanner';

const status = (over: Partial<LicenseStatusDto> = {}): LicenseStatusDto => ({
  mode: 'grace',
  enforcement: 'on',
  salesAllowed: true,
  wouldBlock: false,
  severity: 'warning',
  message: 'Your license has ended. New sales will be blocked on 27 Sep 2026 unless you renew.',
  trialEndsAt: null,
  paidUntil: null,
  graceUntil: null,
  daysLeft: null,
  provisional: false,
  offline: false,
  clockSuspect: false,
  lastValidatedAt: null,
  ...over,
});

type Listener = (event: unknown, ...args: unknown[]) => void;

const installElectron = (initial: LicenseStatusDto) => {
  const listeners = new Map<string, Listener>();
  const invoke = vi.fn(async (channel: string) =>
    channel === IPC.LICENSE_GET_STATUS ? initial : initial
  );
  const ipcRenderer = {
    send: vi.fn(),
    invoke,
    on: vi.fn((channel: string, listener: Listener) => void listeners.set(channel, listener)),
    off: vi.fn((channel: string) => void listeners.delete(channel)),
    removeAllListeners: vi.fn(),
  };
  Object.defineProperty(window, 'electron', {
    value: { app: {}, ipcRenderer },
    configurable: true,
    writable: true,
  });
  return { ipcRenderer, listeners, invoke };
};

afterEach(() => {
  Reflect.deleteProperty(window, 'electron');
});

describe('LicenseBannerView', () => {
  it.each([
    ['no status yet', null],
    ['disabled', status({ mode: 'disabled', severity: 'none', message: null })],
    ['checking', status({ mode: 'checking', severity: 'none', message: null })],
    ['active', status({ mode: 'active', severity: 'none', message: null })],
    ['kill-switch (severity none)', status({ severity: 'none' })],
    ['no message', status({ message: null })],
  ])('renders nothing for %s', (_label, value) => {
    const { container } = render(
      <LicenseBannerView status={value} onRefresh={vi.fn()} onEnterKey={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the message and a Check again button for warnings', async () => {
    const onRefresh = vi.fn();
    render(<LicenseBannerView status={status()} onRefresh={onRefresh} onEnterKey={vi.fn()} />);
    expect(screen.getByTestId('license-banner')).toHaveTextContent('New sales will be blocked');
    await userEvent.click(screen.getByRole('button', { name: 'Check again' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows the trial info with only an Enter key button while online', () => {
    render(
      <LicenseBannerView
        status={status({ mode: 'trialing', severity: 'info', message: 'Free trial: 5 days left.' })}
        onRefresh={vi.fn()}
        onEnterKey={vi.fn()}
      />
    );
    expect(screen.getByTestId('license-banner')).toHaveTextContent('Free trial: 5 days left.');
    expect(screen.queryByRole('button', { name: 'Check again' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter key' })).toBeInTheDocument();
  });

  it('offers Check again for an info banner when the service is unreachable', () => {
    render(
      <LicenseBannerView
        status={status({
          mode: 'trialing',
          severity: 'info',
          message: 'Free trial: 5 days left.',
          offline: true,
        })}
        onRefresh={vi.fn()}
        onEnterKey={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Check again' })).toBeInTheDocument();
  });

  it('never offers Enter key for revoked or unverified (those need support, not a key)', () => {
    for (const mode of ['revoked', 'unverified'] as const) {
      const { unmount } = render(
        <LicenseBannerView status={status({ mode })} onRefresh={vi.fn()} onEnterKey={vi.fn()} />
      );
      expect(screen.queryByRole('button', { name: 'Enter key' })).not.toBeInTheDocument();
      unmount();
    }
  });

  it('calls onEnterKey when its button is clicked', async () => {
    const onEnterKey = vi.fn();
    render(
      <LicenseBannerView
        status={status({ mode: 'lapsed' })}
        onRefresh={vi.fn()}
        onEnterKey={onEnterKey}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Enter key' }));
    expect(onEnterKey).toHaveBeenCalledTimes(1);
  });

  it('adds a clock hint when the system clock looks wrong', () => {
    render(
      <LicenseBannerView
        status={status({ clockSuspect: true })}
        onRefresh={vi.fn()}
        onEnterKey={vi.fn()}
      />
    );
    expect(screen.getByTestId('license-banner')).toHaveTextContent('clock looks wrong');
  });
});

describe('useLicenseStatus', () => {
  it('returns null outside Electron', () => {
    const { result } = renderHook(() => useLicenseStatus());
    expect(result.current).toBeNull();
  });

  it('loads the initial status, follows pushed changes, and unsubscribes on unmount', async () => {
    const { ipcRenderer, listeners, invoke } = installElectron(status({ severity: 'warning' }));
    const { result, unmount } = renderHook(() => useLicenseStatus());

    await waitFor(() => expect(result.current?.mode).toBe('grace'));
    expect(invoke).toHaveBeenCalledWith(IPC.LICENSE_GET_STATUS);

    act(() =>
      listeners.get(IPC.LICENSE_STATUS_CHANGED)?.({}, status({ mode: 'lapsed', severity: 'error' }))
    );
    expect(result.current?.mode).toBe('lapsed');

    unmount();
    expect(ipcRenderer.off).toHaveBeenCalledWith(IPC.LICENSE_STATUS_CHANGED, expect.any(Function));
  });
});

describe('LicenseBanner (connected)', () => {
  it('renders from the main-process status and triggers a refresh on click', async () => {
    const { invoke } = installElectron(status());
    render(<LicenseBanner />);

    expect(await screen.findByTestId('license-banner')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Check again' }));
    expect(invoke).toHaveBeenCalledWith(IPC.LICENSE_REFRESH);
  });

  it('opens the Enter Activation Key dialog from the banner button', async () => {
    installElectron(status({ mode: 'lapsed' }));
    render(<LicenseBanner />);

    await screen.findByTestId('license-banner');
    expect(screen.queryByText('Enter Activation Key')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Enter key' }));
    expect(screen.getByText('Enter Activation Key')).toBeInTheDocument();
  });
});
