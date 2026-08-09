import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { LooseSale, ReportSale } from '@/shared/types/models';
import type {
  PrinterInfo,
  ReceiptSettings,
  ShopMetadata,
} from '@/domains/settings/hooks/useSettings';

interface SaleHistoryProps {
  receiptSettings?: ReceiptSettings | null;
  shopMetadata?: ShopMetadata | null;
  /** Supplied by the shell from Electron's printer list. */
  printers?: PrinterInfo[];
  defaultPrinter?: string | null;
  showError?: (message: string, title?: string) => unknown;
}
import * as Sentry from '@sentry/react';
import { flushSync } from 'react-dom';
import posService from '@/shared/api/posService';
import dashboardService from '@/shared/api/dashboardService';
import { isRequestCanceled } from '@/shared/api/api';
import { Container, Box, CircularProgress } from '@mui/material';

import { useResizablePanel } from '@/shared/hooks/useResizablePanel';
import RefundDialog from '@/domains/refund/components/RefundDialog';
import SaleHistoryHeader from '@/domains/saleHistory/components/SaleHistoryHeader';
import SalesListPanel from '@/domains/saleHistory/components/SalesListPanel';
import POSSaleDetailsPanel from '@/domains/saleHistory/components/POSSaleDetailsPanel';
import SaleHistoryDeleteDialog from '@/domains/saleHistory/components/SaleHistoryDeleteDialog';
import SaleHistoryPrintContainer from '@/domains/saleHistory/components/SaleHistoryPrintContainer';
import { getSaleHistoryRange, buildInclusiveSaleHistoryRange } from '@/domains/saleHistory/components/saleHistoryDateUtils';
import { calculateSaleStats } from '@/domains/saleHistory/components/saleHistoryStats';
import { getResponseArray, getResponseObject } from '@/shared/utils/responseGuards';
import { IPC } from '@/shared/ipcChannels';
import { resolvePrinterName } from '@/shared/utils/resolvePrinterName';

const SaleHistory = ({
  receiptSettings,
  shopMetadata,
  printers = [],
  defaultPrinter = null,
  showError,
}: SaleHistoryProps) => {
  const [sales, setSales] = useState<ReportSale[]>([]);
  const [looseSales, setLooseSales] = useState<LooseSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<ReportSale | LooseSale | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteLooseId, setDeleteLooseId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundSale, setRefundSale] = useState<ReportSale | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { width: rightPanelWidth, isResizing, startResizing } = useResizablePanel({
    storageKey: 'saleHistoryRightPanelWidth',
    defaultWidth: 450,
    min: 320,
    max: typeof window !== 'undefined' ? window.innerWidth * 0.6 : 900,
  });

  const timeframes = [
    { label: 'Today', getValue: () => getSaleHistoryRange('day') },
    { label: 'Yesterday', getValue: () => getSaleHistoryRange('yesterday') },
    { label: 'This Week', getValue: () => getSaleHistoryRange('this_week') },
    { label: 'Last Week', getValue: () => getSaleHistoryRange('last_week') },
    { label: 'This Month', getValue: () => getSaleHistoryRange('this_month') },
    { label: 'Last Month', getValue: () => getSaleHistoryRange('last_month') },
    { label: 'This Year', getValue: () => getSaleHistoryRange('this_year') },
    { label: 'Last Year', getValue: () => getSaleHistoryRange('last_year') },
    { label: 'Custom', getValue: (): null => null },
  ];

  const fetchSales = useCallback(async (start: string, end: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const [salesData, looseSalesData] = await Promise.all([
        posService.fetchSalesHistory(
          { startDate: start, endDate: end },
          { signal: controller.signal }
        ),
        dashboardService.fetchLooseSalesReport(
          { startDate: start, endDate: end },
          { signal: controller.signal }
        ),
      ]);

      const salesList = getResponseObject(salesData).sales || [];
      const looseSalesList = getResponseArray<LooseSale>(looseSalesData);

      setSales(salesList);
      setLooseSales(looseSalesList);

      if (salesList.length > 0) {
        setSelectedSale(salesList[0]);
      } else {
        setSelectedSale(null);
      }
    } catch (error) {
      if (isRequestCanceled(error)) return;
      Sentry.captureException(error, { tags: { feature: 'sale-history-fetch' } });
      console.error('Error fetching sales:', error);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const range = getSaleHistoryRange('day');
    fetchSales(range.start, range.end);
  }, [fetchSales]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input field
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (sales.length === 0) return;

      const currentIndex = sales.findIndex((s) => s.id === selectedSale?.id);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, sales.length - 1);
        if (nextIndex !== currentIndex) {
          const nextSale = sales[nextIndex];
          setSelectedSale(nextSale);
          document.getElementById(`sale-row-${nextSale.id}`)?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex !== currentIndex) {
          const prevSale = sales[prevIndex];
          setSelectedSale(prevSale);
          document.getElementById(`sale-row-${prevSale.id}`)?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sales, selectedSale]);

  const handleTabChange = (event: { target: { value: number } }) => {
    const newValue = event.target.value;
    setTabValue(newValue);
    if (newValue < 8) {
      const range = timeframes[newValue].getValue();
      if (range) fetchSales(range.start, range.end);
    }
  };

  const handleApplyCustomRange = () => {
    const range = buildInclusiveSaleHistoryRange(dateRange.startDate, dateRange.endDate);
    if (!range) return;
    fetchSales(range.start, range.end);
  };

  const handlePrintReceipt = async (sale: ReportSale) => {
    // Guard against a double-tap queueing two silent jobs.
    if (isPrinting) return;

    flushSync(() => {
      setSelectedSale(sale);
    });

    if (!receiptSettings?.directPrint || !window.electron) {
      window.print();
      return;
    }

    setIsPrinting(true);
    try {
      const printer = resolvePrinterName({ receiptSettings, printers, defaultPrinter });
      if (!printer) {
        showError?.('No printer configured. Go to Settings → Receipt Settings to select a printer.');
        return;
      }
      const result = await window.electron.ipcRenderer.invoke<{
        success?: boolean;
        error?: string;
      }>(IPC.PRINT_MANUAL, { printerName: printer });
      if (!result?.success) {
        showError?.(`Print failed: ${result?.error || 'Unknown error'} Check that the printer is on and connected.`);
      }
    } catch (error) {
      showError?.(`Print failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleRefund = (sale: ReportSale) => {
    setRefundSale(sale);
    setShowRefundDialog(true);
  };

  const handleRefundSuccess = () => {
    // Refresh the sales list based on current timeframe
    if (tabValue < 8) {
      const range = timeframes[tabValue].getValue();
      if (range) fetchSales(range.start, range.end);
    } else if (dateRange.startDate && dateRange.endDate) {
      handleApplyCustomRange();
    }
  };

  const handleDeleteLooseSale = async () => {
    if (!deleteLooseId) return;
    try {
      await posService.deleteLooseSale(deleteLooseId);
      setDeleteLooseId(null);
      // Refresh
      if (tabValue < 8) {
        const range = timeframes[tabValue].getValue();
        if (range) fetchSales(range.start, range.end);
      } else {
        handleApplyCustomRange();
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'sale-history-delete-loose' } });
      console.error('Failed to delete loose sale:', error);
    }
  };

  // The list can hold either kind of row; only till sales have `items`, and
  // the detail/print panels below are POS-only.
  const selectedPosSale =
    selectedSale && 'items' in selectedSale ? (selectedSale as ReportSale) : null;

  const stats = calculateSaleStats(selectedPosSale);

  return (
    <Box
      sx={{
        bgcolor: '#f8fafc',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <SaleHistoryHeader
        tabValue={tabValue}
        onTabChange={handleTabChange}
        timeframes={timeframes}
        dateRange={dateRange}
        onDateRangeChange={(key: string, value: string) => setDateRange((prev) => ({ ...prev, [key]: value }))}
        onApplyCustomRange={handleApplyCustomRange}
      />

      <Container
        disableGutters
        maxWidth={false}
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pt: 0,
          px: 1.5,
          pb: 1.5,
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : (
          <Box
            className="no-print"
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 1.5,
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* Left Panel: Sales List */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                minWidth: 0,
              }}
            >
              <SalesListPanel
                sales={sales}
                looseSales={looseSales}
                selectedSale={selectedSale}
                onSelectSale={setSelectedSale}
                onPrintReceipt={handlePrintReceipt}
                onRefund={handleRefund}
                onDeleteLoose={setDeleteLooseId}
              />
            </Box>

            {/* Vertical Resizer Slider */}
            <Box
              onMouseDown={startResizing}
              sx={{
                display: { xs: 'none', lg: 'flex' },
                width: '12px',
                mx: -1.5,
                cursor: 'col-resize',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                '&:hover .handle': {
                  bgcolor: 'primary.main',
                  width: '4px',
                },
              }}
            >
              <Box
                className="handle"
                sx={{
                  width: '2px',
                  height: '60px',
                  bgcolor: isResizing ? 'primary.main' : 'divider',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                  ...(isResizing && { width: '4px' }),
                }}
              />
            </Box>

            {/* Right Panel: Transaction Details */}
            <Box
              sx={{
                width: { xs: '100%', lg: rightPanelWidth },
                minWidth: { lg: 320 },
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <POSSaleDetailsPanel selectedSale={selectedPosSale} stats={stats} />
            </Box>
          </Box>
        )}

        <SaleHistoryPrintContainer
          selectedSale={selectedPosSale}
          receiptSettings={receiptSettings}
          shopMetadata={shopMetadata}
        />

        {/* Refund Dialog */}
        <RefundDialog
          open={showRefundDialog}
          onClose={() => setShowRefundDialog(false)}
          sale={refundSale}
          onRefundSuccess={handleRefundSuccess}
        />

        <SaleHistoryDeleteDialog
          deleteLooseId={deleteLooseId}
          onClose={() => setDeleteLooseId(null)}
          onConfirm={handleDeleteLooseSale}
        />
      </Container>
    </Box>
  );
};

export default SaleHistory;
