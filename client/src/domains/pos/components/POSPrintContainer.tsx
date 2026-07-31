import type { ReceiptSale } from '@/domains/pos/types';
import type {
  ReceiptSettings,
  ShopMetadata,
} from '@/domains/settings/hooks/useSettings';
import React from 'react';
import { Box } from '@mui/material';
import Receipt from '@/domains/pos/components/Receipt';

interface POSPrintContainerProps {
  /** The sale to print; null renders the off-screen container empty. */
  lastSale?: ReceiptSale | null;
  receiptSettings?: ReceiptSettings | null;
  shopMetadata?: ShopMetadata | null;
  /** Hides the customer block on the printed receipt when off. */
  customerFeatureEnabled?: boolean;
}

const POSPrintContainer = ({
  lastSale,
  receiptSettings,
  shopMetadata,
  customerFeatureEnabled = true,
}: POSPrintContainerProps) => (
  <Box
    aria-hidden="true"
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
      {lastSale && (
        <Receipt
          sale={lastSale}
          settings={receiptSettings ?? undefined}
          shopMetadata={shopMetadata ?? undefined}
          customerFeatureEnabled={customerFeatureEnabled}
        />
      )}
    </div>
  </Box>
);

export default React.memo(POSPrintContainer);
