import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Switch,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ReceiptLong as ReceiptIcon,
  FormatColorText as LayoutIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import type {
  PrinterInfo,
  ReceiptSettings,
  ShopMetadata,
} from '@/domains/settings/hooks/useSettings';
import type { ReceiptSale } from '@/domains/pos/types';
import Receipt from '@/domains/pos/components/Receipt';
import ReceiptPrintPortal from '@/shared/components/ReceiptPrintPortal';
import { buildReceiptPrintHtml } from '@/domains/pos/components/receiptPrintHtml';
import {
  fetchPrintersForPreview,
  RECEIPT_VISIBILITY_FIELDS,
} from '@/domains/pos/components/receiptPreviewDialogUtils';
import type { PrintResult } from '@/domains/pos/components/receiptPreviewDialogUtils';
import { resolvePrinterName } from '@/shared/utils/resolvePrinterName';
import { getReceiptPageSize } from '@/shared/utils/receiptPrintOptions';
import { IPC } from '@/shared/ipcChannels';
import { SAMPLE_SALE } from './customizeBillSampleSale';

interface CustomizeBillTabProps {
  billSettings: ReceiptSettings;
  onSettingChange: (field: string) => void;
  onTextSettingChange: (field: string, value: unknown) => void;
  shopMetadata: ShopMetadata;
  printers?: PrinterInfo[];
  defaultPrinter?: string | null;
  customerFeatureEnabled?: boolean;
}

const CustomizeBillTab = ({
  billSettings,
  onSettingChange,
  onTextSettingChange,
  shopMetadata,
  printers = [],
  defaultPrinter = null,
  customerFeatureEnabled = true,
}: CustomizeBillTabProps) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isPrinting, setIsPrinting] = useState(false);

  /**
   * IPC print call — kept in this component rather than a utils module so the
   * invoke stays next to the UI state it gates (see CLAUDE.md). Mirrors
   * ReceiptPreviewDialog.tsx's printPreview exactly, since this screen used
   * to render that dialog before the settings-page redesign.
   */
  const handlePrintTest = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      if (!billSettings?.directPrint || !window.electron) {
        window.print();
        return;
      }
      const printerName = resolvePrinterName({ receiptSettings: billSettings, printers, defaultPrinter });
      // Printed from an isolated window (same mechanism as Sale History/
      // barcode/price-list) targeting this tab's own hidden portal
      // (targetId="customize-bill-print-target" below) rather than the
      // main app window.
      const html = buildReceiptPrintHtml('customize-bill-print-target');
      if (!html) {
        setSnackbar({
          open: true,
          message: 'Could not prepare the receipt for printing. Please try again.',
          severity: 'error',
        });
        return;
      }
      const pageSize = getReceiptPageSize(billSettings?.paperSize);
      const result = await window.electron.ipcRenderer.invoke<PrintResult>(IPC.PRINT_HTML_CONTENT, {
        html,
        printerName,
        pageSize,
      });
      if (!result?.success) {
        setSnackbar({
          open: true,
          message: `Print failed: ${result?.error || 'Unknown error'}`,
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Print failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleTestFetch = async () => {
    const result = await fetchPrintersForPreview();
    setSnackbar({
      open: true,
      message: result.message,
      severity: result.severity,
    });
  };

  return (
    <Grid container spacing={2.5}>
      {/* Settings Form Column */}
      <Grid size={{ xs: 12, lg: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Card 1: Header & Footer Text */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: '#0b1d39',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ReceiptIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                Header & Footer Messaging
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Shop Name"
                size="small"
                fullWidth
                value={(billSettings.customShopName as string) || ''}
                onChange={(e) => onTextSettingChange('customShopName', e.target.value)}
                placeholder="e.g. My Store"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Invoice Title"
                size="small"
                fullWidth
                value={(billSettings.invoiceLabel as string) || 'Tax Invoice'}
                onChange={(e) => onTextSettingChange('invoiceLabel', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Header Line 1"
                size="small"
                fullWidth
                value={(billSettings.customHeader as string) || ''}
                onChange={(e) => onTextSettingChange('customHeader', e.target.value)}
                placeholder="e.g. Welcome to our store"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Header Line 2 (Optional)"
                size="small"
                fullWidth
                value={(billSettings.customHeader2 as string) || ''}
                onChange={(e) => onTextSettingChange('customHeader2', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Header Line 3 (Optional)"
                size="small"
                fullWidth
                value={(billSettings.customHeader3 as string) || ''}
                onChange={(e) => onTextSettingChange('customHeader3', e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Footer Message 1"
                size="small"
                fullWidth
                value={(billSettings.customFooter as string) || ''}
                onChange={(e) => onTextSettingChange('customFooter', e.target.value)}
                placeholder="e.g. Thank you for shopping with us!"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Footer Message 2 (Optional)"
                size="small"
                fullWidth
                value={(billSettings.customFooter2 as string) || ''}
                onChange={(e) => onTextSettingChange('customFooter2', e.target.value)}
                placeholder="e.g. Goods once sold cannot be returned"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Card 2: Layout & Paper Formatting */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: '#0b1d39',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LayoutIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                Layout & Paper Formatting
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Bill Format</InputLabel>
                <Select
                  value={(billSettings.billFormat as string) || 'Standard'}
                  label="Bill Format"
                  onChange={(e) => onTextSettingChange('billFormat', e.target.value)}
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="Standard">Standard</MenuItem>
                  <MenuItem value="Modern">Modern (Sans-Serif)</MenuItem>
                  <MenuItem value="Classic">Classic (Courier)</MenuItem>
                  <MenuItem value="Minimal">Minimalist</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Paper Size</InputLabel>
                <Select
                  value={(billSettings.paperSize as string) || '80mm'}
                  label="Paper Size"
                  onChange={(e) => onTextSettingChange('paperSize', e.target.value)}
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="80mm">80mm (3-inch)</MenuItem>
                  <MenuItem value="58mm">58mm (2-inch)</MenuItem>
                  <MenuItem value="72mm">72mm (Standard)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Global Font Size"
                size="small"
                type="number"
                fullWidth
                value={billSettings.fontSize ?? 0.7}
                onChange={(e) =>
                  onTextSettingChange('fontSize', parseFloat(e.target.value) || 0.7)
                }
                inputProps={{ min: 0.5, max: 2, step: 0.05 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Item Font Size"
                size="small"
                type="number"
                fullWidth
                value={billSettings.itemFontSize ?? 0.7}
                onChange={(e) =>
                  onTextSettingChange('itemFontSize', parseFloat(e.target.value) || 0.7)
                }
                inputProps={{ min: 0.5, max: 2, step: 0.05 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Line Height"
                size="small"
                type="number"
                fullWidth
                value={billSettings.lineHeight ?? 1.1}
                onChange={(e) =>
                  onTextSettingChange('lineHeight', parseFloat(e.target.value) || 1.1)
                }
                inputProps={{ min: 0.8, max: 2.0, step: 0.1 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Grid>

            {/* Alignments */}
            {(['Title', 'Header', 'Footer'] as const).map((alignField) => (
              <Grid size={{ xs: 12, sm: 4 }} key={alignField}>
                <FormControl fullWidth size="small">
                  <InputLabel>{alignField} Alignment</InputLabel>
                  <Select
                    value={(billSettings[`${alignField.toLowerCase()}Align`] as string) || 'center'}
                    label={`${alignField} Alignment`}
                    onChange={(e) =>
                      onTextSettingChange(`${alignField.toLowerCase()}Align`, e.target.value)
                    }
                    sx={{ borderRadius: '8px' }}
                  >
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            ))}

            {/* Margins */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1 }}>
                MARGINS (MM)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <TextField
                    label="Top"
                    size="small"
                    type="number"
                    fullWidth
                    value={billSettings.marginTop ?? 0}
                    onChange={(e) =>
                      onTextSettingChange('marginTop', parseInt(e.target.value, 10) || 0)
                    }
                    inputProps={{ min: 0, max: 20 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField
                    label="Bottom"
                    size="small"
                    type="number"
                    fullWidth
                    value={billSettings.marginBottom ?? 0}
                    onChange={(e) =>
                      onTextSettingChange('marginBottom', parseInt(e.target.value, 10) || 0)
                    }
                    inputProps={{ min: 0, max: 20 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <TextField
                    label="Sides"
                    size="small"
                    type="number"
                    fullWidth
                    value={billSettings.marginSide ?? 4}
                    onChange={(e) =>
                      onTextSettingChange('marginSide', parseInt(e.target.value, 10) || 0)
                    }
                    inputProps={{ min: 0, max: 20 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Card 3: Printer & Printing Behavior */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: '#0b1d39',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PrintIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                  Printer & Behavior
                </Typography>
              </Box>
            </Box>

            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleTestFetch}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                color: '#0b1d39',
                borderColor: '#cbd5e1',
                '&:hover': { borderColor: '#0b1d39', bgcolor: '#f8fafc' },
              }}
            >
              Test Fetch
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="printer-select-label" shrink>Printer Selection</InputLabel>
                <Select
                  labelId="printer-select-label"
                  notched
                  value={
                    printers?.some((p) => p.name === billSettings.printerType)
                      ? (billSettings.printerType as string)
                      : ''
                  }
                  label="Printer Selection"
                  onChange={(e) => onTextSettingChange('printerType', e.target.value)}
                  displayEmpty
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="" disabled>
                    {printers && printers.length > 0 ? 'Select a printer...' : 'No printers found'}
                  </MenuItem>
                  {printers &&
                    printers.map((printer, index) => (
                      <MenuItem key={index} value={printer.name}>
                        {printer.name} {printer.isDefault ? '(Default)' : ''}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Direct Print Toggle Row */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                    🚀 Direct Print
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Skip preview dialog and immediately print receipt upon checkout payment.
                  </Typography>
                </Box>
                <Switch
                  checked={Boolean(billSettings.directPrint)}
                  onChange={() => onSettingChange('directPrint')}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#0b1d39',
                      '& + .MuiSwitch-track': { bgcolor: '#0b1d39' },
                    },
                  }}
                />
              </Box>
            </Grid>

            {/* Round Off Toggle Row */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                    Automatic Round Off
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Round final bill totals to the nearest integer currency unit (₹).
                  </Typography>
                </Box>
                <Switch
                  checked={Boolean(billSettings.roundOff)}
                  onChange={() => onSettingChange('roundOff')}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#0b1d39',
                      '& + .MuiSwitch-track': { bgcolor: '#0b1d39' },
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Card 4: Content Visibility */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: '#0b1d39',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VisibilityIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                Content Visibility
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={1.5}>
            {RECEIPT_VISIBILITY_FIELDS.map((field) => (
              <Grid size={{ xs: 12, sm: 6 }} key={field}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>
                    Show {field.replace(/([A-Z])/g, ' $1')}
                  </Typography>
                  <Switch
                    size="small"
                    checked={Boolean(billSettings[field])}
                    onChange={() => onSettingChange(field)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#0b1d39',
                        '& + .MuiSwitch-track': { bgcolor: '#0b1d39' },
                      },
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>

      {/* Right Column: Live Receipt Simulation */}
      <Grid size={{ xs: 12, lg: 5 }}>
        <Box
          sx={{
            position: { xs: 'static', lg: 'sticky' },
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                pb: 1.5,
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                  Live Receipt Simulation
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                startIcon={<PrintIcon />}
                onClick={handlePrintTest}
                disabled={isPrinting}
                sx={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: '#0b1d39',
                  borderColor: '#cbd5e1',
                  '&:hover': { borderColor: '#0b1d39', bgcolor: '#f8fafc' },
                }}
              >
                {isPrinting ? 'Printing...' : 'Print Test'}
              </Button>
            </Box>

            {/* Thermal Staging Window */}
            <Box
              sx={{
                bgcolor: '#475569',
                p: { xs: 2, md: 3 },
                borderRadius: '8px',
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 280px)',
                display: 'flex',
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              <Paper
                elevation={6}
                sx={{
                  width: 'fit-content',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  bgcolor: '#ffffff',
                  mb: 1,
                }}
              >
                <Receipt
                  sale={SAMPLE_SALE}
                  settings={billSettings}
                  shopMetadata={shopMetadata}
                  customerFeatureEnabled={customerFeatureEnabled}
                />
              </Paper>
            </Box>
          </Paper>
        </Box>
      </Grid>

      {/*
        The visible "Live Receipt Simulation" <Receipt> above is a normal,
        in-place rendered element — it lives inside this page's own layout
        (nested under AppLayout's position:relative `main`), not portaled to
        document.body. index.css's print rules hide every `body *` except
        `#thermal-receipt-print`, and Receipt.tsx's own print CSS forces
        `position: absolute` on #receipt-container — so printing the visible
        preview directly would both (a) stay invisible (it isn't wrapped in
        #thermal-receipt-print) and (b) size itself against this narrow
        sticky panel rather than the physical page, reproducing the original
        sidebar-width bug. This hidden twin, portaled straight to
        document.body via the same ReceiptPrintPortal POS/Sale History use,
        is the actual print target — handlePrintTest's window.print()/
        print-manual call picks this one up, not the visible simulation.
      */}
      <ReceiptPrintPortal
        // SAMPLE_SALE is a display fixture (id: 'PREVIEW', not a real sale
        // id) — Receipt.tsx itself accepts it via a loose Record<string,
        // any> prop type; ReceiptPrintPortal's stricter ReceiptSale type
        // reflects its two real call sites (POS/Sale History), so the cast
        // is narrowly scoped to this one fixture-data usage.
        sale={SAMPLE_SALE as unknown as ReceiptSale}
        receiptSettings={billSettings}
        shopMetadata={shopMetadata}
        customerFeatureEnabled={customerFeatureEnabled}
        // Not strictly required today (this route unmounts POS's own portal
        // on navigation, so there's no live collision), but an explicit,
        // distinct id per consumer is what actually makes that safe by
        // construction rather than by an implicit "different route" fact
        // someone could break later.
        targetId="customize-bill-print-target"
      />

      {/* Test Print / IPC Feedback Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity as import('@mui/material').AlertColor}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default CustomizeBillTab;
