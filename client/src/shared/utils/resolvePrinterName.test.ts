import { describe, it, expect } from 'vitest';
import { resolvePrinterName } from '@/shared/utils/resolvePrinterName';
import type { PrinterInfo } from '@/domains/settings/hooks/useSettings';

const printers: PrinterInfo[] = [
  { name: 'EPSON TM-T20', isDefault: false },
  { name: 'Microsoft Print to PDF', isDefault: true },
];

describe('resolvePrinterName', () => {
  it('uses the saved printer when it is still connected', () => {
    expect(
      resolvePrinterName({
        receiptSettings: { printerType: 'EPSON TM-T20' },
        printers,
        defaultPrinter: 'Microsoft Print to PDF',
      })
    ).toBe('EPSON TM-T20');
  });

  // The regression this helper exists for: a renamed or unplugged printer must
  // fall back, not be sent to main and hard-fail as an unknown device.
  it('falls back to the system default when the saved printer is gone', () => {
    expect(
      resolvePrinterName({
        receiptSettings: { printerType: 'Unplugged Printer' },
        printers,
        defaultPrinter: 'Microsoft Print to PDF',
      })
    ).toBe('Microsoft Print to PDF');
  });

  it('falls back to the isDefault-flagged printer when no system default is given', () => {
    expect(
      resolvePrinterName({
        receiptSettings: { printerType: 'Unplugged Printer' },
        printers,
        defaultPrinter: null,
      })
    ).toBe('Microsoft Print to PDF');
  });

  it('falls back to the first printer when none is flagged default', () => {
    expect(
      resolvePrinterName({
        receiptSettings: {},
        printers: [
          { name: 'Printer A', isDefault: false },
          { name: 'Printer B', isDefault: false },
        ],
        defaultPrinter: null,
      })
    ).toBe('Printer A');
  });

  it('returns undefined when there is no saved printer and none available', () => {
    expect(
      resolvePrinterName({ receiptSettings: {}, printers: [], defaultPrinter: null })
    ).toBeUndefined();
  });

  // Regression guard. Enumeration is async and can fail; an empty list means
  // "we don't know", not "your printer is gone". Dropping the saved printer
  // here would break machines that print fine today — the POS pay-and-print
  // path historically trusted the saved value unconditionally.
  it('trusts the saved printer when the list is empty (enumeration pending or failed)', () => {
    expect(
      resolvePrinterName({
        receiptSettings: { printerType: 'EPSON TM-T20' },
        printers: [],
        defaultPrinter: null,
      })
    ).toBe('EPSON TM-T20');
  });

  it('prefers the saved printer over the system default when the list is unknown', () => {
    expect(
      resolvePrinterName({
        receiptSettings: { printerType: 'EPSON TM-T20' },
        printers: [],
        defaultPrinter: 'Some Other Printer',
      })
    ).toBe('EPSON TM-T20');
  });

  it('tolerates missing/nullish inputs', () => {
    expect(resolvePrinterName({})).toBeUndefined();
    expect(resolvePrinterName({ receiptSettings: null, printers: null, defaultPrinter: null })).toBeUndefined();
  });
});
