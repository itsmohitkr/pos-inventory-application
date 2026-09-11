import type { Options as BarcodeOptions } from 'react-barcode';
import type { Batch, Product } from '@/shared/types/models';
import { LABEL_METRICS, getLineSpacing } from '@/domains/inventory/components/priceListLabelStyles';

/** The symbologies react-barcode accepts. */
export type BarcodeFormat = NonNullable<BarcodeOptions['format']>;

/** One selectable sheet preset. */
export interface PaperPresetOption {
  id: string;
  name: string;
  layout: PriceListLayout;
}

export const PAPER_PRESETS: Record<'a4' | 'thermal', PaperPresetOption[]> = {
  a4: [
    {
      id: 'a4_4x10',
      name: 'A4 Sheet (4 x 10 labels)',
      layout: {
        columns: 4, labelWidth: 45, labelHeight: 25,
        marginTop: 6, marginRight: 6, marginBottom: 6, marginLeft: 6,
        gapHorizontal: 3, gapVertical: 3,
        barcodeLineWidth: 1, barcodeHeight: 30, barcodeFormat: 'CODE128',
      },
    },
    {
      id: 'a4_5x13',
      name: 'A4 Sheet (5 x 13 labels - High Density)',
      layout: {
        columns: 5, labelWidth: 36, labelHeight: 21,
        marginTop: 6, marginRight: 6, marginBottom: 6, marginLeft: 6,
        gapHorizontal: 2.5, gapVertical: 2,
        barcodeLineWidth: 1.0, barcodeHeight: 25, barcodeFormat: 'CODE128',
      },
    },
    {
      id: 'a4_3x8',
      name: 'A4 Sheet (3 x 8 labels)',
      layout: {
        columns: 3, labelWidth: 63, labelHeight: 34,
        marginTop: 8, marginRight: 8, marginBottom: 8, marginLeft: 8,
        gapHorizontal: 4, gapVertical: 4,
        barcodeLineWidth: 1.2, barcodeHeight: 40, barcodeFormat: 'CODE128',
      },
    },
  ],
  // Thermal margins are a safe-area inset on each individual label, so on a
  // 25mm label every extra millimetre costs 4% of the usable height. 1mm still
  // absorbs normal printer registration drift.
  thermal: [
    {
      id: 'thermal_50x25',
      name: 'Thermal Label (50mm x 25mm)',
      layout: {
        columns: 1, labelWidth: 50, labelHeight: 25,
        marginTop: 1, marginRight: 2, marginBottom: 1, marginLeft: 2,
        gapHorizontal: 2, gapVertical: 2,
        barcodeLineWidth: 1.1, barcodeHeight: 30, barcodeFormat: 'CODE128',
      },
    },
    {
      id: 'thermal_38x25',
      name: 'Thermal Label (38mm x 25mm)',
      layout: {
        columns: 1, labelWidth: 38, labelHeight: 25,
        marginTop: 1, marginRight: 2, marginBottom: 1, marginLeft: 2,
        gapHorizontal: 2, gapVertical: 2,
        barcodeLineWidth: 1.1, barcodeHeight: 26, barcodeFormat: 'CODE128',
      },
    },
  ],
};

/**
 * Geometry for one label sheet, in millimetres unless the name says otherwise.
 * `textAlign` and `barcodeLineSpacing` are not in the presets below — they are
 * added by usePriceList when it seeds its state, hence optional.
 */
export interface PriceListLayout {
  columns: number;
  labelWidth: number;
  labelHeight: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  gapHorizontal: number;
  gapVertical: number;
  barcodeLineWidth: number;
  /** Pixels, not mm — passed straight to JsBarcode. */
  barcodeHeight: number;
  /** One of react-barcode's supported symbologies. */
  barcodeFormat: BarcodeFormat;
  barcodeLineSpacing?: number;
  textAlign?: string;
}

/** Which fields each label renders. */
export interface PriceListDisplayOptions {
  mrp: boolean;
  salePrice: boolean;
  batchNumber: boolean;
  productName: boolean;
  barcode: boolean;
}

/**
 * A shelf price tag is the barcode and the two prices; name and batch code are
 * opt-in. Keeping it to these three also leaves every stock preset with room
 * to spare, so a fresh install never opens on a "content is too tall" warning.
 */
export const DEFAULT_DISPLAY_OPTIONS: PriceListDisplayOptions = {
  mrp: true, salePrice: true, batchNumber: false, productName: false, barcode: true,
};

/** A4 portrait, the only sheet size the A4 mode prints to. */
export const A4_WIDTH_MM = 210;

export const PRICE_LIST_SETTINGS_KEY = 'posPriceListSettings';
export const MM_TO_PX = 3.7795275591;
export const MIN_PREVIEW_SCALE = 0.2;
export const PREVIEW_FIT_PADDING_PX = 36;
export const PREVIEW_FIT_SAFETY = 0.96;

export const getStoredSettings = () => {
  try {
    const stored = localStorage.getItem(PRICE_LIST_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    console.error('Failed to load stored price list settings');
    return null;
  }
};

export const getPrimaryBarcode = (product?: Product | null): string => {
  if (!product?.barcode) return '';
  return String(product.barcode).split('|').map((v) => v.trim()).filter(Boolean)[0] || '';
};

export const getPreviewBatch = (product?: Product | null): Batch | null => {
  if (!Array.isArray(product?.batches) || product.batches.length === 0) return null;
  const inStockBatch = product.batches.find((batch: Batch) => Number(batch.quantity) > 0);
  return inStockBatch || product.batches[product.batches.length - 1] || null;
};

const estimateBarcodeModuleCount = (value: string | number, format: string): number => {
  const length = String(value || '').length;
  switch (format) {
    case 'EAN13': case 'UPC': return 95;
    case 'EAN8': return 67;
    case 'ITF': return Math.max(40, length * 14 + 20);
    case 'MSI': return Math.max(40, length * 12 + 20);
    case 'pharmacode': return Math.max(32, length * 16);
    case 'CODE39': return Math.max(48, length * 16 + 35);
    case 'CODE128': default: return Math.max(55, length * 11 + 35);
  }
};

export const getBarcodeReadabilityWarning = ({
  value,
  format,
  lineWidth,
  labelWidthMm,
}: {
  value?: string | number;
  format: string;
  lineWidth: number;
  labelWidthMm: number;
}): string | null => {
  if (!value) return null;
  const innerLabelWidthMm = Math.max(10, labelWidthMm - 4.5);
  const availableWidthPx = innerLabelWidthMm * MM_TO_PX;
  const estimatedWidthPx = estimateBarcodeModuleCount(value, format) * Math.max(0.1, lineWidth);
  if (estimatedWidthPx > availableWidthPx * 0.92) return 'Barcode is too dense for the current label width.';
  if (lineWidth < 0.9 && labelWidthMm <= 40) return 'Barcode bars may print too thin for reliable scanning.';
  return null;
};

/**
 * Height the label's contents need, in px. Mirrors the metrics the shared
 * stylesheet lays the label out with — if one moves, so must the other, or the
 * fit warning drifts away from what actually renders.
 */
export const estimateLabelContentHeightPx = ({
  layout,
  displayOptions,
}: {
  layout: PriceListLayout;
  displayOptions: PriceListDisplayOptions;
}): number => {
  const {
    barcodeGapMm, barcodeTextFontPx, barcodeTextMarginPx,
    nameFontPx, nameLineHeight, nameGapMm, lineFontPx, lineMarginMm,
  } = LABEL_METRICS;

  let height = 0;
  if (displayOptions.barcode) {
    const barcodeHeightPx = Math.max(20, Number(layout.barcodeHeight) || 20);
    height += barcodeHeightPx + barcodeTextFontPx + barcodeTextMarginPx + barcodeGapMm * MM_TO_PX;
  }
  if (displayOptions.productName) {
    // The name is clamped to nameMaxLines and ellipsised, so its height does
    // not depend on how long the product is named.
    height += LABEL_METRICS.nameMaxLines * nameFontPx * nameLineHeight + nameGapMm * MM_TO_PX;
  }
  const lineSpacing = getLineSpacing(layout);
  const lineCount = [displayOptions.mrp, displayOptions.salePrice, displayOptions.batchNumber]
    .filter(Boolean).length;
  height += lineCount * (lineFontPx * lineSpacing + lineMarginMm * 2 * MM_TO_PX);
  return height;
};

/**
 * Warns when the chosen content cannot fit the label. Labels are fixed-height
 * and clip, so without this the last line is silently cut off against the
 * label edge and the shop only finds out after printing a roll.
 */
export const getLabelFitWarning = ({
  layout,
  displayOptions,
  labelHeightMm,
  isThermal,
  marginTopMm,
  marginBottomMm,
}: {
  layout: PriceListLayout;
  displayOptions: PriceListDisplayOptions;
  labelHeightMm: number;
  isThermal: boolean;
  marginTopMm: number;
  marginBottomMm: number;
}): string | null => {
  // On thermal each label is its own page, so the margins eat into the label.
  // On A4 they are sheet margins applied once to the whole grid.
  const marginsMm = isThermal ? marginTopMm + marginBottomMm : 0;
  const availablePx =
    (labelHeightMm - marginsMm) * MM_TO_PX - LABEL_METRICS.paddingVerticalMm * 2 * MM_TO_PX;
  const neededPx = estimateLabelContentHeightPx({ layout, displayOptions });
  if (neededPx <= availablePx) return null;

  const shortfallMm = Math.max(0.1, (neededPx - availablePx) / MM_TO_PX);
  return `Label content is about ${shortfallMm.toFixed(1)}mm too tall and the bottom line will be cut off. Increase Label Height, reduce Barcode Height, or uncheck a field under Label Content.`;
};

/** A4 layouts wider than the sheet are silently cropped by the printer. */
export const getPageWidthWarning = ({
  isThermal,
  previewPageWidthMm,
}: {
  isThermal: boolean;
  previewPageWidthMm: number;
}): string | null => {
  if (isThermal || previewPageWidthMm <= A4_WIDTH_MM) return null;
  const overflowMm = previewPageWidthMm - A4_WIDTH_MM;
  return `This layout is ${previewPageWidthMm.toFixed(0)}mm wide — ${overflowMm.toFixed(0)}mm wider than an A4 sheet. The right-hand column(s) will be cut off. Reduce Columns, Label Width, Horizontal Gap, or the side margins.`;
};
