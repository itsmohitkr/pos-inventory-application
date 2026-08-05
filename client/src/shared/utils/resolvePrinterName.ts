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
 * Order: the user's saved printer -> the system default -> the first printer
 * flagged default -> the first printer at all -> undefined (which the main
 * process treats as "use the OS default").
 *
 * The saved printer is only overridden when we can *prove* it is gone, i.e.
 * the live list is non-empty and does not contain it — a printer that has
 * been renamed or unplugged would otherwise be sent to main, which rejects
 * unknown device names outright, giving a hard failure where falling back
 * would have printed fine.
 *
 * An EMPTY list is not proof of anything. Enumeration is async and can still
 * be in flight on the first sale after launch, and it can fail outright on a
 * busy spooler. Treating "empty" as "your printer is gone" would break
 * machines where printing works today, so in that case the saved value is
 * trusted and main gets the final say. This mirrors the original behaviour of
 * the POS pay-and-print path, which trusted the saved printer unconditionally.
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
  const saved = typeof receiptSettings?.printerType === 'string' ? receiptSettings.printerType : '';

  if (saved) {
    // No list to check against -> trust it rather than silently dropping it.
    if (list.length === 0) return saved;
    if (list.some((p) => p.name === saved)) return saved;
  }

  return defaultPrinter || (list.find((p) => p.isDefault) || list[0])?.name;
};
