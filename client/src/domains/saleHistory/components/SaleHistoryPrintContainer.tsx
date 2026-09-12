import React from 'react';
import { createPortal } from 'react-dom';
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
}: SaleHistoryPrintContainerProps) =>
  createPortal(
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
    </Box>,
    // Rendered as a direct child of <body> via a portal instead of relying
    // on position:fixed to escape AppLayout's ancestor chain. AppLayout's
    // wrappers became position:relative in the sidebar-nav redesign, which
    // broke this container's position:absolute anchoring (it resolved
    // against the sidebar-narrowed layout instead of the true page) on
    // every route except /pos. A position:fixed fix was verified correct
    // against Playwright/Chromium in both dev and production builds, but
    // the real packaged Electron app's silent print still reproduced the
    // original bug — so instead of continuing to depend on exactly how a
    // given Chromium/Electron build resolves position:fixed containing
    // blocks under print, this portal makes the ancestor chain a non-issue
    // structurally: there are no ancestors to escape in the first place.
    document.body
  );

export default React.memo(SaleHistoryPrintContainer);
