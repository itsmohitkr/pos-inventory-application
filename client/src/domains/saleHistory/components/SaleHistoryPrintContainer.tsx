import React from 'react';
import type { ReportSale } from '@/shared/types/models';
import type { ReceiptSettings, ShopMetadata } from '@/domains/settings/hooks/useSettings';
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

interface SaleHistoryPrintContainerProps {
  /** The sale being printed; null renders the off-screen container empty. */
  selectedSale?: ReportSale | null;
  /** Falls back to fallbackReceiptSettings above when not yet loaded. */
  receiptSettings?: ReceiptSettings | null;
  shopMetadata?: ShopMetadata | null;
}

const SaleHistoryPrintContainer = ({
  selectedSale,
  receiptSettings,
  shopMetadata,
}: SaleHistoryPrintContainerProps) => (
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
