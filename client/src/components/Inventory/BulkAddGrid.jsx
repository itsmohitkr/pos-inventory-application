import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    IconButton,
    Button,
    Typography,
    Stack,
    Tooltip,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Add as AddIcon,
    Save as SaveIcon,
    Clear as ClearIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Autocomplete } from '@mui/material';
import api from '../../shared/api/api';
import useCustomDialog from '../../shared/hooks/useCustomDialog';
import CustomDialog from '../common/CustomDialog';

const INITIAL_ROW = {
    name: '',
    barcode: '',
    category: '',
    quantity: '0',
    mrp: '0',
    cost_price: '0',
    selling_price: '0',
    batchTracking: false
};

const BulkAddGrid = ({ onProductsAdded, onCancel }) => {
    const { dialogState, showConfirm, closeDialog } = useCustomDialog();
    const [rows, setRows] = useState([{ ...INITIAL_ROW, id: Date.now() }]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/api/categories');
            const flatten = (nodes) => {
                let list = [];
                nodes.forEach(node => {
                    list.push(node.path);
                    if (node.children) list.push(...flatten(node.children));
                });
                return list;
            };
            setCategories(flatten(res.data.data || []));
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleAddRow = () => {
        setRows([...rows, { ...INITIAL_ROW, id: Date.now() }]);
    };

    const handleRemoveRow = (id) => {
        if (rows.length === 1) return;
        setRows(rows.filter(row => row.id !== id));
    };

    const handleFieldChange = (id, field, value) => {
        setRows(rows.map(row => {
            if (row.id === id) {
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const handleSave = async () => {
        setError(null);
        setSuccess(null);

        // Validation
        const invalidRows = rows.filter(r => !r.name.trim());
        if (invalidRows.length > 0) {
            setError('All products must have a name.');
            return;
        }

        const products = rows.map(r => ({
            name: r.name.trim(),
            barcode: r.barcode.trim() || null,
            category: r.category.trim() || null,
            enableBatchTracking: r.batchTracking,
            initialBatch: {
                quantity: parseInt(r.quantity) || 0,
                mrp: parseFloat(r.mrp) || 0,
                cost_price: parseFloat(r.cost_price) || 0,
                selling_price: parseFloat(r.selling_price) || 0,
                batch_code: '' // Service will auto-generate if tracking enabled
            }
        }));

        setLoading(true);
        try {
            await api.post('/api/products/bulk', { products });
            setSuccess(`Successfully added ${products.length} products.`);
            if (onProductsAdded) {
                setTimeout(() => onProductsAdded(), 1500);
            }
        } catch (err) {
            console.error('Bulk add failed:', err);
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        const confirmed = await showConfirm('Are you sure you want to clear all rows? This action cannot be undone.');
        if (confirmed) {
            setRows([{ ...INITIAL_ROW, id: Date.now() }]);
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight="700" color="primary">Bulk Product Entry</Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        startIcon={<ClearIcon />}
                        onClick={handleClear}
                        variant="outlined"
                        color="inherit"
                        disabled={loading}
                    >
                        Clear All
                    </Button>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddRow}
                        variant="outlined"
                        disabled={loading}
                    >
                        Add Row
                    </Button>
                    <Button
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save All Products'}
                    </Button>
                </Stack>
            </Box>

            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto', borderRadius: 2 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Product Name *</TableCell>
                            <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Barcode</TableCell>
                            <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Qty</TableCell>
                            <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>MRP</TableCell>
                            <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Cost Price</TableCell>
                            <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Sell Price</TableCell>
                            <TableCell sx={{ fontWeight: 700, width: 50 }} align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        value={row.name}
                                        onChange={(e) => handleFieldChange(row.id, 'name', e.target.value)}
                                        placeholder="Enter product name"
                                        error={!row.name.trim() && error}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        value={row.barcode}
                                        onChange={(e) => handleFieldChange(row.id, 'barcode', e.target.value)}
                                        placeholder="Optional barcode"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Autocomplete
                                        freeSolo
                                        options={categories}
                                        value={row.category}
                                        onInputChange={(event, newInputValue) => {
                                            handleFieldChange(row.id, 'category', newInputValue);
                                        }}
                                        onChange={(event, newValue) => {
                                            handleFieldChange(row.id, 'category', newValue || '');
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                size="small"
                                                placeholder="Category path"
                                            />
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={row.quantity}
                                        onChange={(e) => handleFieldChange(row.id, 'quantity', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={row.mrp}
                                        onChange={(e) => handleFieldChange(row.id, 'mrp', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={row.cost_price}
                                        onChange={(e) => handleFieldChange(row.id, 'cost_price', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={row.selling_price}
                                        onChange={(e) => handleFieldChange(row.id, 'selling_price', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        color="error"
                                        onClick={() => handleRemoveRow(row.id)}
                                        disabled={rows.length === 1}
                                        size="small"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', py: 1 }}>
                <Button
                    onClick={onCancel}
                    variant="text"
                    color="inherit"
                    startIcon={<ArrowBackIcon />}
                >
                    Back to Inventory
                </Button>
            </Box>
            <CustomDialog {...dialogState} onClose={closeDialog} />
        </Box>
    );
};

export default BulkAddGrid;
