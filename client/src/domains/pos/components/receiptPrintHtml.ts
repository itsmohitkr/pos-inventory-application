/**
 * Builds a standalone HTML document for printing a receipt through
 * `print-html-content` (an isolated, dedicated BrowserWindow — the same
 * mechanism already used successfully for barcode/price-list printing),
 * instead of `print-manual` (which prints from the main application window,
 * the same window the whole app's UI — sidebar, tables, everything — is
 * loaded into, just hidden via CSS visibility rules at print time).
 *
 * This exists to test a specific hypothesis: after four independent proofs
 * that the receipt's own rendered DOM/CSS is byte-identical between the POS
 * and Sale History screens, and after explicit `pageSize` was proven to have
 * no effect either way, the remaining unexplained inconsistency may be
 * caused by Chromium's print engine behaving differently depending on how
 * much *other* content shares the page being printed — even hidden content.
 * Printing from a page that contains nothing but the receipt removes that
 * variable entirely, matching the isolated-window pattern that has never
 * exhibited this bug for labels.
 *
 * Unlike price-list printing (which uses a hand-written stylesheet, see
 * priceListLabelStyles.ts), Receipt.tsx is styled via MUI's sx prop
 * (Emotion-generated CSS classes). Emotion inserts its generated rules as
 * `<style data-emotion="...">` tags in `document.head` — capturing all of
 * `document.head`'s <style> tags and embedding them verbatim, alongside the
 * receipt's own cloned outerHTML (including its own hand-written inline
 * <style> block from Receipt.tsx), reproduces the exact same styling in the
 * isolated print window without needing to rewrite Receipt.tsx.
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

  const styleTags = Array.from(document.head.querySelectorAll('style'))
    .map((style) => style.textContent || '')
    .join('\n');

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
          ${styleTags}
        </style>
      </head>
      <body>
        ${receiptHtml}
      </body>
    </html>
  `;
}
