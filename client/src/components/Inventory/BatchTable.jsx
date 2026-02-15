import React, { useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Box, IconButton, Chip, Tooltip } from '@mui/material';
import { Edit as EditIcon, Inventory2 as InventoryIcon } from '@mui/icons-material';
import QuickInventoryDialog from './QuickInventoryDialog';

const ShortBatchCode = ({ batchCode }) => {
    if (!batchCode || batchCode === 'N/A') {
        return <span style={{ color: '#999' }}>N/A</span>;
    }
    
    // If batch code is short (<=8 chars), display it normally
    if (batchCode.length <= 8) {
        return (
            <Chip 
                label={batchCode} 
                size="small" 
                variant="outlined"
                sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    height: '22px'
                }} 
            />
        );
    }
    
    // For longer codes, show first 6 chars + "..."
    const shortCode = batchCode.substring(0, 6) + '...';
    return (
        <Tooltip title={batchCode} arrow placement="top">
            <Chip 
                label={shortCode} 
                size="small" 
                variant="outlined"
                sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    height: '22px',
                    cursor: 'help'
                }} 
            />
        </Tooltip>
    );
};

const BatchTable = ({ batches, onEditBatch, onBatchUpdated, productName }) => {
    const [quickBatch, setQuickBatch] = useState(null);
    const [quickOpen, setQuickOpen] = useState(false);

    const handleQuickOpen = (batch) => {
        setQuickBatch(batch);
        setQuickOpen(true);
    };

    const handleQuickClose = () => {
        setQuickOpen(false);
    };

    return (
        <>
            <Table size="small" aria-label="purchases">
                <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Batch Code</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cost Price (CP)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Selling Price (SP)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>MRP</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Margin</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Expiry Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {batches.map((batch) => {
                        const margin = batch.sellingPrice > 0
                            ? (((batch.sellingPrice - batch.costPrice) / batch.sellingPrice) * 100).toFixed(1)
                            : 0;

                        return (
                            <TableRow key={batch.id}>
                                <TableCell component="th" scope="row"><ShortBatchCode batchCode={batch.batchCode} /></TableCell>
                                <TableCell>{batch.quantity}</TableCell>
                                <TableCell align="right">₹{batch.costPrice}</TableCell>
                                <TableCell align="right">₹{batch.sellingPrice}</TableCell>
                                <TableCell align="right">₹{batch.mrp}</TableCell>
                                <TableCell align="center">
                                    <Box sx={{
                                        color: margin > 20 ? 'success.main' : margin > 10 ? 'warning.main' : 'error.main',
                                        fontWeight: 'bold'
                                    }}>
                                        {margin}%
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                        <Tooltip title="Quick Inventory" arrow>
                                            <IconButton size="medium" color="primary" onClick={() => handleQuickOpen(batch)}>
                                                <InventoryIcon fontSize="medium" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit Batch" arrow>
                                            <IconButton size="medium" color="primary" onClick={() => onEditBatch(batch)}>
                                                <EditIcon fontSize="medium" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            <QuickInventoryDialog
                open={quickOpen}
                onClose={handleQuickClose}
                batch={quickBatch}
                productName={productName}
                onUpdated={onBatchUpdated}
            />
        </>
    );
};

export default BatchTable;
