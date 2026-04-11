import React from 'react';
import { Box } from '@mui/material';
import POS from '../components/POS/POS';

const POSPage = ({ receiptSettings, shopMetadata, printers, defaultPrinter }) => {
    return (
        <Box sx={{ bgcolor: 'background.default', height: '100%', overflow: 'hidden' }}>
            <POS
                receiptSettings={receiptSettings}
                shopMetadata={shopMetadata}
                printers={printers}
                defaultPrinter={defaultPrinter}
            />
        </Box>
    );
};

export default POSPage;
