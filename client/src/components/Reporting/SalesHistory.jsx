import React from 'react';
import {
    Box, Typography, Chip, TableContainer, Table,
    TableHead, TableRow, TableCell, TableBody, IconButton
} from '@mui/material';
import {
    ListAlt as OrdersIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';

const SalesHistory = ({ sales, timeframeLabel, onSelectSale }) => {
    return (
        <Box sx={{ bgcolor: '#ffffff', p: 4, borderRight: '1px solid #eeeeee', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
                    Sales History - {timeframeLabel}
                </Typography>
                <Chip
                    label={`${sales?.length || 0} Transactions`}
                    size="small"
                    sx={{ bgcolor: '#f0f4f8', color: '#1a73e8', fontWeight: 700 }}
                />
            </Box>

            <TableContainer sx={{ flex: 1, overflowY: 'auto', border: '1px solid #edf2f7', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Table stickyHeader sx={{ tableLayout: 'fixed' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#64748b', width: '30%', py: 2 }}>DATE & TIME</TableCell>
                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#64748b', width: '15%', py: 2 }}>ORDER ID</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#64748b', width: '20%', py: 2 }}>AMOUNT</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#64748b', width: '20%', py: 2 }}>PROFIT</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#64748b', width: '15%', py: 2 }}>ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sales?.map((sale) => (
                            <TableRow key={sale.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                <TableCell sx={{ py: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(sale.createdAt).toLocaleDateString()}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>#{sale.id}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>₹{sale.netTotalAmount.toFixed(0)}</TableCell>
                                <TableCell align="right">
                                    <Typography sx={{ color: '#2e7d32', fontWeight: 700 }}>₹{sale.profit.toFixed(0)}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton size="small" onClick={() => onSelectSale(sale)} sx={{ color: '#1a73e8' }}>
                                        <ViewIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!sales || sales.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 12 }}>
                                    <Box sx={{ opacity: 0.5 }}>
                                        <OrdersIcon sx={{ fontSize: 48, mb: 1, color: '#94a3b8' }} />
                                        <Typography sx={{ color: '#64748b', fontWeight: 500 }}>No transactions found for this period.</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SalesHistory;
