import React from 'react';
import { Box } from '@mui/material';
import POS from '@/domains/pos/components/POS';

const POSPage = ({ receiptSettings, shopName, shopMetadata, printers, defaultPrinter }) => {
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
