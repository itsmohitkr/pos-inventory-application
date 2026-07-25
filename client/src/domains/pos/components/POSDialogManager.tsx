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
}) => (
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
