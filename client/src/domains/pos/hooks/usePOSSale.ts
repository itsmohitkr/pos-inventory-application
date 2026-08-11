import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import * as Sentry from '@sentry/react';
import posService from '@/shared/api/posService';
import { getApiErrorMessage } from '@/shared/api/api';
import { resolvePrinterName } from '@/shared/utils/resolvePrinterName';
import { IPC } from '@/shared/ipcChannels';
import type { CartItem, PaymentMethod, ReceiptSale } from '@/domains/pos/types';
import type { Customer } from '@/shared/api/customerService';
import type { Product } from '@/shared/types/models';
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
  /** Cross-referenced against cart items' batch_id to detect an expired batch before paying. */
  products: Product[];
  showConfirm: (message: string) => Promise<boolean>;
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
  products,
  showConfirm,
}: UsePOSSaleArgs) => {
  const [lastSale, setLastSale] = useState<ReceiptSale | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);

  /**
   * Warn, don't block: an expired batch used to hard-fail the whole sale
   * server-side, with no way through even when the expiry date was simply
   * never updated after new stock arrived. Cross-references the cart against
   * already-fetched product/batch data (no extra request) and, if anything
   * is expired, lets the cashier consciously confirm before proceeding —
   * same non-blocking-confirm shape as RefundProcessor.tsx's gift-threshold
   * warning.
   *
   * Returns `hasExpiredItems` alongside `proceed` so the caller only sends
   * `allowExpiredItems: true` when this check genuinely found (and the
   * cashier confirmed) an expired batch — never unconditionally. The
   * server-side expiry check is the actual backstop for anything this
   * client-side pass might miss (a stale/incomplete `products` cache, a
   * batch not yet loaded); always sending the flag would silently disable
   * that backstop for every sale, not just ones with a real expired item.
   */
  const checkExpiredItems = useCallback(async (): Promise<{
    proceed: boolean;
    hasExpiredItems: boolean;
  }> => {
    const now = new Date();
    const expired: string[] = [];
    for (const item of cart) {
      const batch = products
        .find((p) => p.id === item.product_id)
        ?.batches?.find((b) => b.id === item.batch_id);
      if (batch?.expiryDate && new Date(batch.expiryDate) < now) {
        expired.push(`${item.name} (expired ${new Date(batch.expiryDate).toLocaleDateString()})`);
      }
    }
    if (expired.length === 0) return { proceed: true, hasExpiredItems: false };
    const confirmed = await showConfirm(
      `The following item(s) are past their expiry date: ${expired.join(', ')}. This usually means the expiry date wasn't updated after new stock arrived. Continue with the sale anyway?`
    );
    return { proceed: confirmed, hasExpiredItems: true };
  }, [cart, products, showConfirm]);

  const handlePay = useCallback(async (
    selectedPaymentMethod?: PaymentMethod | null,
    customerOverride?: Customer | null
  ) => {
    if (isPaying) return;
    setIsPaying(true);
    const methodToUse: Partial<PaymentMethod> & { id: string; label: string } =
      selectedPaymentMethod || { id: 'cash', label: 'Cash' };
    try {
      const { proceed, hasExpiredItems } = await checkExpiredItems();
      if (!proceed) return;
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
        allowExpiredItems: hasExpiredItems,
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
  }, [isPaying, cart, discount, activeTabId, handleCloseTab, fetchProducts, showNotification, refocus, showError, activeCustomer, clearCustomerOnSale, setShowReceipt, receiptSettings, checkExpiredItems]);

  const handlePayAndPrint = useCallback(async (
    selectedPaymentMethod?: PaymentMethod | null,
    customerOverride?: Customer | null
  ) => {
    if (isPaying) return;
    setIsPaying(true);
    const methodToUse: Partial<PaymentMethod> & { id: string; label: string } =
      selectedPaymentMethod || { id: 'cash', label: 'Cash' };
    try {
      const { proceed, hasExpiredItems } = await checkExpiredItems();
      if (!proceed) return;
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
        allowExpiredItems: hasExpiredItems,
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
  }, [isPaying, cart, discount, activeTabId, handleCloseTab, receiptSettings, defaultPrinter, printers, setShowReceipt, fetchProducts, refocus, showError, activeCustomer, clearCustomerOnSale, checkExpiredItems]);

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
