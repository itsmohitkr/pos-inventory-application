import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Paper, TextField, Chip, Stack, Grid, Card, CardContent, CardActions, Button,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography,
    InputAdornment, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse
} from '@mui/material';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FolderOpen as FolderOpenIcon,
    Folder as FolderIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    MoreVert as MoreVertIcon,
    Add as AddIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import EditProductDialog from './EditProductDialog';
import EditBatchDialog from './EditBatchDialog';

// Helper to render barcodes as chips
const renderBarcodeChips = (barcode) => {
    if (!barcode) return <Typography variant="caption" color="textSecondary">—</Typography>;

    const barcodes = barcode.split('|').map(b => b.trim()).filter(Boolean);
    if (barcodes.length === 0) return <Typography variant="caption" color="textSecondary">—</Typography>;

    return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {barcodes.map((bc, idx) => (
                <Chip
                    key={idx}
                    label={bc}
                    size="small"
                    variant="outlined"
                    sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        height: '20px'
                    }}
                />
            ))}
        </Box>
    );
};

const InventoryTree = forwardRef((props, ref) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});
    const [editOpen, setEditOpen] = useState(false);
    const [batchEditOpen, setBatchEditOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [currentBatch, setCurrentBatch] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    useImperativeHandle(ref, () => ({
        refresh: fetchProducts
    }));

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, 200);
        return () => clearTimeout(handle);
    }, [searchTerm]);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/products', {
                params: { page: 1, pageSize: 1000, includeBatches: true }
            });
            const allProducts = response.data.data || [];
            setProducts(allProducts);

            // Extract unique categories
            const uniqueCategories = ['All Products'];
            allProducts.forEach(product => {
                if (product.category && !uniqueCategories.includes(product.category)) {
                    uniqueCategories.push(product.category);
                }
            });
            if (allProducts.some(p => !p.category)) {
                uniqueCategories.push('Uncategorized');
            }

            setCategories(uniqueCategories);
            // Always set selected category to 'All Products' on initial load
            setSelectedCategory('All Products');
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const normalizedSearch = debouncedSearch.toLowerCase();

    const filteredProducts = useMemo(() => {
        if (!normalizedSearch) return products;
        return products.filter((product) => {
            const nameMatch = product.name?.toLowerCase().includes(normalizedSearch);
            const barcodeMatch = product.barcode?.toLowerCase().includes(normalizedSearch);
            return nameMatch || barcodeMatch;
        });
    }, [products, normalizedSearch]);

    const productsByCategory = useMemo(() => {
        const map = new Map();
        map.set('All Products', filteredProducts);
        map.set('Uncategorized', []);

        filteredProducts.forEach((product) => {
            if (!product.category) {
                map.get('Uncategorized').push(product);
                return;
            }
            if (!map.has(product.category)) {
                map.set(product.category, []);
            }
            map.get(product.category).push(product);
        });

        return map;
    }, [filteredProducts]);

    const handleEditProduct = (product) => {
        setCurrentProduct(product);
        setEditOpen(true);
    };

    const handleDeleteProduct = async (product) => {
        setProductToDelete(product);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (productToDelete) {
            try {
                await axios.delete(`/api/products/${productToDelete.id}`);
                fetchProducts();
                setDeleteConfirmOpen(false);
                setProductToDelete(null);
            } catch (error) {
                console.error('Failed to delete product:', error);
            }
        }
    };

    const handleProductUpdated = () => {
        fetchProducts();
        setEditOpen(false);
        setCurrentProduct(null);
    };

    const handleBatchUpdated = () => {
        fetchProducts();
        setBatchEditOpen(false);
    };

    const currentCategoryProducts = productsByCategory.get(selectedCategory) || [];

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 3 }}>
            {/* Left Sidebar - Directory Tree */}
            <Paper elevation={2} sx={{
                width: 280,
                overflowY: 'auto',
                p: 2,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                position: 'sticky',
                top: 0,
                maxHeight: 'calc(100vh - 200px)'
            }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#0b1d39', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderIcon sx={{ color: '#f2b544' }} />
                    Categories
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List disablePadding>
                    {categories.map((category) => {
                        const isSelected = selectedCategory === category;
                        const isExpanded = expandedCategories[category];
                        const itemsInCategory = productsByCategory.get(category) || [];

                        return (
                            <Box key={category}>
                                <ListItemButton
                                    selected={isSelected}
                                    onClick={() => setSelectedCategory(category)}
                                    sx={{
                                        pl: 2,
                                        py: 1.5,
                                        borderRadius: 1.5,
                                        mb: 0.5,
                                        backgroundColor: isSelected ? 'rgba(31, 138, 91, 0.12)' : 'transparent',
                                        borderLeft: isSelected ? '4px solid #1f8a5b' : 'none',
                                        pl: isSelected ? 1.5 : 2,
                                        '&:hover': {
                                            backgroundColor: 'rgba(31, 138, 91, 0.08)'
                                        },
                                        transition: 'all 150ms ease'
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        {isSelected ? (
                                            <FolderOpenIcon sx={{ color: '#1f8a5b', fontSize: 24 }} />
                                        ) : (
                                            <FolderIcon sx={{ color: '#f2b544', fontSize: 24 }} />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={category}
                                        secondary={`${itemsInCategory.length} items`}
                                        primaryTypographyProps={{ fontWeight: isSelected ? 600 : 500, fontSize: '14px' }}
                                        secondaryTypographyProps={{ fontSize: '12px' }}
                                    />
                                    {itemsInCategory.length > 0 && (
                                        <Chip
                                            label={itemsInCategory.length}
                                            size="small"
                                            variant="outlined"
                                            sx={{ ml: 1 }}
                                        />
                                    )}
                                </ListItemButton>
                            </Box>
                        );
                    })}
                </List>
            </Paper>

            {/* Right Side - Product Grid */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Search and Header */}
                <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(31, 138, 91, 0.05)' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#0b1d39', mb: 1 }}>
                                {selectedCategory}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {currentCategoryProducts.length} products found
                            </Typography>
                        </Box>
                        <TextField
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            sx={{ width: { xs: '100%', sm: 280 } }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                            }}
                        />
                    </Stack>
                </Paper>

                {/* Products Grid */}
                <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                    {currentCategoryProducts.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                            <FolderIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                            <Typography variant="h6" color="textSecondary">
                                No products found
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                {searchTerm ? 'Try adjusting your search' : 'Add some products to get started'}
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2}>
                            {currentCategoryProducts.map((product) => {
                                const totalQuantity = product.batches.reduce((sum, b) => sum + b.quantity, 0);
                                const maxMrp = Math.max(...product.batches.map(b => b.mrp), 0);
                                const maxSelling = Math.max(...product.batches.map(b => b.sellingPrice), 0);
                                const maxCost = Math.max(...product.batches.map(b => b.costPrice), 0);
                                const margin = maxSelling > 0 ? ((maxSelling - maxCost) / maxSelling * 100).toFixed(1) : 0;

                                return (
                                    <Grid item xs={12} sm={6} lg={4} key={product.id}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: 'all 200ms ease',
                                                '&:hover': {
                                                    boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                                                    transform: 'translateY(-4px)'
                                                },
                                                borderTop: '4px solid #1f8a5b'
                                            }}
                                        >
                                            <CardContent sx={{ flex: 1 }}>
                                                {/* Product Header */}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '14px' }}>
                                                                {product.name.length > 35 ? product.name.substring(0, 35) + '...' : product.name}
                                                            </Typography>
                                                            {product.batchTrackingEnabled && (
                                                                <Chip label="Batch" size="small" variant="filled" />
                                                            )}
                                                        </Box>
                                                        {renderBarcodeChips(product.barcode)}
                                                    </Box>
                                                </Box>

                                                <Divider sx={{ my: 1.5 }} />

                                                {/* Stock Status */}
                                                <Box sx={{ mb: 1.5 }}>
                                                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="caption" color="textSecondary">Stock</Typography>
                                                            <Typography variant="h6" sx={{
                                                                fontWeight: 700,
                                                                color: totalQuantity === 0 ? '#d32f2f' : totalQuantity < 10 ? '#f57c00' : '#1f8a5b'
                                                            }}>
                                                                {totalQuantity} units
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="caption" color="textSecondary">Batches</Typography>
                                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39' }}>
                                                                {product.batches.length}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Box>

                                                {/* Pricing Info */}
                                                <Box sx={{ mb: 1.5 }}>
                                                    <Stack spacing={0.5} sx={{ fontSize: '13px' }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <Typography variant="caption" color="textSecondary">MRP:</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>₹{maxMrp.toFixed(2)}</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <Typography variant="caption" color="textSecondary">Selling:</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>₹{maxSelling.toFixed(2)}</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <Typography variant="caption" color="textSecondary">Cost:</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>₹{maxCost.toFixed(2)}</Typography>
                                                        </Box>
                                                        <Divider sx={{ my: 0.5 }} />
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'rgba(31, 138, 91, 0.1)', p: 1, borderRadius: 1 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>Margin:</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f8a5b' }}>{margin}%</Typography>
                                                        </Box>
                                                    </Stack>
                                                </Box>

                                                {/* Category */}
                                                {product.category && (
                                                    <Chip
                                                        label={product.category}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ mt: 1 }}
                                                    />
                                                )}
                                            </CardContent>

                                            <CardActions sx={{ pt: 0 }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<EditIcon fontSize="small" />}
                                                    onClick={() => handleEditProduct(product)}
                                                    sx={{ flex: 1 }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    startIcon={<DeleteIcon fontSize="small" />}
                                                    onClick={() => handleDeleteProduct(product)}
                                                >
                                                    Delete
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Box>
            </Box>

            {/* Edit Product Dialog */}
            {editOpen && currentProduct && (
                <EditProductDialog
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    product={currentProduct}
                    onProductUpdated={handleProductUpdated}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onKeyDown={(event) => {
                    if (event.defaultPrevented) return;
                    if (event.key !== 'Enter') return;
                    if (event.shiftKey) return;
                    if (event.target?.tagName === 'TEXTAREA') return;
                    event.preventDefault();
                    confirmDelete();
                }}
            >
                <DialogTitle>Delete Product</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
});

InventoryTree.displayName = 'InventoryTree';
export default InventoryTree;
