import React from 'react';
import { Box } from '@mui/material';
import POS from '@/domains/pos/components/POS';
import ScopedErrorBoundary from '@/shared/components/ScopedErrorBoundary';
import type {
  PrinterInfo,
  ReceiptSettings,
  ShopMetadata,
} from '@/domains/settings/hooks/useSettings';

interface POSPageProps {
  receiptSettings?: ReceiptSettings | null;
  shopName?: string;
  shopMetadata?: ShopMetadata | null;
  printers?: PrinterInfo[];
  defaultPrinter?: string | null;
}

const POSPage = ({
  receiptSettings,
  shopName,
  shopMetadata,
  printers,
  defaultPrinter,
}: POSPageProps) => {
  return (
    <Box sx={{ bgcolor: 'background.default', height: '100%', overflow: 'hidden' }}>
      <ScopedErrorBoundary label="POS">
        <POS
          receiptSettings={receiptSettings}
          shopName={shopName}
          shopMetadata={shopMetadata}
          printers={printers}
          defaultPrinter={defaultPrinter}
        />
      </ScopedErrorBoundary>
    </Box>
  );
};

export default POSPage;
