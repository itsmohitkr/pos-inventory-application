import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import * as Sentry from '@sentry/react';
import posService from '@/shared/api/posService';
import { IPC } from '@/shared/ipcChannels';
import type { CartItem, PaymentMethod, ReceiptSale } from '@/domains/pos/types';
import type { Customer } from '@/shared/api/customerService';
import type {
  PrinterInfo,
  ReceiptSettings,
} from '@/domains/settings/hooks/useSettings';

interface UsePOSSaleArgs {
  cart: CartItem[];
  discount: number;
  activeTabId: number;
  handleCloseTab: (tabId: number) => void;
  fetchProducts: () => void;
  receiptSettings?: ReceiptSettings | null;
  defaultPrinter?: string | null;
  printers?: PrinterInfo[];
  setShowReceipt: (show: boolean) => void;
  showError: (message: string) => void;
  showNotification: (message: string, severity?: string) => void;
  refocus: (options?: { force?: boolean; delay?: number }) => void;
  activeCustomer?: Customer | null;
  clearCustomerOnSale: () => void;
  /** Printed on the receipt header. */
  shopName?: string;
}

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
}: UsePOSSaleArgs) => {
  const [lastSale, setLastSale] = useState<ReceiptSale | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = useCallback(async (
    selectedPaymentMethod?: PaymentMethod | null,
    customerOverride?: Customer | null
  ) => {
    if (isPaying) return;
    setIsPaying(true);
    const methodToUse: Partial<PaymentMethod> & { id: string; label: string } =
      selectedPaymentMethod || { id: 'cash', label: 'Cash' };
    try {
      const items = cart.map((item: CartItem) => ({
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
      if (!receiptSettings?.directPrint) {
        setShowReceipt(true);
      }
      refocus();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'pos-pay' } });
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Payment failed';
      showError(`Payment failed: ${msg}`);
    } finally {
      setIsPaying(false);
    }
  }, [isPaying, cart, discount, activeTabId, handleCloseTab, fetchProducts, showNotification, refocus, showError, activeCustomer, clearCustomerOnSale, setShowReceipt, receiptSettings]);

  const handlePayAndPrint = useCallback(async (
    selectedPaymentMethod?: PaymentMethod | null,
    customerOverride?: Customer | null
  ) => {
    if (isPaying) return;
    setIsPaying(true);
    const methodToUse: Partial<PaymentMethod> & { id: string; label: string } =
      selectedPaymentMethod || { id: 'cash', label: 'Cash' };
    try {
      const items = cart.map((item: CartItem) => ({
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

      if (receiptSettings?.directPrint) {
        const printer =
          receiptSettings.printerType ||
          defaultPrinter ||
          ((printers || []).find((p: PrinterInfo) => p.isDefault) || (printers || [])[0])?.name;
        if (window.electron) {
          if (!printer) {
            showError('No printer configured. Go to Settings → Receipt Settings to select a printer.');
          } else {
            const result = await window.electron.ipcRenderer.invoke<{ success?: boolean; error?: string }>(IPC.PRINT_MANUAL, { printerName: printer });
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
      Sentry.captureException(error, { tags: { feature: 'pos-pay-and-print' } });
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Payment failed';
      showError(`Payment failed: ${msg}`);
    } finally {
      setIsPaying(false);
    }
  }, [isPaying, cart, discount, activeTabId, handleCloseTab, receiptSettings, defaultPrinter, printers, setShowReceipt, fetchProducts, refocus, showError, activeCustomer, clearCustomerOnSale]);

  const handlePrintLastReceipt = useCallback(async () => {
    if (lastSale) {
      if (receiptSettings?.directPrint) {
        const printer =
          receiptSettings.printerType ||
          defaultPrinter ||
          ((printers || []).find((p: PrinterInfo) => p.isDefault) || (printers || [])[0])?.name;
        if (window.electron) {
          if (!printer) {
            showError('No printer configured. Go to Settings → Receipt Settings to select a printer.');
          } else {
            const result = await window.electron.ipcRenderer.invoke<{ success?: boolean; error?: string }>(IPC.PRINT_MANUAL, { printerName: printer });
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
