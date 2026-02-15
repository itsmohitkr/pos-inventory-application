import React from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, IconButton
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';

const CartTable = ({ cart, onUpdateQuantity, onRemoveFromCart }) => {
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
                                <TableRow key={item.batch_id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight="600">{item.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">Code: {item.batch_code || 'N/A'}</Typography>
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
                                        <IconButton size="small" color="error" onClick={() => onRemoveFromCart(item.batch_id)}>
                                            <DeleteIcon fontSize="small" />
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
