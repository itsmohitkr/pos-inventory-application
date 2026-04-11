import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Stack,
  Chip,
  RadioGroup,
  Radio,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  ZoomIn as ZoomInIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Barcode from 'react-barcode';

const DEFAULT_SIZES = {
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

const BarcodePrintDialog = ({ open, onClose, product }) => {
  const [quantity, setQuantity] = useState(1);
  const [printMethod, setPrintMethod] = useState('a4'); // 'a4' or 'machine'
  const [paperSize, setPaperSize] = useState('50x25');
  const [customDimensions, setCustomDimensions] = useState({ width: 2, height: 50, cols: 1 });

  // Printer Configuration
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [margins, setMargins] = useState({
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
  });
  const [spacing, setSpacing] = useState({
    horizontal: 2,
    vertical: 2,
  });
  const [contentOptions, setContentOptions] = useState({
    productName: true,
    mrp: true,
    sellingPrice: false,
    discount: false,
    shopName: false,
  });
  const [textAlign, setTextAlign] = useState('center');
  const [shopName, setShopName] = useState('My Store');
  const printRef = useRef();

  // Load settings and printers on mount
  React.useEffect(() => {
    if (open) {
      const loadSettings = async () => {
        // Fetch printers if in Electron
        if (window.electron) {
          try {
            const list = await window.electron.ipcRenderer.invoke('get-printers');
            if (list && Array.isArray(list)) {
              setPrinters(list);
            }
          } catch (e) {
            console.error('Failed to load printers:', e);
          }
        }

        // Load saved settings
        const savedStr = localStorage.getItem('barcodePrinterSettings');
        if (savedStr) {
          try {
            const saved = JSON.parse(savedStr);
            if (saved.printMethod) setPrintMethod(saved.printMethod);
            if (saved.paperSize) setPaperSize(saved.paperSize);
            if (saved.selectedPrinter) setSelectedPrinter(saved.selectedPrinter);
            if (saved.margins) setMargins(saved.margins);
            if (saved.spacing) setSpacing(saved.spacing);
            if (saved.contentOptions) setContentOptions(saved.contentOptions);
            if (saved.textAlign) setTextAlign(saved.textAlign);
            if (saved.shopName) setShopName(saved.shopName);
            if (saved.customDimensions) setCustomDimensions(saved.customDimensions);
          } catch (e) {
            console.error('Failed to parse barcode settings');
          }
        }
      };
      loadSettings();
    }
  }, [open]);

  // Save settings when they change
  React.useEffect(() => {
    if (open) {
      const settingsToSave = {
        printMethod,
        paperSize,
        selectedPrinter,
        margins,
        spacing,
        contentOptions,
        textAlign,
        shopName,
        customDimensions,
      };
      localStorage.setItem('barcodePrinterSettings', JSON.stringify(settingsToSave));
    }
  }, [
    printMethod,
    paperSize,
    selectedPrinter,
    margins,
    spacing,
    contentOptions,
    textAlign,
    shopName,
    customDimensions,
    open,
  ]);

  const handleContentChange = (field) => {
    setContentOptions((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePrint = () => {
    if (window.electron?.ipcRenderer) {
      try {
        // Add printing class to body to trigger @media print styles
        document.body.classList.add('is-printing-labels');

        // Brief timeout to ensure class is applied before print capture
        setTimeout(() => {
          window.electron.ipcRenderer.send('print-manual', {
            printerName: selectedPrinter || undefined,
          });

          setSnackbar({ open: true, message: 'Print job sent successfully!', severity: 'success' });

          // Remove class after print dialog is triggered
          setTimeout(() => {
            document.body.classList.remove('is-printing-labels');
          }, 1000);
        }, 100);
      } catch (error) {
        console.error('Direct print failed:', error);
        document.body.classList.remove('is-printing-labels');
        setSnackbar({ open: true, message: 'Direct printing failed.', severity: 'error' });
      }
      return;
    }

    // Fallback for browser
    window.print();
  };

  const renderBarcodePreview = () => {
    if (!product || !product.barcode) return null;

    const barcodes = product.barcode
      .split('|')
      .map((b) => b.trim())
      .filter(Boolean);
    const primaryBarcode = barcodes[0] || product.id.toString();

    const activeDims = paperSize === 'custom' ? customDimensions : DEFAULT_SIZES[paperSize];
    const activeCols = activeDims.cols || 1;

    return (
      <Box
        className="barcode-container"
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${activeCols}, 1fr)`,
          gap: `${spacing.horizontal}mm`,
          rowGap: `${spacing.vertical}mm`,
          justifyContent: activeCols === 1 ? 'center' : 'start',
        }}
      >
        {Array.from({ length: quantity }).map((_, index) => (
          <Box
            key={index}
            className="barcode-item"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems:
                textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
              border: '1px dashed #94a3b8',
              borderRadius: 1,
              padding: `${spacing.vertical}mm ${spacing.horizontal}mm`,
              bgcolor: '#ffffff',
              width: activeCols === 1 ? 'auto' : '100%',
              boxSizing: 'border-box',
              '@media print': {
                border: '1px solid #000000 !important',
              },
            }}
          >
            <Barcode
              value={primaryBarcode}
              width={activeDims.width}
              height={activeDims.height}
              fontSize={12}
              margin={0}
            />
            <Box
              className="barcode-info"
              sx={{
                textAlign: textAlign,
                width: '100%',
                mt: 0.5,
              }}
            >
              {contentOptions.productName && (
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                  {product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name}
                </Typography>
              )}
              {contentOptions.mrp && product.batches && product.batches.length > 0 && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  MRP: ₹{Math.max(...product.batches.map((b) => b.mrp))}
                </Typography>
              )}
              {contentOptions.sellingPrice && product.batches && product.batches.length > 0 && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Price: ₹{Math.max(...product.batches.map((b) => b.sellingPrice))}
                </Typography>
              )}
              {contentOptions.discount && product.batches && product.batches.length > 0 && (
                <Typography variant="caption" sx={{ display: 'block', color: 'green' }}>
                  Save: ₹{Math.max(...product.batches.map((b) => b.mrp - b.sellingPrice))}
                </Typography>
              )}
              {contentOptions.shopName && (
                <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                  {shopName}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <style>{`
                @media print {
                    body.is-printing-labels {
                        visibility: hidden !important;
                        background: #ffffff !important;
                    }
                    body.is-printing-labels .printable-area,
                    body.is-printing-labels .printable-area * {
                        visibility: visible !important;
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body.is-printing-labels .printable-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        z-index: 9999 !important;
                        display: block !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
                    }
                }
            `}</style>

      <DialogTitle
        className="no-print"
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Barcode Print Setup
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {product?.name || 'No product selected'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Left Panel - Settings */}
          <Grid item xs={12} md={5} className="no-print">
            <Stack spacing={3}>
              {/* Basic Settings */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Basic Settings
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Number of Labels"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    fullWidth
                    size="small"
                    inputProps={{ min: 1, max: 1000 }}
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>Output Destination</InputLabel>
                    <Select
                      value={printMethod}
                      onChange={(e) => setPrintMethod(e.target.value)}
                      label="Output Destination"
                    >
                      <MenuItem value="a4">Standard Printer (A4 Sheet)</MenuItem>
                      <MenuItem value="machine">Dedicated Barcode Printer</MenuItem>
                    </Select>
                  </FormControl>

                  {printMethod === 'machine' && window.electron && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Printer Selection</InputLabel>
                      <Select
                        value={selectedPrinter}
                        onChange={(e) => setSelectedPrinter(e.target.value)}
                        label="Printer Selection"
                        displayEmpty
                      >
                        {printers && printers.length > 0 ? (
                          printers.map((p, i) => (
                            <MenuItem key={i} value={p.name}>
                              {p.name} {p.isDefault ? '(Default)' : ''}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem value="" disabled>
                            No printers found
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  )}
                </Stack>
              </Paper>

              {/* Label Layout */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Label Size & Layout
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Paper Size Preset</InputLabel>
                    <Select
                      value={paperSize}
                      onChange={(e) => {
                        setPaperSize(e.target.value);
                        if (e.target.value !== 'custom') {
                          const p = DEFAULT_SIZES[e.target.value];
                          setSpacing({ horizontal: p.horizontal, vertical: p.vertical });
                        }
                      }}
                      label="Paper Size Preset"
                    >
                      {Object.values(DEFAULT_SIZES).map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.label}
                        </MenuItem>
                      ))}
                      <MenuItem value="custom">Custom Size</MenuItem>
                    </Select>
                  </FormControl>

                  {paperSize === 'custom' && (
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <TextField
                          label="Bar Width (px)"
                          type="number"
                          value={customDimensions.width}
                          onChange={(e) =>
                            setCustomDimensions({
                              ...customDimensions,
                              width: parseFloat(e.target.value) || 2,
                            })
                          }
                          fullWidth
                          size="small"
                          inputProps={{ min: 1, max: 5, step: 0.1 }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Height (px)"
                          type="number"
                          value={customDimensions.height}
                          onChange={(e) =>
                            setCustomDimensions({
                              ...customDimensions,
                              height: parseInt(e.target.value) || 50,
                            })
                          }
                          fullWidth
                          size="small"
                          inputProps={{ min: 20, max: 200 }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Columns"
                          type="number"
                          value={customDimensions.cols}
                          onChange={(e) =>
                            setCustomDimensions({
                              ...customDimensions,
                              cols: parseInt(e.target.value) || 1,
                            })
                          }
                          fullWidth
                          size="small"
                          inputProps={{ min: 1, max: 10 }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Stack>
              </Paper>

              {/* Margins */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Page Margins (mm)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Top"
                      type="number"
                      value={margins.top}
                      onChange={(e) =>
                        setMargins({ ...margins, top: parseInt(e.target.value) || 0 })
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Right"
                      type="number"
                      value={margins.right}
                      onChange={(e) =>
                        setMargins({ ...margins, right: parseInt(e.target.value) || 0 })
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Bottom"
                      type="number"
                      value={margins.bottom}
                      onChange={(e) =>
                        setMargins({ ...margins, bottom: parseInt(e.target.value) || 0 })
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Left"
                      type="number"
                      value={margins.left}
                      onChange={(e) =>
                        setMargins({ ...margins, left: parseInt(e.target.value) || 0 })
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Spacing */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Barcode Spacing (mm)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Horizontal"
                      type="number"
                      value={spacing.horizontal}
                      onChange={(e) =>
                        setSpacing({ ...spacing, horizontal: parseInt(e.target.value) || 0 })
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Vertical"
                      type="number"
                      value={spacing.vertical}
                      onChange={(e) =>
                        setSpacing({ ...spacing, vertical: parseInt(e.target.value) || 0 })
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Content Options */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Display Content
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contentOptions.productName}
                        onChange={() => handleContentChange('productName')}
                      />
                    }
                    label="Product Name"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contentOptions.mrp}
                        onChange={() => handleContentChange('mrp')}
                      />
                    }
                    label="MRP"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contentOptions.sellingPrice}
                        onChange={() => handleContentChange('sellingPrice')}
                      />
                    }
                    label="Selling Price"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contentOptions.discount}
                        onChange={() => handleContentChange('discount')}
                      />
                    }
                    label="Discount/Savings"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={contentOptions.shopName}
                        onChange={() => handleContentChange('shopName')}
                      />
                    }
                    label="Shop Name"
                  />
                </FormGroup>
                {contentOptions.shopName && (
                  <TextField
                    label="Shop Name"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </Paper>

              {/* Text Alignment */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Text Alignment
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup value={textAlign} onChange={(e) => setTextAlign(e.target.value)} row>
                    <FormControlLabel value="left" control={<Radio size="small" />} label="Left" />
                    <FormControlLabel
                      value="center"
                      control={<Radio size="small" />}
                      label="Center"
                    />
                    <FormControlLabel
                      value="right"
                      control={<Radio size="small" />}
                      label="Right"
                    />
                  </RadioGroup>
                </FormControl>
              </Paper>
            </Stack>
          </Grid>

          {/* Right Panel - Preview */}
          <Grid item xs={12} md={7}>
            <Paper
              className="printable-area"
              elevation={0}
              sx={{
                p: 3,
                bgcolor: '#ffffff',
                border: '2px dashed #cbd5e1',
                minHeight: 600,
                display: 'flex',
                flexDirection: 'column',
                '@media print': {
                  border: 'none',
                  p: 0,
                },
              }}
            >
              <Box
                className="no-print"
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Preview
                </Typography>
                <Chip
                  label={`${printMethod === 'a4' ? 'A4 Paper' : 'Barcode Machine'}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <Divider className="no-print" sx={{ mb: 2 }} />
              <Box
                ref={printRef}
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  bgcolor: printMethod === 'a4' ? '#ffffff' : '#f8fafc',
                  p: 2,
                  border: '1px solid #e2e8f0',
                  borderRadius: 1,
                  '@media print': {
                    border: 'none',
                    overflow: 'visible',
                    p: 0,
                    bgcolor: '#fff',
                  },
                }}
              >
                {product && product.barcode ? (
                  renderBarcodePreview()
                ) : (
                  <Box
                    className="no-print"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <Typography color="text.secondary">
                      No barcode available for this product
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="no-print" sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          disabled={!product || !product.barcode}
          sx={{ bgcolor: '#1f8a5b', '&:hover': { bgcolor: '#166d47' } }}
        >
          Print Barcodes
        </Button>
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default BarcodePrintDialog;
