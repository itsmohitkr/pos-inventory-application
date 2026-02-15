import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, Typography, Box
} from '@mui/material';

const BatchSelectionDialog = ({ scannedProduct, onSelectBatch, onClose }) => {
    const isPriceMode = scannedProduct?.mode === 'price';
    const title = isPriceMode
        ? `Select MRP for ${scannedProduct?.product.name}`
        : `Select Batch for ${scannedProduct?.product.name}`;

    return (
        <Dialog open={Boolean(scannedProduct)} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <List>
                    {scannedProduct?.batches.map(batch => (
                        <ListItemButton key={batch.id} onClick={() => onSelectBatch(scannedProduct.product, batch)}>
                            <ListItemText
                                primary={
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {isPriceMode ? `MRP: ₹${batch.mrp}` : `Batch: ${batch.batchCode || 'N/A'}`}
                                    </Typography>
                                }
                                secondary={
                                    <Box component="span" sx={{ display: 'flex', gap: 2, color: 'text.secondary', mt: 0.5 }}>
                                        {!isPriceMode && <Typography variant="body2">MRP: ₹{batch.mrp}</Typography>}
                                        <Typography variant="body2" color="success.main" fontWeight="bold">SP: ₹{batch.sellingPrice}</Typography>
                                        <Typography variant="body2">Qty: {batch.quantity}</Typography>
                                    </Box>
                                }
                            />
                        </ListItemButton>
                    ))}
                </List>
            </DialogContent>
        </Dialog>
    );
};

export default BatchSelectionDialog;
