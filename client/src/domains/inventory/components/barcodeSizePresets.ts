/** Label geometry for one barcode preset. `width` is the JsBarcode bar width. */
export interface BarcodeSizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  horizontal: number;
  vertical: number;
  cols: number;
}

/** Sheet dimensions when 'custom' is selected instead of a preset. */
export interface BarcodeCustomDimensions {
  width: number;
  height: number;
  cols: number;
}

export interface BarcodeMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BarcodeSpacing {
  horizontal: number;
  vertical: number;
}

/** Which lines each label prints besides the barcode itself. */
export interface BarcodeContentOptions {
  productName: boolean;
  mrp: boolean;
  sellingPrice: boolean;
  discount: boolean;
  shopName: boolean;
}

export const DEFAULT_SIZES: Record<string, BarcodeSizePreset> = {
  '50x25': {
    id: '50x25',
    label: '50mm x 25mm (2-inch)',
    width: 2,
    height: 50,
    horizontal: 2,
    vertical: 2,
    cols: 1,
  },
  '38x25': {
    id: '38x25',
    label: '38mm x 25mm (1.5-inch)',
    width: 1.6,
    height: 40,
    horizontal: 2,
    vertical: 2,
    cols: 1,
  },
  '100x150': {
    id: '100x150',
    label: '100mm x 150mm (Shipping)',
    width: 3,
    height: 100,
    horizontal: 0,
    vertical: 0,
    cols: 1,
  },
  a4_sheet: {
    id: 'a4_sheet',
    label: 'A4 Sticky Sheet (3x8)',
    width: 1.8,
    height: 40,
    horizontal: 5,
    vertical: 5,
    cols: 3,
  },
};
