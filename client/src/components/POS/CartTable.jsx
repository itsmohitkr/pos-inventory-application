import React from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, IconButton, Chip, Tooltip
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';

const ShortBatchCode = ({ batchCode }) => {
    if (!batchCode || batchCode === 'N/A') {
        return <Typography variant="caption" color="text.secondary">No batch</Typography>;
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
                    fontSize: '0.7rem',
                    height: '18px'
                }}
            />
        );
    }

    // For longer codes, show first 6 chars + "..."
    const shortCode = batchCode.substring(0, 6) + '...';
    return (
        <Tooltip title={`Batch: ${batchCode}`} arrow placement="top">
            <Chip
                label={shortCode}
                size="small"
                variant="outlined"
                sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    height: '18px',
                    cursor: 'help'
                }}
            />
        </Tooltip>
    );
};

const CartTable = ({ cart, onUpdateQuantity, onRemoveFromCart, lastAddedItemId }) => {
    return (
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <TableContainer sx={{ borderTop: '1px solid rgba(16, 24, 40, 0.06)' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>MRP</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Disc.</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            <TableCell width={40}></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {cart.map((item) => {
                            const discountPerUnit = item.mrp - item.price;
                            const totalDiscount = discountPerUnit * item.quantity;
                            return (
                                <TableRow
                                    key={item.batch_id}
                                    hover
                                    sx={{
                                        backgroundColor: item.batch_id === lastAddedItemId ? 'rgba(76, 175, 80, 0.15)' : 'inherit',
                                        transition: 'background-color 0.5s ease'
                                    }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle2" fontWeight="600">{item.name}</Typography>
                                            {item.isOnSale && <Chip label="SALE" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#7c3aed', color: 'white' }} />}
                                            {item.wholesaleEnabled && (
                                                <Tooltip title={`Wholesale: ₹${item.wholesalePrice} for ${item.wholesaleMinQty}+ units`} arrow>
                                                    <Chip
                                                        label="WHOLESALE"
                                                        size="small"
                                                        variant={item.quantity >= item.wholesaleMinQty ? "filled" : "outlined"}
                                                        color="primary"
                                                        sx={{
                                                            height: 16,
                                                            fontSize: '0.6rem',
                                                            fontWeight: 800,
                                                            bgcolor: item.quantity >= item.wholesaleMinQty ? 'primary.main' : 'transparent',
                                                            color: item.quantity >= item.wholesaleMinQty ? 'white' : 'primary.main',
                                                            borderColor: 'primary.main'
                                                        }}
                                                    />
                                                </Tooltip>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ShortBatchCode batchCode={item.batch_code} />
                                            {item.wholesaleEnabled && (
                                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500, fontSize: '0.65rem' }}>
                                                    {item.wholesaleMinQty}+ units @ ₹{item.wholesalePrice}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd', borderRadius: 1, width: 'fit-content', mx: 'auto' }}>
                                            <IconButton size="small" onClick={() => onUpdateQuantity(item.batch_id, -1)} color="primary">
                                                <RemoveIcon fontSize="small" />
                                            </IconButton>
                                            <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</Typography>
                                            <IconButton size="small" onClick={() => onUpdateQuantity(item.batch_id, 1)} color="primary">
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2">₹{item.mrp.toFixed(2)}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight="600">₹{item.price.toFixed(2)}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" color="error.main">₹{totalDiscount.toFixed(2)}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold">₹{(item.price * item.quantity).toFixed(2)}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="medium" color="error" onClick={() => onRemoveFromCart(item.batch_id)}>
                                            <DeleteIcon fontSize="medium" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {cart.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                    <ShoppingCartIcon sx={{ fontSize: 60, color: 'rgba(11, 29, 57, 0.2)', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">Order is empty</Typography>
                                    <Typography variant="body2" color="text.secondary">Search an item to begin</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default CartTable;
