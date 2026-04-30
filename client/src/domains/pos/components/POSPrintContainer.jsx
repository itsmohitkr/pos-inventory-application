import React from 'react';
import { Box } from '@mui/material';
import Receipt from '@/domains/pos/components/Receipt';

const POSPrintContainer = ({ lastSale, receiptSettings, shopMetadata, customerFeatureEnabled = true }) => (
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
      {lastSale && (
        <Receipt 
          sale={lastSale} 
          settings={receiptSettings} 
          shopMetadata={shopMetadata} 
          customerFeatureEnabled={customerFeatureEnabled}
        />
      )}
    </div>
  </Box>
);

export default React.memo(POSPrintContainer);
