import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import posService from '@/shared/api/posService';
import { IPC } from '@/shared/ipcChannels';

export const usePOSSale = ({
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
  clearCustomerOnSale,
}) => {
  const [lastSale, setLastSale] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = useCallback(async (selectedPaymentMethod, customerOverride) => {
    if (isPaying) return;
    setIsPaying(true);
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
        customerId: (customerOverride || activeCustomer)?.id || null,
      });
      const detailedRes = await posService.fetchSaleById(res.saleId);
      setLastSale(detailedRes);
      handleCloseTab(activeTabId);
      clearCustomerOnSale?.();
      fetchProducts();
      showNotification('Sale Completed Successfully!');
      setShowReceipt(true);
      refocus();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Payment failed';
      showError(`Payment failed: ${msg}`);
    } finally {
      setIsPaying(false);
    }
  }, [isPaying, cart, discount, activeTabId, handleCloseTab, fetchProducts, showNotification, refocus, showError, activeCustomer, clearCustomerOnSale, setShowReceipt]);

  const handlePayAndPrint = useCallback(async (selectedPaymentMethod, customerOverride) => {
    if (isPaying) return;
    setIsPaying(true);
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
        customerId: (customerOverride || activeCustomer)?.id || null,
      });

      flushSync(() => {
        setLastSale(res.sale);
        handleCloseTab(activeTabId);
      });
      clearCustomerOnSale?.();

      if (receiptSettings.directPrint) {
        const printer =
          receiptSettings.printerType ||
          defaultPrinter ||
          (printers.find((p) => p.isDefault) || printers[0])?.name;
        if (window.electron) {
          if (!printer) {
            showError('No printer configured. Go to Settings → Receipt Settings to select a printer.');
          } else {
            const result = await window.electron.ipcRenderer.invoke(IPC.PRINT_MANUAL, { printerName: printer });
            if (!result?.success) {
              showError(`Print failed: ${result?.error || 'Unknown error'}. Check that the printer is on and connected.`);
            }
          }
        } else {
          window.print();
        }
      } else {
        setShowReceipt(true);
      }
      fetchProducts();
      refocus();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Payment failed';
      showError(`Payment failed: ${msg}`);
    } finally {
      setIsPaying(false);
    }
  }, [isPaying, cart, discount, activeTabId, handleCloseTab, receiptSettings, defaultPrinter, printers, setShowReceipt, fetchProducts, refocus, showError, activeCustomer, clearCustomerOnSale]);

  const handlePrintLastReceipt = useCallback(async () => {
    if (lastSale) {
      if (receiptSettings.directPrint) {
        const printer =
          receiptSettings.printerType ||
          defaultPrinter ||
          (printers.find((p) => p.isDefault) || printers[0])?.name;
        if (window.electron) {
          if (!printer) {
            showError('No printer configured. Go to Settings → Receipt Settings to select a printer.');
          } else {
            const result = await window.electron.ipcRenderer.invoke(IPC.PRINT_MANUAL, { printerName: printer });
            if (!result?.success) {
              showError(`Print failed: ${result?.error || 'Unknown error'}. Check that the printer is on and connected.`);
            }
          }
        } else {
          window.print();
        }
      } else setShowReceipt(true);
    }
  }, [lastSale, receiptSettings, defaultPrinter, printers, setShowReceipt, showError]);

  return {
    lastSale,
    setLastSale,
    isPaying,
    handlePay,
    handlePayAndPrint,
    handlePrintLastReceipt,
  };
};
