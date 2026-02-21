import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Autocomplete, FormControlLabel, Switch, Box, Chip, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import { Refresh as RefreshIcon, Close as CloseIcon, Edit as EditIcon } from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import { QrCode as QrCodeIcon } from '@mui/icons-material';
import EditBatchDialog from './EditBatchDialog';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../hooks/useCustomDialog';

const EditProductDialog = ({ open, onClose, product, onProductUpdated }) => {
    const { dialogState, showError, closeDialog } = useCustomDialog();
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        barcode: '',
        batchTrackingEnabled: false,
        lowStockWarningEnabled: false,
        lowStockThreshold: 10
    });
    const [batches, setBatches] = useState([]);
    const [existingCategories, setExistingCategories] = useState([]);
    const [barcodes, setBarcodes] = useState([]);
    const [manualBarcodeInput, setManualBarcodeInput] = useState('');
    const [barcodeError, setBarcodeError] = useState('');
    const [barcodeChecking, setBarcodeChecking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [editBatchOpen, setEditBatchOpen] = useState(false);
    const [currentBatch, setCurrentBatch] = useState(null);

    const fetchProductDetails = async () => {
        if (!product?.id) return;
        try {
            const response = await api.get(`/api/products/id/${product.id}`);
            const fullProduct = response.data.data;
            if (fullProduct) {
                setFormData({
                    name: fullProduct.name || '',
                    category: fullProduct.category || '',
                    barcode: fullProduct.barcode || '',
                    batchTrackingEnabled: !!fullProduct.batchTrackingEnabled,
                    lowStockWarningEnabled: !!fullProduct.lowStockWarningEnabled,
                    lowStockThreshold: fullProduct.lowStockThreshold || 10
                });
                if (fullProduct.barcode) {
                    setBarcodes(fullProduct.barcode.split('|').filter(Boolean));
                } else {
                    setBarcodes([]);
                }
                setBatches(fullProduct.batches || []);
            }
        } catch (error) {
            console.error('Failed to fetch product details:', error);
        }
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/api/products/summary');
                const categoryCounts = response.data.data?.categoryCounts || {};
                const categories = Object.keys(categoryCounts).filter(Boolean).sort();
                setExistingCategories(categories);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        if (open) {
            fetchCategories();
            fetchProductDetails();
            setManualBarcodeInput('');
            setBarcodeError('');
            setIsSaving(false);
        }
    }, [open, product]);

    const addBarcode = async (barcode) => {
        const trimmed = barcode.trim();
        if (!trimmed) return true;

        if (barcodes.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
            setBarcodeError('Barcode already added');
            return false;
        }

        setBarcodeChecking(true);
        try {
            // Check if barcode exists in database and belongs to ANOTHER product
            try {
                const res = await api.get(`/api/products/${encodeURIComponent(trimmed)}`);
                const existingProduct = res.data?.product;
                if (existingProduct && String(existingProduct.id) !== String(product.id)) {
                    setBarcodeError(`Barcode '${trimmed}' is already associated with product '${existingProduct.name}'`);
                    setBarcodeChecking(false);
                    return false;
                }
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    console.error("Authentication failed during barcode check");
                    setBarcodeError("Session expired. Please re-login.");
                    setBarcodeChecking(false);
                    return false;
                }
                if (error.response && error.response.status === 404) {
                    // Not found, safe to add
                } else {
                    console.error("Barcode verification failed:", error);
                }
            }

            const updatedBarcodes = [...barcodes, trimmed];
            setBarcodes(updatedBarcodes);
            setManualBarcodeInput('');
            setBarcodeError('');
            setFormData(prev => ({ ...prev, barcode: updatedBarcodes.join('|') }));
            return true;
        } finally {
            setBarcodeChecking(false);
        }
    };

    const removeBarcode = (index) => {
        const updatedBarcodes = barcodes.filter((_, i) => i !== index);
        setBarcodes(updatedBarcodes);
        setBarcodeError('');
        setFormData(prev => ({ ...prev, barcode: updatedBarcodes.length > 0 ? updatedBarcodes.join('|') : null }));
    };

    // Generate a unique 13-digit barcode
    const generateBarcode = () => {
        const newBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
        addBarcode(newBarcode);
    };

    const handleSave = async () => {
        if (!product?.id) return;

        // If there's pending manual input, try to add it first
        if (manualBarcodeInput.trim()) {
            const success = await addBarcode(manualBarcodeInput);
            if (!success) return;
        }

        if (barcodeChecking || barcodeError) {
            return;
        }

        setIsSaving(true);
        try {
            await api.put(`/api/products/${product.id}`, formData);
            if (onProductUpdated) {
                onProductUpdated();
            }
            onClose();
        } catch (error) {
            console.error("Error updating product:", error);
            const errorMessage = error.response?.data?.error || error.message;
            if (error.response?.status === 409) {
                setBarcodeError(errorMessage);
                showError("Conflict: " + errorMessage);
            } else {
                showError("Failed to update product: " + errorMessage);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditBatch = (batch) => {
        setCurrentBatch(batch);
        setEditBatchOpen(true);
    };

    const handleBatchUpdated = () => {
        fetchProductDetails(); // Reload batches
        setEditBatchOpen(false);
        if (onProductUpdated) {
            onProductUpdated();
        }
    };

    // Removed global onKeyDown handler to prevent premature saving

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>Edit Product Information</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Product Name"
                        fullWidth
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Barcodes</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                            <TextField
                                size="small"
                                label="Add Barcode"
                                value={manualBarcodeInput}
                                onChange={(e) => setManualBarcodeInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addBarcode(manualBarcodeInput);
                                    }
                                }}
                                error={Boolean(barcodeError)}
                                helperText={barcodeError || 'Enter barcode and press Enter or click Generate'}
                                disabled={barcodeChecking}
                                sx={{ flex: 1, minWidth: 200 }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><QrCodeIcon color="action" /></InputAdornment>,
                                }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                onClick={generateBarcode}
                                disabled={barcodeChecking}
                                sx={{ mt: 0.5, whiteSpace: 'nowrap', height: 'fit-content' }}
                            >
                                Generate
                            </Button>
                        </Box>
                        {barcodes.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                {barcodes.map((barcode, index) => (
                                    <Chip
                                        key={index}
                                        label={barcode}
                                        sx={{
                                            backgroundColor: '#2196F3',
                                            color: 'white',
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem',
                                            fontWeight: 600
                                        }}
                                        onDelete={() => removeBarcode(index)}
                                        deleteIcon={<CloseIcon />}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>

                    <Autocomplete
                        freeSolo
                        options={existingCategories}
                        value={formData.category}
                        onChange={(event, newValue) => {
                            setFormData({ ...formData, category: newValue || '' });
                        }}
                        onInputChange={(event, newInputValue) => {
                            setFormData({ ...formData, category: newInputValue });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                margin="dense"
                                label="Category"
                                placeholder="Select or type new"
                                fullWidth
                            />
                        )}
                        sx={{ mt: 2 }}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.batchTrackingEnabled}
                                onChange={(e) => setFormData({ ...formData, batchTrackingEnabled: e.target.checked })}
                            />
                        }
                        label="Enable batch tracking"
                        sx={{ mt: 2 }}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.lowStockWarningEnabled}
                                onChange={(e) => setFormData({ ...formData, lowStockWarningEnabled: e.target.checked })}
                            />
                        }
                        label="Enable low stock warning"
                        sx={{ mt: 2 }}
                    />
                    {formData.lowStockWarningEnabled && (
                        <TextField
                            margin="dense"
                            label="Low Stock Threshold"
                            type="number"
                            fullWidth
                            value={formData.lowStockThreshold}
                            onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                            InputProps={{ inputProps: { min: 0, step: 1 } }}
                            helperText="Alert when stock quantity falls below this number"
                            sx={{ mt: 1 }}
                        />
                    )}

                    {batches.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Batches</Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                            <TableCell>Code</TableCell>
                                            <TableCell align="right">Qty</TableCell>
                                            <TableCell align="right">MRP</TableCell>
                                            <TableCell align="right">SP</TableCell>
                                            <TableCell align="right">CP</TableCell>
                                            <TableCell>Expiry</TableCell>
                                            <TableCell align="center">Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {batches.map((batch) => (
                                            <TableRow key={batch.id}>
                                                <TableCell>{batch.batchCode || 'N/A'}</TableCell>
                                                <TableCell align="right">{batch.quantity}</TableCell>
                                                <TableCell align="right">{batch.mrp}</TableCell>
                                                <TableCell align="right">{batch.sellingPrice}</TableCell>
                                                <TableCell align="right">{batch.costPrice}</TableCell>
                                                <TableCell>{batch.expiryDate ? batch.expiryDate.split('T')[0] : '-'}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={() => handleEditBatch(batch)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={isSaving || barcodeChecking}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={isSaving || barcodeChecking || Boolean(barcodeError)}>
                        {isSaving ? 'Saving...' : 'Save Product'}
                    </Button>
                </DialogActions>

                {editBatchOpen && currentBatch && (
                    <EditBatchDialog
                        open={editBatchOpen}
                        onClose={() => setEditBatchOpen(false)}
                        batch={currentBatch}
                        onBatchUpdated={handleBatchUpdated}
                    />
                )}
            </Dialog>
            <CustomDialog {...dialogState} onClose={closeDialog} />
        </>
    );
};

export default EditProductDialog;
