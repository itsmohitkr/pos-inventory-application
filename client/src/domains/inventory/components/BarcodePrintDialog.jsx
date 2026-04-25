import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Grid, Divider, IconButton, Chip, Paper,
  Snackbar, Alert,
} from '@mui/material';
import { Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';
import { DEFAULT_SIZES } from '@/domains/inventory/components/barcodeSizePresets';
import BarcodeSettingsPanel from '@/domains/inventory/components/BarcodeSettingsPanel';
import BarcodePreviewGrid from '@/domains/inventory/components/BarcodePreviewGrid';

const BarcodePrintDialog = ({ open, onClose, product }) => {
  const [quantity, setQuantity] = useState(1);
  const [printMethod, setPrintMethod] = useState('a4');
  const [paperSize, setPaperSize] = useState('50x25');
  const [customDimensions, setCustomDimensions] = useState({ width: 2, height: 50, cols: 1 });
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [margins, setMargins] = useState({ top: 10, right: 10, bottom: 10, left: 10 });
  const [spacing, setSpacing] = useState({ horizontal: 2, vertical: 2 });
  const [contentOptions, setContentOptions] = useState({
    productName: true, mrp: true, sellingPrice: false, discount: false, shopName: false,
  });
  const [textAlign, setTextAlign] = useState('center');
  const [shopName, setShopName] = useState('My Store');

  React.useEffect(() => {
    if (!open) return;
    const loadSettings = async () => {
      if (window.electron) {
        try {
          const list = await window.electron.ipcRenderer.invoke('get-printers');
          if (list && Array.isArray(list)) setPrinters(list);
        } catch (e) {
          console.error('Failed to load printers:', e);
        }
      }
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
        } catch {
          console.error('Failed to parse barcode settings');
        }
      }
    };
    loadSettings();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    localStorage.setItem('barcodePrinterSettings', JSON.stringify({
      printMethod, paperSize, selectedPrinter, margins, spacing,
      contentOptions, textAlign, shopName, customDimensions,
    }));
  }, [printMethod, paperSize, selectedPrinter, margins, spacing, contentOptions, textAlign, shopName, customDimensions, open]);

  const handlePaperSizeChange = (newSize) => {
    setPaperSize(newSize);
    if (newSize !== 'custom') {
      const p = DEFAULT_SIZES[newSize];
      setSpacing({ horizontal: p.horizontal, vertical: p.vertical });
    }
  };

  const handleContentChange = (field) => {
    setContentOptions((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // IPC print call — must stay here per arch constraints
  const handlePrint = async () => {
    if (window.electron?.ipcRenderer) {
      try {
        document.body.classList.add('is-printing-labels');
        await new Promise((r) => setTimeout(r, 100));
        const result = await window.electron.ipcRenderer.invoke('print-manual', {
          printerName: selectedPrinter || undefined,
        });
        if (result?.success) {
          setSnackbar({ open: true, message: 'Print job sent successfully!', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: `Print failed: ${result?.error || 'Unknown error'}`, severity: 'error' });
        }
      } catch (error) {
        console.error('Direct print failed:', error);
        setSnackbar({ open: true, message: 'Direct printing failed. Check printer connection.', severity: 'error' });
      } finally {
        setTimeout(() => document.body.classList.remove('is-printing-labels'), 500);
      }
      return;
    }
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '90vh' } }}>
      <style>{`
        @media print {
          body.is-printing-labels { visibility: hidden !important; background: #ffffff !important; }
          body.is-printing-labels .printable-area,
          body.is-printing-labels .printable-area * { visibility: visible !important; color: #000000 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body.is-printing-labels .printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; background: #ffffff !important; z-index: 9999 !important; display: block !important; }
          .no-print { display: none !important; }
          @page { margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }
        }
      `}</style>

      <DialogTitle className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Barcode Print Setup</Typography>
          <Typography variant="caption" color="text.secondary">{product?.name || 'No product selected'}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Settings Panel */}
          <Grid item xs={12} md={5} className="no-print">
            <BarcodeSettingsPanel
              quantity={quantity} onQuantityChange={setQuantity}
              printMethod={printMethod} onPrintMethodChange={setPrintMethod}
              printers={printers} selectedPrinter={selectedPrinter} onPrinterChange={setSelectedPrinter}
              paperSize={paperSize} onPaperSizeChange={handlePaperSizeChange}
              customDimensions={customDimensions} onCustomDimensionsChange={setCustomDimensions}
              margins={margins} onMarginsChange={setMargins}
              spacing={spacing} onSpacingChange={setSpacing}
              contentOptions={contentOptions} onContentChange={handleContentChange}
              shopName={shopName} onShopNameChange={setShopName}
              textAlign={textAlign} onTextAlignChange={setTextAlign}
            />
          </Grid>

          {/* Preview Panel */}
          <Grid item xs={12} md={7}>
            <Paper
              className="printable-area"
              elevation={0}
              sx={{
                p: 3, bgcolor: '#ffffff', border: '2px dashed #cbd5e1', minHeight: 600,
                display: 'flex', flexDirection: 'column',
                '@media print': { border: 'none', p: 0 },
              }}
            >
              <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Preview</Typography>
                <Chip
                  label={printMethod === 'a4' ? 'A4 Paper' : 'Barcode Machine'}
                  size="small" color="primary" variant="outlined"
                />
              </Box>
              <Divider className="no-print" sx={{ mb: 2 }} />
              <Box
                sx={{
                  flex: 1, overflow: 'auto', bgcolor: printMethod === 'a4' ? '#ffffff' : '#f8fafc',
                  p: 2, border: '1px solid #e2e8f0', borderRadius: 1,
                  '@media print': { border: 'none', overflow: 'visible', p: 0, bgcolor: '#fff' },
                }}
              >
                {product && product.barcode ? (
                  <BarcodePreviewGrid
                    product={product} quantity={quantity} paperSize={paperSize}
                    customDimensions={customDimensions} spacing={spacing}
                    contentOptions={contentOptions} textAlign={textAlign} shopName={shopName}
                  />
                ) : (
                  <Box className="no-print" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No barcode available for this product</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className="no-print" sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button
          onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}
          disabled={!product || !product.barcode}
          sx={{ bgcolor: '#1f8a5b', '&:hover': { bgcolor: '#166d47' } }}
        >
          Print Barcodes
        </Button>
      </DialogActions>

      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity} variant="filled"
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default BarcodePrintDialog;
