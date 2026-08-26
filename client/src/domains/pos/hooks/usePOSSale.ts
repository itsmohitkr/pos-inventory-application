import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import * as Sentry from '@sentry/react';
import posService from '@/shared/api/posService';
import { getApiErrorMessage } from '@/shared/api/api';
import { resolvePrinterName } from '@/shared/utils/resolvePrinterName';
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
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);

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
        freeGiftThresholdAmount: item.freeGiftThresholdAmount ?? null,
      }));
      const { icon: _icon, ...methodWithoutIcon } = methodToUse;
      const res = await posService.processSale({
        items,
        discount: 0,
        extraDiscount: discount,
        paymentMethod: methodToUse.label,
        paymentDetails: JSON.stringify({ method: methodWithoutIcon }),
        customerId: (customerOverride || activeCustomer)?.id || null,
        allowExpiredItems: true,
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
      const msg = getApiErrorMessage(error, 'Payment failed');
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
        freeGiftThresholdAmount: item.freeGiftThresholdAmount ?? null,
      }));
      const { icon: _icon, ...methodWithoutIcon } = methodToUse;
      const res = await posService.processSale({
        items,
        discount: 0,
        extraDiscount: discount,
        paymentMethod: methodToUse.label,
        paymentDetails: JSON.stringify({ method: methodWithoutIcon }),
        customerId: (customerOverride || activeCustomer)?.id || null,
        allowExpiredItems: true,
      });

      flushSync(() => {
        setLastSale(res.sale);
        handleCloseTab(activeTabId);
      });
      clearCustomerOnSale?.();

      // The sale is committed from here on. Printing gets its own try/catch so
      // a print failure can never fall through to the outer "Payment failed"
      // handler below — a cashier told the payment failed for a sale that
      // actually succeeded will re-ring it, double-charging the customer.
      if (receiptSettings?.directPrint) {
        try {
          const printer = resolvePrinterName({ receiptSettings, printers, defaultPrinter });
          if (window.electron) {
            if (!printer) {
              showError(
                'Sale saved, but no printer is configured. Go to Settings → Receipt Settings to select one, then reprint from Sale History.'
              );
            } else {
              const result = await window.electron.ipcRenderer.invoke<{ success?: boolean; error?: string }>(IPC.PRINT_MANUAL, { printerName: printer });
              if (!result?.success) {
                showError(
                  `Print failed: ${result?.error || 'Unknown error'} The sale was saved — reprint it from Sale History.`
                );
              }
            }
          } else {
            window.print();
          }
        } catch (printError) {
          Sentry.captureException(printError, { tags: { feature: 'pos-print-after-sale' } });
          console.error(printError);
          const printMsg = printError instanceof Error ? printError.message : String(printError);
          showError(`Print failed: ${printMsg}. The sale was saved — reprint it from Sale History.`);
        }
      } else {
        setShowReceipt(true);
      }
      fetchProducts();
      refocus();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'pos-pay-and-print' } });
      console.error(error);
      const msg = getApiErrorMessage(error, 'Payment failed');
      showError(`Payment failed: ${msg}`);
    } finally {
      setIsPaying(false);
    }
  }, [isPaying, cart, discount, activeTabId, handleCloseTab, receiptSettings, defaultPrinter, printers, setShowReceipt, fetchProducts, refocus, showError, activeCustomer, clearCustomerOnSale]);

  const handlePrintLastReceipt = useCallback(async () => {
    if (!lastSale) return;
    if (!receiptSettings?.directPrint) {
      setShowReceipt(true);
      return;
    }
    // Guard against a double-tap queueing two silent jobs.
    if (isPrintingReceipt) return;
    setIsPrintingReceipt(true);
    try {
      const printer = resolvePrinterName({ receiptSettings, printers, defaultPrinter });
      if (window.electron) {
        if (!printer) {
          showError('No printer configured. Go to Settings → Receipt Settings to select a printer.');
        } else {
          const result = await window.electron.ipcRenderer.invoke<{ success?: boolean; error?: string }>(IPC.PRINT_MANUAL, { printerName: printer });
          if (!result?.success) {
            showError(`Print failed: ${result?.error || 'Unknown error'} Check that the printer is on and connected.`);
          }
        }
      } else {
        window.print();
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'pos-print-last-receipt' } });
      showError(`Print failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsPrintingReceipt(false);
    }
  }, [lastSale, receiptSettings, defaultPrinter, printers, setShowReceipt, showError, isPrintingReceipt]);

  return {
    lastSale,
    setLastSale,
    isPaying,
    isPrintingReceipt,
    handlePay,
    handlePayAndPrint,
    handlePrintLastReceipt,
  };
};
