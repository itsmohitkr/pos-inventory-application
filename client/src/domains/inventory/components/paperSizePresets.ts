export const PAPER_PRESETS = {
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
  thermal: [
    {
      id: 'thermal_50x25',
      name: 'Thermal Label (50mm x 25mm)',
      layout: {
        columns: 1, labelWidth: 50, labelHeight: 25,
        marginTop: 2, marginRight: 2, marginBottom: 2, marginLeft: 2,
        gapHorizontal: 2, gapVertical: 2,
        barcodeLineWidth: 1.1, barcodeHeight: 30, barcodeFormat: 'CODE128',
      },
    },
    {
      id: 'thermal_38x25',
      name: 'Thermal Label (38mm x 25mm)',
      layout: {
        columns: 1, labelWidth: 38, labelHeight: 25,
        marginTop: 2, marginRight: 2, marginBottom: 2, marginLeft: 2,
        gapHorizontal: 2, gapVertical: 2,
        barcodeLineWidth: 1.1, barcodeHeight: 26, barcodeFormat: 'CODE128',
      },
    },
  ],
};

export const DEFAULT_DISPLAY_OPTIONS = {
  mrp: true, salePrice: true, batchNumber: true, productName: true, barcode: true,
};

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

export const getPrimaryBarcode = (product) => {
  if (!product?.barcode) return '';
  return String(product.barcode).split('|').map((v) => v.trim()).filter(Boolean)[0] || '';
};

export const getPreviewBatch = (product) => {
  if (!Array.isArray(product?.batches) || product.batches.length === 0) return null;
  const inStockBatch = product.batches.find((batch) => Number(batch.quantity) > 0);
  return inStockBatch || product.batches[product.batches.length - 1] || null;
};

const estimateBarcodeModuleCount = (value, format) => {
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

export const getBarcodeReadabilityWarning = ({ value, format, lineWidth, labelWidthMm }) => {
  if (!value) return null;
  const innerLabelWidthMm = Math.max(10, labelWidthMm - 4.5);
  const availableWidthPx = innerLabelWidthMm * MM_TO_PX;
  const estimatedWidthPx = estimateBarcodeModuleCount(value, format) * Math.max(0.1, lineWidth);
  if (estimatedWidthPx > availableWidthPx * 0.92) return 'Barcode is too dense for the current label width.';
  if (lineWidth < 0.9 && labelWidthMm <= 40) return 'Barcode bars may print too thin for reliable scanning.';
  return null;
};
