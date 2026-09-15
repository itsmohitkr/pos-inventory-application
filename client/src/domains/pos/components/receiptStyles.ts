import type { getReceiptTheme } from '@/domains/pos/components/receiptUtils';

type ReceiptTheme = ReturnType<typeof getReceiptTheme>;

interface BuildReceiptCssArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, any>;
  theme: ReceiptTheme;
  printableWidth: string;
  paperSize: string;
  marginTop: string;
  marginBottom: string;
  marginSide: string;
}

/**
 * The receipt's appearance, in one plain stylesheet shared verbatim by every
 * on-screen render (POS, Sale History, Bill Preview, Customize Bill) and by
 * whatever print document clones the rendered markup. Receipt.tsx renders
 * structure + className only (no MUI `sx`/`Typography`) so there is no
 * Emotion-generated class whose cascade position depends on the app's render
 * history — this stylesheet is embedded directly alongside the markup it
 * styles and travels with it wherever that markup is cloned.
 *
 * Page-level print rules (visibility, @page-equivalent positioning) have no
 * on-screen meaning and stay in Receipt.tsx's own trailing helper block,
 * mirroring priceListLabelStyles.ts's split between label appearance (here)
 * and page/print mechanics (priceListPrintUtils.ts).
 */
export const buildReceiptCss = ({
  config,
  theme,
  printableWidth,
  marginTop,
  marginBottom,
  marginSide,
}: BuildReceiptCssArgs): string => {
  const fontSize = `${config.fontSize || 0.8}rem`;
  const itemFontSize = `${config.itemFontSize || 0.8}rem`;
  const lineHeight = config.lineHeight || 1.1;
  const titleAlign = config.titleAlign || 'center';
  const headerAlign = config.headerAlign || 'center';
  const footerAlign = config.footerAlign || 'center';

  return `
    .receipt-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: #ffffff;
    }

    .receipt-content {
      width: ${printableWidth};
      box-sizing: border-box;
      padding: ${marginTop} ${marginSide} ${marginBottom} ${marginSide};
      background-color: #ffffff;
      color: #000000;
      font-family: ${theme.fontFamily};
      font-size: ${fontSize};
      line-height: ${lineHeight};
    }

    /* Relaxed thermal-printer sharpness hacks. */
    .receipt-content * {
      color: #000000 !important;
      text-shadow: none !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @media print {
      .receipt-container {
        background-color: #ffffff;
        width: 100%;
      }

      .receipt-content {
        display: block !important;
        width: ${printableWidth};
        max-width: ${printableWidth};
        margin: 0 auto;
        box-sizing: border-box;
      }
    }

    .receipt-header-block {
      margin-bottom: 2.4px;
    }

    .receipt-shop-name {
      font-weight: 900;
      font-size: 1.25em;
      letter-spacing: -0.02em;
      margin: 0 0 1.6px 0;
      text-align: ${titleAlign};
    }

    .receipt-header-lines {
      text-align: ${headerAlign};
    }

    .receipt-header-line {
      font-size: 0.9em;
      font-weight: ${theme.textWeight};
      margin: 0 0 0.8px 0;
    }

    .receipt-tel-line {
      font-size: 0.85em;
      font-weight: ${theme.textWeight};
      margin: 0;
    }

    .receipt-invoice-label {
      font-weight: ${theme.headerWeight};
      font-size: 1em;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: center;
      margin: 0;
    }

    .receipt-sale-info-block {
      margin-bottom: 4px;
    }

    .receipt-bill-info-row {
      display: flex;
      justify-content: space-between;
    }

    .receipt-bill-no {
      font-size: 0.85em;
      font-weight: ${theme.boldWeight};
      margin: 0;
    }

    .receipt-sale-info-line {
      font-size: 0.85em;
      margin: 0;
    }

    .receipt-customer-block {
      margin-top: 4px;
      border-top: 1px dashed #ccc;
      padding-top: 4px;
    }

    .receipt-items-table {
      width: 100%;
      font-size: ${itemFontSize};
      border-collapse: collapse;
      color: #000000;
    }

    .receipt-totals-block {
      margin-left: auto;
      width: 100%;
      color: #000000;
    }

    .receipt-totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.6px;
    }

    .receipt-totals-row--start {
      justify-content: flex-start;
    }

    .receipt-items-summary {
      font-size: 0.9em;
      font-weight: ${theme.textWeight};
      margin: 0;
    }

    .receipt-subtotal-text {
      font-size: 1em;
      font-weight: ${theme.textWeight};
      margin: 0;
    }

    .receipt-discount-text {
      font-size: 0.9em;
      font-weight: ${theme.boldWeight};
      margin: 0;
    }

    .receipt-roundoff-label {
      font-size: 0.9em;
      font-style: italic;
      margin: 0;
    }

    .receipt-roundoff-value {
      font-size: 0.9em;
      margin: 0;
    }

    .receipt-grand-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2.4px 0;
    }

    .receipt-grand-total-label {
      font-weight: 900;
      font-size: 1.1em;
      margin: 0;
    }

    .receipt-grand-total-value {
      font-weight: 900;
      font-size: 1.25em;
      margin: 0;
    }

    .receipt-savings-box {
      border: 2px solid #000000;
      padding: 6.4px;
      margin-top: 8px;
      text-align: center;
      border-radius: 4px;
    }

    .receipt-savings-text {
      font-weight: 400;
      font-size: 1em;
      letter-spacing: 0.05em;
      margin: 0;
    }

    .receipt-footer-block {
      text-align: ${footerAlign};
      margin-top: 2.4px;
    }

    .receipt-footer-line {
      font-weight: ${theme.boldWeight};
      font-size: 1em;
      margin: 0 0 1.6px 0;
    }

    .receipt-footer-line--secondary {
      font-weight: ${theme.boldWeight};
      font-size: 0.9em;
      margin: 0 0 1.6px 0;
    }

    .receipt-branding {
      font-size: 0.85em;
      font-weight: ${theme.boldWeight};
      display: block;
      margin-top: 8px;
      opacity: 0.7;
    }
  `;
};
