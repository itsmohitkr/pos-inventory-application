import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Autocomplete,
    Chip,
    Tooltip,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    CalendarToday as CalendarIcon,
    LocalOffer as PromoIcon,
    Inventory as InventoryIcon
} from '@mui/icons-material';
import api from '../../api';

const PromotionManagement = () => {
    const [promotions, setPromotions] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        items: []
    });

    // Product selection state
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productPriceInfo, setProductPriceInfo] = useState(null);
    const [promoPrice, setPromoPrice] = useState('');

    useEffect(() => {
        fetchPromotions();
        fetchProducts();
    }, []);

    const fetchPromotions = async () => {
        try {
            const res = await api.get('/api/promotions');
            setPromotions(res.data);
        } catch (error) {
            console.error('Failed to fetch promotions:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/api/products', { params: { pageSize: 1000 } });
            setProducts(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const handleOpenDialog = () => {
        setIsEditMode(false);
        setEditId(null);
        setFormData({
            name: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            items: []
        });
        setOpenDialog(true);
    };

    const handleEditOpen = async (promo) => {
        setIsEditMode(true);
        setEditId(promo.id);

        // Convert ISO dates to YYYY-MM-DD
        const start = promo.startDate.split('T')[0];
        const end = promo.endDate.split('T')[0];

        // Fetch current pricing for the items in the promotion
        const enrichedItems = await Promise.all(promo.items.map(async (item) => {
            try {
                const res = await api.get(`/api/promotions/product-options/${item.productId}`);
                return {
                    productId: item.productId,
                    productName: item.product?.name || 'Unknown Product',
                    promoPrice: item.promoPrice,
                    mrp: res.data.mrp,
                    costPrice: res.data.costPrice,
                    sellingPrice: res.data.sellingPrice
                };
            } catch (err) {
                return {
                    productId: item.productId,
                    productName: item.product?.name || 'Unknown Product',
                    promoPrice: item.promoPrice,
                    mrp: 0,
                    costPrice: 0,
                    sellingPrice: 0
                };
            }
        }));

        setFormData({
            name: promo.name,
            startDate: start,
            endDate: end,
            isActive: promo.isActive,
            items: enrichedItems
        });

        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedProduct(null);
        setProductPriceInfo(null);
        setPromoPrice('');
    };

    const handleProductSelect = async (event, newValue) => {
        setSelectedProduct(newValue);
        if (newValue) {
            try {
                const res = await api.get(`/api/promotions/product-options/${newValue.id}`);
                setProductPriceInfo(res.data);
                setPromoPrice(res.data.sellingPrice);
            } catch (error) {
                console.error('Failed to fetch product pricing:', error);
            }
        } else {
            setProductPriceInfo(null);
            setPromoPrice('');
        }
    };

    const handleAddItem = () => {
        if (!selectedProduct || !promoPrice) return;

        const newItem = {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            promoPrice: parseFloat(promoPrice),
            mrp: productPriceInfo.mrp,
            costPrice: productPriceInfo.costPrice,
            sellingPrice: productPriceInfo.sellingPrice
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        setSelectedProduct(null);
        setProductPriceInfo(null);
        setPromoPrice('');
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        try {
            if (isEditMode) {
                await api.put(`/api/promotions/${editId}`, formData);
            } else {
                await api.post('/api/promotions', formData);
            }
            fetchPromotions();
            handleCloseDialog();
        } catch (error) {
            console.error('Failed to save promotion:', error);
        }
    };

    const handleDeletePromotion = async (id) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;
        try {
            await api.delete(`/api/promotions/${id}`);
            fetchPromotions();
        } catch (error) {
            console.error('Failed to delete promotion:', error);
        }
    };

    const isPromotionActive = (promo) => {
        const now = new Date();
        const start = new Date(promo.startDate);
        const end = new Date(promo.endDate);
        return promo.isActive && now >= start && now <= end;
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 2, background: "linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)", borderBottom: "1px solid rgba(16, 24, 40, 0.08)", mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}>
                            Sales & Promotions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Schedule temporary price reductions and create sales events.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenDialog}
                        sx={{ bgcolor: "#0b1d39", borderRadius: 2, px: 3, "&:hover": { bgcolor: "#1b3e6f" } }}
                    >
                        Create New Sale
                    </Button>
                </Box>
            </Paper>

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #eee' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Promo Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {promotions.map((promo) => (
                            <TableRow key={promo.id}>
                                <TableCell>{promo.name}</TableCell>
                                <TableCell>{new Date(promo.startDate).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(promo.endDate).toLocaleDateString()}</TableCell>
                                <TableCell>{promo.items?.length || 0} Products</TableCell>
                                <TableCell>
                                    {isPromotionActive(promo) ? (
                                        <Chip label="ACTIVE" color="success" size="small" sx={{ fontWeight: 700 }} />
                                    ) : new Date() < new Date(promo.startDate) ? (
                                        <Chip label="UPCOMING" color="primary" size="small" sx={{ fontWeight: 700 }} />
                                    ) : (
                                        <Chip label="EXPIRED" color="default" size="small" sx={{ fontWeight: 700 }} />
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleEditOpen(promo)} color="primary">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDeletePromotion(promo.id)} color="error">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create/Edit Promotion Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#0b1d39', borderBottom: '1px solid #f0f0f0', pb: 2 }}>
                    {isEditMode ? 'Edit Sale Event' : 'Schedule New Sale Event'}
                </DialogTitle>
                <DialogContent sx={{ mt: 3, '&::-webkit-scrollbar': { display: 'none' } }}>
                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1b3e6f', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon fontSize="small" /> Event Details
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Sale Name"
                                        placeholder="e.g. Spring Clearance Sale"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        InputProps={{ sx: { borderRadius: 2 } }}
                                        sx={{ minWidth: 350 }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Start Date"
                                        InputLabelProps={{ shrink: true }}
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        InputProps={{ sx: { borderRadius: 2 } }}
                                        sx={{ minWidth: 250 }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="End Date"
                                        InputLabelProps={{ shrink: true }}
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        InputProps={{ sx: { borderRadius: 2 } }}
                                        sx={{ minWidth: 250 }}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1b3e6f', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PromoIcon fontSize="small" /> Add Products
                            </Typography>

                            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: '#fbfbfd', border: '1px solid #e2e8f0', mb: 3 }}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <Autocomplete
                                        sx={{ flexGrow: 1, minWidth: 350 }}
                                        options={products}
                                        getOptionLabel={(option) => `${option.name} (${option.barcode || 'No Barcode'})`}
                                        value={selectedProduct}
                                        onChange={handleProductSelect}
                                        renderInput={(params) => <TextField {...params} label="Search Product" InputProps={{ ...params.InputProps, sx: { borderRadius: 2, bgcolor: 'white' } }} />}
                                    />
                                    <TextField
                                        label="Sale Price"
                                        type="number"
                                        sx={{ width: 220, minWidth: 220 }}
                                        value={promoPrice}
                                        onChange={(e) => setPromoPrice(e.target.value)}
                                        InputProps={{ sx: { borderRadius: 2, bgcolor: 'white' } }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleAddItem}
                                        disabled={!selectedProduct}
                                        sx={{
                                            height: 56, px: 4, borderRadius: 2, fontWeight: 700,
                                            background: '#22ab7dff', color: 'white',
                                            '&:hover': { background: '#059669' },
                                            '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Box>

                                {productPriceInfo && (
                                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                        <Box sx={{ flex: 1, p: 1.5, bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>MRP</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0b1d39' }}>₹{productPriceInfo.mrp}</Typography>
                                        </Box>
                                        <Box sx={{ flex: 1, p: 1.5, bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>Cost Price</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0b1d39' }}>₹{productPriceInfo.costPrice}</Typography>
                                        </Box>
                                        <Box sx={{ flex: 1, p: 1.5, bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>Current SP</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0b1d39' }}>₹{productPriceInfo.sellingPrice}</Typography>
                                        </Box>
                                        <Box sx={{ flex: 1, p: 1.5, bgcolor: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 2, textAlign: 'center' }}>
                                            <Typography variant="caption" sx={{ color: '#db2777', display: 'block', mb: 0.5, fontWeight: 700 }}>Discount Amount</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 800, color: '#be185d' }}>
                                                ₹{Math.max(0, productPriceInfo.sellingPrice - parseFloat(promoPrice || 0)).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Paper>

                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2 }}>Product</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2 }}>MRP</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2 }}>Current SP</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: '#0b1d39', py: 2 }}>Sale Price</TableCell>
                                            <TableCell align="right" sx={{ py: 2 }}></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.items.map((item, index) => (
                                            <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ fontWeight: 500 }}>{item.productName}</TableCell>
                                                <TableCell sx={{ color: '#64748b' }}>₹{item.mrp}</TableCell>
                                                <TableCell sx={{ color: '#64748b' }}>₹{item.sellingPrice}</TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: '#16a34a', fontSize: '1.05rem' }}>₹{item.promoPrice}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={() => handleRemoveItem(index)} color="error" sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {formData.items.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                    <InventoryIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                                                    <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                                                        No products added to this sale yet
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                                                        Search and add products above to build your promotion
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid #f0f0f0', mt: 3 }}>
                    <Button onClick={handleCloseDialog} sx={{ color: '#64748b', fontWeight: 600, px: 3 }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!formData.name || formData.items.length === 0}
                        sx={{
                            borderRadius: 2, px: 4, fontWeight: 700,
                            background: '#22ab7dff', color: 'white',
                            '&:hover': { background: '#059669' },
                            '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' }
                        }}
                    >
                        Publish Sale
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default PromotionManagement;
