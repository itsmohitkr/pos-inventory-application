import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Button, Chip } from '@mui/material';
import { LocalOffer as PromoIcon } from '@mui/icons-material';

import POSSearchBar from './POSSearchBar';
import CartTable from './CartTable';
import TransactionPanel from './TransactionPanel';
import BatchSelectionDialog from './BatchSelectionDialog';
import ReceiptPreviewDialog from './ReceiptPreviewDialog';
import QuantityDialog from './QuantityDialog';
import LooseSaleDialog from './LooseSaleDialog';
import POSTabs from './POSTabs';
import POSPrintContainer from './POSPrintContainer';
import POSFloatingActions from './POSFloatingActions';
import Calculator from './Calculator';
import NumpadDialog from './NumpadDialog';
import PromoGiftsList from './PromoGiftsList';
import CustomDialog from '../common/CustomDialog';
import SuccessNotification from '../common/SuccessNotification';
import useCustomDialog from '../../shared/hooks/useCustomDialog';
import { usePOSTabs } from '../../hooks/usePOSTabs';
import { usePOSLayout } from '../../hooks/usePOSLayout';
import { usePOSShortcuts } from '../../hooks/usePOSShortcuts';
import inventoryService from '../../shared/api/inventoryService';
import posService from '../../shared/api/posService';
import dashboardService from '../../shared/api/dashboardService';
import settingsService from '../../shared/api/settingsService';
import {
  getStoredPaymentSettings,
  getFullscreenEnabled,
  getNotificationDuration,
  getExtraDiscountEnabled,
  getChangeCalculatorEnabled,
  getPaymentMethodsEnabled,
  getCalculatorEnabled,
  getDecodedPricesEnabled,
} from '../../shared/utils/paymentSettings';

import { STORAGE_KEYS, getStoredReceiptSettings } from './posReceiptSettings';

const POS = ({
  receiptSettings: propReceiptSettings,
  shopMetadata: propShopMetadata,
  printers = [],
  defaultPrinter = null,
}) => {
  const navigate = useNavigate();
  const { dialogState, showError, showConfirm, closeDialog } = useCustomDialog();

  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('posCachedProducts');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('posCurrentUser'));
    } catch {
      return null;
    }
  });

  const {
    tabs,
    activeTabId,
    setActiveTabId,
    cart,
    discount,
    setDiscount,
    addToCart,
    removeFromCart,
    updateQuantity,
    handleSetQuantity,
    addFreeProduct: addFreeProductHook,
    handleAddTab,
    handleCloseTab,
    clearCart,
    lastAddedItemId,
    setLastAddedItemId: _setLastAddedItemId,
    subTotal,
    totalMrp,
    totalCostPrice,
    totalQty,
    baseTotalAmount,
    totalProfit,
    alreadyHasFreeProduct,
  } = usePOSTabs(products);

  const {
    transactionPanelWidth,
    isResizing,
    startResizing,
    isFullscreen,
    handleFullscreenToggle,
    showCalculator,
    setShowCalculator,
    showNumpad,
    setShowNumpad,
    showLooseSaleDialog,
    setShowLooseSaleDialog,
    showPromoGifts,
    setShowPromoGifts,
    showReceipt,
    setShowReceipt,
    searchBarRef,
    refocus,
  } = usePOSLayout();

  const [scannedProduct, setScannedProduct] = useState(null);
  const [manualQuantityItem, setManualQuantityItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSale, setLastSale] = useState(null);
  const [receiptSettings, setReceiptSettings] = useState(
    () => propReceiptSettings || getStoredReceiptSettings()
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(() => getStoredPaymentSettings());
  const [fullscreenEnabled, setFullscreenEnabled] = useState(getFullscreenEnabled);
  const [extraDiscountEnabled, setExtraDiscountEnabled] = useState(() => getExtraDiscountEnabled());
  const [isCalculatorEnabled, setCalculatorEnabledState] = useState(getCalculatorEnabled);
  const [changeCalculatorEnabled, setChangeCalculatorEnabledState] = useState(
    getChangeCalculatorEnabled()
  );
  const [paymentMethodsEnabled, setPaymentMethodsEnabledState] = useState(getPaymentMethodsEnabled());
  const [notificationDuration, setNotificationDuration] = useState(() => getNotificationDuration());
  const [decodedPricesEnabled, setDecodedPricesEnabledState] = useState(() =>
    getDecodedPricesEnabled()
  );
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [looseSaleEnabled, setLooseSaleEnabled] = useState(
    () => localStorage.getItem('posLooseSaleEnabled') !== 'false'
  );
  const [promoSettings, setPromoSettings] = useState({ enabled: false, config: [] });
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [productSales, setProductSales] = useState({});
  const [shopMetadata, setShopMetadata] = useState(
    () =>
      propShopMetadata || {
        shopMobile: '',
        shopMobile2: '',
        shopAddress: '',
        shopEmail: '',
        shopGST: '',
        shopLogo: '',
      }
  );

  const barcodeMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (p.barcode) {
        map.set(String(p.barcode).toLowerCase(), p);
      }
    });
    return map;
  }, [products]);

  const totalAmount = useMemo(() => {
    const roundOff = receiptSettings?.roundOff ?? true;
    return roundOff ? Math.round(baseTotalAmount) : baseTotalAmount;
  }, [baseTotalAmount, receiptSettings]);

  // Keyboard Shortcuts handler
  usePOSShortcuts(
    {
      onPay: () => handlePay(),
      onPayAndPrint: () => handlePayAndPrint(),
      onLooseSale: () => setShowLooseSaleDialog(true),
      onToggleNumpad: () => setShowNumpad(true),
    },
    {
      disabled: Boolean(
        scannedProduct ||
        manualQuantityItem ||
        showLooseSaleDialog ||
        showReceipt ||
        showCalculator ||
        showNumpad ||
        showPromoGifts ||
        dialogState.open
      ),
    }
  );

  const totalSavings = useMemo(() => Math.max(0, totalMrp - totalAmount), [totalMrp, totalAmount]);

  useEffect(() => {
    refocus({ force: true, delay: 80 });
  }, [activeTabId, refocus]);

  useEffect(() => {
    refocus({ force: true, delay: 80 });
  }, [
    scannedProduct,
    manualQuantityItem,
    showLooseSaleDialog,
    showReceipt,
    showCalculator,
    showNumpad,
    showPromoGifts,
    dialogState.open,
    refocus,
  ]);

  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!(target instanceof HTMLElement)) return false;

      const tagName = target.tagName;
      return (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target.isContentEditable
      );
    };

    const shouldHandlePosInteraction = (target) => {
      if (!(target instanceof HTMLElement)) return false;

      return Boolean(
        target.closest('.no-print') ||
        target.closest('[role="dialog"]') ||
        target.closest('.MuiAutocomplete-popper') ||
        target.closest('.MuiPopover-root')
      );
    };

    const handlePointerUp = (event) => {
      const target = event.target;
      if (!shouldHandlePosInteraction(target) || isEditableTarget(target)) {
        return;
      }

      refocus({ force: true, delay: 90 });
    };

    const handleWindowFocus = () => {
      refocus({ force: true, delay: 60 });
    };

    document.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [refocus]);

  // Auto-select Cash when cart gets items, clear when empty
  useEffect(() => {
    setSelectedPaymentMethod((prev) => {
      if (cart.length > 0 && !prev) {
        return { id: 'cash', label: 'Cash', color: '#16a34a' };
      } else if (cart.length === 0 && prev) {
        return null;
      }
      return prev;
    });
  }, [cart.length]);

  // ===== All Functions Declared BEFORE useEffect =====

  const _refreshSettings = useCallback(async function runRefreshSettings(retries = 3) {
    try {
      const [settingsRes, topSellingData] = await Promise.all([
        settingsService.fetchSettings(),
        dashboardService.fetchTopSelling(),
      ]);

      const sett = settingsRes.data;
      if (sett.posReceiptSettings) setReceiptSettings(sett.posReceiptSettings);
      if (sett.posPaymentSettings) setPaymentSettings(sett.posPaymentSettings);
      if (sett.posEnableExtraDiscount !== undefined)
        setExtraDiscountEnabled(sett.posEnableExtraDiscount);
      if (sett.posNotificationDuration !== undefined)
        setNotificationDuration(sett.posNotificationDuration);
      setProductSales(topSellingData || {});
      setShopMetadata({
        shopMobile: sett.shopMobile || '',
        shopMobile2: sett.shopMobile2 || '',
        shopAddress: sett.shopAddress || '',
        shopEmail: sett.shopEmail || '',
        shopGST: sett.shopGST || '',
        shopLogo: sett.shopLogo || '',
      });

      if (sett.promotion_buy_x_get_free) {
        const data = sett.promotion_buy_x_get_free;
        if (data.thresholds && !data.config) {
          const migratedConfig = data.thresholds.map((t) => ({
            threshold: t,
            isActive: true,
            profitPercentage: data.profitPercentage || 20,
            minCostPrice: data.minCostPrice || 0,
            maxCostPrice: data.maxCostPrice || null,
            sortBySales: data.sortBySales || 'none',
            maxGiftsToShow: data.maxGiftsToShow || 5,
          }));
          setPromoSettings({ enabled: data.enabled || false, config: migratedConfig });
        } else {
          setPromoSettings({ enabled: data.enabled || false, config: data.config || [] });
        }
      }
    } catch (error) {
      console.error(`Failed to refresh POS settings (remaining retries: ${retries}):`, error);
      if (retries > 0) setTimeout(() => runRefreshSettings(retries - 1), 1000);
    }
  }, []);

  const fetchProducts = useCallback(async function runFetchProducts(retries = 3) {
    try {
      const res = await inventoryService.fetchProducts({ includeBatches: true });
      const data = res.data;
      setProducts(data);
      try {
        localStorage.setItem('posCachedProducts', JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to cache products:', e);
      }
    } catch (err) {
      console.error(`Error fetching products (remaining retries: ${retries}):`, err);
      if (retries > 0) setTimeout(() => runFetchProducts(retries - 1), 1000);
      else {
        setNotification({
          open: true,
          message: `Unable to connect to POS server. ${err.message}`,
          severity: 'error',
          duration: 5000,
        });
      }
    }
  }, []);

  const persistReceiptSettings = async (nextSettings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.receipt, JSON.stringify(nextSettings));
      window.dispatchEvent(new Event('pos-settings-updated'));
      await settingsService.updateSettings({
        key: 'posReceiptSettings',
        value: nextSettings,
      });
    } catch (error) {
      console.error('Failed to persist receipt settings:', error);
    }
  };

  const handleSettingChange = (field) => {
    setReceiptSettings((prev) => {
      const next = { ...prev, [field]: !prev[field] };
      persistReceiptSettings(next);
      return next;
    });
  };

  const handleTextSettingChange = (field, value) => {
    setReceiptSettings((prev) => {
      const next = { ...prev, [field]: value };
      persistReceiptSettings(next);
      return next;
    });
  };

  const addFreeProduct = (product) => {
    const success = addFreeProductHook(product, activeConfig, totalProfit);
    if (success) {
      showNotification(`${product.name} added as a free gift!`);
      refocus();
    } else {
      showNotification('No eligible batch found for this free product.', 'error');
    }
  };

  const handleProductInteraction = (product) => {
    setSearchQuery('');
    const batches = (product.batches || []).filter((b) => b.quantity > 0);
    if (batches.length === 0) {
      showNotification(`${product.name} is Out of Stock!`, 'error');
      return;
    }

    const isBatchTracked = product.batchTrackingEnabled !== false;
    if (!isBatchTracked) {
      if (batches.length === 1) addToCart(product, batches[0]);
      else setScannedProduct({ product, batches, mode: 'price' });
      return;
    }

    if (batches.length === 1) {
      addToCart(product, batches[0]);
    } else {
      setScannedProduct({ product, batches, mode: 'batch' });
    }
  };

  const handleVoidOrder = async () => {
    const confirmed = await showConfirm('Are you sure you want to VOID this entire order?');
    if (confirmed) clearCart();
    refocus();
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handlePay = async () => {
    const methodToUse = selectedPaymentMethod || { id: 'cash', label: 'Cash' };
    try {
      const items = cart.map((item) => ({
        batch_id: item.batch_id,
        quantity: item.quantity,
        sellingPrice: item.price,
        isFree: item.isFree,
      }));
      const { icon: _icon, ...methodWithoutIcon } = methodToUse;
      const res = await posService.processSale({
        items,
        discount: 0,
        extraDiscount: discount,
        paymentMethod: methodToUse.label,
        paymentDetails: JSON.stringify({ method: methodWithoutIcon }),
      });
      const detailedRes = await posService.fetchSaleById(res.saleId);
      setLastSale(detailedRes);
      handleCloseTab(activeTabId);
      fetchProducts();
      setSelectedPaymentMethod(null);
      showNotification('Sale Completed Successfully!');
      refocus();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Payment failed';
      showError(`Payment failed: ${msg}`);
    }
  };

  const handlePayAndPrint = async () => {
    const methodToUse = selectedPaymentMethod || { id: 'cash', label: 'Cash' };
    try {
      const items = cart.map((item) => ({
        batch_id: item.batch_id,
        quantity: item.quantity,
        sellingPrice: item.price,
        isFree: item.isFree,
      }));
      const { icon: _icon, ...methodWithoutIcon } = methodToUse;
      const res = await posService.processSale({
        items,
        discount: 0,
        extraDiscount: discount,
        paymentMethod: methodToUse.label,
        paymentDetails: JSON.stringify({ method: methodWithoutIcon }),
      });

      flushSync(() => {
        setLastSale(res.sale);
        handleCloseTab(activeTabId);
        setSelectedPaymentMethod(null);
      });

      if (receiptSettings.directPrint) {
        const printer =
          receiptSettings.printerType ||
          defaultPrinter ||
          (printers.find((p) => p.isDefault) || printers[0])?.name;
        if (window.electron)
          window.electron.ipcRenderer.send('print-manual', { printerName: printer });
        else window.print();
      } else {
        setShowReceipt(true);
      }
      fetchProducts();
      refocus();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Payment failed';
      showError(`Payment failed: ${msg}`);
    }
  };

  const handlePrintLastReceipt = () => {
    if (lastSale) {
      if (receiptSettings.directPrint) {
        const printer =
          receiptSettings.printerType ||
          defaultPrinter ||
          (printers.find((p) => p.isDefault) || printers[0])?.name;
        if (window.electron)
          window.electron.ipcRenderer.send('print-manual', { printerName: printer });
        else window.print();
      } else setShowReceipt(true);
    }
  };

  const handleRefund = () => navigate('/refund');

  const activeConfig = useMemo(() => {
    if (!promoSettings?.enabled || !promoSettings?.config?.length) return null;
    const metConfigs = promoSettings.config.filter(
      (c) => Number(baseTotalAmount) >= Number(c.threshold) && c.isActive !== false
    );
    if (metConfigs.length === 0) return null;
    return metConfigs.reduce((prev, curr) =>
      Number(curr.threshold) > Number(prev.threshold) ? curr : prev
    );
  }, [baseTotalAmount, promoSettings]);

  const eligibleFreeProducts = useMemo(() => {
    if (!activeConfig) return [];
    const profitLimit = Number(totalProfit) * (Number(activeConfig.profitPercentage || 20) / 100);
    const minCost = Number(activeConfig.minCostPrice || 0);
    const effectiveMaxCost =
      activeConfig.maxCostPrice !== null && activeConfig.maxCostPrice !== undefined
        ? Math.min(Number(activeConfig.maxCostPrice), profitLimit)
        : profitLimit;

    const filtered = products.filter((p) => {
      const allowedGroups = activeConfig.allowedGroups || [];
      const productCategory = p.category || '';
      if (allowedGroups.length > 0) {
        const isAllowed = allowedGroups.some(
          (group) => productCategory === group || productCategory.startsWith(`${group}/`)
        );
        if (!isAllowed) return false;
      }
      const disallowedGroups = activeConfig.disallowedGroups || [];
      if (disallowedGroups.length > 0) {
        const isDisallowed = disallowedGroups.some(
          (group) => productCategory === group || productCategory.startsWith(`${group}/`)
        );
        if (isDisallowed) return false;
      }
      return (
        p.batches &&
        p.batches.some((b) => {
          const cp = Number(b.costPrice);
          return cp >= minCost && cp <= effectiveMaxCost + 0.001 && b.quantity > 0;
        })
      );
    });

    let finalGifts = filtered;
    if (activeConfig.sortBySales === 'most') {
      finalGifts = [...filtered].sort(
        (a, b) => (productSales[b.id] || 0) - (productSales[a.id] || 0)
      );
    } else if (activeConfig.sortBySales === 'least') {
      finalGifts = [...filtered].sort(
        (a, b) => (productSales[a.id] || 0) - (productSales[b.id] || 0)
      );
    }
    return finalGifts.slice(
      0,
      activeConfig.maxGiftsToShow !== undefined ? activeConfig.maxGiftsToShow : 5
    );
  }, [activeConfig, totalProfit, products, productSales]);

  useEffect(() => {
    if (alreadyHasFreeProduct) {
      const freeItem = cart.find((item) => item.isFree);
      if (!freeItem) return;
      if (!activeConfig) {
        removeFromCart(freeItem.batch_id);
        return;
      }
      const profitLimit = Number(totalProfit) * (Number(activeConfig.profitPercentage || 20) / 100);
      const minCost = Number(activeConfig.minCostPrice || 0);
      const maxCost =
        activeConfig.maxCostPrice !== null ? Number(activeConfig.maxCostPrice) : profitLimit;
      const cp = Number(freeItem.costPrice);
      if (cp < minCost || cp > maxCost + 0.001) {
        removeFromCart(freeItem.batch_id);
      }
    }
  }, [activeConfig, totalProfit, cart, alreadyHasFreeProduct, removeFromCart]);

  useEffect(() => {
    if (!activeConfig) setShowPromoGifts(false);
  }, [activeConfig, setShowPromoGifts]);

  const handleSelectPaymentMethod = (method) => setSelectedPaymentMethod(method);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(() => fetchProducts(), 30000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  useEffect(() => {
    const handleSettingsUpdated = () => {
      setReceiptSettings(getStoredReceiptSettings());
      setFullscreenEnabled(getFullscreenEnabled());
      setPaymentSettings(getStoredPaymentSettings());
      setNotificationDuration(getNotificationDuration());
      setExtraDiscountEnabled(getExtraDiscountEnabled());
      setChangeCalculatorEnabledState(getChangeCalculatorEnabled());
      setPaymentMethodsEnabledState(getPaymentMethodsEnabled());
      setDecodedPricesEnabledState(getDecodedPricesEnabled());
      setCalculatorEnabledState(getCalculatorEnabled());
      setLooseSaleEnabled(localStorage.getItem('posLooseSaleEnabled') !== 'false');
    };
    window.addEventListener('pos-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('pos-settings-updated', handleSettingsUpdated);
  }, []);

  const filterOptions = (options, { inputValue }) => {
    const normalizedInput = inputValue.trim().toLowerCase();
    if (!normalizedInput) return [];

    const exactMatch = barcodeMap.get(normalizedInput);
    const namePrefix = [];
    const barcodePrefix = [];
    const nameContains = [];
    const barcodeContains = [];
    const priceMatches = [];

    if (exactMatch) barcodePrefix.push(exactMatch);

    for (const option of options) {
      if (!option || option === exactMatch) continue;
      const name =
        option._searchName || (option._searchName = String(option.name || '').toLowerCase());
      const barcode =
        option._searchBarcode ||
        (option._searchBarcode = String(option.barcode || '').toLowerCase());

      if (name.startsWith(normalizedInput)) namePrefix.push(option);
      else if (barcode.startsWith(normalizedInput)) barcodePrefix.push(option);
      else if (name.includes(normalizedInput)) nameContains.push(option);
      else if (barcode.includes(normalizedInput)) barcodeContains.push(option);
      else {
        const priceMatch = (option.batches || []).some(
          (batch) =>
            batch &&
            (
              batch._searchPrice || (batch._searchPrice = String(batch.sellingPrice || ''))
            ).includes(normalizedInput)
        );
        if (priceMatch) priceMatches.push(option);
      }
    }

    const sortFn = (a, b) => (a.name || '').localeCompare(b.name || '');
    namePrefix.sort(sortFn);
    barcodePrefix.sort(sortFn);
    nameContains.sort(sortFn);
    barcodeContains.sort(sortFn);
    priceMatches.sort(sortFn);

    return [
      ...namePrefix,
      ...barcodePrefix,
      ...nameContains,
      ...barcodeContains,
      ...priceMatches,
    ].slice(0, 50);
  };

  return (
    <>
      <SuccessNotification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={() => setNotification({ ...notification, open: false })}
        duration={notification.duration || notificationDuration}
      />
      <Box
        className="no-print"
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 0,
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 3 },
          height: 'calc(100vh - 72px)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <POSFloatingActions
          fullscreenEnabled={fullscreenEnabled}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleFullscreenToggle}
          isCalculatorEnabled={isCalculatorEnabled}
          onOpenCalculator={() => setShowCalculator(true)}
        />

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%',
            mr: { lg: 2 },
          }}
        >
          <POSTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onTabChange={setActiveTabId}
            onTabClose={handleCloseTab}
            onAddTab={handleAddTab}
          />

          <POSSearchBar
            ref={searchBarRef}
            products={products}
            searchQuery={searchQuery}
            onSearchInputChange={setSearchQuery}
            onSelectProduct={handleProductInteraction}
            filterOptions={filterOptions}
            onLooseSale={() => setShowLooseSaleDialog(true)}
            looseSaleEnabled={looseSaleEnabled}
          />
          <CartTable
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onQuantityClick={setManualQuantityItem}
            lastAddedItemId={lastAddedItemId}
          />

          {activeConfig && !showPromoGifts && (
            <Box
              sx={{
                p: 1,
                display: 'flex',
                justifyContent: 'center',
                bgcolor: '#f0fff4',
                borderTop: '1px solid #c6f6d5',
              }}
            >
              <Chip
                icon={<PromoIcon />}
                label="View Eligible Offers"
                onClick={() => {
                  setShowPromoGifts(true);
                  refocus();
                }}
                color="primary"
                sx={{
                  fontWeight: 800,
                  bgcolor: '#22ab7dff',
                  '&:hover': { bgcolor: '#059669' },
                  px: 2,
                  height: 36,
                  borderRadius: 2,
                }}
              />
            </Box>
          )}

          <PromoGiftsList
            show={showPromoGifts}
            eligibleProducts={eligibleFreeProducts}
            activeConfig={activeConfig}
            totalProfit={totalProfit}
            cart={cart}
            onAddGift={addFreeProduct}
            onClose={() => setShowPromoGifts(false)}
          />
        </Paper>

        {/* Vertical Resizer Slider */}
        <Box
          onMouseDown={startResizing}
          sx={{
            display: { xs: 'none', lg: 'flex' },
            width: '8px',
            cursor: 'col-resize',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1,
            '&:hover .handle': {
              bgcolor: 'primary.main',
              width: '4px',
            },
            zIndex: 10,
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

        <Box
          sx={{
            width: { xs: '100%', lg: transactionPanelWidth },
            minWidth: { lg: 320 },
            height: '100%',
            flexShrink: 0,
          }}
        >
          <TransactionPanel
            cart={cart}
            discount={discount}
            onDiscountChange={setDiscount}
            onVoid={handleVoidOrder}
            onPay={handlePay}
            onPayAndPrint={handlePayAndPrint}
            onRefund={handleRefund}
            onSelectPaymentMethod={handleSelectPaymentMethod}
            selectedPaymentMethod={selectedPaymentMethod}
            paymentSettings={paymentSettings}
            extraDiscountEnabled={extraDiscountEnabled}
            decodedPricesEnabled={decodedPricesEnabled}
            totalCostPrice={totalCostPrice}
            subTotal={subTotal}
            totalMrp={totalMrp}
            totalQty={totalQty}
            totalAmount={totalAmount}
            totalSavings={totalSavings}
            changeCalculatorEnabled={changeCalculatorEnabled}
            paymentMethodsEnabled={paymentMethodsEnabled}
            onPrintLastReceipt={handlePrintLastReceipt}
            hasLastSale={!!lastSale}
            receivedAmount={receivedAmount}
            setReceivedAmount={setReceivedAmount}
            showNumpad={showNumpad}
            setShowNumpad={setShowNumpad}
          />
        </Box>

        <BatchSelectionDialog
          scannedProduct={scannedProduct}
          onSelectBatch={addToCart}
          onClose={() => {
            setScannedProduct(null);
            searchBarRef.current?.focus();
          }}
        />

        <ReceiptPreviewDialog
          open={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            searchBarRef.current?.focus();
          }}
          lastSale={lastSale}
          receiptSettings={receiptSettings}
          onSettingChange={handleSettingChange}
          onTextSettingChange={handleTextSettingChange}
          isAdmin={currentUser?.role === 'admin'}
          shopMetadata={shopMetadata}
          printers={printers}
          defaultPrinter={defaultPrinter}
        />

        <QuantityDialog
          open={Boolean(manualQuantityItem)}
          onClose={() => {
            setManualQuantityItem(null);
            refocus();
          }}
          onConfirm={(qty) => {
            handleSetQuantity(manualQuantityItem.batch_id, qty);
            setManualQuantityItem(null);
            refocus();
          }}
          itemName={manualQuantityItem?.name}
          initialValue={0}
        />

        <LooseSaleDialog
          open={showLooseSaleDialog}
          onClose={() => {
            setShowLooseSaleDialog(false);
            refocus();
          }}
          onComplete={() => {
            setNotification({
              open: true,
              message: 'Loose Sale Recorded Successfully!',
              severity: 'success',
            });
            refocus();
          }}
        />
      </Box>
      <CustomDialog {...dialogState} onClose={closeDialog} />

      <POSPrintContainer
        lastSale={lastSale}
        receiptSettings={receiptSettings}
        shopMetadata={shopMetadata}
      />

      <Calculator
        open={showCalculator}
        onClose={() => {
          setShowCalculator(false);
          refocus();
        }}
      />

      <NumpadDialog
        open={showNumpad}
        onClose={() => setShowNumpad(false)}
        initialValue={receivedAmount}
        onConfirm={(val) => {
          setReceivedAmount(val);
          setShowNumpad(false);
        }}
        title="Received Amount"
      />
    </>
  );
};

export default POS;
