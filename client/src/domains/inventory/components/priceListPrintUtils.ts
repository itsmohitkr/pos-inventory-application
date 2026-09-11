import type { PriceListLayout } from '@/domains/inventory/components/paperSizePresets';
import { buildLabelCss } from '@/domains/inventory/components/priceListLabelStyles';

interface BuildPriceListHtmlArgs {
  /** The live preview node; its .price-label-item children are cloned. */
  previewRoot?: HTMLElement | null;
  /** 'thermal' switches to continuous-roll page rules. */
  paperType: string;
  layout: PriceListLayout;
  /** CSS @page size value, e.g. 'A4' or '50mm 25mm'. */
  printPageSize: string;
  labelWidthMm: number;
  labelHeightMm: number;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
}

export const buildPriceListPrintableHtml = ({
  previewRoot,
  paperType,
  layout,
  printPageSize,
  labelWidthMm,
  labelHeightMm,
  marginTopMm,
  marginRightMm,
  marginBottomMm,
  marginLeftMm,
}: BuildPriceListHtmlArgs): string => {
  const labelElements = Array.from(previewRoot?.querySelectorAll('.price-label-item') || []);
  if (labelElements.length === 0) {
    return '';
  }

  const isThermalPrint = paperType === 'thermal';

  // The SVG is cloned exactly as the preview rendered it. It used to be
  // stretched to the label width, which threw away the configured Bar
  // Thickness and made the printout disagree with the preview.
  const printableLabels = (labelElements as Element[]).map(
    (element) => (element.cloneNode(true) as Element).outerHTML
  );

  const printableBody = isThermalPrint
    ? printableLabels
        .map(
          (labelHtml, index) => `
          <div class="thermal-label-page${index === printableLabels.length - 1 ? ' is-last-page' : ''}">
            ${labelHtml}
          </div>
        `
        )
        .join('')
    : `
          <div class="price-list-grid">
            ${printableLabels.join('')}
          </div>
        `;

  return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <!--
            This markup is assembled from database values (product names,
            prices) via outerHTML and is never sanitised, so a crafted product
            name could otherwise smuggle in a remote <img>/<script> that
            beacons out when the label sheet renders. Everything here is
            self-contained — inline styles and inline SVG barcodes — so the
            policy can deny all network origins outright. The main process
            also blocks non-data: requests at the session level; this is the
            second layer.
          -->
          <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:;"
          />
          <title>Price List Labels</title>
          <style>
            @media print {
              @page {
                size: ${printPageSize};
                margin: 0;
              }
              body {
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color: #000000;
                background: #ffffff;
              }
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              margin: 0;
              padding: 0;
              color: #000000;
              background: #ffffff;
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              width: ${isThermalPrint ? `${labelWidthMm}mm` : 'auto'};
            }

            /* Shared verbatim with the live preview — see priceListLabelStyles. */
            ${buildLabelCss({
              layout,
              labelWidthMm,
              labelHeightMm,
              marginTopMm,
              marginRightMm,
              marginBottomMm,
              marginLeftMm,
            })}

            /* Page breaks have no on-screen meaning, so they stay here. */
            .thermal-label-page {
              break-after: page;
              page-break-after: always;
            }

            .thermal-label-page.is-last-page {
              break-after: auto;
              page-break-after: auto;
            }
          </style>
        </head>
        <body>
          ${printableBody}
        </body>
      </html>
    `;
};
