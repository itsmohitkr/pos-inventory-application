import { useCallback, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { IPC } from '@/shared/ipcChannels';
import type { PrinterInfo } from '@/domains/settings/hooks/useSettings';

export interface PrinterList {
  printers: PrinterInfo[];
  defaultPrinter: string | null;
}

const EMPTY: PrinterList = { printers: [], defaultPrinter: null };

/**
 * Module-level cache.
 *
 * Enumerating printers hits the OS spooler, which on Windows can block for
 * seconds when a networked printer is unreachable. Four components used to
 * each run their own fetch on mount/dialog-open with four separate states and
 * no shared result, so opening the barcode dialog re-paid that cost every
 * time. Cached here rather than in a context because the printer list is
 * process-wide, not tree-scoped, and callers only ever read it.
 */
let cache: PrinterList | null = null;
let inFlight: Promise<PrinterList> | null = null;
const subscribers = new Set<(value: PrinterList) => void>();

const publish = (value: PrinterList) => {
  cache = value;
  subscribers.forEach((notify) => notify(value));
};

const fetchPrinters = async (retries = 3): Promise<PrinterList> => {
  try {
    const list = await window.electron?.ipcRenderer.invoke<PrinterInfo[]>(IPC.GET_PRINTERS);
    const printers = Array.isArray(list) ? list : [];
    const value: PrinterList = {
      printers,
      defaultPrinter: printers.find((p) => p.isDefault)?.name ?? null,
    };
    publish(value);
    return value;
  } catch (err) {
    console.error('Failed to get printers:', err);
    if (retries > 0) {
      // Matches the original backoff in useSettings: the spooler is often not
      // ready in the first seconds after launch.
      await new Promise((r) => setTimeout(r, 2000));
      return fetchPrinters(retries - 1);
    }
    Sentry.captureException(err, { tags: { feature: 'printers-fetch' } });
    publish(EMPTY);
    return EMPTY;
  }
};

/** Fetches once per process; concurrent callers share the same in-flight promise. */
export const loadPrinters = (force = false): Promise<PrinterList> => {
  if (!force && cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = fetchPrinters().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
};

/**
 * Shared printer list. `enabled` defers the fetch until a dialog is actually
 * opened, so the cost is not paid on every mount.
 */
export const usePrinters = (enabled = true): PrinterList & { refresh: () => Promise<PrinterList> } => {
  const [value, setValue] = useState<PrinterList>(cache ?? EMPTY);

  useEffect(() => {
    subscribers.add(setValue);
    return () => {
      subscribers.delete(setValue);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !window.electron) return;
    loadPrinters();
  }, [enabled]);

  const refresh = useCallback(() => loadPrinters(true), []);

  return { ...value, refresh };
};
