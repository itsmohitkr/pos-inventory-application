import React from 'react';
import { Box } from '@mui/material';
import POS from '@/domains/pos/components/POS';
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
      <POS
        receiptSettings={receiptSettings}
        shopName={shopName}
        shopMetadata={shopMetadata}
        printers={printers}
        defaultPrinter={defaultPrinter}
      />
    </Box>
  );
};

export default POSPage;
