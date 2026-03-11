import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  DialogActions,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Print as PrintIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  AspectRatio as AspectRatioIcon
} from '@mui/icons-material';
import Barcode from 'react-barcode';
import { useTheme } from '@mui/material/styles';

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
        barcodeHeight: 30
      }
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
        barcodeLineWidth: 0.8,
        barcodeHeight: 25
      }
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
        barcodeHeight: 40
      }
    }
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
        barcodeHeight: 30
      }
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
        barcodeLineWidth: 1,
        barcodeHeight: 26
      }
    }
  ]
};

const DEFAULT_DISPLAY_OPTIONS = {
  mrp: true,
  salePrice: true,
  batchNumber: true,
  productName: true,
  barcode: true
};

const MM_TO_PX = 3.7795275591;
const MIN_PREVIEW_SCALE = 0.2;
const PREVIEW_FIT_PADDING_PX = 36;
const PREVIEW_FIT_SAFETY = 0.96;

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '-';
  }
  return Number(value).toFixed(2);
};

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

const PriceListPanel = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');

  const [paperType, setPaperType] = useState('a4');
  const [paperPreset, setPaperPreset] = useState(PAPER_PRESETS.a4[0].id); // Defaults to 4x10 now
  const [layout, setLayout] = useState({
    ...PAPER_PRESETS.a4[0].layout,
    textAlign: 'left',
    barcodeLineSpacing: 1.25
  });

  const [displayOptions, setDisplayOptions] = useState(DEFAULT_DISPLAY_OPTIONS);
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
    return selectedProducts
      .map((item) => productById.get(String(item.productId)))
      .filter(Boolean);
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
          barcodeValue: getPrimaryBarcode(product)
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
          copyNumber: copy + 1
        });
      }
    });
    return labels;
  }, [selectedRows]);

  const totalLabelCount = previewLabels.length;
  const missingBarcodeCount = selectedRows.filter((row) => !row.barcodeValue).length;

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
  const scaledPreviewPageWidthPx = useMemo(
    () => Math.max(1, previewPageWidthPx * activePreviewScale),
    [previewPageWidthPx, activePreviewScale]
  );

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await api.get('/api/products', {
        params: {
          includeBatches: true,
          category: 'all'
        }
      });
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      const sorted = [...rows].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      setProducts(sorted);
    } catch (error) {
      console.error('Failed to load products for price list:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
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
      return;
    }
    fetchProducts();
    fetchPrinters();
  }, [open, fetchProducts, fetchPrinters]);

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
    setPreviewScale(prev => Math.min(3, prev + 0.1));
  };

  const handleZoomOut = () => {
    setAutoFit(false);
    setPreviewScale(prev => Math.max(MIN_PREVIEW_SCALE, prev - 0.1));
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
      barcodeLineSpacing: current.barcodeLineSpacing
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
          quantity: existing?.quantity || 1
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
          quantity: parsed
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
          quantity: Math.max(1, Number(item.quantity) || 1) + 1
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
          quantity: Math.max(1, (Number(item.quantity) || 1) - 1)
        };
      });
    });
  };

  const handleRemoveSelectedProduct = (productId) => {
    setSelectedProducts((current) => current.filter((item) => String(item.productId) !== String(productId)));
  };

  const handleDisplayOptionChange = (field) => {
    setDisplayOptions((current) => ({
      ...current,
      [field]: !current[field]
    }));
  };

  const buildPrintableHtml = () => {
    if (!previewRef.current) {
      return '';
    }

    const pageSize =
      paperType === 'a4'
        ? 'A4 portrait'
        : `${layout.labelWidth + layout.marginLeft + layout.marginRight}mm ${layout.labelHeight + layout.marginTop + layout.marginBottom}mm`;

    return `
      <html>
        <head>
          <title>Price List Labels</title>
          <style>
            @media print {
              @page {
                size: ${pageSize};
                margin: 0;
              }
              body {
                margin: 0;
              }
            }

            body {
              font-family: Arial, sans-serif;
              margin: 0;
              color: #111827;
            }

            .price-list-grid {
              display: grid;
              grid-template-columns: repeat(${Math.max(1, Number(layout.columns) || 1)}, ${Math.max(20, Number(layout.labelWidth) || 20)}mm);
              column-gap: ${Math.max(0, Number(layout.gapHorizontal) || 0)}mm;
              row-gap: ${Math.max(0, Number(layout.gapVertical) || 0)}mm;
              padding: ${Math.max(0, Number(layout.marginTop) || 0)}mm ${Math.max(0, Number(layout.marginRight) || 0)}mm ${Math.max(0, Number(layout.marginBottom) || 0)}mm ${Math.max(0, Number(layout.marginLeft) || 0)}mm;
              box-sizing: border-box;
            }

            .price-label-item {
              width: ${Math.max(20, Number(layout.labelWidth) || 20)}mm;
              min-height: ${Math.max(15, Number(layout.labelHeight) || 15)}mm;
              border: 1px dashed #9ca3af;
              border-radius: 3px;
              box-sizing: border-box;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              background: #ffffff;
              text-align: ${layout.textAlign || 'left'};
            }

            .price-label-item svg {
              width: 100%;
              max-width: 100%;
              height: ${Math.max(20, Number(layout.barcodeHeight) || 20)}px;
            }

            .label-line {
              font-size: 10px;
              line-height: ${Math.max(0.8, Number(layout.barcodeLineSpacing) || 1.25)};
              margin: 1px 0;
              word-break: break-word;
            }

            .label-name {
              font-weight: 700;
              font-size: 11px;
              line-height: ${Math.max(0.8, Number(layout.barcodeLineSpacing) || 1.25)};
            }
          </style>
        </head>
        <body>
          ${previewRef.current.innerHTML}
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    setPrintError('');

    if (!previewLabels.length) {
      const message = 'Select at least one product and quantity before printing.';
      setPrintError(message);
      setPrintNotice({ open: true, message, severity: 'warning' });
      return;
    }

    const html = buildPrintableHtml();
    if (!html) {
      const message = 'Unable to generate print preview. Please try again.';
      setPrintError(message);
      setPrintNotice({ open: true, message, severity: 'error' });
      return;
    }

    if (window.electron?.ipcRenderer && printers.length === 0) {
      const message = 'No printers detected. Click refresh next to Printer and try again.';
      setPrintError(message);
      setPrintNotice({ open: true, message, severity: 'error' });
      return;
    }

    // In desktop app, always use Electron print channel. Empty printer means system default.
    if (window.electron?.ipcRenderer) {
      try {
        window.electron.ipcRenderer.send('print-barcode', {
          html,
          printerName: selectedPrinter || undefined
        });
        setPrintNotice({
          open: true,
          message: `Print job sent${selectedPrinter ? ` to ${selectedPrinter}` : ' to default printer'}.`,
          severity: 'success'
        });
      } catch (error) {
        console.error('Direct print failed:', error);
        const message = 'Direct printing failed. Please check printer connection.';
        setPrintError(message);
        setPrintNotice({ open: true, message, severity: 'error' });
      }
      return;
    }

    const printWindow = window.open('', '', 'width=1100,height=800');
    if (!printWindow) {
      const message = 'Popup blocked by browser. Please allow popups for printing.';
      setPrintError(message);
      setPrintNotice({ open: true, message, severity: 'error' });
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setPrintNotice({ open: true, message: 'Print dialog opened.', severity: 'info' });
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const renderLabelMeta = (label) => {
    const resolvedTextAlign = layout.textAlign || 'left';

    return (
      <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.2, textAlign: resolvedTextAlign }}>
        {displayOptions.productName && (
          <Typography className="label-line label-name" sx={{ fontSize: '0.68rem', fontWeight: 700, textAlign: resolvedTextAlign }}>
            {label.product.name}
          </Typography>
        )}
        {displayOptions.mrp && (
          <Typography className="label-line" sx={{ fontSize: '0.64rem', textAlign: resolvedTextAlign }}>
            MRP: Rs {formatCurrency(label.batch?.mrp)}
          </Typography>
        )}
        {displayOptions.salePrice && (
          <Typography className="label-line" sx={{ fontSize: '0.64rem', textAlign: resolvedTextAlign }}>
            Sale: Rs {formatCurrency(label.batch?.sellingPrice)}
          </Typography>
        )}
        {displayOptions.batchNumber && (
          <Typography className="label-line" sx={{ fontSize: '0.64rem', textAlign: resolvedTextAlign }}>
            Batch: {label.batch?.batchCode || '-'}
          </Typography>
        )}
      </Box>
    );
  };

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
          maxWidth: '1500px'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          pb: 1.2
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
          minHeight: 0
        }}
      >
        <Box sx={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              flex: 1,
              minHeight: 0,
              gap: 2,
              p: 0.5 // Safety padding to prevent shadows from being cut
            }}
          >
            {/* Left Configuration Column */}
            <Box
              sx={{
                width: { xs: '100%', sm: '380px', md: '440px' },
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}
            >
              <Stack
                spacing={2}
                sx={{
                  flex: 1,
                  height: '100%',
                  minHeight: 0,
                  overflowY: 'auto',
                  pr: 0.5,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 10 }
                }}
              >
                <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.2 }}>
                    Product Selection
                  </Typography>
                  <Autocomplete
                    multiple
                    options={products}
                    loading={loadingProducts}
                    value={selectedProductOptions}
                    onChange={handleProductSelectionChange}
                    disableCloseOnSelect
                    getOptionLabel={(option) => {
                      const barcode = getPrimaryBarcode(option);
                      return barcode ? `${option.name} (${barcode})` : option.name;
                    }}
                    isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select one or more products"
                        placeholder="Search products"
                        size="small"
                      />
                    )}
                    sx={{ mb: 1.5 }}
                  />
                  <Divider sx={{ my: 1.5 }} />
                  <Stack spacing={1}>
                    {selectedRows.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No products selected yet.
                      </Typography>
                    )}
                    {selectedRows.map((row) => (
                      <Paper
                        key={row.product.id}
                        variant="outlined"
                        sx={{
                          px: 1,
                          py: 0.8,
                          borderRadius: 1.5,
                          bgcolor: 'rgba(255,255,255,0.92)',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto auto auto auto',
                          alignItems: 'center',
                          gap: 0.6
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {row.product.name}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDecreaseQuantity(row.product.id)}
                          disabled={row.quantity <= 1}
                          title="Decrease labels"
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 1, style: { textAlign: 'center', width: 48 } }}
                          value={row.quantity}
                          onChange={(event) => handleQuantityChange(row.product.id, event.target.value)}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleIncreaseQuantity(row.product.id)}
                          title="Increase labels"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveSelectedProduct(row.product.id)}
                          title="Remove product"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>

                <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.2 }}>
                    Printer and Paper
                  </Typography>
                  <Stack spacing={1.2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Printer</InputLabel>
                        <Select
                          label="Printer"
                          value={selectedPrinter}
                          onChange={(event) => setSelectedPrinter(event.target.value)}
                        >
                          {printers.length === 0 && (
                            <MenuItem value="">Browser Print</MenuItem>
                          )}
                          {printers.map((printer) => (
                            <MenuItem key={printer.name} value={printer.name}>
                              {printer.name}{printer.isDefault ? ' (Default)' : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <IconButton onClick={fetchPrinters} title="Refresh printers">
                        <RefreshIcon />
                      </IconButton>
                    </Box>

                    {!window.electron?.ipcRenderer && (
                      <Alert severity="info" sx={{ py: 0.5 }}>
                        Printer auto-detection is available in the desktop app. Browser print is still supported.
                      </Alert>
                    )}

                    <FormControl fullWidth size="small">
                      <InputLabel>Paper Type</InputLabel>
                      <Select label="Paper Type" value={paperType} onChange={handlePaperTypeChange}>
                        <MenuItem value="a4">A4 Paper</MenuItem>
                        <MenuItem value="thermal">Thermal Label Printer Paper</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel>Paper Size Preset</InputLabel>
                      <Select label="Paper Size Preset" value={paperPreset} onChange={handlePresetChange}>
                        {PAPER_PRESETS[paperType].map((preset) => (
                          <MenuItem key={preset.id} value={preset.id}>
                            {preset.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Paper>

                <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Advanced Layout and Margins
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      endIcon={showAdvancedLayout ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      onClick={() => setShowAdvancedLayout((current) => !current)}
                    >
                      {showAdvancedLayout ? 'Hide' : 'Show'}
                    </Button>
                  </Box>

                  <Collapse in={showAdvancedLayout} timeout="auto" unmountOnExit>
                    <Grid container spacing={1.2} sx={{ mt: 0.8 }}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Columns"
                          type="number"
                          inputProps={{ min: 1, max: 10 }}
                          value={layout.columns}
                          onChange={(event) => setLayout((current) => ({ ...current, columns: Math.max(1, Number(event.target.value) || 1) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Label Width (mm)"
                          type="number"
                          inputProps={{ min: 20 }}
                          value={layout.labelWidth}
                          onChange={(event) => setLayout((current) => ({ ...current, labelWidth: Math.max(20, Number(event.target.value) || 20) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Label Height (mm)"
                          type="number"
                          inputProps={{ min: 15 }}
                          value={layout.labelHeight}
                          onChange={(event) => setLayout((current) => ({ ...current, labelHeight: Math.max(15, Number(event.target.value) || 15) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Barcode Height (px)"
                          type="number"
                          inputProps={{ min: 20 }}
                          value={layout.barcodeHeight}
                          onChange={(event) => setLayout((current) => ({ ...current, barcodeHeight: Math.max(20, Number(event.target.value) || 20) }))}
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Margin Left (mm)"
                          type="number"
                          value={layout.marginLeft}
                          onChange={(event) => setLayout((current) => ({ ...current, marginLeft: Math.max(0, Number(event.target.value) || 0) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Margin Right (mm)"
                          type="number"
                          value={layout.marginRight}
                          onChange={(event) => setLayout((current) => ({ ...current, marginRight: Math.max(0, Number(event.target.value) || 0) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Margin Top (mm)"
                          type="number"
                          value={layout.marginTop}
                          onChange={(event) => setLayout((current) => ({ ...current, marginTop: Math.max(0, Number(event.target.value) || 0) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Margin Bottom (mm)"
                          type="number"
                          value={layout.marginBottom}
                          onChange={(event) => setLayout((current) => ({ ...current, marginBottom: Math.max(0, Number(event.target.value) || 0) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Horizontal Gap (mm)"
                          type="number"
                          value={layout.gapHorizontal}
                          onChange={(event) => setLayout((current) => ({ ...current, gapHorizontal: Math.max(0, Number(event.target.value) || 0) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Vertical Gap (mm)"
                          type="number"
                          value={layout.gapVertical}
                          onChange={(event) => setLayout((current) => ({ ...current, gapVertical: Math.max(0, Number(event.target.value) || 0) }))}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Barcode Line Spacing"
                          type="number"
                          inputProps={{ min: 0.8, max: 3, step: 0.1 }}
                          value={layout.barcodeLineSpacing}
                          onChange={(event) => setLayout((current) => ({ ...current, barcodeLineSpacing: Math.max(0.8, Number(event.target.value) || 1.25) }))}
                        />
                      </Grid>
                    </Grid>
                  </Collapse>
                </Paper>

                <Paper elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Label Content
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={<Checkbox checked={displayOptions.mrp} onChange={() => handleDisplayOptionChange('mrp')} />}
                      label="MRP"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={displayOptions.salePrice} onChange={() => handleDisplayOptionChange('salePrice')} />}
                      label="Sale Price"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={displayOptions.batchNumber} onChange={() => handleDisplayOptionChange('batchNumber')} />}
                      label="Batch Number"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={displayOptions.productName} onChange={() => handleDisplayOptionChange('productName')} />}
                      label="Product Name"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={displayOptions.barcode} onChange={() => handleDisplayOptionChange('barcode')} />}
                      label="Barcode No"
                    />
                  </FormGroup>
                  <Divider sx={{ my: 1.5 }} />
                  <FormControl fullWidth size="small">
                    <InputLabel>Text Alignment</InputLabel>
                    <Select
                      value={layout.textAlign || 'left'}
                      label="Text Alignment"
                      onChange={(event) => setLayout((current) => ({ ...current, textAlign: event.target.value }))}
                    >
                      <MenuItem value="left">Left</MenuItem>
                      <MenuItem value="center">Center</MenuItem>
                      <MenuItem value="right">Right</MenuItem>
                    </Select>
                  </FormControl>
                </Paper>
              </Stack>
            </Box>

            {/* Right Preview Column */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                minWidth: 0 // Crucial for preventing flex blowout
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid #e5e7eb',
                  borderRadius: 2,
                  flex: 1,
                  height: { xs: 'auto', sm: '100%' },
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: { xs: 460, sm: 0 }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Live Preview
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" variant="outlined" label={`${selectedRows.length} items`} />
                    <Chip size="small" color="primary" label={`${totalLabelCount} labels`} />

                    {/* Zoom Control Group */}
                    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 2, px: 0.5, py: 0.25 }}>
                      <Tooltip title="Zoom Out">
                        <span>
                          <IconButton size="small" onClick={handleZoomOut} disabled={paperType !== 'a4'}>
                            <ZoomOutIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Typography variant="caption" sx={{ minWidth: 45, textAlign: 'center', fontWeight: 600 }}>
                        {Math.round(activePreviewScale * 100)}%
                      </Typography>
                      <Tooltip title="Zoom In">
                        <span>
                          <IconButton size="small" onClick={handleZoomIn} disabled={paperType !== 'a4'}>
                            <ZoomInIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
                      <Tooltip title="Auto-Fit to Width">
                        <span>
                          <IconButton
                            size="small"
                            color={autoFit ? "primary" : "default"}
                            onClick={handleFitToWidth}
                            disabled={paperType !== 'a4'}
                          >
                            <AspectRatioIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Stack>
                </Box>
                <Divider sx={{ mb: 1.5 }} />

                {missingBarcodeCount > 0 && (
                  <Alert severity="warning" sx={{ mb: 1.2 }}>
                    {missingBarcodeCount} selected product(s) do not have barcode values.
                  </Alert>
                )}
                {printError && (
                  <Alert severity="error" sx={{ mb: 1.2 }}>
                    {printError}
                  </Alert>
                )}

                <Box
                  ref={previewContainerRef}
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    boxSizing: 'border-box',
                    borderRadius: 1.5,
                    bgcolor: '#f1f5f9',
                    p: paperType === 'a4' ? 4 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    scrollbarGutter: 'stable'
                  }}
                >
                  <Box
                    ref={previewRef}
                    sx={{
                      width: paperType === 'a4' ? `${previewPageWidthMm}mm` : '100%',
                      transform: paperType === 'a4' ? `scale(${activePreviewScale})` : 'none',
                      transformOrigin: 'top center',
                      bgcolor: '#fff',
                      border: '1px solid #94a3b8',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                      borderRadius: '4px',
                      mb: 12, // Substantial padding for bottom scaling
                      flexShrink: 0
                    }}
                  >
                    <Box
                      className="price-list-grid"
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.max(1, Number(layout.columns) || 1)}, ${Math.max(20, Number(layout.labelWidth) || 20)}mm)`,
                        columnGap: `${Math.max(0, Number(layout.gapHorizontal) || 0)}mm`,
                        rowGap: `${Math.max(0, Number(layout.gapVertical) || 0)}mm`,
                        p: `${Math.max(0, Number(layout.marginTop) || 0)}mm ${Math.max(0, Number(layout.marginRight) || 0)}mm ${Math.max(0, Number(layout.marginBottom) || 0)}mm ${Math.max(0, Number(layout.marginLeft) || 0)}mm`,
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      {previewLabels.map((label) => (
                        <Box
                          key={label.id}
                          className="price-label-item"
                          sx={{
                            width: `${Math.max(20, Number(layout.labelWidth) || 20)}mm`,
                            minHeight: `${Math.max(15, Number(layout.labelHeight) || 15)}mm`,
                            border: '1px dashed #cbd5e1',
                            borderRadius: '2px',
                            boxSizing: 'border-box',
                            bgcolor: '#fff',
                            p: 1,
                            overflow: 'hidden',
                            textAlign: layout.textAlign || 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start'
                          }}
                        >
                          {displayOptions.barcode && label.barcodeValue ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Barcode
                                value={label.barcodeValue}
                                width={Math.max(0.7, Number(layout.barcodeLineWidth) || 0.7)}
                                height={Math.max(20, Number(layout.barcodeHeight) || 20)}
                                margin={0}
                                fontSize={10}
                                textMargin={2}
                                displayValue
                              />
                            </Box>
                          ) : displayOptions.barcode ? (
                            <Typography variant="caption" color="error.main">No barcode</Typography>
                          ) : null}

                          {renderLabelMeta(label)}
                        </Box>
                      ))}

                      {previewLabels.length === 0 && (
                        <Box sx={{ p: 4, textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
                          <Typography variant="body1" color="text.secondary">
                            Your preview will appear here once you select products.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          py: 1.5,
          borderTop: '1px solid #e5e7eb',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
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
    </Dialog >
  );
};

export default PriceListPanel;
