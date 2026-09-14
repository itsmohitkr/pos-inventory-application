/**
 * Chromium's webContents.print() falls back to A4 when no explicit `pageSize`
 * is given (see https://github.com/electron/electron/issues/39670) — the
 * printer driver's own configured roll size is NOT used automatically. A
 * receipt sized for e.g. 72mm content sitting on an A4 page looks like a
 * small block that doesn't fill the paper.
 *
 * A prior attempt at this fix computed both width AND height dynamically
 * from the rendered receipt's actual pixel size, and shipped a regression:
 * on real hardware it produced a tiny blank printout instead of a properly
 * sized one. The likely cause: many real thermal printer drivers only
 * reliably honor a small set of *preset* media sizes and mishandle an
 * arbitrary custom width/height pair that doesn't match one, even when the
 * value is technically valid per Chromium's own constraints. This version
 * is deliberately more conservative: the width is exactly the shop's
 * configured roll preset (e.g. "80mm"), the same string already used
 * everywhere else in the app for this printer, not a computed value — and
 * the height is one fixed, generous constant rather than a per-receipt
 * measurement, so there is no dynamic value in this calculation at all.
 */

/**
 * Comfortably taller than any realistic receipt (auto-cut thermal printers
 * simply stop feeding once the content ends; this only needs to be an upper
 * bound, not a tight fit). Chosen well above a fixed-size label's height to
 * avoid truncating a long cart, without depending on measuring this
 * specific receipt's rendered height.
 */
const RECEIPT_PAGE_HEIGHT_MM = 1200;

export function getReceiptPageSize(
  paperSize?: string
): { widthMicrons: number; heightMicrons: number } | undefined {
  const widthMm = parseFloat(paperSize || '');
  if (!widthMm) return undefined; // no pageSize sent -> today's fallback behavior, never worse

  return {
    widthMicrons: Math.round(widthMm * 1000),
    heightMicrons: RECEIPT_PAGE_HEIGHT_MM * 1000,
  };
}
