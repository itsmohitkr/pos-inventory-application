/**
 * Chromium's webContents.print() falls back to A4 when no explicit `pageSize`
 * is given (see https://github.com/electron/electron/issues/39670) — the
 * printer driver's own configured roll size is NOT used automatically. A
 * receipt sized for a 72mm-wide content box sitting on an A4 page looks like
 * a small block that doesn't fill the paper. Barcode/price-list printing
 * already avoids this by sending an explicit pageSize; receipts didn't,
 * because unlike a fixed-size label a receipt's height is continuous/variable
 * (depends on item count) — a fixed label-style height would risk truncating
 * a long receipt. This measures the actual rendered height instead of
 * guessing one.
 *
 * Must be called after the receipt DOM has been committed (e.g. right after
 * the flushSync that renders it into ReceiptPrintPortal), so
 * #receipt-content reflects this specific receipt's real content height.
 */
export function getReceiptPageSize(
  paperSize?: string
): { widthMicrons: number; heightMicrons: number } | undefined {
  const widthMm = parseFloat(paperSize || '');
  const el = document.getElementById('receipt-content');
  // No pageSize sent -> today's existing (A4-fallback) behavior, never worse.
  if (!widthMm || !el) return undefined;

  const heightPx = el.getBoundingClientRect().height;
  if (!heightPx) return undefined;

  // CSS px -> mm at 96 DPI, plus a safety margin so header/footer padding
  // never gets clipped at the very edge of the physical page.
  const heightMm = (heightPx * 25.4) / 96 + 10;

  return {
    widthMicrons: Math.round(widthMm * 1000),
    heightMicrons: Math.round(heightMm * 1000),
  };
}
