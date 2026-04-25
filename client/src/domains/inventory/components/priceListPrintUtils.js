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
}) => {
  const labelElements = Array.from(previewRoot?.querySelectorAll('@/domains/inventory/components/.price-label-item') || []);
  if (labelElements.length === 0) {
    return '';
  }

  const isThermalPrint = paperType === 'thermal';
  const barcodeHeightPx = Math.max(20, Number(layout.barcodeHeight) || 20);
  const barcodeLineSpacing = Math.max(0.8, Number(layout.barcodeLineSpacing) || 1.1);

  const printableLabels = labelElements.map((element) => {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('svg').forEach((svg) => {
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', `${barcodeHeightPx}px`);
      svg.setAttribute('preserveAspectRatio', 'none');
    });
    return clone.outerHTML;
  });

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

            .price-list-grid {
              display: grid;
              width: max-content;
              max-width: 100%;
              grid-template-columns: repeat(${Math.max(1, Number(layout.columns) || 1)}, ${labelWidthMm}mm);
              column-gap: ${Math.max(0, Number(layout.gapHorizontal) || 0)}mm;
              row-gap: ${Math.max(0, Number(layout.gapVertical) || 0)}mm;
              padding: ${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm;
              justify-content: flex-start;
            }

            .thermal-label-page {
              width: ${labelWidthMm}mm;
              height: ${labelHeightMm}mm;
              box-sizing: border-box;
              padding: ${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm;
              overflow: hidden;
              break-after: page;
              page-break-after: always;
            }

            .thermal-label-page.is-last-page {
              break-after: auto;
              page-break-after: auto;
            }

            .price-label-item {
              width: ${labelWidthMm}mm;
              min-height: ${labelHeightMm}mm;
              border: none !important;
              border-radius: 0;
              padding: 1.2mm 1.6mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              background: #ffffff;
              text-align: ${layout.textAlign || 'left'};
              overflow: hidden;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .thermal-label-page .price-label-item {
              width: 100% !important;
              min-height: 100% !important;
              height: 100%;
              padding: 0.8mm 1.4mm;
            }

            .barcode-block {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
              padding: 0 1.2mm;
              margin-bottom: 0.8mm;
            }

            .price-label-item svg {
              display: block;
              width: 100% !important;
              height: ${barcodeHeightPx}px !important;
              shape-rendering: crispEdges;
              text-rendering: geometricPrecision;
            }

            .price-label-item svg text {
              letter-spacing: 0.2px;
            }

            .label-line {
              font-size: 10px;
              line-height: ${barcodeLineSpacing};
              margin: 0.35mm 0;
              word-break: break-all;
              display: block;
              color: #000000;
            }

            .label-name {
              font-weight: 700;
              font-size: 11px;
              line-height: 1.1;
              max-height: 2.3em;
              overflow: hidden;
              margin-bottom: 0.8mm;
              color: #000000;
            }
          </style>
        </head>
        <body>
          ${printableBody}
        </body>
      </html>
    `;
};
