import {
  Alert, Box, Button, Divider, Paper, Snackbar, Stack, Typography,
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import PriceListConfigurationPanel from '@/domains/inventory/components/PriceListConfigurationPanel';
import PriceListPreviewPanel from '@/domains/inventory/components/PriceListPreviewPanel';
import type { PriceListLabel } from '@/domains/inventory/components/usePriceList';
import PriceListLabelCard from '@/domains/inventory/components/PriceListLabelCard';
import * as Sentry from '@sentry/react';
import { buildPriceListPrintableHtml } from '@/domains/inventory/components/priceListPrintUtils';
import { PAPER_PRESETS } from '@/domains/inventory/components/paperSizePresets';
import usePriceList from '@/domains/inventory/components/usePriceList';

interface PriceListPanelProps {
  open?: boolean;
}

const PriceListPanel = ({ open = true }: PriceListPanelProps) => {
  const pl = usePriceList(open);

  // IPC print call must stay in this file
  const handlePrint = async () => {
    // Guard against a double-tap queueing two jobs.
    if (pl.isPrinting) return;
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
      pl.setIsPrinting(true);
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

        // print-html-content returns {success,error} — it used to throw, so
        // this success notice fired unconditionally and the specific message
        // main builds ("printer offline, go reselect it") was thrown away.
        const result = await window.electron.ipcRenderer.invoke<{
          success?: boolean;
          error?: string;
        }>('print-html-content', {
          html,
          printerName: pl.selectedPrinter || undefined,
          pageSize: thermalPageSize,
        });

        if (!result?.success) {
          const message = result?.error || 'Direct printing failed. Please check printer connection.';
          pl.setPrintError(message);
          pl.setPrintNotice({ open: true, message, severity: 'error' });
          return;
        }

        pl.setPrintNotice({
          open: true,
          message: `Print job sent${pl.selectedPrinter ? ` to ${pl.selectedPrinter}` : ' to default printer'}.`,
          severity: 'success',
        });
      } catch (error) {
        Sentry.captureException(error, { tags: { feature: 'price-list-print' } });
        console.error('Direct print failed:', error);
        const message =
          error instanceof Error ? error.message : 'Direct printing failed. Please check printer connection.';
        pl.setPrintError(message);
        pl.setPrintNotice({ open: true, message, severity: 'error' });
      } finally {
        pl.setIsPrinting(false);
      }
      return;
    }

    // Fallback for browser. The class removal is in a finally because a
    // synchronous throw from window.print() (blocked by the browser) would
    // otherwise leave `is-printing-price-labels` on <body> permanently,
    // hiding the whole app on every later print.
    document.body.classList.add('is-printing-price-labels');
    setTimeout(() => {
      try {
        window.print();
      } finally {
        setTimeout(() => document.body.classList.remove('is-printing-price-labels'), 500);
      }
    }, 50);
  };

  const renderPreviewLabelCard = (label: PriceListLabel) => (
    <PriceListLabelCard label={label} layout={pl.layout} displayOptions={pl.displayOptions} />
  );

  if (!open) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#ffffff',
      }}
      className="price-list-flat-view"
    >
      <style>{`
        @media print {
          @page { size: ${pl.printPageSize}; margin: 0; }
          body.is-printing-price-labels { visibility: hidden !important; margin: 0 !important; background: #ffffff !important; }
          body.is-printing-price-labels .printable-labels-area,
          body.is-printing-price-labels .printable-labels-area * { visibility: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #000000 !important; }
          body.is-printing-price-labels .printable-labels-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; z-index: 9999 !important; }
          body.is-printing-price-labels .no-print { display: none !important; }
          body.is-printing-price-labels .price-list-flat-view,
          body.is-printing-price-labels .MuiPaper-root,
          body.is-printing-price-labels .MuiBox-root { height: auto !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* Main Configuration & Preview Columns */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <PriceListConfigurationPanel
          products={pl.products}
          loadingProducts={pl.loadingProducts}
          selectedProductOptions={pl.selectedProductOptions}
          handleProductSelectionChange={pl.handleProductSelectionChange}
          handleAddProduct={pl.handleAddProduct}
          handleClearAllProducts={pl.handleClearAllProducts}
          getPrimaryBarcode={pl.getPrimaryBarcode}
          selectedRows={pl.selectedRows}
          recentlyAddedId={pl.recentlyAddedId}
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
          handleResetLayout={pl.handleResetLayout}
          paperPresets={PAPER_PRESETS[pl.paperType as keyof typeof PAPER_PRESETS]}
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
          labelFitWarning={pl.labelFitWarning}
          pageWidthWarning={pl.pageWidthWarning}
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

      {/* Horizontal Divider before Action Footer */}
      <Divider sx={{ my: 1.5, borderColor: '#e2e8f0' }} className="no-print" />

      {/* Bottom Action Footer */}
      <Box
        className="no-print"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          pt: 0.5,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0b1d39' }}>
            {pl.selectedRows.length} {pl.selectedRows.length === 1 ? 'Product' : 'Products'} ({pl.totalLabelCount} {pl.totalLabelCount === 1 ? 'Label' : 'Labels'})
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
            Paper: <strong style={{ color: '#0b1d39' }}>{pl.paperType === 'thermal' ? 'Thermal Roll' : 'A4 Sheet'}</strong> ({pl.printPageSize})
          </Typography>
        </Stack>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={pl.isPrinting || pl.previewLabels.length === 0}
          sx={{
            bgcolor: '#0b1d39',
            color: '#ffffff',
            borderRadius: '8px',
            px: 4,
            py: 1.15,
            fontWeight: 700,
            fontSize: '0.925rem',
            textTransform: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': { bgcolor: '#162e56', boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
            '&.Mui-disabled': {
              bgcolor: '#cbd5e1',
              color: '#94a3b8',
            },
          }}
        >
          {pl.isPrinting ? 'Printing…' : 'Print Labels'}
        </Button>
      </Box>

      {/* Print Notice Feedback Snackbar */}
      <Snackbar
        open={pl.printNotice.open}
        autoHideDuration={3000}
        onClose={() => pl.setPrintNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => pl.setPrintNotice((current) => ({ ...current, open: false }))}
          severity={pl.printNotice.severity as import('@mui/material').AlertColor}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {pl.printNotice.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default PriceListPanel;
