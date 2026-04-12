import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import posService from '../../shared/api/posService';
import dashboardService from '../../shared/api/dashboardService';
import { isRequestCanceled } from '../../shared/api/api';
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';

import Receipt from '../POS/Receipt';
import RefundDialog from '../Refund/RefundDialog';
import SaleHistoryHeader from './SaleHistoryHeader';
import SalesListPanel from './SalesListPanel';
import POSSaleDetailsPanel from './POSSaleDetailsPanel';

const SaleHistory = ({ receiptSettings, shopMetadata, printers = [], defaultPrinter = null }) => {
  const [sales, setSales] = useState([]);
  const [looseSales, setLooseSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [saleType, setSaleType] = useState('pos');
  const [deleteLooseId, setDeleteLooseId] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundSale, setRefundSale] = useState(null);
  const abortControllerRef = useRef(null);

  const timeframes = [
    { label: 'Today', getValue: () => getRange('day') },
    { label: 'Yesterday', getValue: () => getRange('yesterday') },
    { label: 'This Week', getValue: () => getRange('this_week') },
    { label: 'Last Week', getValue: () => getRange('last_week') },
    { label: 'This Month', getValue: () => getRange('this_month') },
    { label: 'Last Month', getValue: () => getRange('last_month') },
    { label: 'This Year', getValue: () => getRange('this_year') },
    { label: 'Last Year', getValue: () => getRange('last_year') },
    { label: 'Custom', getValue: () => null },
  ];

  const getRange = useCallback((type) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (type) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case 'this_week': {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - diffToMonday,
          0,
          0,
          0,
          0
        );
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      }
      case 'last_week': {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - diffToMonday - 7,
          0,
          0,
          0,
          0
        );
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - diffToMonday - 1,
          23,
          59,
          59,
          999
        );
        break;
      }
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'last_year':
        start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      default:
        break;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  }, []);

  const fetchSales = useCallback(async (start, end) => {
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

      const salesList = salesData.sales || [];
      const looseSalesList = looseSalesData || [];

      setSales(salesList);
      setLooseSales(looseSalesList);

      if (salesList.length > 0) {
        setSelectedSale(salesList[0]);
      } else {
        setSelectedSale(null);
      }
    } catch (error) {
      if (isRequestCanceled(error)) return;
      console.error('Error fetching sales:', error);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const range = getRange('day');
    fetchSales(range.start, range.end);
  }, [fetchSales, getRange]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't navigate if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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

  const handleTabChange = (event) => {
    const newValue = event.target.value;
    setTabValue(newValue);
    if (newValue < 8) {
      const range = timeframes[newValue].getValue();
      fetchSales(range.start, range.end);
    }
  };

  const handleApplyCustomRange = () => {
    if (dateRange.startDate && dateRange.endDate) {
      const [sy, sm, sd] = dateRange.startDate.split('-').map(Number);
      const [ey, em, ed] = dateRange.endDate.split('-').map(Number);

      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      fetchSales(start.toISOString(), end.toISOString());
    }
  };

  const handlePrintReceipt = (sale) => {
    flushSync(() => {
      setSelectedSale(sale);
    });

    if (receiptSettings?.directPrint && window.electron) {
      const rawPrinter = receiptSettings?.printerType;
      const isValidPrinter = rawPrinter && printers.some((p) => p.name === rawPrinter);
      const printer = isValidPrinter
        ? rawPrinter
        : defaultPrinter || (printers.find((p) => p.isDefault) || printers[0])?.name;
      window.electron.ipcRenderer.send('print-manual', { printerName: printer });
    } else {
      window.print();
    }
  };

  const handleRefund = (sale) => {
    setRefundSale(sale);
    setShowRefundDialog(true);
  };

  const handleRefundSuccess = () => {
    // Refresh the sales list based on current timeframe
    if (tabValue < 8) {
      const range = timeframes[tabValue].getValue();
      fetchSales(range.start, range.end);
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
        fetchSales(range.start, range.end);
      } else {
        handleApplyCustomRange();
      }
    } catch (error) {
      console.error('Failed to delete loose sale:', error);
    }
  };

  const handleSaleTypeChange = (event, newType) => {
    if (newType !== null) {
      setSaleType(newType);
      // Reset selected item when switching tabs
      if (newType === 'pos') {
        setSelectedSale(sales[0] || null);
      } else {
        setSelectedSale(looseSales[0] || null);
      }
    }
  };

  const calculateStats = (sale) => {
    if (!sale) return { total: 0, mrpDiscount: 0, extraDiscount: 0, discountPercent: 0 };

    // Calculate MRP discount (sum of item-level MRP discounts)
    let mrpDiscount = 0;
    sale.items?.forEach((item) => {
      const mrp = item.mrp || item.sellingPrice;
      mrpDiscount += (mrp - item.sellingPrice) * item.quantity;
    });

    // Extra discount is from the sale level
    const extraDiscount = sale.extraDiscount || 0;

    // Total discount
    const totalDiscount = mrpDiscount + extraDiscount;

    // Subtotal (sum of all item MRP)
    let subtotal = 0;
    sale.items?.forEach((item) => {
      const mrp = item.mrp || item.sellingPrice;
      subtotal += mrp * item.quantity;
    });

    const discountPercent = subtotal > 0 ? ((totalDiscount / subtotal) * 100).toFixed(2) : 0;

    return {
      total: sale.netTotalAmount || sale.totalAmount,
      mrpDiscount: mrpDiscount,
      extraDiscount: extraDiscount,
      totalDiscount: totalDiscount,
      discountPercent,
    };
  };

  const stats = calculateStats(selectedSale);

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <SaleHistoryHeader
        saleType={saleType}
        onSaleTypeChange={handleSaleTypeChange}
        tabValue={tabValue}
        onTabChange={handleTabChange}
        timeframes={timeframes}
        dateRange={dateRange}
        onDateRangeChange={(key, value) => setDateRange((prev) => ({ ...prev, [key]: value }))}
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
          px: 3,
          pb: 3,
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
          <Grid
            container
            spacing={2}
            wrap="nowrap"
            className="no-print"
            sx={{ flex: 1, minHeight: 0, overflow: 'hidden', flexWrap: 'nowrap' }}
          >
            {/* Left Panel: Sales List */}
            <Grid
              item
              xs={saleType === 'pos' ? 6 : 12}
              md={saleType === 'pos' ? 6 : 12}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                minWidth: 0,
                flexBasis: saleType === 'pos' ? '50%' : '100%',
                maxWidth: saleType === 'pos' ? '50%' : '100%',
                transition: 'all 0.3s ease',
              }}
            >
              <SalesListPanel
                saleType={saleType}
                sales={sales}
                looseSales={looseSales}
                selectedSale={selectedSale}
                onSelectSale={setSelectedSale}
                onPrintReceipt={handlePrintReceipt}
                onRefund={handleRefund}
                onDeleteLoose={setDeleteLooseId}
              />
            </Grid>

            {/* Right Panel: Statistics & Products (Only for POS Sales) */}
            {saleType === 'pos' && (
              <Grid
                item
                xs={6}
                md={6}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  minWidth: 0,
                  flexBasis: '50%',
                  maxWidth: '50%',
                }}
              >
                <POSSaleDetailsPanel selectedSale={selectedSale} stats={stats} />
              </Grid>
            )}
          </Grid>
        )}

        {/* Hidden Print Container for Direct Printing in Sale History */}
        <Box
          sx={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            height: 0,
            overflow: 'hidden',
            '@media print': {
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: 'auto',
              overflow: 'visible',
              display: 'block',
              zIndex: 9999,
            },
          }}
        >
          <div id="thermal-receipt-print">
            {selectedSale && (
              <Receipt
                sale={selectedSale}
                settings={
                  receiptSettings || {
                    shopName: true,
                    header: true,
                    footer: true,
                    mrp: true,
                    price: true,
                    discount: true,
                    totalValue: true,
                    productName: true,
                    exp: true,
                    barcode: true,
                    totalSavings: true,
                    customShopName: localStorage.getItem('posShopName') || 'Bachat Bazaar',
                    customHeader: '123 Business Street, City',
                    customFooter: 'Thank You! Visit Again',
                  }
                }
                shopMetadata={shopMetadata}
              />
            )}
          </div>
        </Box>

        {/* Refund Dialog */}
        <RefundDialog
          open={showRefundDialog}
          onClose={() => setShowRefundDialog(false)}
          sale={refundSale}
          onRefundSuccess={handleRefundSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={Boolean(deleteLooseId)}
          onClose={() => setDeleteLooseId(null)}
          PaperProps={{
            sx: { borderRadius: 3, p: 1 },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 800,
              color: '#d32f2f',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <DeleteIcon color="error" />
            Delete Loose Sale?
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontWeight: 500 }}>
              Are you sure you want to permanently delete this loose sale record (LOO-
              {deleteLooseId})? This action cannot be undone and will be removed from all financial
              reports.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setDeleteLooseId(null)}
              variant="outlined"
              color="inherit"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteLooseSale}
              variant="contained"
              color="error"
              sx={{ fontWeight: 800, borderRadius: 2, px: 3 }}
            >
              Yes, Delete Record
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default SaleHistory;
