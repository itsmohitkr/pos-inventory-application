import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, Typography, Box
} from '@mui/material';
import { KeyboardArrowDown as ArrowDownIcon } from '@mui/icons-material';

const BatchSelectionDialog = ({ scannedProduct, onSelectBatch, onClose }) => {
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [keyboardEnabled, setKeyboardEnabled] = useState(false);
    const listRef = useRef(null);
    const isPriceMode = scannedProduct?.mode === 'price';
    const title = isPriceMode
        ? `Select MRP for ${scannedProduct?.product.name}`
        : `Select Batch for ${scannedProduct?.product.name}`;
    
    const batches = scannedProduct?.batches || [];

    // Reset focus when dialog opens or batches change
    useEffect(() => {
        if (scannedProduct) {
            setFocusedIndex(0);
        }
    }, [scannedProduct]);

    useEffect(() => {
        if (!scannedProduct) {
            setKeyboardEnabled(false);
            return;
        }

        setKeyboardEnabled(false);
        const timer = setTimeout(() => {
            setKeyboardEnabled(true);
        }, 150);

        return () => clearTimeout(timer);
    }, [scannedProduct]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!scannedProduct) return;

        const handleKeyDown = (e) => {
            if (!keyboardEnabled) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex(prev => (prev + 1) % batches.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex(prev => (prev - 1 + batches.length) % batches.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (batches[focusedIndex]) {
                    onSelectBatch(scannedProduct.product, batches[focusedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scannedProduct, batches, focusedIndex, onSelectBatch, onClose, keyboardEnabled]);

    // Auto-scroll focused item into view
    useEffect(() => {
        if (listRef.current) {
            const focusedElement = listRef.current.children[focusedIndex];
            if (focusedElement) {
                focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [focusedIndex]);

    return (
        <Dialog open={Boolean(scannedProduct)} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {title}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        Use ↑↓ arrows, Enter to select
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <List ref={listRef}>
                    {batches.map((batch, index) => {
                        const isFocused = index === focusedIndex;
                        return (
                            <ListItemButton 
                                key={batch.id} 
                                onClick={() => onSelectBatch(scannedProduct.product, batch)}
                                selected={isFocused}
                                sx={{
                                    backgroundColor: isFocused ? '#E3F2FD' : 'transparent',
                                    border: isFocused ? '2px solid #1976d2' : '2px solid transparent',
                                    '&:hover': {
                                        backgroundColor: isFocused ? '#BBDEFB' : 'action.hover',
                                    },
                                    '&.Mui-selected': {
                                        backgroundColor: '#E3F2FD',
                                        border: '2px solid #1976d2',
                                        '&:hover': {
                                            backgroundColor: '#BBDEFB',
                                        }
                                    },
                                    borderRadius: 1,
                                    mb: 0.5,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={() => setFocusedIndex(index)}
                            >
                                <ListItemText
                                    primary={
                                        <Typography 
                                            variant="subtitle1" 
                                            fontWeight="bold"
                                            sx={{ color: isFocused ? '#1976d2' : 'inherit' }}
                                        >
                                            {isPriceMode ? `MRP: ₹${batch.mrp}` : `Batch: ${batch.batchCode || 'N/A'}`}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box component="span" sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                            {!isPriceMode && (
                                                <Typography 
                                                    variant="body2"
                                                    sx={{ color: 'text.secondary' }}
                                                >
                                                    MRP: ₹{batch.mrp}
                                                </Typography>
                                            )}
                                            <Typography 
                                                variant="body2" 
                                                fontWeight="bold"
                                                sx={{ color: 'success.main' }}
                                            >
                                                SP: ₹{batch.sellingPrice}
                                            </Typography>
                                            <Typography 
                                                variant="body2"
                                                sx={{ color: 'text.secondary' }}
                                            >
                                                Qty: {batch.quantity}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            </DialogContent>
        </Dialog>
    );
};

export default BatchSelectionDialog;
