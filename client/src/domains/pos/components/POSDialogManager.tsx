import type { Batch, Product } from '@/shared/types/models';
import type { AuthUser } from '@/shared/types/auth';
import type { DialogState } from '@/shared/hooks/useCustomDialog';
import type { CartItem, ReceiptSale, ScannedProduct } from '@/domains/pos/types';
import type {
  PrinterInfo,
  ReceiptSettings,
  ShopMetadata,
} from '@/domains/settings/hooks/useSettings';

/**
 * Every POS dialog lives here, so this takes the union of their props. Grouped
 * by the dialog each belongs to, matching the comments in the destructure.
 */
interface POSDialogManagerProps {
  // BatchSelectionDialog
  scannedProduct?: ScannedProduct | null;
  addToCart: (product: Product, batch: Batch) => void;
  setScannedProduct: (product: ScannedProduct | null) => void;
  searchBarRef: React.RefObject<{ focus: () => void } | null>;

  // ReceiptPreviewDialog
  showReceipt: boolean;
  setShowReceipt: (show: boolean) => void;
  lastSale?: ReceiptSale | null;
  receiptSettings?: ReceiptSettings | null;
  handleSettingChange: (field: string) => void;
  handleTextSettingChange: (field: string, value: unknown) => void;
  currentUser?: AuthUser | null;
  shopMetadata?: ShopMetadata | null;
  printers?: PrinterInfo[];
  defaultPrinter?: string | null;

  // QuantityDialog
  manualQuantityItem?: CartItem | null;
  setManualQuantityItem: (item: CartItem | null) => void;
  handleSetQuantity: (batchId: number, quantity: number) => void;
  refocus: (options?: { force?: boolean; delay?: number }) => void;

  // LooseSaleDialog
  showLooseSaleDialog: boolean;
  setShowLooseSaleDialog: (show: boolean) => void;
  setNotification: (notification: {
    open: boolean;
    message: string;
    severity: string;
  }) => void;

  // CustomDialog
  dialogState: DialogState;
  closeDialog: () => void;

  // Calculator
  showCalculator: boolean;
  setShowCalculator: (show: boolean) => void;

  // NumpadDialog (received amount)
  showNumpad: boolean;
  setShowNumpad: (show: boolean) => void;
  receivedAmount: number;
  setReceivedAmount: (amount: number) => void;

  // NumpadDialog (discount)
  showDiscountNumpad: boolean;
  setShowDiscountNumpad: (show: boolean) => void;
  discount: number;
  setDiscount: (discount: number) => void;

  // Customer Feature
  customerFeatureEnabled?: boolean;
}

import React from 'react';
import BatchSelectionDialog from '@/domains/pos/components/BatchSelectionDialog';
import ReceiptPreviewDialog from '@/domains/pos/components/ReceiptPreviewDialog';
import QuantityDialog from '@/domains/pos/components/QuantityDialog';
import LooseSaleDialog from '@/domains/pos/components/LooseSaleDialog';
import Calculator from '@/domains/pos/components/Calculator';
import NumpadDialog from '@/domains/pos/components/NumpadDialog';
import CustomDialog from '@/shared/components/CustomDialog';

const POSDialogManager = ({
  // BatchSelectionDialog
  scannedProduct, addToCart, setScannedProduct, searchBarRef,
  // ReceiptPreviewDialog
  showReceipt, setShowReceipt, lastSale, receiptSettings,
  handleSettingChange, handleTextSettingChange, currentUser, shopMetadata, printers, defaultPrinter,
  // QuantityDialog
  manualQuantityItem, setManualQuantityItem, handleSetQuantity, refocus,
  // LooseSaleDialog
  showLooseSaleDialog, setShowLooseSaleDialog, setNotification,
  // CustomDialog
  dialogState, closeDialog,
  // Calculator
  showCalculator, setShowCalculator,
  // NumpadDialog (received amount)
  showNumpad, setShowNumpad, receivedAmount, setReceivedAmount,
  // NumpadDialog (discount)
  showDiscountNumpad, setShowDiscountNumpad, discount, setDiscount,
  // Customer Feature
  customerFeatureEnabled,
}: POSDialogManagerProps) => (
  <>
    <BatchSelectionDialog
      scannedProduct={scannedProduct}
      onSelectBatch={(product, batch) => {
        addToCart(product, batch);
        setScannedProduct(null);
      }}
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
      customerFeatureEnabled={customerFeatureEnabled}
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
        setNotification({ open: true, message: 'Loose Sale Recorded Successfully!', severity: 'success' });
        refocus();
      }}
    />

    <CustomDialog {...dialogState} onClose={closeDialog} />

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

    <NumpadDialog
      open={showDiscountNumpad}
      onClose={() => setShowDiscountNumpad(false)}
      initialValue={discount}
      onConfirm={(val) => {
        setDiscount(val);
        setShowDiscountNumpad(false);
      }}
      title="Extra Discount"
    />
  </>
);

export default POSDialogManager;
