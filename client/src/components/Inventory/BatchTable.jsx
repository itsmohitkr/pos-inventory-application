import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Box, IconButton } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

const BatchTable = ({ batches, onEditBatch }) => {
    return (
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
                            <TableCell component="th" scope="row">{batch.batchCode || 'N/A'}</TableCell>
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
                                <IconButton size="small" color="primary" onClick={() => onEditBatch(batch)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default BatchTable;
