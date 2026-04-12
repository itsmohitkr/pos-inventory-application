import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import inventoryService from '../../shared/api/inventoryService';
import { isRequestCanceled } from '../../shared/api/api';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PriceListConfigurationPanel from './PriceListConfigurationPanel';
import PriceListPreviewPanel from './PriceListPreviewPanel';
import PriceListLabelCard from './PriceListLabelCard';
import { buildPriceListPrintableHtml } from './priceListPrintUtils';

const PAPER_PRESETS = {
  a4: [
    {
      id: 'a4_4x10',
      name: 'A4 Sheet (4 x 10 labels)',
      layout: {
        columns: 4,
        labelWidth: 45,
        labelHeight: 25,
        marginTop: 6,
        marginRight: 6,
        marginBottom: 6,
        marginLeft: 6,
        gapHorizontal: 3,
        gapVertical: 3,
        barcodeLineWidth: 1,
        barcodeHeight: 30,
        barcodeFormat: 'CODE128',
      },
    },
    {
      id: 'a4_5x13',
      name: 'A4 Sheet (5 x 13 labels - High Density)',
      layout: {
        columns: 5,
        labelWidth: 36,
        labelHeight: 21,
        marginTop: 6,
        marginRight: 6,
        marginBottom: 6,
        marginLeft: 6,
        gapHorizontal: 2.5,
        gapVertical: 2,
        barcodeLineWidth: 1.0,
        barcodeHeight: 25,
        barcodeFormat: 'CODE128',
      },
    },
    {
      id: 'a4_3x8',
      name: 'A4 Sheet (3 x 8 labels)',
      layout: {
        columns: 3,
        labelWidth: 63,
        labelHeight: 34,
        marginTop: 8,
        marginRight: 8,
        marginBottom: 8,
        marginLeft: 8,
        gapHorizontal: 4,
        gapVertical: 4,
        barcodeLineWidth: 1.2,
        barcodeHeight: 40,
        barcodeFormat: 'CODE128',
      },
    },
  ],
  thermal: [
    {
      id: 'thermal_50x25',
      name: 'Thermal Label (50mm x 25mm)',
      layout: {
        columns: 1,
        labelWidth: 50,
        labelHeight: 25,
        marginTop: 2,
        marginRight: 2,
        marginBottom: 2,
        marginLeft: 2,
        gapHorizontal: 2,
        gapVertical: 2,
        barcodeLineWidth: 1.1,
        barcodeHeight: 30,
        barcodeFormat: 'CODE128',
      },
    },
    {
      id: 'thermal_38x25',
      name: 'Thermal Label (38mm x 25mm)',
      layout: {
        columns: 1,
        labelWidth: 38,
        labelHeight: 25,
        marginTop: 2,
        marginRight: 2,
        marginBottom: 2,
        marginLeft: 2,
        gapHorizontal: 2,
        gapVertical: 2,
        barcodeLineWidth: 1.1,
        barcodeHeight: 26,
        barcodeFormat: 'CODE128',
      },
    },
  ],
};

const DEFAULT_DISPLAY_OPTIONS = {
  mrp: true,
  salePrice: true,
  batchNumber: true,
  productName: true,
  barcode: true,
};

const PRICE_LIST_SETTINGS_KEY = 'posPriceListSettings';

const getStoredSettings = () => {
  try {
    const stored = localStorage.getItem(PRICE_LIST_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load stored price list settings:', error);
    return null;
  }
};

const MM_TO_PX = 3.7795275591;
const MIN_PREVIEW_SCALE = 0.2;
const PREVIEW_FIT_PADDING_PX = 36;
const PREVIEW_FIT_SAFETY = 0.96;

const getPrimaryBarcode = (product) => {
  if (!product?.barcode) {
    return '';
  }
  const barcodes = String(product.barcode)
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean);
  return barcodes[0] || '';
};

const getPreviewBatch = (product) => {
  if (!Array.isArray(product?.batches) || product.batches.length === 0) {
    return null;
  }

  const inStockBatch = product.batches.find((batch) => Number(batch.quantity) > 0);
  if (inStockBatch) {
    return inStockBatch;
  }

  return product.batches[product.batches.length - 1] || null;
};

const estimateBarcodeModuleCount = (value, format) => {
  const length = String(value || '').length;

  switch (format) {
    case 'EAN13':
    case 'UPC':
      return 95;
    case 'EAN8':
      return 67;
    case 'ITF':
      return Math.max(40, length * 14 + 20);
    case 'MSI':
      return Math.max(40, length * 12 + 20);
    case 'pharmacode':
      return Math.max(32, length * 16);
    case 'CODE39':
      return Math.max(48, length * 16 + 35);
    case 'CODE128':
    default:
      return Math.max(55, length * 11 + 35);
  }
};

const getBarcodeReadabilityWarning = ({ value, format, lineWidth, labelWidthMm }) => {
  if (!value) {
    return null;
  }

  const innerLabelWidthMm = Math.max(10, labelWidthMm - 4.5);
  const availableWidthPx = innerLabelWidthMm * MM_TO_PX;
  const estimatedWidthPx = estimateBarcodeModuleCount(value, format) * Math.max(0.1, lineWidth);

  if (estimatedWidthPx > availableWidthPx * 0.92) {
    return 'Barcode is too dense for the current label width.';
  }

  if (lineWidth < 0.9 && labelWidthMm <= 40) {
    return 'Barcode bars may print too thin for reliable scanning.';
  }

  return null;
};

const PriceListPanel = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [printers, setPrinters] = useState([]);

  // Persistence Loading
  const initialSettings = useMemo(() => getStoredSettings(), []);

  const [selectedPrinter, setSelectedPrinter] = useState(initialSettings?.selectedPrinter || '');

  const [paperType, setPaperType] = useState(initialSettings?.paperType || 'a4');
  const [paperPreset, setPaperPreset] = useState(
    initialSettings?.paperPreset || PAPER_PRESETS.a4[0].id
  );
  const [layout, setLayout] = useState(() => {
    if (initialSettings?.layout) return initialSettings.layout;
    return {
      ...PAPER_PRESETS.a4[0].layout,
      textAlign: 'left',
      barcodeLineSpacing: 1.25,
      barcodeFormat: 'CODE128',
    };
  });

  const [displayOptions, setDisplayOptions] = useState(
    initialSettings?.displayOptions || DEFAULT_DISPLAY_OPTIONS
  );

  const [showAdvancedLayout, setShowAdvancedLayout] = useState(false);
  const [printError, setPrintError] = useState('');
  const [printNotice, setPrintNotice] = useState({ open: false, message: '', severity: 'info' });
  const [previewScale, setPreviewScale] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const previewRef = useRef(null);
  const previewContainerRef = useRef(null);

  const productById = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      map.set(String(product.id), product);
    });
    return map;
  }, [products]);

  const selectedProductOptions = useMemo(() => {
    return selectedProducts.map((item) => productById.get(String(item.productId))).filter(Boolean);
  }, [productById, selectedProducts]);

  const selectedRows = useMemo(() => {
    return selectedProducts
      .map((item) => {
        const product = productById.get(String(item.productId));
        if (!product) return null;
        return {
          product,
          quantity: Math.max(1, Number(item.quantity) || 1),
          batch: getPreviewBatch(product),
          barcodeValue: getPrimaryBarcode(product),
        };
      })
      .filter(Boolean);
  }, [productById, selectedProducts]);

  const previewLabels = useMemo(() => {
    const labels = [];
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

  const barcodeWarnings = useMemo(() => {
    if (!displayOptions.barcode) {
      return [];
    }

    return selectedRows
      .map((row) => {
        const message = getBarcodeReadabilityWarning({
          value: row.barcodeValue,
          format: layout.barcodeFormat || 'CODE128',
          lineWidth: Number(layout.barcodeLineWidth) || 0.7,
          labelWidthMm,
        });

        if (!message) {
          return null;
        }

        return {
          id: row.product.id,
          productName: row.product.name,
          message,
        };
      })
      .filter(Boolean);
  }, [
    displayOptions.barcode,
    selectedRows,
    layout.barcodeFormat,
    layout.barcodeLineWidth,
    labelWidthMm,
  ]);

  const previewPageWidthMm = useMemo(() => {
    const columns = Math.max(1, Number(layout.columns) || 1);
    const labelWidth = Math.max(20, Number(layout.labelWidth) || 20);
    const marginLeft = Math.max(0, Number(layout.marginLeft) || 0);
    const marginRight = Math.max(0, Number(layout.marginRight) || 0);
    const gapHorizontal = Math.max(0, Number(layout.gapHorizontal) || 0);

    return (
      marginLeft + marginRight + columns * labelWidth + Math.max(0, columns - 1) * gapHorizontal
    );
  }, [
    layout.columns,
    layout.labelWidth,
    layout.marginLeft,
    layout.marginRight,
    layout.gapHorizontal,
  ]);

  const previewPageWidthPx = useMemo(
    () => Math.max(1, previewPageWidthMm * MM_TO_PX),
    [previewPageWidthMm]
  );
  const activePreviewScale = paperType === 'a4' ? previewScale : 1;

  const fetchProducts = useCallback(async (signal) => {
    setLoadingProducts(true);
    try {
      const data = await inventoryService.fetchProducts(
        {
          includeBatches: true,
          category: 'all',
        },
        { signal }
      );
      const rows = Array.isArray(data?.data) ? data.data : [];
      const sorted = [...rows].sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''))
      );
      setProducts(sorted);
    } catch (error) {
      if (isRequestCanceled(error)) {
        return;
      }
      console.error('Failed to load products for price list:', error);
      setProducts([]);
    } finally {
      if (!signal?.aborted) {
        setLoadingProducts(false);
      }
    }
  }, []);

  const fetchPrinters = useCallback(async () => {
    if (!window.electron?.ipcRenderer) {
      setPrinters([]);
      return;
    }

    try {
      const printerList = await window.electron.ipcRenderer.invoke('get-printers');
      const normalized = Array.isArray(printerList) ? printerList : [];
      setPrinters(normalized);
      const defaultPrinter = normalized.find((printer) => printer.isDefault);
      setSelectedPrinter((current) => current || defaultPrinter?.name || '');
    } catch (error) {
      console.error('Failed to fetch printers:', error);
      setPrinters([]);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const controller = new AbortController();
    fetchProducts(controller.signal);
    fetchPrinters();

    return () => controller.abort();
  }, [open, fetchProducts, fetchPrinters]);

  // Persistence Saving
  useEffect(() => {
    const settings = {
      selectedPrinter,
      paperType,
      paperPreset,
      layout,
      displayOptions,
    };
    localStorage.setItem(PRICE_LIST_SETTINGS_KEY, JSON.stringify(settings));
  }, [selectedPrinter, paperType, paperPreset, layout, displayOptions]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previewElement = previewContainerRef.current;
    if (!previewElement) {
      return undefined;
    }

    const updatePreviewScale = () => {
      if (paperType !== 'a4' || !autoFit) {
        return;
      }

      const availableWidthPx = Math.max(0, previewElement.clientWidth - PREVIEW_FIT_PADDING_PX);
      const fitScale = Math.min(1, availableWidthPx / previewPageWidthPx) * PREVIEW_FIT_SAFETY;
      const nextScale = Math.max(MIN_PREVIEW_SCALE, Number(fitScale.toFixed(3)));
      setPreviewScale(nextScale);
    };

    updatePreviewScale();

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updatePreviewScale);
      resizeObserver.observe(previewElement);
    }

    window.addEventListener('resize', updatePreviewScale);

    return () => {
      window.removeEventListener('resize', updatePreviewScale);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [open, paperType, previewPageWidthPx, autoFit]);

  const handleZoomIn = () => {
    setAutoFit(false);
    setPreviewScale((prev) => Math.min(3, prev + 0.1));
  };

  const handleZoomOut = () => {
    setAutoFit(false);
    setPreviewScale((prev) => Math.max(MIN_PREVIEW_SCALE, prev - 0.1));
  };

  const handleFitToWidth = () => {
    setAutoFit(true);
    const container = previewContainerRef.current;
    if (container && paperType === 'a4') {
      const availableWidthPx = Math.max(0, container.clientWidth - PREVIEW_FIT_PADDING_PX);
      const fitScale = Math.min(1.5, availableWidthPx / previewPageWidthPx) * PREVIEW_FIT_SAFETY;
      setPreviewScale(Math.max(MIN_PREVIEW_SCALE, Number(fitScale.toFixed(3))));
    }
  };

  const applyPreset = (nextType, nextPreset) => {
    const preset = PAPER_PRESETS[nextType].find((item) => item.id === nextPreset);
    if (!preset) return;

    setPaperType(nextType);
    setPaperPreset(nextPreset);
    setLayout((current) => ({
      ...preset.layout,
      textAlign: current.textAlign,
      barcodeLineSpacing: current.barcodeLineSpacing,
    }));
  };

  const handlePaperTypeChange = (event) => {
    const nextType = event.target.value;
    const firstPreset = PAPER_PRESETS[nextType][0];
    applyPreset(nextType, firstPreset.id);
  };

  const handlePresetChange = (event) => {
    applyPreset(paperType, event.target.value);
  };

  const handleProductSelectionChange = (_event, nextProducts) => {
    setSelectedProducts((current) => {
      return nextProducts.map((product) => {
        const existing = current.find((item) => String(item.productId) === String(product.id));
        return {
          productId: product.id,
          quantity: existing?.quantity || 1,
        };
      });
    });
  };

  const handleQuantityChange = (productId, rawValue) => {
    const parsed = Math.max(1, Number(rawValue) || 1);
    setSelectedProducts((current) => {
      return current.map((item) => {
        if (String(item.productId) !== String(productId)) {
          return item;
        }
        return {
          ...item,
          quantity: parsed,
        };
      });
    });
  };

  const handleIncreaseQuantity = (productId) => {
    setSelectedProducts((current) => {
      return current.map((item) => {
        if (String(item.productId) !== String(productId)) {
          return item;
        }
        return {
          ...item,
          quantity: Math.max(1, Number(item.quantity) || 1) + 1,
        };
      });
    });
  };

  const handleDecreaseQuantity = (productId) => {
    setSelectedProducts((current) => {
      return current.map((item) => {
        if (String(item.productId) !== String(productId)) {
          return item;
        }
        return {
          ...item,
          quantity: Math.max(1, (Number(item.quantity) || 1) - 1),
        };
      });
    });
  };

  const handleRemoveSelectedProduct = (productId) => {
    setSelectedProducts((current) =>
      current.filter((item) => String(item.productId) !== String(productId))
    );
  };

  const handleDisplayOptionChange = (field) => {
    setDisplayOptions((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handlePrint = async () => {
    setPrintError('');

    if (!previewLabels.length) {
      const message = 'Select at least one product and quantity before printing.';
      setPrintError(message);
      setPrintNotice({ open: true, message, severity: 'warning' });
      return;
    }

    if (window.electron?.ipcRenderer) {
      if (printers.length === 0) {
        const message = 'No printers detected. Click refresh next to Printer and try again.';
        setPrintError(message);
        setPrintNotice({ open: true, message, severity: 'error' });
        return;
      }

      try {
        const html = buildPriceListPrintableHtml({
          previewRoot: previewRef.current,
          paperType,
          layout,
          printPageSize,
          labelWidthMm,
          labelHeightMm,
          marginTopMm,
          marginRightMm,
          marginBottomMm,
          marginLeftMm,
        });
        if (!html) {
          throw new Error('Unable to build printable content.');
        }

        const thermalPageSize =
          paperType === 'thermal'
            ? {
                widthMicrons: Math.round(Math.max(20, Number(layout.labelWidth) || 20) * 1000),
                heightMicrons: Math.round(Math.max(15, Number(layout.labelHeight) || 15) * 1000),
              }
            : undefined;

        await window.electron.ipcRenderer.invoke('print-html-content', {
          html,
          printerName: selectedPrinter || undefined,
          pageSize: thermalPageSize,
        });

        setPrintNotice({
          open: true,
          message: `Print job sent${selectedPrinter ? ` to ${selectedPrinter}` : ' to default printer'}.`,
          severity: 'success',
        });
      } catch (error) {
        console.error('Direct print failed:', error);
        const message = 'Direct printing failed. Please check printer connection.';
        setPrintError(message);
        setPrintNotice({ open: true, message, severity: 'error' });
      }
      return;
    }

    // Fallback for browser
    document.body.classList.add('is-printing-price-labels');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('is-printing-price-labels');
      }, 500);
    }, 50);
  };

  const renderPreviewLabelCard = (label, options = {}) => (
    <PriceListLabelCard
      label={label}
      options={options}
      layout={layout}
      displayOptions={displayOptions}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          height: { xs: '96vh', sm: '94vh' },
          width: { xs: '100%', sm: '96vw' },
          maxWidth: '1500px',
        },
      }}
    >
      <style>{`
        @media print {
          @page {
            size: ${printPageSize};
            margin: 0;
          }

          body.is-printing-price-labels {
            visibility: hidden !important;
            margin: 0 !important;
            background: #ffffff !important;
          }

          body.is-printing-price-labels .printable-labels-area,
          body.is-printing-price-labels .printable-labels-area * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: #000000 !important;
          }

          body.is-printing-price-labels .printable-labels-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 9999 !important;
          }

          body.is-printing-price-labels .no-print {
            display: none !important;
          }

          body.is-printing-price-labels .MuiDialog-paper,
          body.is-printing-price-labels .MuiDialogContent-root,
          body.is-printing-price-labels .MuiPaper-root,
          body.is-printing-price-labels .MuiBox-root {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <DialogTitle
        className="no-print"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          pb: 1.2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Price List Label Setup
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select products, configure label layout, preview all labels, and print.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <Box
          sx={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              flex: 1,
              minHeight: 0,
              gap: 2,
              p: 0.5, // Safety padding to prevent shadows from being cut
            }}
          >
            <PriceListConfigurationPanel
              products={products}
              loadingProducts={loadingProducts}
              selectedProductOptions={selectedProductOptions}
              handleProductSelectionChange={handleProductSelectionChange}
              getPrimaryBarcode={getPrimaryBarcode}
              selectedRows={selectedRows}
              handleDecreaseQuantity={handleDecreaseQuantity}
              handleQuantityChange={handleQuantityChange}
              handleIncreaseQuantity={handleIncreaseQuantity}
              handleRemoveSelectedProduct={handleRemoveSelectedProduct}
              selectedPrinter={selectedPrinter}
              setSelectedPrinter={setSelectedPrinter}
              printers={printers}
              fetchPrinters={fetchPrinters}
              paperType={paperType}
              handlePaperTypeChange={handlePaperTypeChange}
              paperPreset={paperPreset}
              handlePresetChange={handlePresetChange}
              paperPresets={PAPER_PRESETS[paperType]}
              showAdvancedLayout={showAdvancedLayout}
              setShowAdvancedLayout={setShowAdvancedLayout}
              layout={layout}
              setLayout={setLayout}
              displayOptions={displayOptions}
              handleDisplayOptionChange={handleDisplayOptionChange}
            />

            <PriceListPreviewPanel
              selectedRows={selectedRows}
              totalLabelCount={totalLabelCount}
              activePreviewScale={activePreviewScale}
              handleZoomOut={handleZoomOut}
              handleZoomIn={handleZoomIn}
              autoFit={autoFit}
              handleFitToWidth={handleFitToWidth}
              paperType={paperType}
              missingBarcodeCount={missingBarcodeCount}
              printError={printError}
              barcodeWarnings={barcodeWarnings}
              previewContainerRef={previewContainerRef}
              previewRef={previewRef}
              isThermalPreview={isThermalPreview}
              labelWidthMm={labelWidthMm}
              previewPageWidthMm={previewPageWidthMm}
              labelHeightMm={labelHeightMm}
              marginTopMm={marginTopMm}
              marginRightMm={marginRightMm}
              marginBottomMm={marginBottomMm}
              marginLeftMm={marginLeftMm}
              previewLabels={previewLabels}
              renderPreviewLabelCard={renderPreviewLabelCard}
              layout={layout}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        className="no-print"
        sx={{
          px: 2,
          py: 1.5,
          borderTop: '1px solid #e5e7eb',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
        <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print Labels
        </Button>
      </DialogActions>

      <Snackbar
        open={printNotice.open}
        autoHideDuration={3000}
        onClose={() => setPrintNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setPrintNotice((current) => ({ ...current, open: false }))}
          severity={printNotice.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {printNotice.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default PriceListPanel;
