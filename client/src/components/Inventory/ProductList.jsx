import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, TextField, Box, InputAdornment, IconButton,
    Chip, Button, ToggleButton, ToggleButtonGroup, List, ListItemButton, ListItemIcon, ListItemText, Divider,
    TableSortLabel, Dialog, DialogTitle, DialogContent, DialogActions,
    Menu, MenuItem, Collapse, Tooltip
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
    History as HistoryIcon,
    Inventory2 as InventoryIcon,
    Print as PrintIcon,
    Circle as CircleIcon,
    FilterList as FilterListIcon,
    Clear as ClearIcon
} from '@mui/icons-material';

import EditProductDialog from './EditProductDialog';
import EditBatchDialog from './EditBatchDialog';
import AddStockDialog from './AddStockDialog';
import ProductHistoryDialog from './ProductHistoryDialog';
import QuickInventoryDialog from './QuickInventoryDialog';
import BarcodePrintDialog from './BarcodePrintDialog';
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
    const [filteredProducts, setFilteredProducts] = useState(null); // null = show all
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
    const [quickInventoryBatch, setQuickInventoryBatch] = useState(null);
    const [quickInventoryOpen, setQuickInventoryOpen] = useState(false);
    const [barcodePrintOpen, setBarcodePrintOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    // Pagination removed
    // Loader removed
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
        return Number(localStorage.getItem('inventoryLeftPanelWidth')) || 280;
    });
    const [rightPanelWidth, setRightPanelWidth] = useState(() => {
        return Number(localStorage.getItem('inventoryRightPanelWidth')) || 360;
    });
    const [showCategories, setShowCategories] = useState(true);
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
    const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'zero'
    const productsRequestId = useRef(0);
    const summaryRequestId = useRef(0);
    const searchInputRef = useRef(null);
    const searchTimerRef = useRef(null);

    const fetchProducts = React.useCallback(async () => {
        const requestId = ++productsRequestId.current;
        try {
            // Fetch everything for the current category once, then filter locally
            // This matches the high-performance behavior of the POS screen
            const resProd = await api.get('/api/products', {
                params: {
                    category: categoryFilter,
                    sortBy,
                    sortOrder,
                    pageSize: 10000 // Ensure we get the full list for local filtering
                }
            });
            const data = resProd.data.data || [];
            if (productsRequestId.current !== requestId) return;
            setProducts(data);

            // Sync selected product if it exists
            if (selectedProduct) {
                const refreshed = data.find(p => String(p.id) === String(selectedProduct.id));
                if (refreshed) setSelectedProduct(refreshed);
            }
        } catch (error) {
            console.error(error);
        }
    }, [categoryFilter, sortBy, sortOrder]);

    const fetchSummary = React.useCallback(async () => {
        const requestId = ++summaryRequestId.current;
        try {
            const [totalsRes, sidebarRes] = await Promise.all([
                api.get('/api/products/summary', {
                    params: {
                        search: debouncedSearch,
                        category: categoryFilter
                    }
                }),
                api.get('/api/products/summary', {
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
    }, [debouncedSearch, categoryFilter]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/api/categories');
            setCategories(res.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCategories();
        // Explicit focus on mount
        setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, 100);
    }, []);

    // Live search debouncing is handled directly in the TextField's onChange 
    // to avoid full component re-renders while typing.

    // Pagination removed

    useEffect(() => {
        fetchProducts();
    }, [categoryFilter, sortBy, sortOrder, fetchProducts]);

    useEffect(() => {
        fetchSummary();
    }, [debouncedSearch, categoryFilter, fetchSummary]);

    useEffect(() => {
        const handleMouseMove = (event) => {
            if (isResizingLeft) {
                const nextWidth = Math.max(80, Math.min(window.innerWidth * 0.4, event.clientX - 40));
                setLeftPanelWidth(nextWidth);
                localStorage.setItem('inventoryLeftPanelWidth', nextWidth.toString());
            }
            if (isResizingRight) {
                const nextWidth = Math.max(100, Math.min(window.innerWidth * 0.5, window.innerWidth - event.clientX - 40));
                setRightPanelWidth(nextWidth);
                localStorage.setItem('inventoryRightPanelWidth', nextWidth.toString());
            }
        };
        const handleMouseUp = () => {
            setIsResizingLeft(false);
            setIsResizingRight(false);
            document.body.style.cursor = 'default';
        };
        if (isResizingLeft || isResizingRight) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
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
                const res = await api.get(`/api/products/id/${selectedProduct.id}`);
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
                const res = await api.get(`/api/products/${selectedProduct.id}/history`, {
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

    // Filter products based on stock status
    // Filter products based on search term and stock status locally for instant reflection
    const displayedProducts = useMemo(() => {
        let filtered = products;

        // Local Search filtering
        if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.barcode && p.barcode.split('|').some(b => b.trim().includes(query)))
            );
        }

        if (stockFilter === 'low') {
            filtered = filtered.filter(p =>
                p.lowStockWarningEnabled &&
                p.total_stock > 0 &&
                p.total_stock <= p.lowStockThreshold
            );
        } else if (stockFilter === 'zero') {
            filtered = filtered.filter(p => p.total_stock === 0);
        }

        // Limit to 250 for performance during active search/filtering
        return filtered.slice(0, 250);
    }, [products, debouncedSearch, stockFilter]);

    const clearSearch = React.useCallback(() => {
        if (searchInputRef.current) searchInputRef.current.value = '';
        setSearchTerm('');
        setDebouncedSearch('');
        setFilteredProducts(null);
    }, []);

    const getStockStatus = (product) => {
        if (product.total_stock === 0) return 'zero';
        if (product.lowStockWarningEnabled && product.total_stock <= product.lowStockThreshold) return 'low';
        return 'sufficient';
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm('Deleting this product will also delete all associated batches and related data. This action cannot be undone. Are you sure you want to continue?');
        if (confirmed) {
            try {
                await api.delete(`/api/products/${id}`);
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
        // This handler is called by EditProductDialog's onProductUpdated callback
        fetchProducts();
        fetchSummary();
        setSelectedProductRefresh(prev => prev + 1);
        setEditOpen(false);
    };

    const handleBatchEditSave = async () => {
        // This handler is called by EditBatchDialog's onBatchUpdated callback
        fetchProducts();
        fetchSummary();
        setSelectedProductRefresh((value) => value + 1);
        setBatchEditOpen(false);
    };

    const handleBatchDelete = async (batchId) => {
        const confirmed = await showConfirm('Are you sure you want to delete this batch? This action cannot be undone.');
        if (!confirmed) {
            return;
        }
        try {
            await api.delete(`/api/batches/${batchId}`);
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

    const handleQuickInventoryOpen = (batch) => {
        setQuickInventoryBatch(batch);
        setQuickInventoryOpen(true);
    };

    const handleQuickInventoryClose = () => {
        setQuickInventoryOpen(false);
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
                await api.post('/api/categories', {
                    name: trimmed,
                    parentId: categoryDialogParent?.id || null
                });
            } else if (categoryDialogTarget) {
                await api.put(`/api/categories/${categoryDialogTarget.id}`, {
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
            await api.delete(`/api/categories/${category.id}`);
            if (categoryFilter === category.path || categoryFilter.startsWith(`${category.path}/`)) {
                setCategoryFilter('all');
                setSelectedProduct(null);
                setSelectedProductDetails(null);
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
            await api.put(`/api/products/${product.id}`, {
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
                        setSelectedProductDetails(null);
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
                    lg: showCategories
                        ? (displayProduct ? `${leftPanelWidth}px 1fr ${rightPanelWidth}px` : `${leftPanelWidth}px 1fr`)
                        : (displayProduct ? `1fr ${rightPanelWidth}px` : '1fr')
                },
                gap: 1.5,
                height: '100%',
                minHeight: 0,
                alignItems: 'stretch'
            }}
        >
            {/* Category List */}
            {showCategories && (
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
                                setSelectedProductDetails(null);
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
                                    setSelectedProductDetails(null);
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
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizingLeft(true);
                        }}
                        sx={{
                            display: { xs: 'none', lg: 'flex' },
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '8px',
                            height: '100%',
                            cursor: 'col-resize',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover .handle': {
                                bgcolor: 'primary.main',
                                width: '4px'
                            },
                            zIndex: 10
                        }}
                    >
                        <Box
                            className="handle"
                            sx={{
                                width: '2px',
                                height: '60px',
                                bgcolor: isResizingLeft ? 'primary.main' : 'divider',
                                borderRadius: '4px',
                                transition: 'all 0.2s',
                                ...(isResizingLeft && { width: '4px' })
                            }}
                        />
                    </Box>
                </Paper>
            )}

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
            <Paper elevation={0} sx={{ p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Redesigned Product Card Header for Flexibility */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Products</Typography>
                            <Chip
                                label={categoryLabel}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(31, 41, 55, 0.15)',
                                    color: '#1f2937',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    height: '22px'
                                }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            {searchTerm && (
                                <Chip
                                    label={`Search: "${searchTerm}"`}
                                    onDelete={clearSearch}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(31, 41, 55, 0.15)',
                                        color: '#1f2937',
                                        fontSize: '0.7rem',
                                        height: '24px',
                                        '& .MuiChip-deleteIcon': {
                                            color: 'rgba(31, 41, 55, 0.7)',
                                            fontSize: '1rem',
                                            '&:hover': {
                                                color: '#1f2937'
                                            }
                                        }
                                    }}
                                />
                            )}
                            <TextField
                                autoFocus
                                variant="outlined"
                                size="small"
                                placeholder="Search name or barcode..."
                                inputRef={searchInputRef}
                                defaultValue={searchTerm}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                                    searchTimerRef.current = setTimeout(() => {
                                        setDebouncedSearch(val.trim());
                                    }, 400);
                                }}
                                onKeyDown={async e => {
                                    if (e.key === 'Enter') {
                                        const val = e.target.value.trim();
                                        setSearchTerm(val);
                                        if (!val) return;
                                        const barcode = val;
                                        // Priority 1: Check existing products in memory (fastest)
                                        let found = products.find(p =>
                                            p.barcode && p.barcode.split('|').some(b => b.trim() === barcode)
                                        );

                                        if (!found) {
                                            try {
                                                // Priority 2: Fetch from server if not in current page memory
                                                const res = await api.get(`/api/products/${barcode}`);
                                                if (res.data && res.data.product) {
                                                    found = res.data.product;
                                                    if (res.data.batches) {
                                                        found.total_stock = res.data.batches.reduce((sum, b) => sum + b.quantity, 0);
                                                    }
                                                }
                                            } catch (error) {
                                                console.error('Barcode fetch error:', error);
                                            }
                                        }

                                        if (found) {
                                            setSelectedProduct(found);
                                            setFilteredProducts([found]);
                                        } else {
                                            setFilteredProducts(null);
                                            showError(`No product found for barcode: ${barcode}`);
                                        }
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'rgba(31, 41, 55, 0.6)', fontSize: '1.1rem' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (debouncedSearch || searchTerm) && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={clearSearch}
                                                edge="end"
                                            >
                                                <ClearIcon sx={{ fontSize: '1rem' }} />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    width: { xs: '100%', sm: 220, md: 260, lg: 280 },
                                    maxWidth: 320,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#1f2937',
                                        fontSize: '0.85rem',
                                        bgcolor: 'rgba(255, 255, 255, 0.5)',
                                        '& fieldset': {
                                            borderColor: 'rgba(31, 41, 55, 0.3)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(31, 41, 55, 0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#d97706',
                                        },
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        padding: '7px 10px',
                                        '&::placeholder': {
                                            color: 'rgba(31, 41, 55, 0.5)',
                                            opacity: 1,
                                        }
                                    }
                                }}
                            />
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setShowCategories(prev => !prev)}
                                sx={{
                                    color: '#1f2937',
                                    borderColor: 'rgba(31, 41, 55, 0.4)',
                                    fontSize: '0.75rem',
                                    padding: '4px 12px',
                                    '&:hover': {
                                        borderColor: 'rgba(31, 41, 55, 0.7)',
                                        bgcolor: 'rgba(31, 41, 55, 0.1)'
                                    }
                                }}
                            >
                                {showCategories ? 'Hide Categories' : 'Show Categories'}
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    setCategoryFilter('all');
                                    setSortBy('name');
                                    setSortOrder('asc');
                                    setSearchTerm('');
                                    setFilteredProducts(null);
                                    setSelectedProduct(null);
                                    setSelectedProductDetails(null);
                                }}
                                sx={{
                                    color: '#1f2937',
                                    borderColor: 'rgba(31, 41, 55, 0.4)',
                                    fontSize: '0.75rem',
                                    padding: '4px 12px',
                                    '&:hover': {
                                        borderColor: 'rgba(31, 41, 55, 0.7)',
                                        bgcolor: 'rgba(31, 41, 55, 0.1)'
                                    }
                                }}
                            >
                                Reset
                            </Button>
                            <ToggleButtonGroup
                                value={stockFilter}
                                exclusive
                                onChange={(_, value) => {
                                    if (value) setStockFilter(value);
                                    setCategoryFilter('all');
                                }}
                                size="small"
                                sx={{ ml: 1 }}
                            >
                                <ToggleButton value="all" sx={{ fontSize: '0.75rem', px: 2 }}>
                                    All
                                </ToggleButton>
                                <ToggleButton value="low" sx={{ fontSize: '0.75rem', px: 2 }}>
                                    Low Stock
                                    {stockFilter === 'low' && (
                                        <Box component="span" sx={{ ml: 1, fontWeight: 700, color: '#7c3aed' }}>
                                            ({displayedProducts.length})
                                        </Box>
                                    )}
                                </ToggleButton>
                                <ToggleButton value="zero" sx={{ fontSize: '0.75rem', px: 2 }}>
                                    Zero Stock
                                    {stockFilter === 'zero' && (
                                        <Box component="span" sx={{ ml: 1, fontWeight: 700, color: '#ef4444' }}>
                                            ({displayedProducts.length})
                                        </Box>
                                    )}
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>
                    {/* Stats Row */}
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2.5,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            pt: 1.5,
                            borderTop: '1px solid rgba(31, 41, 55, 0.2)'
                        }}
                    >
                        <Box sx={{
                            border: '2px dotted #3b82f6',
                            borderRadius: 1,
                            p: 1.5,
                            bgcolor: 'rgba(59, 130, 246, 0.08)',
                            minWidth: 100,
                            flex: '1 1 120px'
                        }}>
                            <Typography variant="caption" sx={{ color: '#1e40af', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.3px', fontWeight: 600 }}>
                                Products
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3, color: '#1e3a8a' }}>
                                {summaryTotals.productCount}
                            </Typography>
                        </Box>
                        <Box sx={{
                            border: '2px dotted #8b5cf6',
                            borderRadius: 1,
                            p: 1.5,
                            bgcolor: 'rgba(139, 92, 246, 0.08)',
                            minWidth: 100,
                            flex: '1 1 120px'
                        }}>
                            <Typography variant="caption" sx={{ color: '#6d28d9', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.3px', fontWeight: 600 }}>
                                Total Stock
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3, color: '#5b21b6' }}>
                                {summaryTotals.totalQty}
                            </Typography>
                        </Box>
                        <Box sx={{
                            border: '2px dotted #f59e0b',
                            borderRadius: 1,
                            p: 1.5,
                            bgcolor: 'rgba(245, 158, 11, 0.08)',
                            minWidth: 110,
                            flex: '1 1 130px'
                        }}>
                            <Typography variant="caption" sx={{ color: '#d97706', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.3px', fontWeight: 600 }}>
                                Cost Value
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3, color: '#b45309' }}>
                                ₹{summaryTotals.totalCost.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box sx={{
                            border: '2px dotted #10b981',
                            borderRadius: 1,
                            p: 1.5,
                            bgcolor: 'rgba(16, 185, 129, 0.08)',
                            minWidth: 110,
                            flex: '1 1 130px'
                        }}>
                            <Typography variant="caption" sx={{ color: '#059669', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.3px', fontWeight: 600 }}>
                                Selling Value
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3, color: '#047857' }}>
                                ₹{summaryTotals.totalSelling.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box sx={{
                            border: '2px dotted #ec4899',
                            borderRadius: 1,
                            p: 1.5,
                            bgcolor: 'rgba(236, 72, 153, 0.08)',
                            minWidth: 100,
                            flex: '1 1 120px'
                        }}>
                            <Typography variant="caption" sx={{ color: '#db2777', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.3px', fontWeight: 600 }}>
                                Avg Margin
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3, color: '#be185d' }}>
                                {averageMargin}%
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <TableContainer sx={{ flex: 1, overflow: 'auto', overflowX: 'scroll' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'background.default' }}>
                                <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>
                                    <TableSortLabel
                                        active={sortBy === 'name'}
                                        direction={sortBy === 'name' ? sortOrder : 'asc'}
                                        onClick={() => handleSortRequest('name')}
                                    >
                                        Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>
                                    <TableSortLabel
                                        active={sortBy === 'barcode'}
                                        direction={sortBy === 'barcode' ? sortOrder : 'asc'}
                                        onClick={() => handleSortRequest('barcode')}
                                    >
                                        Barcode
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>
                                    <TableSortLabel
                                        active={sortBy === 'stock'}
                                        direction={sortBy === 'stock' ? sortOrder : 'asc'}
                                        onClick={() => handleSortRequest('stock')}
                                    >
                                        Stock
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayedProducts.map((product) => {
                                const stockStatus = getStockStatus(product);
                                const statusColor = stockStatus === 'zero' ? '#ef4444' :
                                    stockStatus === 'low' ? '#7c3aed' :
                                        '#10b981';
                                return (
                                    <TableRow
                                        key={product.id}
                                        hover
                                        onClick={() => setSelectedProduct(product)}
                                        sx={{
                                            cursor: 'pointer',
                                            bgcolor: selectedProduct?.id === product.id ? 'rgba(11, 29, 57, 0.08)' : 'transparent',
                                            '& td': { py: 0.5, px: 1.5 }
                                        }}
                                    >
                                        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CircleIcon sx={{ fontSize: 12, color: statusColor }} />
                                                <Box>
                                                    <Typography variant="body1">{product.name}</Typography>
                                                    <Typography
                                                        variant="body2"
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
                                        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>
                                            {renderBarcodeChips(product.barcode, 'small')}
                                        </TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>
                                            <Typography variant="body1">{product.total_stock}</Typography>
                                        </TableCell>
                                        <TableCell align="right" onClick={(e) => e.stopPropagation()} sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>
                                            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditClick(product)}
                                                        sx={{
                                                            bgcolor: 'rgba(31, 41, 55, 0.08)',
                                                            color: '#1f2937',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(31, 41, 55, 0.15)'
                                                            }
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1f2937' }}>
                                                        Edit
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(product.id)}
                                                        sx={{
                                                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                                                            color: '#ef4444',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(239, 68, 68, 0.2)'
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#ef4444' }}>
                                                        Delete
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Pagination removed as per request */}
            </Paper>

            {/* Right Side: Batch Details */}
            {displayProduct && (
                <Paper elevation={0} sx={{ p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <Box
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizingRight(true);
                        }}
                        sx={{
                            display: { xs: 'none', lg: 'flex' },
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '8px',
                            height: '100%',
                            cursor: 'col-resize',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover .handle': {
                                bgcolor: 'primary.main',
                                width: '4px'
                            },
                            zIndex: 10
                        }}
                    >
                        <Box
                            className="handle"
                            sx={{
                                width: '2px',
                                height: '60px',
                                bgcolor: isResizingRight ? 'primary.main' : 'divider',
                                borderRadius: '4px',
                                transition: 'all 0.2s',
                                ...(isResizingRight && { width: '4px' })
                            }}
                        />
                    </Box>
                    {displayProduct ? (
                        <>
                            <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(16, 24, 40, 0.08)' }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: { xs: 'flex-start', sm: 'center' },
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        justifyContent: 'space-between',
                                        gap: 2,
                                        mb: 2
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                        <Typography
                                            variant="h5"
                                            component="h2"
                                            sx={{ wordBreak: 'break-word' }}
                                        >
                                            {displayProduct.name}
                                        </Typography>
                                        {displayProduct.batchTrackingEnabled && (
                                            <Chip label="Batch Tracking Enabled" size="small" color="primary" variant="filled" />
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        {displayProduct.batchTrackingEnabled && (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                                <IconButton
                                                    size="medium"
                                                    onClick={() => handleAddStock(displayProduct)}
                                                    sx={{
                                                        bgcolor: '#1f8a5b',
                                                        color: '#fff',
                                                        '&:hover': {
                                                            bgcolor: '#166d47'
                                                        }
                                                    }}
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#1f8a5b' }}>
                                                    Batch
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                            <IconButton
                                                size="medium"
                                                onClick={handleOpenHistory}
                                                sx={{
                                                    bgcolor: 'rgba(31, 41, 55, 0.08)',
                                                    color: '#1f2937',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(31, 41, 55, 0.15)'
                                                    }
                                                }}
                                            >
                                                <HistoryIcon />
                                            </IconButton>
                                            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#1f2937' }}>
                                                History
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                            <IconButton
                                                size="medium"
                                                onClick={() => setBarcodePrintOpen(true)}
                                                sx={{
                                                    bgcolor: '#d97706',
                                                    color: '#fff',
                                                    '&:hover': {
                                                        bgcolor: '#b45309'
                                                    }
                                                }}
                                            >
                                                <PrintIcon />
                                            </IconButton>
                                            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#d97706' }}>
                                                Barcode
                                            </Typography>
                                        </Box>
                                    </Box>
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
                                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleQuickInventoryOpen(batch)}
                                                                        sx={{
                                                                            bgcolor: 'rgba(31, 138, 91, 0.1)',
                                                                            color: '#1f8a5b',
                                                                            '&:hover': {
                                                                                bgcolor: 'rgba(31, 138, 91, 0.2)'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <InventoryIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1f8a5b' }}>
                                                                        Stock
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleBatchEditClick(batch)}
                                                                        sx={{
                                                                            bgcolor: 'rgba(31, 41, 55, 0.08)',
                                                                            color: '#1f2937',
                                                                            '&:hover': {
                                                                                bgcolor: 'rgba(31, 41, 55, 0.15)'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#1f2937' }}>
                                                                        Edit
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleBatchDelete(batch.id)}
                                                                        sx={{
                                                                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                                                                            color: '#ef4444',
                                                                            '&:hover': {
                                                                                bgcolor: 'rgba(239, 68, 68, 0.2)'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#ef4444' }}>
                                                                        Delete
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
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
            )}

            <Dialog
                open={addCategoryOpen}
                onClose={() => setAddCategoryOpen(false)}
                onKeyDown={(event) => {
                    if (event.defaultPrevented) return;
                    if (event.key !== 'Enter') return;
                    if (event.shiftKey) return;
                    if (event.target?.tagName === 'TEXTAREA') return;
                    event.preventDefault();
                    handleSaveCategory();
                }}
            >
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
                onProductUpdated={handleEditSave}
            />

            <EditBatchDialog
                open={batchEditOpen}
                onClose={() => setBatchEditOpen(false)}
                batch={currentBatch}
                onBatchUpdated={handleBatchEditSave}
            />

            <QuickInventoryDialog
                open={quickInventoryOpen}
                onClose={handleQuickInventoryClose}
                batch={quickInventoryBatch}
                productName={displayProduct?.name}
                onUpdated={handleStockAdded}
            />

            <AddStockDialog
                open={addStockOpen}
                onClose={() => setAddStockOpen(false)}
                product={currentProduct}
                onStockAdded={handleStockAdded}
            />

            <BarcodePrintDialog
                open={barcodePrintOpen}
                onClose={() => setBarcodePrintOpen(false)}
                product={displayProduct}
            />

            <CustomDialog {...dialogState} onClose={closeDialog} />
        </Box>
    );
};
export default ProductList;
