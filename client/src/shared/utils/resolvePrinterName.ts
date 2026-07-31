import type { PrinterInfo, ReceiptSettings } from '@/domains/settings/hooks/useSettings';

export interface ResolvePrinterNameArgs {
  /** Supplies the user's saved choice via `printerType`. */
  receiptSettings?: ReceiptSettings | null;
  /** The live printer list from the get-printers IPC handler. */
  printers?: PrinterInfo[] | null;
  /** System default, as reported at enumeration time. */
  defaultPrinter?: string | null;
}

/**
 * Picks which printer a receipt should go to.
 *
 * Order: the user's saved printer (only if it is still present in the live
 * list) -> the system default -> the first printer flagged default -> the
 * first printer at all -> undefined when none exist.
 *
 * The "still present in the live list" check is the important part. A saved
 * printer that has been renamed, unplugged, or removed would otherwise be
 * sent to the main process, which rejects unknown device names outright — so
 * without this the cashier gets a hard failure where falling back to the
 * default would have printed fine. This is shared precisely because three
 * call sites had drifted into three different versions of it, two of which
 * skipped the check.
 *
 * Barcode and price-list printing deliberately do NOT use this: those keep
 * their own per-dialog printer choice in localStorage, which is a separate
 * concept from the receipt printer.
 */
export const resolvePrinterName = ({
  receiptSettings,
  printers = [],
  defaultPrinter = null,
}: ResolvePrinterNameArgs): string | undefined => {
  const list = Array.isArray(printers) ? printers : [];
  const saved = receiptSettings?.printerType;

  if (typeof saved === 'string' && saved && list.some((p) => p.name === saved)) {
    return saved;
  }

  return defaultPrinter || (list.find((p) => p.isDefault) || list[0])?.name;
};
