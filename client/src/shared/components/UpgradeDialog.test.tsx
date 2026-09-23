import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IPC } from '@/shared/ipcChannels';
import type { CheckoutStartResult, CheckoutState } from '@/shared/types/license';
import UpgradeDialog from './UpgradeDialog';

const IDLE: CheckoutState = { phase: 'idle', checkoutUrl: null };

type Listener = (event: unknown, ...args: unknown[]) => void;

const installElectron = (
  startResult: CheckoutStartResult | (() => CheckoutStartResult) = {
    kind: 'ok',
    checkoutUrl: 'https://x',
  },
  initialCheckout: CheckoutState = IDLE
) => {
  const listeners = new Map<string, Listener>();
  const invoke = vi.fn(async (channel: string) => {
    if (channel === IPC.LICENSE_GET_CHECKOUT_STATE) return initialCheckout;
    if (channel === IPC.LICENSE_START_CHECKOUT) {
      return typeof startResult === 'function' ? startResult() : startResult;
    }
    if (channel === IPC.LICENSE_CANCEL_CHECKOUT) return undefined;
    return undefined;
  });
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
  return { invoke, listeners };
};

/** Simulates the main process pushing a new checkout state, the way LicenseManager's 'checkoutState' event
 *  does via desktop/license/index.ts. */
const pushCheckoutState = (listeners: Map<string, Listener>, state: CheckoutState): void => {
  act(() => {
    listeners.get(IPC.LICENSE_CHECKOUT_STATE_CHANGED)?.({}, state);
  });
};

afterEach(() => {
  Reflect.deleteProperty(window, 'electron');
});

describe('UpgradeDialog', () => {
  it('renders nothing when closed', () => {
    installElectron();
    render(<UpgradeDialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Upgrade')).not.toBeInTheDocument();
  });

  it('shows plan choices with no price (pricing is not finalized server-side)', async () => {
    installElectron();
    render(<UpgradeDialog open onClose={vi.fn()} />);
    expect(await screen.findByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Yearly')).toBeInTheDocument();
    expect(screen.queryByText(/₹|\$/)).not.toBeInTheDocument();
  });

  it('starting a checkout invokes LICENSE_START_CHECKOUT with the chosen plan key', async () => {
    const { invoke } = installElectron();
    render(<UpgradeDialog open onClose={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: /Yearly/ }));

    await waitFor(() => expect(invoke).toHaveBeenCalledWith(IPC.LICENSE_START_CHECKOUT, 'yearly'));
  });

  it('shows the waiting view once the main process pushes a pending checkout state', async () => {
    const { listeners } = installElectron();
    render(<UpgradeDialog open onClose={vi.fn()} />);
    await screen.findByText('Monthly');

    pushCheckoutState(listeners, { phase: 'pending', checkoutUrl: 'https://rzp.io/i/xyz' });

    expect(screen.getByText('Waiting for payment…')).toBeInTheDocument();
    expect(screen.queryByText('Monthly')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('Cancel while pending invokes LICENSE_CANCEL_CHECKOUT', async () => {
    const { invoke, listeners } = installElectron();
    render(<UpgradeDialog open onClose={vi.fn()} />);
    await screen.findByText('Monthly');
    pushCheckoutState(listeners, { phase: 'pending', checkoutUrl: 'https://rzp.io/i/xyz' });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(invoke).toHaveBeenCalledWith(IPC.LICENSE_CANCEL_CHECKOUT);
  });

  it('shows a success view once paid, and Done resets via LICENSE_CANCEL_CHECKOUT', async () => {
    const { invoke, listeners } = installElectron();
    render(<UpgradeDialog open onClose={vi.fn()} />);
    await screen.findByText('Monthly');

    pushCheckoutState(listeners, { phase: 'paid', checkoutUrl: null });

    expect(screen.getByText(/Payment received/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(invoke).toHaveBeenCalledWith(IPC.LICENSE_CANCEL_CHECKOUT);
  });

  it.each(['failed', 'expired'] as const)(
    'shows a terminal message for %s with Close and Try again',
    async (phase) => {
      const { listeners } = installElectron();
      render(<UpgradeDialog open onClose={vi.fn()} />);
      await screen.findByText('Monthly');

      pushCheckoutState(listeners, { phase, checkoutUrl: null });

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    }
  );

  it.each([
    ['already_pending', /already in progress/],
    ['rejected', /isn't recognized/],
    ['unknown_plan', /isn't available/],
    ['offline', /Couldn't reach the license server/],
  ] as const)('shows the right message for a %s start outcome', async (kind, expected) => {
    installElectron({ kind });
    render(<UpgradeDialog open onClose={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: /Monthly/ }));

    expect(await screen.findByText(expected)).toBeInTheDocument();
    // Still on plan selection: nothing was actually started.
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('outside Electron, starting a checkout reports offline rather than throwing', async () => {
    render(<UpgradeDialog open onClose={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: /Monthly/ }));
    expect(await screen.findByText(/Couldn't reach the license server/)).toBeInTheDocument();
  });

  it('a throwing invoke is treated as offline, never crashes', async () => {
    installElectron(() => {
      throw new Error('bridge error');
    });
    render(<UpgradeDialog open onClose={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: /Monthly/ }));
    expect(await screen.findByText(/Couldn't reach the license server/)).toBeInTheDocument();
  });

  it('closing while pending does not cancel the in-progress checkout', async () => {
    const { invoke, listeners } = installElectron();
    const onClose = vi.fn();
    render(<UpgradeDialog open onClose={onClose} />);
    await screen.findByText('Monthly');
    pushCheckoutState(listeners, { phase: 'pending', checkoutUrl: 'https://rzp.io/i/xyz' });
    invoke.mockClear();

    // Escape triggers the dialog's onClose the same way a backdrop click or window close would.
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(invoke).not.toHaveBeenCalledWith(IPC.LICENSE_CANCEL_CHECKOUT);
  });
});
