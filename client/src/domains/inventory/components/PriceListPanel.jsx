import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Snackbar, Typography, useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PriceListConfigurationPanel from '@/domains/inventory/components/PriceListConfigurationPanel';
import PriceListPreviewPanel from '@/domains/inventory/components/PriceListPreviewPanel';
import PriceListLabelCard from '@/domains/inventory/components/PriceListLabelCard';
import { buildPriceListPrintableHtml } from '@/domains/inventory/components/priceListPrintUtils';
import { PAPER_PRESETS } from '@/domains/inventory/components/paperSizePresets';
import usePriceList from '@/domains/inventory/components/usePriceList';

const PriceListPanel = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const pl = usePriceList(open);

  // IPC print call must stay in this file
  const handlePrint = async () => {
    pl.setPrintError('');
    if (!pl.previewLabels.length) {
      const message = 'Select at least one product and quantity before printing.';
      pl.setPrintError(message);
      pl.setPrintNotice({ open: true, message, severity: 'warning' });
      return;
    }

    if (window.electron?.ipcRenderer) {
      if (pl.printers.length === 0) {
        const message = 'No printers detected. Click refresh next to Printer and try again.';
        pl.setPrintError(message);
        pl.setPrintNotice({ open: true, message, severity: 'error' });
        return;
      }
      try {
        const html = buildPriceListPrintableHtml({
          previewRoot: pl.previewRef.current,
          paperType: pl.printPageSize.includes('mm') ? 'thermal' : 'a4',
          layout: pl.layout,
          printPageSize: pl.printPageSize,
          labelWidthMm: pl.labelWidthMm,
          labelHeightMm: pl.labelHeightMm,
          marginTopMm: pl.marginTopMm,
          marginRightMm: pl.marginRightMm,
          marginBottomMm: pl.marginBottomMm,
          marginLeftMm: pl.marginLeftMm,
        });
        if (!html) throw new Error('Unable to build printable content.');

        const thermalPageSize = pl.isThermalPreview
          ? {
              widthMicrons: Math.round(Math.max(20, pl.labelWidthMm) * 1000),
              heightMicrons: Math.round(Math.max(15, pl.labelHeightMm) * 1000),
            }
          : undefined;

        await window.electron.ipcRenderer.invoke('print-html-content', {
          html,
          printerName: pl.selectedPrinter || undefined,
          pageSize: thermalPageSize,
        });

        pl.setPrintNotice({
          open: true,
          message: `Print job sent${pl.selectedPrinter ? ` to ${pl.selectedPrinter}` : ' to default printer'}.`,
          severity: 'success',
        });
      } catch (error) {
        console.error('Direct print failed:', error);
        const message = 'Direct printing failed. Please check printer connection.';
        pl.setPrintError(message);
        pl.setPrintNotice({ open: true, message, severity: 'error' });
      }
      return;
    }

    // Fallback for browser
    document.body.classList.add('is-printing-price-labels');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('is-printing-price-labels'), 500);
    }, 50);
  };

  const renderPreviewLabelCard = (label, options = {}) => (
    <PriceListLabelCard label={label} options={options} layout={pl.layout} displayOptions={pl.displayOptions} />
  );

  return (
    <Dialog
      open={open} onClose={onClose} maxWidth="xl" fullWidth fullScreen={fullScreen}
      PaperProps={{ sx: { height: { xs: '96vh', sm: '94vh' }, width: { xs: '100%', sm: '96vw' }, maxWidth: '1500px' } }}
    >
      <style>{`
        @media print {
          @page { size: ${pl.printPageSize}; margin: 0; }
          body.is-printing-price-labels { visibility: hidden !important; margin: 0 !important; background: #ffffff !important; }
          body.is-printing-price-labels .printable-labels-area,
          body.is-printing-price-labels .printable-labels-area * { visibility: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #000000 !important; }
          body.is-printing-price-labels .printable-labels-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; z-index: 9999 !important; }
          body.is-printing-price-labels .no-print { display: none !important; }
          body.is-printing-price-labels .MuiDialog-paper,
          body.is-printing-price-labels .MuiDialogContent-root,
          body.is-printing-price-labels .MuiPaper-root,
          body.is-printing-price-labels .MuiBox-root { height: auto !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; }
        }
      `}</style>

      <DialogTitle className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, pb: 1.2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Price List Label Setup</Typography>
          <Typography variant="body2" color="text.secondary">
            Select products, configure label layout, preview all labels, and print.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Close"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flex: 1, minHeight: 0, gap: 2, p: 0.5 }}>
            <PriceListConfigurationPanel
              products={pl.products}
              loadingProducts={pl.loadingProducts}
              selectedProductOptions={pl.selectedProductOptions}
              handleProductSelectionChange={pl.handleProductSelectionChange}
              getPrimaryBarcode={pl.getPrimaryBarcode}
              selectedRows={pl.selectedRows}
              handleDecreaseQuantity={pl.handleDecreaseQuantity}
              handleQuantityChange={pl.handleQuantityChange}
              handleIncreaseQuantity={pl.handleIncreaseQuantity}
              handleRemoveSelectedProduct={pl.handleRemoveSelectedProduct}
              selectedPrinter={pl.selectedPrinter}
              setSelectedPrinter={pl.setSelectedPrinter}
              printers={pl.printers}
              fetchPrinters={pl.fetchPrinters}
              paperType={pl.paperType}
              handlePaperTypeChange={pl.handlePaperTypeChange}
              paperPreset={pl.paperPreset}
              handlePresetChange={pl.handlePresetChange}
              paperPresets={PAPER_PRESETS[pl.paperType]}
              showAdvancedLayout={pl.showAdvancedLayout}
              setShowAdvancedLayout={pl.setShowAdvancedLayout}
              layout={pl.layout}
              setLayout={pl.setLayout}
              displayOptions={pl.displayOptions}
              handleDisplayOptionChange={pl.handleDisplayOptionChange}
            />
            <PriceListPreviewPanel
              selectedRows={pl.selectedRows}
              totalLabelCount={pl.totalLabelCount}
              activePreviewScale={pl.activePreviewScale}
              handleZoomOut={pl.handleZoomOut}
              handleZoomIn={pl.handleZoomIn}
              autoFit={pl.autoFit}
              handleFitToWidth={pl.handleFitToWidth}
              paperType={pl.printPageSize.includes('mm') ? 'thermal' : 'a4'}
              missingBarcodeCount={pl.missingBarcodeCount}
              printError={pl.printError}
              barcodeWarnings={pl.barcodeWarnings}
              previewContainerRef={pl.previewContainerRef}
              previewRef={pl.previewRef}
              isThermalPreview={pl.isThermalPreview}
              labelWidthMm={pl.labelWidthMm}
              previewPageWidthMm={pl.previewPageWidthMm}
              labelHeightMm={pl.labelHeightMm}
              marginTopMm={pl.marginTopMm}
              marginRightMm={pl.marginRightMm}
              marginBottomMm={pl.marginBottomMm}
              marginLeftMm={pl.marginLeftMm}
              previewLabels={pl.previewLabels}
              renderPreviewLabelCard={renderPreviewLabelCard}
              layout={pl.layout}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="no-print" sx={{ px: 2, py: 1.5, borderTop: '1px solid #e5e7eb', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={onClose}>Close</Button>
        <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={handlePrint}>
          Print Labels
        </Button>
      </DialogActions>

      <Snackbar
        open={pl.printNotice.open} autoHideDuration={3000}
        onClose={() => pl.setPrintNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => pl.setPrintNotice((current) => ({ ...current, open: false }))}
          severity={pl.printNotice.severity} variant="filled" sx={{ width: '100%' }}
        >
          {pl.printNotice.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default PriceListPanel;
