import type { PriceListLayout } from '@/domains/inventory/components/paperSizePresets';

/**
 * Every metric the label's interior is built from. The preview and the print
 * document share one stylesheet generated from these, so a value changed here
 * moves both. Pixel values are only used where the barcode SVG forces them —
 * JsBarcode sizes itself in px — everything else is mm so screen and paper
 * agree.
 */
export const LABEL_METRICS = {
  paddingVerticalMm: 0.5,
  paddingHorizontalMm: 1.2,
  /** Space between the barcode block and the first text line. */
  barcodeGapMm: 0.3,
  /** Passed to react-barcode; part of the SVG's own height. */
  barcodeTextFontPx: 9,
  barcodeTextMarginPx: 1,
  nameFontPx: 10,
  nameLineHeight: 1.1,
  /* One line, ellipsised. A wrapping name made the label's height depend on
     how long the product happened to be named, which silently pushed the price
     off the bottom of fixed-height stock for exactly the long names a grocery
     catalogue is full of. */
  nameMaxLines: 1,
  nameGapMm: 0.25,
  /* The price is the one thing a customer actually reads off the tag, so this
     stays readable even though shrinking it would buy the most space. */
  lineFontPx: 9.5,
  lineMarginMm: 0.06,
  defaultLineSpacing: 1.25,
} as const;

export const getLineSpacing = (layout: PriceListLayout): number =>
  Math.max(0.8, Number(layout.barcodeLineSpacing) || LABEL_METRICS.defaultLineSpacing);

interface BuildLabelCssArgs {
  layout: PriceListLayout;
  labelWidthMm: number;
  labelHeightMm: number;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
}

/**
 * The label stylesheet, shared verbatim by the live preview and the print
 * document. Printing clones the preview's `.price-label-item` nodes, but
 * emotion's generated classes never reach the print window — so anything
 * styled through `sx` would silently vanish on paper. Keeping every rule that
 * decides how a label *looks* in this one string is what actually makes the
 * preview WYSIWYG; page-level rules (`@page`, page breaks) stay in
 * priceListPrintUtils since they have no on-screen meaning.
 */
export const buildLabelCss = ({
  layout,
  labelWidthMm,
  labelHeightMm,
  marginTopMm,
  marginRightMm,
  marginBottomMm,
  marginLeftMm,
}: BuildLabelCssArgs): string => {
  const {
    paddingVerticalMm,
    paddingHorizontalMm,
    barcodeGapMm,
    nameFontPx,
    nameLineHeight,
    nameMaxLines,
    nameGapMm,
    lineFontPx,
    lineMarginMm,
  } = LABEL_METRICS;

  const columns = Math.max(1, Number(layout.columns) || 1);
  const gapHorizontal = Math.max(0, Number(layout.gapHorizontal) || 0);
  const gapVertical = Math.max(0, Number(layout.gapVertical) || 0);
  const lineSpacing = getLineSpacing(layout);
  const textAlign = layout.textAlign || 'left';

  return `
    .price-list-grid {
      display: grid;
      width: max-content;
      max-width: 100%;
      grid-template-columns: repeat(${columns}, ${labelWidthMm}mm);
      column-gap: ${gapHorizontal}mm;
      row-gap: ${gapVertical}mm;
      padding: ${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm;
      justify-content: flex-start;
      box-sizing: border-box;
    }

    .thermal-label-page {
      width: ${labelWidthMm}mm;
      height: ${labelHeightMm}mm;
      padding: ${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm;
      box-sizing: border-box;
      overflow: hidden;
      background: #ffffff;
    }

    .price-label-item {
      width: ${labelWidthMm}mm;
      height: ${labelHeightMm}mm;
      box-sizing: border-box;
      padding: ${paddingVerticalMm}mm ${paddingHorizontalMm}mm;
      display: flex;
      flex-direction: column;
      /* Never centre: when content is taller than the label the overflow must
         fall off the bottom only. Centring would shave the top off the
         barcode, which is the one part that has to stay scannable. */
      justify-content: flex-start;
      background: #ffffff;
      border: none;
      text-align: ${textAlign};
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .thermal-label-page .price-label-item {
      width: 100%;
      height: 100%;
    }

    .barcode-block {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      width: 100%;
      margin-bottom: ${barcodeGapMm}mm;
      flex-shrink: 0;
    }

    /* No width override — react-barcode's natural width is exactly the
       configured Bar Thickness times the module count. Stretching it to the
       label would silently discard that setting. */
    .price-label-item svg {
      display: block;
      max-width: 100%;
      shape-rendering: crispEdges;
      text-rendering: geometricPrecision;
    }

    .price-label-item svg text {
      letter-spacing: 0.2px;
    }

    .label-lines {
      display: block;
      text-align: ${textAlign};
    }

    .label-line {
      display: block;
      margin: ${lineMarginMm}mm 0;
      font-size: ${lineFontPx}px;
      line-height: ${lineSpacing};
      text-align: ${textAlign};
      word-break: break-word;
      color: #000000;
    }

    .label-name {
      display: block;
      margin: 0 0 ${nameGapMm}mm 0;
      font-size: ${nameFontPx}px;
      font-weight: 700;
      line-height: ${nameLineHeight};
      height: ${(nameMaxLines * nameLineHeight).toFixed(2)}em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: ${textAlign};
      color: #000000;
    }
  `;
};
