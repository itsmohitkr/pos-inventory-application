import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Chip } from '@mui/material';
import { LocalOffer as PromoIcon } from '@mui/icons-material';

import POSSearchBar from '@/domains/pos/components/POSSearchBar';
import CartTable from '@/domains/pos/components/CartTable';
import TransactionPanel from '@/domains/pos/components/TransactionPanel';
import POSDialogManager from '@/domains/pos/components/POSDialogManager';
import POSTabs from '@/domains/pos/components/POSTabs';
import POSPrintContainer from '@/domains/pos/components/POSPrintContainer';
import POSFloatingActions from '@/domains/pos/components/POSFloatingActions';
import PromoGiftsList from '@/domains/pos/components/PromoGiftsList';
import SuccessNotification from '@/shared/components/SuccessNotification';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import { usePOSTabs } from '@/domains/pos/hooks/usePOSTabs';
import { usePOSLayout } from '@/domains/pos/hooks/usePOSLayout';
import { usePOSShortcuts } from '@/domains/pos/hooks/usePOSShortcuts';
import { usePOSData } from '@/domains/pos/hooks/usePOSData';
import { usePOSSale } from '@/domains/pos/hooks/usePOSSale';
import { usePOSPromotions } from '@/domains/pos/hooks/usePOSPromotions';
import { usePOSSearch } from '@/domains/pos/hooks/usePOSSearch';
import { usePOSCustomer } from '@/domains/pos/hooks/usePOSCustomer';
import settingsService from '@/shared/api/settingsService';
import { STORAGE_KEYS } from '@/domains/pos/components/posReceiptSettings';

const POS = ({
  receiptSettings: propReceiptSettings,
  shopName: propShopName,
  shopMetadata: propShopMetadata,
  printers = [],
  defaultPrinter = null,
}) => {
  const navigate = useNavigate();
  const { dialogState, showError, showConfirm, closeDialog } = useCustomDialog();

  const {
    products,
    currentUser,
    receiptSettings,
    setReceiptSettings,
    paymentSettings,
    fullscreenEnabled,
    extraDiscountEnabled,
    isCalculatorEnabled,
    notificationDuration,
    promoSettings,
    productSales,
    shopMetadata,
    fetchProducts,
    looseSaleEnabled,
    decodedPricesEnabled,
    changeCalculatorEnabled,
    paymentMethodsEnabled,
    customerFeatureEnabled,
  } = usePOSData(propReceiptSettings, propShopMetadata);

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
    showDiscountNumpad,
    setShowDiscountNumpad,
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
  const [customerSearchValue, setCustomerSearchValue] = useState('');
  const [customerNameValue, setCustomerNameValue] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState(0);

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const showNotification = useCallback((message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  }, []);

  const {
    activeCustomer,
    isLoadingCustomer,
    searchResults,
    isSearching,
    searchCustomers,
    lookupCustomer,
    selectCustomer,
    detachCustomer,
    clearOnSale,
    registerCustomer,
  } = usePOSCustomer({
    showNotification,
    shopName: propShopName || 'Bachat Bazar',
  });

  const {
    lastSale,
    isPaying,
    handlePay,
    handlePayAndPrint,
    handlePrintLastReceipt,
  } = usePOSSale({
    cart,
    discount,
    activeTabId,
    handleCloseTab,
    fetchProducts,
    receiptSettings,
    defaultPrinter,
    printers,
    setShowReceipt,
    showError,
    showNotification,
    refocus,
    activeCustomer,
    clearCustomerOnSale: clearOnSale,
    shopName: propShopName || 'Bachat Bazar',
  });

  const { filterOptions } = usePOSSearch(products);

  const { activeConfig, eligibleFreeProducts, addFreeProduct } = usePOSPromotions({
    promoSettings,
    baseTotalAmount,
    totalProfit,
    products,
    productSales,
    cart,
    removeFromCart,
    addFreeProductHook,
    showNotification,
    refocus,
  });

  const totalAmount = useMemo(() => {
    const roundOff = receiptSettings?.roundOff ?? true;
    return roundOff ? Math.round(baseTotalAmount) : baseTotalAmount;
  }, [baseTotalAmount, receiptSettings]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPaymentMethod((prev) => {
      if (cart.length > 0 && !prev) {
        return { id: 'cash', label: 'Cash', color: '#16a34a' };
      } else if (cart.length === 0 && prev) {
        return null;
      }
      return prev;
    });
  }, [cart.length]);

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

  const handleRefund = () => navigate('/refund');


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


  // Keyboard Shortcuts handlers (memoized to avoid re-registration churn)
  const handlePayWithCustomerSync = useCallback(async (method) => {
    let customer = activeCustomer;
    if (!customer && customerSearchValue.trim().length === 10) {
      customer = await registerCustomer(customerSearchValue.trim(), customerNameValue.trim());
      if (customer) {
        setCustomerSearchValue('');
        setCustomerNameValue('');
      }
    }
    return handlePay(method, customer);
  }, [activeCustomer, customerSearchValue, customerNameValue, registerCustomer, handlePay]);

  const handlePayAndPrintWithCustomerSync = useCallback(async (method) => {
    let customer = activeCustomer;
    if (!customer && customerSearchValue.trim().length === 10) {
      customer = await registerCustomer(customerSearchValue.trim(), customerNameValue.trim());
      if (customer) {
        setCustomerSearchValue('');
        setCustomerNameValue('');
      }
    }
    return handlePayAndPrint(method, customer);
  }, [activeCustomer, customerSearchValue, customerNameValue, registerCustomer, handlePayAndPrint]);

  const posShortcutHandlers = useMemo(
    () => ({
      onPay: () => handlePayWithCustomerSync(selectedPaymentMethod),
      onPayAndPrint: () => handlePayAndPrintWithCustomerSync(selectedPaymentMethod),
      onLooseSale: () => setShowLooseSaleDialog(true),
      onToggleNumpad: () => setShowNumpad(true),
    }),
    [handlePayWithCustomerSync, handlePayAndPrintWithCustomerSync, selectedPaymentMethod, setShowLooseSaleDialog, setShowNumpad]
  );

  usePOSShortcuts(posShortcutHandlers, {
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
  });

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
            onCustomerBarcode={customerFeatureEnabled ? lookupCustomer : undefined}
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
                  bgcolor: '#22ab7d',
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
            eligibleFreeProducts={eligibleFreeProducts}
            activeConfig={activeConfig}
            totalProfit={totalProfit}
            cart={cart}
            onAddFreeProduct={addFreeProduct}
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
            onPay={() => handlePayWithCustomerSync(selectedPaymentMethod)}
            onPayAndPrint={() => handlePayAndPrintWithCustomerSync(selectedPaymentMethod)}
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
            isPaying={isPaying}
            receivedAmount={receivedAmount}
            setReceivedAmount={setReceivedAmount}
            showNumpad={showNumpad}
            setShowNumpad={setShowNumpad}
            setShowDiscountNumpad={setShowDiscountNumpad}
            customerFeatureEnabled={customerFeatureEnabled}
            activeCustomer={activeCustomer}
            onCustomerSelect={selectCustomer}
            onCustomerLookup={lookupCustomer}
            onCustomerDetach={detachCustomer}
            isLoadingCustomer={isLoadingCustomer}
            searchResults={searchResults}
            isSearching={isSearching}
            onCustomerSearch={searchCustomers}
            customerSearchValue={customerSearchValue}
            setCustomerSearchValue={setCustomerSearchValue}
            customerNameValue={customerNameValue}
            setCustomerNameValue={setCustomerNameValue}
            onCustomerRegister={registerCustomer}
          />
        </Box>

      </Box>

      <POSDialogManager
        scannedProduct={scannedProduct}
        addToCart={addToCart}
        setScannedProduct={setScannedProduct}
        searchBarRef={searchBarRef}
        showReceipt={showReceipt}
        setShowReceipt={setShowReceipt}
        lastSale={lastSale}
        receiptSettings={receiptSettings}
        handleSettingChange={handleSettingChange}
        handleTextSettingChange={handleTextSettingChange}
        currentUser={currentUser}
        shopMetadata={shopMetadata}
        printers={printers}
        defaultPrinter={defaultPrinter}
        manualQuantityItem={manualQuantityItem}
        setManualQuantityItem={setManualQuantityItem}
        handleSetQuantity={handleSetQuantity}
        refocus={refocus}
        showLooseSaleDialog={showLooseSaleDialog}
        setShowLooseSaleDialog={setShowLooseSaleDialog}
        setNotification={setNotification}
        dialogState={dialogState}
        closeDialog={closeDialog}
        showCalculator={showCalculator}
        setShowCalculator={setShowCalculator}
        showNumpad={showNumpad}
        setShowNumpad={setShowNumpad}
        receivedAmount={receivedAmount}
        setReceivedAmount={setReceivedAmount}
        showDiscountNumpad={showDiscountNumpad}
        setShowDiscountNumpad={setShowDiscountNumpad}
        discount={discount}
        setDiscount={setDiscount}
        customerFeatureEnabled={customerFeatureEnabled}
      />

      <POSPrintContainer
        lastSale={lastSale}
        receiptSettings={receiptSettings}
        shopMetadata={shopMetadata}
        customerFeatureEnabled={customerFeatureEnabled}
      />
    </>
  );
};

export default POS;
