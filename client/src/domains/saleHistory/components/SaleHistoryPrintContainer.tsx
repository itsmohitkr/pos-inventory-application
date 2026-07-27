import React from 'react';
import { Box } from '@mui/material';
import ReceiptUntyped from '@/domains/pos/components/Receipt';

// Receipt.jsx is part of the receipt-printing path and is converted later; it
// currently exposes no prop types, so forwardRef infers empty props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Receipt = ReceiptUntyped as React.ComponentType<any>;

const fallbackReceiptSettings = {
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
  customShopName: localStorage.getItem('posShopName') || 'My Shop',
  customHeader: '123 Business Street, City',
  customFooter: 'Thank You! Visit Again',
};

const SaleHistoryPrintContainer = ({ selectedSale, receiptSettings, shopMetadata }) => (
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
          settings={receiptSettings || fallbackReceiptSettings}
          shopMetadata={shopMetadata}
        />
      )}
    </div>
  </Box>
);

export default React.memo(SaleHistoryPrintContainer);
