/**
 * Builds a standalone HTML document for printing a receipt through
 * `print-html-content` (an isolated, dedicated BrowserWindow — the same
 * mechanism already used successfully for barcode/price-list printing),
 * instead of `print-manual` (which prints from the main application window,
 * the same window the whole app's UI — sidebar, tables, everything — is
 * loaded into, just hidden via CSS visibility rules at print time). Printing
 * from a page that contains nothing but the receipt means there is nothing
 * about the surrounding app (sidebar state, layout, anything else) that can
 * ever affect the printed result.
 *
 * Receipt.tsx renders structure + className only (see receiptStyles.ts) and
 * embeds its own complete stylesheet in a trailing <style> tag inside
 * #receipt-container, so cloning that container's outerHTML carries its
 * styling with it. This used to also capture every <style> tag in
 * `document.head` to reproduce MUI/Emotion's generated classes — necessary
 * back when Receipt.tsx was styled via `sx`, but that snapshot's rule order
 * depended on the app's render history rather than Receipt.tsx's own
 * structure, which caused a real font-size bug (see PR #197). Now that
 * Receipt.tsx is self-contained, that capture is unnecessary and has been
 * removed — there is nothing left for the clone to depend on.
 *
 * The receipt has no images, external fonts, or barcodes (the "barcode"
 * setting renders as plain text), so a strict CSP with no image/font
 * allowances is sufficient — stricter than price-list's, which does need
 * inline SVG/data-URI support.
 */
export function buildReceiptPrintHtml(receiptRootId = 'thermal-receipt-print'): string | null {
  const receiptRoot = document.getElementById(receiptRootId);
  if (!receiptRoot) return null;

  const receiptContainer = receiptRoot.querySelector('#receipt-container');
  if (!receiptContainer) return null;

  const receiptHtml = (receiptContainer.cloneNode(true) as Element).outerHTML;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <!--
          This markup is cloned from a live-rendered receipt (sale/product
          data from the database) and is never sanitised, so a crafted
          product/customer name could otherwise smuggle in a remote
          <img>/<script> that beacons out when the receipt renders. There
          are no images, fonts, or other external resources in a receipt, so
          this CSP denies everything except inline styles. The main process
          also blocks non-data: requests at the session level; this is the
          second layer.
        -->
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'none'; style-src 'unsafe-inline';"
        />
        <title>Receipt</title>
        <style>
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
        </style>
      </head>
      <body>
        ${receiptHtml}
      </body>
    </html>
  `;
}
