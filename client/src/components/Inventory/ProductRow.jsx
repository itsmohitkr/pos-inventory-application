import React, { useState } from 'react';
import { TableRow, TableCell, IconButton, Collapse, Box, Typography, Button, Chip } from '@mui/material';
import {
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import BatchTable from './BatchTable';

// Helper to render barcodes as chips
const renderBarcodeChips = (barcode) => {
    if (!barcode) return <Typography variant="body2" color="text.secondary">—</Typography>;
    
    const barcodes = barcode.split('|').map(b => b.trim()).filter(Boolean);
    if (barcodes.length === 0) return <Typography variant="body2" color="text.secondary">—</Typography>;
    
    return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {barcodes.map((bc, idx) => (
                <Chip
                    key={idx}
                    label={bc}
                    size="small"
                    variant="outlined"
                    sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem'
                    }}
                />
            ))}
        </Box>
    );
};

const ProductRow = ({ product, onDelete, onEdit, onEditBatch, onAddStock, onBatchUpdated }) => {
    const [open, setOpen] = useState(false);
    const hasBatches = product.batches && product.batches.length > 0;

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    {hasBatches && (
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                        >
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                    )}
                </TableCell>
                <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{product.name}</span>
                        {product.batchTrackingEnabled && (
                            <Chip label="Batch" size="small" variant="filled" sx={{ height: '20px' }} />
                        )}
                    </Box>
                </TableCell>
                <TableCell>{renderBarcodeChips(product.barcode)}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell align="right">{product.total_stock}</TableCell>
                <TableCell align="right">
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => onAddStock(product)}
                        sx={{ mr: 1, textTransform: 'none' }}
                    >
                        Add Stock
                    </Button>
                    <IconButton color="primary" size="medium" onClick={() => onEdit(product)}>
                        <EditIcon fontSize="medium" />
                    </IconButton>
                    <IconButton color="error" size="medium" onClick={() => onDelete(product.id)}>
                        <DeleteIcon fontSize="medium" />
                    </IconButton>
                </TableCell>
            </TableRow>
            {hasBatches && (
                <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1 }}>
                                <Typography variant="h6" gutterBottom component="div">
                                    Batch Details
                                </Typography>
                                <BatchTable
                                    batches={product.batches}
                                    onEditBatch={onEditBatch}
                                    onBatchUpdated={onBatchUpdated}
                                    productName={product.name}
                                />
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            )}
        </React.Fragment>
    );
};

export default ProductRow;
