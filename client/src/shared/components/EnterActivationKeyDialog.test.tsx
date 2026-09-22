import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IPC } from '@/shared/ipcChannels';
import type { RedeemKeyOutcome } from '@/shared/types/license';
import EnterActivationKeyDialog from './EnterActivationKeyDialog';

const installElectron = (invoke: (...args: unknown[]) => unknown) => {
  Object.defineProperty(window, 'electron', {
    value: { app: {}, ipcRenderer: { invoke, on: vi.fn(), off: vi.fn(), send: vi.fn() } },
    configurable: true,
    writable: true,
  });
};

afterEach(() => {
  Reflect.deleteProperty(window, 'electron');
});

const typeAndActivate = async (key: string) => {
  await userEvent.type(screen.getByLabelText('Activation Key'), key);
  await userEvent.click(screen.getByRole('button', { name: 'Activate' }));
};

describe('EnterActivationKeyDialog', () => {
  it('renders nothing when closed', () => {
    render(<EnterActivationKeyDialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Enter Activation Key')).not.toBeInTheDocument();
  });

  it('disables Activate until something is typed, and calls the redeem channel with the trimmed key', async () => {
    const invoke = vi.fn(async (): Promise<RedeemKeyOutcome> => ({ kind: 'ok' }));
    installElectron(invoke);
    render(<EnterActivationKeyDialog open onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Activate' })).toBeDisabled();
    await typeAndActivate('  0WD2T-G2KCS-WRS7X-JRQCE-DN  ');

    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(IPC.LICENSE_REDEEM_KEY, '0WD2T-G2KCS-WRS7X-JRQCE-DN')
    );
  });

  it('shows a success message and swaps Cancel for Close on ok', async () => {
    installElectron(async () => ({ kind: 'ok' }));
    render(<EnterActivationKeyDialog open onClose={vi.fn()} />);

    await typeAndActivate('0WD2T-G2KCS-WRS7X-JRQCE-DN');

    expect(await screen.findByText(/Activated\. Your license is now active\./)).toBeInTheDocument();
    expect(screen.queryByLabelText('Activation Key')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activate' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it.each([
    ['malformed', 'not-a-key', /doesn't look right/],
    ['invalid_key', 'invalid key text', /isn't valid/],
    ['seat_limit_reached', 'seat limit', /already in use/],
    ['device_already_licensed', 'already licensed', /different account/],
    ['offline', 'offline', /Couldn't reach the license server/],
  ] as const)(
    'shows the right message for %s and lets the person try again',
    async (kind, _label, expected) => {
      installElectron(async () => ({ kind }));
      render(<EnterActivationKeyDialog open onClose={vi.fn()} />);

      await typeAndActivate('WHATEVER-KEY-00-00-00');

      expect(await screen.findByText(expected)).toBeInTheDocument();
      // Still on the entry form: the field and Activate button are back for another attempt.
      expect(screen.getByLabelText('Activation Key')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    }
  );

  it('treats a rejected/throwing invoke as offline, never crashes', async () => {
    installElectron(async () => {
      throw new Error('bridge error');
    });
    render(<EnterActivationKeyDialog open onClose={vi.fn()} />);

    await typeAndActivate('0WD2T-G2KCS-WRS7X-JRQCE-DN');
    expect(await screen.findByText(/Couldn't reach the license server/)).toBeInTheDocument();
  });

  it('submits on Enter', async () => {
    const invoke = vi.fn(async (): Promise<RedeemKeyOutcome> => ({ kind: 'ok' }));
    installElectron(invoke);
    render(<EnterActivationKeyDialog open onClose={vi.fn()} />);

    await userEvent.type(
      screen.getByLabelText('Activation Key'),
      '0WD2T-G2KCS-WRS7X-JRQCE-DN{enter}'
    );
    await waitFor(() => expect(invoke).toHaveBeenCalled());
  });

  it('never submits an empty or whitespace-only key', async () => {
    const invoke = vi.fn();
    installElectron(invoke);
    render(<EnterActivationKeyDialog open onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Activation Key'), '   {enter}');
    expect(invoke).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Activate' })).toBeDisabled();
  });

  it('resets the form after Cancel/Close, so reopening starts fresh (the only real close path: Cancel, Close, backdrop and Escape all route through the same handler)', async () => {
    installElectron(async () => ({ kind: 'invalid_key' }));
    const onClose = vi.fn();
    const { rerender } = render(<EnterActivationKeyDialog open onClose={onClose} />);

    await typeAndActivate('bad-key');
    expect(await screen.findByText(/isn't valid/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<EnterActivationKeyDialog open={false} onClose={onClose} />);
    rerender(<EnterActivationKeyDialog open onClose={onClose} />);

    expect(screen.queryByText(/isn't valid/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Activation Key')).toHaveValue('');
  });

  it('Cancel closes without submitting', async () => {
    const invoke = vi.fn();
    installElectron(invoke);
    const onClose = vi.fn();
    render(<EnterActivationKeyDialog open onClose={onClose} />);

    await userEvent.type(screen.getByLabelText('Activation Key'), 'something');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('outside Electron, reports offline rather than throwing', async () => {
    render(<EnterActivationKeyDialog open onClose={vi.fn()} />);
    await typeAndActivate('0WD2T-G2KCS-WRS7X-JRQCE-DN');
    expect(await screen.findByText(/Couldn't reach the license server/)).toBeInTheDocument();
  });
});
