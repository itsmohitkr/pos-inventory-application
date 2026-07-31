import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Sentry from '@sentry/react';
import { loadPrinters } from '@/shared/hooks/usePrinters';
import inventoryService from '@/shared/api/inventoryService';
import { isRequestCanceled } from '@/shared/api/api';
import {
  PAPER_PRESETS, DEFAULT_DISPLAY_OPTIONS, PRICE_LIST_SETTINGS_KEY,
  MM_TO_PX, MIN_PREVIEW_SCALE, PREVIEW_FIT_PADDING_PX, PREVIEW_FIT_SAFETY,
  getStoredSettings, getPrimaryBarcode, getPreviewBatch, getBarcodeReadabilityWarning,
} from '@/domains/inventory/components/paperSizePresets';
import type {
  PriceListDisplayOptions,
  PriceListLayout,
} from '@/domains/inventory/components/paperSizePresets';
import type { Batch, Product } from '@/shared/types/models';
import type { PrinterInfo } from '@/domains/settings/hooks/useSettings';

/** The two paper families PAPER_PRESETS is keyed by. */
type PaperType = keyof typeof PAPER_PRESETS;

/** One product queued for printing, with how many copies. */
export interface PriceListSelection {
  productId: number;
  quantity: number;
}

/** A selection resolved against the product list, ready to render. */
export interface PriceListRow {
  product: Product;
  quantity: number;
  batch: Batch | null;
  barcodeValue: string;
}

/** A readability problem for one product's barcode at the current label size. */
export interface BarcodeWarning {
  id: number;
  productName: string;
  message: string;
}

/** One physical label in the preview — a row repeated per copy. */
export interface PriceListLabel {
  id: string;
  product: Product;
  batch: Batch | null;
  barcodeValue: string;
  copyNumber: number;
}

export default function usePriceList(open: boolean) {
  const initialSettings = useMemo(() => getStoredSettings(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<PriceListSelection[]>([]);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState(initialSettings?.selectedPrinter || '');
  const [paperType, setPaperType] = useState(initialSettings?.paperType || 'a4');
  const [paperPreset, setPaperPreset] = useState(initialSettings?.paperPreset || PAPER_PRESETS.a4[0].id);
  const [layout, setLayout] = useState<PriceListLayout>(() => {
    if (initialSettings?.layout) return initialSettings.layout;
    return { ...PAPER_PRESETS.a4[0].layout, textAlign: 'left', barcodeLineSpacing: 1.25, barcodeFormat: 'CODE128' };
  });
  const [displayOptions, setDisplayOptions] = useState(initialSettings?.displayOptions || DEFAULT_DISPLAY_OPTIONS);
  const [showAdvancedLayout, setShowAdvancedLayout] = useState(false);
  const [printError, setPrintError] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [printNotice, setPrintNotice] = useState({ open: false, message: '', severity: 'info' });
  const [previewScale, setPreviewScale] = useState(1);
  const [autoFit, setAutoFit] = useState(true);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((product) => map.set(String(product.id), product));
    return map;
  }, [products]);

  const selectedProductOptions = useMemo(
    () =>
      selectedProducts
        .map((item) => productById.get(String(item.productId)))
        .filter((product): product is Product => product !== undefined),
    [productById, selectedProducts]
  );

  const selectedRows = useMemo(
    () =>
      selectedProducts
        .map((item): PriceListRow | null => {
          const product = productById.get(String(item.productId));
          if (!product) return null;
          return {
            product,
            quantity: Math.max(1, Number(item.quantity) || 1),
            batch: getPreviewBatch(product),
            barcodeValue: getPrimaryBarcode(product),
          };
        })
        .filter((row): row is PriceListRow => row !== null),
    [productById, selectedProducts]
  );

  const previewLabels = useMemo(() => {
    const labels: PriceListLabel[] = [];
    selectedRows.forEach((row) => {
      for (let copy = 0; copy < row.quantity; copy += 1) {
        labels.push({
          id: `${row.product.id}-${copy}`,
          product: row.product,
          batch: row.batch,
          barcodeValue: row.barcodeValue,
          copyNumber: copy + 1,
        });
      }
    });
    return labels;
  }, [selectedRows]);

  const totalLabelCount = previewLabels.length;
  const missingBarcodeCount = selectedRows.filter((row) => !row.barcodeValue).length;
  const labelWidthMm = Math.max(20, Number(layout.labelWidth) || 20);
  const labelHeightMm = Math.max(15, Number(layout.labelHeight) || 15);
  const marginTopMm = Math.max(0, Number(layout.marginTop) || 0);
  const marginRightMm = Math.max(0, Number(layout.marginRight) || 0);
  const marginBottomMm = Math.max(0, Number(layout.marginBottom) || 0);
  const marginLeftMm = Math.max(0, Number(layout.marginLeft) || 0);
  const isThermalPreview = paperType === 'thermal';
  const printPageSize = paperType === 'thermal' ? `${labelWidthMm}mm ${labelHeightMm}mm` : 'A4';

  const barcodeWarnings = useMemo<BarcodeWarning[]>(() => {
    if (!displayOptions.barcode) return [];
    return selectedRows
      .map((row): BarcodeWarning | null => {
        const message = getBarcodeReadabilityWarning({
          value: row.barcodeValue,
          format: layout.barcodeFormat || 'CODE128',
          lineWidth: Number(layout.barcodeLineWidth) || 0.7,
          labelWidthMm,
        });
        if (!message) return null;
        return { id: row.product.id, productName: row.product.name, message };
      })
      .filter((warning): warning is BarcodeWarning => warning !== null);
  }, [displayOptions.barcode, selectedRows, layout.barcodeFormat, layout.barcodeLineWidth, labelWidthMm]);

  const previewPageWidthMm = useMemo(() => {
    const columns = Math.max(1, Number(layout.columns) || 1);
    const labelWidth = Math.max(20, Number(layout.labelWidth) || 20);
    const marginLeft = Math.max(0, Number(layout.marginLeft) || 0);
    const marginRight = Math.max(0, Number(layout.marginRight) || 0);
    const gapHorizontal = Math.max(0, Number(layout.gapHorizontal) || 0);
    return marginLeft + marginRight + columns * labelWidth + Math.max(0, columns - 1) * gapHorizontal;
  }, [layout.columns, layout.labelWidth, layout.marginLeft, layout.marginRight, layout.gapHorizontal]);

  const previewPageWidthPx = useMemo(() => Math.max(1, previewPageWidthMm * MM_TO_PX), [previewPageWidthMm]);
  const activePreviewScale = paperType === 'a4' ? previewScale : 1;

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    setLoadingProducts(true);
    try {
      const data = await inventoryService.fetchProducts({ includeBatches: true, category: 'all' }, { signal });
      const rows = Array.isArray(data?.data) ? data.data : [];
      setProducts([...rows].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))));
    } catch (error) {
      if (isRequestCanceled(error)) return;
      Sentry.captureException(error, { tags: { feature: 'price-list-fetch-products' } });
      console.error('Failed to load products for price list:', error);
      setProducts([]);
    } finally {
      if (!signal?.aborted) setLoadingProducts(false);
    }
  }, []);

  // Goes through the shared cache so opening this dialog does not re-hit the
  // OS spooler when another component has already enumerated. `force` on the
  // explicit refresh button so the user can still pick up a newly-connected
  // printer without restarting.
  const fetchPrinters = useCallback(async (force = false) => {
    if (!window.electron?.ipcRenderer) { setPrinters([]); return; }
    const { printers: normalized, defaultPrinter } = await loadPrinters(force);
    setPrinters(normalized);
    setSelectedPrinter((current: string) => current || defaultPrinter || '');
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    fetchProducts(controller.signal);
    fetchPrinters();
    return () => controller.abort();
  }, [open, fetchProducts, fetchPrinters]);

  useEffect(() => {
    localStorage.setItem(PRICE_LIST_SETTINGS_KEY, JSON.stringify({
      selectedPrinter, paperType, paperPreset, layout, displayOptions,
    }));
  }, [selectedPrinter, paperType, paperPreset, layout, displayOptions]);

  useEffect(() => {
    if (!open) return undefined;
    const previewElement = previewContainerRef.current;
    if (!previewElement) return undefined;

    const updatePreviewScale = () => {
      if (paperType !== 'a4' || !autoFit) return;
      const availableWidthPx = Math.max(0, previewElement.clientWidth - PREVIEW_FIT_PADDING_PX);
      const fitScale = Math.min(1, availableWidthPx / previewPageWidthPx) * PREVIEW_FIT_SAFETY;
      setPreviewScale(Math.max(MIN_PREVIEW_SCALE, Number(fitScale.toFixed(3))));
    };

    updatePreviewScale();
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updatePreviewScale);
      resizeObserver.observe(previewElement);
    }
    window.addEventListener('resize', updatePreviewScale);
    return () => {
      window.removeEventListener('resize', updatePreviewScale);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [open, paperType, previewPageWidthPx, autoFit]);

  const handleZoomIn = () => { setAutoFit(false); setPreviewScale((prev) => Math.min(3, prev + 0.1)); };
  const handleZoomOut = () => { setAutoFit(false); setPreviewScale((prev) => Math.max(MIN_PREVIEW_SCALE, prev - 0.1)); };
  const handleFitToWidth = () => {
    setAutoFit(true);
    const container = previewContainerRef.current;
    if (container && paperType === 'a4') {
      const availableWidthPx = Math.max(0, container.clientWidth - PREVIEW_FIT_PADDING_PX);
      const fitScale = Math.min(1.5, availableWidthPx / previewPageWidthPx) * PREVIEW_FIT_SAFETY;
      setPreviewScale(Math.max(MIN_PREVIEW_SCALE, Number(fitScale.toFixed(3))));
    }
  };

  const applyPreset = (nextType: PaperType, nextPreset: string) => {
    const preset = PAPER_PRESETS[nextType].find((item) => item.id === nextPreset);
    if (!preset) return;
    setPaperType(nextType);
    setPaperPreset(nextPreset);
    setLayout((current: PriceListLayout) => ({
      ...preset.layout,
      textAlign: current.textAlign,
      barcodeLineSpacing: current.barcodeLineSpacing,
    }));
  };

  const handlePaperTypeChange = (event: { target: { value: string } }) => {
    const nextType = event.target.value as PaperType;
    applyPreset(nextType, PAPER_PRESETS[nextType][0].id);
  };

  const handlePresetChange = (event: { target: { value: string } }) =>
    applyPreset(paperType, event.target.value);

  const handleProductSelectionChange = (_event: unknown, nextProducts: Product[]) => {
    setSelectedProducts((current) =>
      nextProducts.map((product) => {
        const existing = current.find((item) => String(item.productId) === String(product.id));
        return { productId: product.id, quantity: existing?.quantity || 1 };
      })
    );
  };

  const handleQuantityChange = (productId: number, rawValue: string | number) => {
    const parsed = Math.max(1, Number(rawValue) || 1);
    setSelectedProducts((current) =>
      current.map((item) =>
        String(item.productId) !== String(productId) ? item : { ...item, quantity: parsed }
      )
    );
  };

  const handleIncreaseQuantity = (productId: number) => {
    setSelectedProducts((current) =>
      current.map((item) =>
        String(item.productId) !== String(productId)
          ? item
          : { ...item, quantity: Math.max(1, Number(item.quantity) || 1) + 1 }
      )
    );
  };

  const handleDecreaseQuantity = (productId: number) => {
    setSelectedProducts((current) =>
      current.map((item) =>
        String(item.productId) !== String(productId)
          ? item
          : { ...item, quantity: Math.max(1, (Number(item.quantity) || 1) - 1) }
      )
    );
  };

  const handleRemoveSelectedProduct = (productId: number) => {
    setSelectedProducts((current) =>
      current.filter((item) => String(item.productId) !== String(productId))
    );
  };

  const handleDisplayOptionChange = (field: keyof PriceListDisplayOptions) => {
    setDisplayOptions((current: PriceListDisplayOptions) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  return {
    // data
    products, loadingProducts, printers, selectedPrinter, setSelectedPrinter,
    // paper config
    paperType, paperPreset, layout, setLayout, showAdvancedLayout, setShowAdvancedLayout,
    displayOptions,
    // computed
    selectedProductOptions, selectedRows, previewLabels,
    totalLabelCount, missingBarcodeCount,
    labelWidthMm, labelHeightMm, marginTopMm, marginRightMm, marginBottomMm, marginLeftMm,
    isThermalPreview, printPageSize, barcodeWarnings, previewPageWidthMm,
    activePreviewScale, autoFit,
    // print feedback
    printError, setPrintError, printNotice, setPrintNotice,
    isPrinting, setIsPrinting,
    // refs
    previewRef, previewContainerRef,
    // handlers
    fetchPrinters,
    handleZoomIn, handleZoomOut, handleFitToWidth,
    handlePaperTypeChange, handlePresetChange,
    handleProductSelectionChange, handleQuantityChange,
    handleIncreaseQuantity, handleDecreaseQuantity,
    handleRemoveSelectedProduct, handleDisplayOptionChange,
    // for print handler in parent
    getPrimaryBarcode,
  };
}
