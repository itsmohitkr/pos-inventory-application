import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, TextField, Box, InputAdornment, IconButton,
    Chip, Button, List, ListItemButton, ListItemIcon, ListItemText, Divider,
    TableSortLabel, Dialog, DialogTitle, DialogContent, DialogActions,
    Menu, MenuItem, Collapse, LinearProgress, TablePagination
} from '@mui/material';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Folder as FolderIcon,
    FolderOpen as FolderOpenIcon,
    SortByAlpha as SortByAlphaIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    History as HistoryIcon
} from '@mui/icons-material';

import EditProductDialog from './EditProductDialog';
import EditBatchDialog from './EditBatchDialog';
import AddStockDialog from './AddStockDialog';
import ProductHistoryDialog from './ProductHistoryDialog';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../hooks/useCustomDialog';

// Helper to render barcodes as chips
const renderBarcodeChips = (barcode, size = 'small') => {
    if (!barcode) return <Typography variant="body2" color="text.secondary">—</Typography>;
    
    const barcodes = barcode.split('|').map(b => b.trim()).filter(Boolean);
    if (barcodes.length === 0) return <Typography variant="body2" color="text.secondary">—</Typography>;
    
    return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {barcodes.map((bc, idx) => (
                <Chip
                    key={idx}
                    label={bc}
                    size={size}
                    variant="outlined"
                    sx={{
                        fontFamily: 'monospace',
                        fontSize: size === 'small' ? '0.75rem' : '0.875rem'
                    }}
                />
            ))}
        </Box>
    );
};

const ProductList = () => {
    const { dialogState, showError, showConfirm, closeDialog } = useCustomDialog();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [editOpen, setEditOpen] = useState(false);
    const [batchEditOpen, setBatchEditOpen] = useState(false);
    const [addStockOpen, setAddStockOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedProductDetails, setSelectedProductDetails] = useState(null);
    const [selectedProductRefresh, setSelectedProductRefresh] = useState(0);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyRange, setHistoryRange] = useState('today');
    const [historyData, setHistoryData] = useState(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [currentBatch, setCurrentBatch] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [totalProducts, setTotalProducts] = useState(0);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(280);
    const [rightPanelWidth, setRightPanelWidth] = useState(360);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const [categorySortOrder, setCategorySortOrder] = useState('asc');
    const [categories, setCategories] = useState([]);
    const [summaryTotals, setSummaryTotals] = useState({
        productCount: 0,
        totalQty: 0,
        totalCost: 0,
        totalSelling: 0
    });
    const [categoryCounts, setCategoryCounts] = useState({});
    const [uncategorizedCount, setUncategorizedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [expandedCategoryIds, setExpandedCategoryIds] = useState({});
    const [contextMenu, setContextMenu] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryDialogMode, setCategoryDialogMode] = useState('add');
    const [categoryDialogParent, setCategoryDialogParent] = useState(null);
    const [categoryDialogTarget, setCategoryDialogTarget] = useState(null);
    const productsRequestId = useRef(0);
    const summaryRequestId = useRef(0);

    const fetchProducts = async () => {
        const requestId = ++productsRequestId.current;
        setIsLoadingProducts(true);
        try {
            const resProd = await axios.get('/api/products', {
                params: {
                    page: page + 1,
                    pageSize,
                    search: debouncedSearch,
                    category: categoryFilter,
                    sortBy,
                    sortOrder
                }
            });
            const data = resProd.data.data || [];
            if (productsRequestId.current !== requestId) return;
            setProducts(data);
            setTotalProducts(resProd.data.pagination?.total || 0);
            if (selectedProduct) {
                const updatedSelected = data.find(item => String(item.id) === String(selectedProduct.id));
                setSelectedProduct(updatedSelected || null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            if (productsRequestId.current === requestId) {
                setIsLoadingProducts(false);
            }
        }
    };

    const fetchSummary = async () => {
        const requestId = ++summaryRequestId.current;
        try {
            const [totalsRes, sidebarRes] = await Promise.all([
                axios.get('/api/products/summary', {
                    params: {
                        search: debouncedSearch,
                        category: categoryFilter
                    }
                }),
                axios.get('/api/products/summary', {
                    params: {
                        search: debouncedSearch,
                        category: 'all'
                    }
                })
            ]);

            const totalsData = totalsRes.data.data || {};
            if (summaryRequestId.current !== requestId) return;
            setSummaryTotals(totalsData.totals || { productCount: 0, totalQty: 0, totalCost: 0, totalSelling: 0 });

            const sidebarData = sidebarRes.data.data || {};
            setCategoryCounts(sidebarData.categoryCounts || {});
            setUncategorizedCount(sidebarData.uncategorizedCount || 0);
            setTotalCount(sidebarData.totalCount || 0);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, 300);
        return () => clearTimeout(handle);
    }, [searchTerm]);

    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, categoryFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchProducts();
    }, [debouncedSearch, categoryFilter, sortBy, sortOrder, page, pageSize]);

    useEffect(() => {
        fetchSummary();
    }, [debouncedSearch, categoryFilter]);

    useEffect(() => {
        const handleMouseMove = (event) => {
            if (isResizingLeft) {
                const nextWidth = Math.max(220, Math.min(420, event.clientX - 40));
                setLeftPanelWidth(nextWidth);
            }
            if (isResizingRight) {
                const nextWidth = Math.max(280, Math.min(520, window.innerWidth - event.clientX - 40));
                setRightPanelWidth(nextWidth);
            }
        };
        const handleMouseUp = () => {
            setIsResizingLeft(false);
            setIsResizingRight(false);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingLeft, isResizingRight]);

    useEffect(() => {
        if (!selectedProduct?.id) {
            setSelectedProductDetails(null);
            return;
        }

        const fetchSelectedDetails = async () => {
            setIsLoadingBatches(true);
            try {
                const res = await axios.get(`/api/products/id/${selectedProduct.id}`);
                setSelectedProductDetails(res.data.data || null);
            } catch (error) {
                console.error(error);
                setSelectedProductDetails(null);
            } finally {
                setIsLoadingBatches(false);
            }
        };

        fetchSelectedDetails();
    }, [selectedProduct?.id, selectedProductRefresh]);

    useEffect(() => {
        if (!historyOpen || !selectedProduct?.id) return;
        const fetchHistory = async () => {
            setIsHistoryLoading(true);
            try {
                const res = await axios.get(`/api/products/${selectedProduct.id}/history`, {
                    params: { range: historyRange }
                });
                setHistoryData(res.data.data || null);
            } catch (error) {
                console.error(error);
                setHistoryData(null);
            } finally {
                setIsHistoryLoading(false);
            }
        };
        fetchHistory();
    }, [historyOpen, historyRange, selectedProduct?.id]);

    const handleDelete = async (id) => {
        const confirmed = await showConfirm('Are you sure you want to delete this product? This will delete all associated batches.');
        if (confirmed) {
            try {
                await axios.delete(`/api/products/${id}`);
                fetchProducts();
                fetchSummary();
            } catch (error) {
                console.error(error);
                showError('Failed to delete product: ' + (error.response?.data?.error || error.message));
            }
        }
    };

    const handleEditClick = (product) => {
        setCurrentProduct(product);
        setEditOpen(true);
    };

    const handleBatchEditClick = (batch) => {
        setCurrentBatch({
            ...batch,
            expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : ''
        });
        setBatchEditOpen(true);
    };

    const toTitleCase = (str) => {
        if (!str) return str;
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleEditSave = async () => {
        try {
            await axios.put(`/api/products/${currentProduct.id}`, {
                name: toTitleCase(currentProduct.name),
                barcode: currentProduct.barcode,
                category: currentProduct.category,
                batchTrackingEnabled: currentProduct.batchTrackingEnabled
            });
            setEditOpen(false);
            fetchProducts();
            fetchSummary();
            // Refresh the selected product details on the right side
            setSelectedProductRefresh(prev => prev + 1);
        } catch (error) {
            console.error(error);
            showError('Failed to update product: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleBatchEditSave = async () => {
        try {
            await axios.put(`/api/batches/${currentBatch.id}`, {
                batchCode: currentBatch.batchCode,
                quantity: currentBatch.quantity,
                mrp: currentBatch.mrp,
                costPrice: currentBatch.costPrice,
                sellingPrice: currentBatch.sellingPrice,
                expiryDate: currentBatch.expiryDate
            });
            setBatchEditOpen(false);
            fetchProducts();
            fetchSummary();
            setSelectedProductRefresh((value) => value + 1);
        } catch (error) {
            console.error(error);
            showError('Failed to update batch: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleBatchDelete = async (batchId) => {
        const confirmed = await showConfirm('Are you sure you want to delete this batch? This action cannot be undone.');
        if (!confirmed) {
            return;
        }
        try {
            await axios.delete(`/api/batches/${batchId}`);
            fetchProducts();
            fetchSummary();
            setSelectedProductRefresh((value) => value + 1);
        } catch (error) {
            console.error(error);
            showError('Failed to delete batch: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleAddStock = (product) => {
        setCurrentProduct(product);
        setAddStockOpen(true);
    };

    const handleStockAdded = () => {
        fetchProducts();
        fetchSummary();
        setSelectedProductRefresh((value) => value + 1);
    };

    const handleOpenHistory = () => {
        if (!selectedProduct?.id) return;
        setHistoryOpen(true);
    };

    const handleCloseHistory = () => {
        setHistoryOpen(false);
    };

    const hasUncategorized = uncategorizedCount > 0;
    const averageMargin = useMemo(() => {
        if (summaryTotals.totalSelling > 0) {
            return (((summaryTotals.totalSelling - summaryTotals.totalCost) / summaryTotals.totalSelling) * 100).toFixed(1);
        }
        return '0.0';
    }, [summaryTotals.totalCost, summaryTotals.totalSelling]);
    const categoryLabel = categoryFilter === 'all'
        ? 'All Categories'
        : categoryFilter === 'uncategorized'
            ? 'Uncategorized'
            : categoryFilter;
    const displayProduct = selectedProductDetails || selectedProduct;
    const handleSortRequest = (field) => {
        setSortOrder(prevOrder => (sortBy === field ? (prevOrder === 'asc' ? 'desc' : 'asc') : 'asc'));
        setSortBy(field);
    };
    const handleToggleExpand = (id) => {
        setExpandedCategoryIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
    const openCategoryMenu = (event, category) => {
        event.preventDefault();
        setActiveCategory(category);
        setContextMenu(
            contextMenu
                ? null
                : {
                    mouseX: event.clientX - 2,
                    mouseY: event.clientY - 4
                }
        );
    };
    const closeCategoryMenu = () => {
        setContextMenu(null);
    };
    const openAddCategoryDialog = (parent) => {
        setCategoryDialogMode('add');
        setCategoryDialogParent(parent);
        setCategoryDialogTarget(null);
        setNewCategoryName('');
        setAddCategoryOpen(true);
    };
    const openEditCategoryDialog = (category) => {
        setCategoryDialogMode('edit');
        setCategoryDialogParent(null);
        setCategoryDialogTarget(category);
        setNewCategoryName(category?.name || '');
        setAddCategoryOpen(true);
    };
    const handleSaveCategory = async () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        if (trimmed.includes('/')) {
            showError('Category name cannot include "/"');
            return;
        }
        try {
            if (categoryDialogMode === 'add') {
                await axios.post('/api/categories', {
                    name: trimmed,
                    parentId: categoryDialogParent?.id || null
                });
            } else if (categoryDialogTarget) {
                await axios.put(`/api/categories/${categoryDialogTarget.id}`, {
                    name: trimmed
                });
            }
            setAddCategoryOpen(false);
            setNewCategoryName('');
            fetchCategories();
        } catch (error) {
            console.error(error);
            showError('Failed to save category: ' + (error.response?.data?.error || error.message));
        }
    };
    const handleDeleteCategory = async (category) => {
        if (!category) return;
        const confirmed = await showConfirm(`Delete category "${category.name}" and all subcategories?`);
        if (!confirmed) return;
        try {
            await axios.delete(`/api/categories/${category.id}`);
            if (categoryFilter === category.path || categoryFilter.startsWith(`${category.path}/`)) {
                setCategoryFilter('all');
            }
            fetchCategories();
            fetchProducts();
            fetchSummary();
        } catch (error) {
            console.error(error);
            showError('Failed to delete category: ' + (error.response?.data?.error || error.message));
        }
    };
    const handleCategoryDrop = async (event, targetCategory) => {
        event.preventDefault();
        const productId = event.dataTransfer.getData('text/plain');
        if (!productId) return;
        const product = products.find(item => String(item.id) === String(productId));
        if (!product) return;
        const nextCategory = targetCategory === 'uncategorized' ? null : targetCategory;
        if ((product.category || null) === nextCategory) return;
        try {
            await axios.put(`/api/products/${product.id}`, {
                name: toTitleCase(product.name),
                barcode: product.barcode,
                category: nextCategory,
                batchTrackingEnabled: product.batchTrackingEnabled
            });
            fetchProducts();
            fetchSummary();
        } catch (error) {
            console.error(error);
            showError('Failed to move product: ' + (error.response?.data?.error || error.message));
        }
    };
    const handleCategoryDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };
    const sortCategoryTree = (nodes) => {
        const sorted = [...nodes].sort((a, b) =>
            categorySortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );
        return sorted.map(node => ({
            ...node,
            children: node.children ? sortCategoryTree(node.children) : []
        }));
    };
    const sortedCategoryTree = sortCategoryTree(categories);

    const renderCategoryNode = (node, depth = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedCategoryIds[node.id];
        const isSelected = categoryFilter === node.path;

        return (
            <Box key={node.id}>
                <ListItemButton
                    selected={isSelected}
                    onClick={() => {
                        setCategoryFilter(node.path);
                        setSelectedProduct(null);
                    }}
                    onContextMenu={(event) => openCategoryMenu(event, node)}
                    onDragOver={handleCategoryDragOver}
                    onDrop={(event) => handleCategoryDrop(event, node.path)}
                    sx={{ borderRadius: 1.5, mb: 0.5, pl: 2 + depth * 2 }}
                >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                        {isSelected ? (
                            <FolderOpenIcon fontSize="small" color="primary" />
                        ) : (
                            <FolderIcon fontSize="small" color="action" />
                        )}
                    </ListItemIcon>
                    <ListItemText
                        primary={node.name}
                        secondary={`${categoryCounts[node.path] || 0} items`}
                    />
                    {hasChildren && (
                        <IconButton
                            size="small"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleToggleExpand(node.id);
                            }}
                        >
                            {isExpanded ? (
                                <ExpandLessIcon fontSize="small" />
                            ) : (
                                <ExpandMoreIcon fontSize="small" />
                            )}
                        </IconButton>
                    )}
                </ListItemButton>
                {hasChildren && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List disablePadding>
                            {node.children.map((child) => renderCategoryNode(child, depth + 1))}
                        </List>
                    </Collapse>
                )}
            </Box>
        );
    };

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    lg: `${leftPanelWidth}px 1.2fr ${rightPanelWidth}px`
                },
                gap: 3,
                height: 'calc(100vh - 200px)',
                minHeight: 480,
                alignItems: 'stretch'
            }}
        >
            {/* Category List */}
            <Paper
                elevation={0}
                onDoubleClick={displayProduct ? handleOpenHistory : undefined}
                sx={{ p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Categories</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                            size="small"
                            onClick={() => setCategorySortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                            title={`Sort ${categorySortOrder === 'asc' ? 'A-Z' : 'Z-A'}`}
                        >
                            <SortByAlphaIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => openAddCategoryDialog(null)}
                            title="Add category"
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                <List disablePadding sx={{ overflow: 'auto', flex: 1 }}>
                    <ListItemButton
                        selected={categoryFilter === 'all'}
                        onClick={() => {
                            setCategoryFilter('all');
                            setSelectedProduct(null);
                        }}
                        sx={{ borderRadius: 1.5, mb: 0.5 }}
                    >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            {categoryFilter === 'all' ? (
                                <FolderOpenIcon fontSize="small" color="primary" />
                            ) : (
                                <FolderIcon fontSize="small" color="action" />
                            )}
                        </ListItemIcon>
                        <ListItemText primary="All Categories" secondary={`${totalCount} items`} />
                    </ListItemButton>
                    {hasUncategorized && (
                        <ListItemButton
                            selected={categoryFilter === 'uncategorized'}
                            onClick={() => {
                                setCategoryFilter('uncategorized');
                                setSelectedProduct(null);
                            }}
                            onDragOver={handleCategoryDragOver}
                            onDrop={(event) => handleCategoryDrop(event, 'uncategorized')}
                            sx={{ borderRadius: 1.5, mb: 0.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                {categoryFilter === 'uncategorized' ? (
                                    <FolderOpenIcon fontSize="small" color="primary" />
                                ) : (
                                    <FolderIcon fontSize="small" color="action" />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary="Uncategorized"
                                secondary={`${uncategorizedCount} items`}
                            />
                        </ListItemButton>
                    )}
                    {sortedCategoryTree.map((category) => renderCategoryNode(category))}
                </List>
                <Box
                    role="separator"
                    aria-orientation="vertical"
                    onMouseDown={() => setIsResizingLeft(true)}
                    sx={{
                        display: { xs: 'none', lg: 'block' },
                        position: 'absolute',
                        top: 0,
                        right: -6,
                        width: 12,
                        height: '100%',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent'
                    }}
                />
            </Paper>

            <Menu
                open={Boolean(contextMenu)}
                onClose={closeCategoryMenu}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem
                    onClick={() => {
                        closeCategoryMenu();
                        if (activeCategory) {
                            openAddCategoryDialog(activeCategory);
                        }
                    }}
                >
                    Add subcategory
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        closeCategoryMenu();
                        if (activeCategory) {
                            openEditCategoryDialog(activeCategory);
                        }
                    }}
                >
                    Edit category
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        closeCategoryMenu();
                        if (activeCategory) {
                            handleDeleteCategory(activeCategory);
                        }
                    }}
                >
                    Delete category
                </MenuItem>
            </Menu>
            {/* Left Side: Product List */}
            <Paper elevation={0} sx={{ p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h2">Products</Typography>
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Search name or barcode..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 320 }}
                    />
                </Box>
                
                {/* Category Summary */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip label={categoryLabel} size="small" color="primary" variant="outlined" />
                        <Chip label={`Products: ${summaryTotals.productCount}`} size="small" color="info" variant="outlined" />
                        <Chip label={`Total Stock: ${summaryTotals.totalQty}`} size="small" color="warning" variant="outlined" />
                        <Chip label={`Cost: ₹${summaryTotals.totalCost.toFixed(2)}`} size="small" color="error" variant="outlined" />
                        <Chip label={`Selling: ₹${summaryTotals.totalSelling.toFixed(2)}`} size="small" color="success" variant="outlined" />
                        <Chip label={`Avg Margin: ${averageMargin}%`} size="small" color="secondary" variant="outlined" />
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                                setCategoryFilter('all');
                                setSortBy('name');
                                setSortOrder('asc');
                                setSearchTerm('');
                            }}
                        >
                            Reset
                        </Button>
                    </Box>
                    {searchTerm && (
                        <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                label={`Search: "${searchTerm}"`}
                                onDelete={() => setSearchTerm('')}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                    )}
                </Box>
                {isLoadingProducts && <LinearProgress sx={{ mb: 1 }} />}
                <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'background.default' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    <TableSortLabel
                                        active={sortBy === 'name'}
                                        direction={sortBy === 'name' ? sortOrder : 'asc'}
                                        onClick={() => handleSortRequest('name')}
                                    >
                                        Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    <TableSortLabel
                                        active={sortBy === 'barcode'}
                                        direction={sortBy === 'barcode' ? sortOrder : 'asc'}
                                        onClick={() => handleSortRequest('barcode')}
                                    >
                                        Barcode
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    <TableSortLabel
                                        active={sortBy === 'stock'}
                                        direction={sortBy === 'stock' ? sortOrder : 'asc'}
                                        onClick={() => handleSortRequest('stock')}
                                    >
                                        Stock
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow
                                    key={product.id}
                                    hover
                                    onClick={() => setSelectedProduct(product)}
                                    draggable
                                    onDragStart={(event) => event.dataTransfer.setData('text/plain', product.id)}
                                    sx={{
                                        cursor: 'pointer',
                                        bgcolor: selectedProduct?.id === product.id ? 'rgba(11, 29, 57, 0.08)' : 'transparent'
                                    }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">{product.name}</Typography>
                                                <Typography 
                                                    variant="caption" 
                                                    color="text.secondary"
                                                >
                                                    {product.category || 'Uncategorized'}
                                                </Typography>
                                            </Box>
                                            {product.batchTrackingEnabled && (
                                                <Chip label="Batch" size="small" variant="filled" sx={{ height: '20px' }} />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {renderBarcodeChips(product.barcode, 'small')}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold">{product.total_stock}</Typography>
                                    </TableCell>
                                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                        <IconButton size="small" color="primary" onClick={() => handleAddStock(product)}>
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="primary" onClick={() => handleEditClick(product)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(product.id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={totalProducts}
                    page={page}
                    onPageChange={(_, nextPage) => setPage(nextPage)}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={(event) => {
                        setPageSize(parseInt(event.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[25, 50, 100]}
                />
            </Paper>

            {/* Right Side: Batch Details */}
            <Paper elevation={0} sx={{ p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <Box
                    role="separator"
                    aria-orientation="vertical"
                    onMouseDown={() => setIsResizingRight(true)}
                    sx={{
                        display: { xs: 'none', lg: 'block' },
                        position: 'absolute',
                        top: 0,
                        left: -6,
                        width: 12,
                        height: '100%',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent'
                    }}
                />
                {displayProduct ? (
                    <>
                        <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(16, 24, 40, 0.08)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="h5" component="h2">{displayProduct.name}</Typography>
                                    {displayProduct.batchTrackingEnabled && (
                                        <Chip label="Batch Tracking Enabled" size="small" color="primary" variant="filled" />
                                    )}
                                </Box>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<HistoryIcon />}
                                    onClick={handleOpenHistory}
                                >
                                    History
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Barcode</Typography>
                                    {renderBarcodeChips(displayProduct.barcode, 'medium')}
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Category</Typography>
                                    <Typography variant="body2" fontWeight="bold">{displayProduct.category || 'N/A'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Total Stock</Typography>
                                    <Typography variant="body2" fontWeight="bold">{displayProduct.total_stock}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Batch Tracking</Typography>
                                    <Typography variant="body2" fontWeight="bold">{displayProduct.batchTrackingEnabled ? 'Enabled' : 'Disabled'}</Typography>
                                </Box>
                            </Box>
                        </Box>
                        {isLoadingBatches ? (
                            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                                <Typography variant="body2">Loading batches...</Typography>
                            </Box>
                        ) : displayProduct.batches && displayProduct.batches.length > 0 ? (
                            <Box sx={{ flex: 1, overflow: 'auto' }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Stock Lots / Batches</Typography>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'background.default' }}>
                                            {displayProduct.batchTrackingEnabled && <TableCell sx={{ fontWeight: 'bold' }}>Batch Code</TableCell>}
                                            <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>MRP</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Selling</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Margin</TableCell>
                                            {displayProduct.batchTrackingEnabled && <TableCell align="right" sx={{ fontWeight: 'bold' }}>Expiry</TableCell>}
                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {displayProduct.batches.map((batch) => {
                                            const margin = batch.sellingPrice > 0
                                                ? (((batch.sellingPrice - batch.costPrice) / batch.sellingPrice) * 100).toFixed(1)
                                                : 0;
                                            return (
                                                <TableRow key={batch.id}>
                                                    {displayProduct.batchTrackingEnabled && <TableCell>{batch.batchCode || 'N/A'}</TableCell>}
                                                    <TableCell>{batch.quantity}</TableCell>
                                                    <TableCell align="right">₹{batch.mrp}</TableCell>
                                                    <TableCell align="right">₹{batch.costPrice}</TableCell>
                                                    <TableCell align="right">₹{batch.sellingPrice}</TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{
                                                            color: margin > 20 ? 'success.main' : margin > 10 ? 'warning.main' : 'error.main',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {margin}%
                                                        </Box>
                                                    </TableCell>
                                                    {displayProduct.batchTrackingEnabled && (
                                                        <TableCell align="right">
                                                            {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                                                        </TableCell>
                                                    )}
                                                    <TableCell align="center">
                                                        <IconButton size="small" color="primary" onClick={() => handleBatchEditClick(batch)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => handleBatchDelete(batch.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Box>
                        ) : (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">No stock available</Typography>
                            </Box>
                        )}
                    </>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>Select a product</Typography>
                            <Typography variant="body2" color="text.secondary">Click on any product from the list to view details</Typography>
                        </Box>
                    </Box>
                )}
            </Paper>

            <Dialog open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)}>
                <DialogTitle>{categoryDialogMode === 'edit' ? 'Edit Category' : 'Add Category'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Category name"
                        fullWidth
                        value={newCategoryName}
                        onChange={(event) => setNewCategoryName(event.target.value)}
                        helperText={categoryDialogMode === 'add' && categoryDialogParent ? `Parent: ${categoryDialogParent.name}` : 'The / character is reserved for nesting'}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddCategoryOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveCategory}>
                        {categoryDialogMode === 'edit' ? 'Save' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ProductHistoryDialog
                open={historyOpen}
                onClose={handleCloseHistory}
                product={displayProduct}
                history={historyData}
                loading={isHistoryLoading}
                range={historyRange}
                onRangeChange={setHistoryRange}
            />

            <EditProductDialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                product={currentProduct}
                onProductChange={setCurrentProduct}
                onSave={handleEditSave}
            />

            <EditBatchDialog
                open={batchEditOpen}
                onClose={() => setBatchEditOpen(false)}
                batch={currentBatch}
                onBatchChange={setCurrentBatch}
                onSave={handleBatchEditSave}
            />

            <AddStockDialog
                open={addStockOpen}
                onClose={() => setAddStockOpen(false)}
                product={currentProduct}
                onStockAdded={handleStockAdded}
            />
            
            <CustomDialog {...dialogState} onClose={closeDialog} />
        </Box>
    );
};
export default ProductList;
