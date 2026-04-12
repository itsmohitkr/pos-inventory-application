import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import inventoryService from '../../shared/api/inventoryService';
import { isRequestCanceled } from '../../shared/api/api';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Box,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TableSortLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Print as PrintIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';

import EditProductDialog from './EditProductDialog';
import EditBatchDialog from './EditBatchDialog';
import AddStockDialog from './AddStockDialog';
import ProductHistoryDialog from './ProductHistoryDialog';
import QuickInventoryDialog from './QuickInventoryDialog';
import BarcodePrintDialog from './BarcodePrintDialog';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../shared/hooks/useCustomDialog';
import { getResponseArray, getResponseObject } from '../../shared/utils/responseGuards';
import ProductRow from './ProductRow';
import ProductSummaryBar from './ProductSummaryBar';
import CategorySidebar from './CategorySidebar';
import ProductDetailPanel from './ProductDetailPanel';

const ProductList = forwardRef(
  ({ categoryFilter, onCategoryChange, debouncedSearch, onSearchChange, isPending }, ref) => {
    const [, setFilteredProducts] = useState(null); // null = show all
    const { dialogState, showError, showConfirm, closeDialog } = useCustomDialog();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    // debouncedSearch is now a prop
    const [editOpen, setEditOpen] = useState(false);
    const [batchEditOpen, setBatchEditOpen] = useState(false);
    const [addStockOpen, setAddStockOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [lastSelectedId, setLastSelectedId] = useState(null);
    const [selectedProductDetails, setSelectedProductDetails] = useState(null);
    const [selectedProductRefresh, setSelectedProductRefresh] = useState(0);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyRange, setHistoryRange] = useState('thisMonth');
    const [historyData, setHistoryData] = useState(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [currentBatch, setCurrentBatch] = useState(null);
    const [quickInventoryBatch, setQuickInventoryBatch] = useState(null);
    const [quickInventoryOpen, setQuickInventoryOpen] = useState(false);
    const [barcodePrintOpen, setBarcodePrintOpen] = useState(false);
    // categoryFilter is now a prop
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
      totalSelling: 0,
      totalMrp: 0,
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
    const tableContainerRef = useRef(null);
    // Ref that always reflects the current selectedProduct without being listed
    // as a dependency of fetchProducts – prevents a full re-fetch on every row click.
    const selectedProductRef = useRef(null);
    selectedProductRef.current = selectedProduct;

    const fetchProducts = React.useCallback(async () => {
      const requestId = ++productsRequestId.current;
      try {
        // Fetch everything for the current category once, then filter locally
        // This matches the high-performance behavior of the POS screen
        const data = await inventoryService.fetchProducts({
          category: 'all',
          sortBy,
          sortOrder,
          pageSize: 10000, // Ensure we get the full list for local filtering
        });
        const productsData = getResponseArray(data);
        if (productsRequestId.current !== requestId) return;
        setProducts(productsData);

        // Sync selected product if it exists – read through ref so selectedProduct
        // is NOT a dependency here (adding it would cause a re-fetch on every click).
        if (selectedProductRef.current) {
          const refreshed = productsData.find(
            (p) => String(p.id) === String(selectedProductRef.current.id)
          );
          if (refreshed) setSelectedProduct(refreshed);
        }
      } catch (error) {
        if (isRequestCanceled(error)) return;
        console.error(error);
      }
    }, [sortBy, sortOrder]);

    // Fix refresh bug in App.jsx
    useImperativeHandle(ref, () => ({
      refresh: () => {
        fetchProducts();
        fetchSummary();
        fetchCategories();
      },
    }));

    const fetchSummary = React.useCallback(async () => {
      const requestId = ++summaryRequestId.current;
      try {
        const isAllNoSearch = (categoryFilter === 'all' || !categoryFilter) && !debouncedSearch;

        let totalsData, sidebarData;

        if (isAllNoSearch) {
          // Only one call needed
          const data = await inventoryService.fetchSummary({ search: '', category: 'all' });
          if (summaryRequestId.current !== requestId) return;
          totalsData = getResponseObject(data);
          sidebarData = totalsData;
        } else {
          // Two calls: one for current view totals, one for global sidebar counts
          const [totalsRes, sidebarRes] = await Promise.all([
            inventoryService.fetchSummary({ search: debouncedSearch, category: categoryFilter }),
            inventoryService.fetchSummary({ search: '', category: 'all' }),
          ]);
          if (summaryRequestId.current !== requestId) return;
          totalsData = getResponseObject(totalsRes);
          sidebarData = getResponseObject(sidebarRes);
        }

        setSummaryTotals(
          totalsData.totals || {
            productCount: 0,
            totalQty: 0,
            totalCost: 0,
            totalSelling: 0,
            totalMrp: 0,
          }
        );
        setCategoryCounts(sidebarData.categoryCounts || {});
        setUncategorizedCount(sidebarData.uncategorizedCount || 0);
        setTotalCount(sidebarData.totalCount || 0);
      } catch (error) {
        if (isRequestCanceled(error)) return;
        console.error(error);
      }
    }, [debouncedSearch, categoryFilter]);

    const fetchCategories = async () => {
      try {
        const data = await inventoryService.fetchCategories();
        setCategories(getResponseArray(data));
      } catch (error) {
        if (isRequestCanceled(error)) return;
        console.error(error);
      }
    };

    useEffect(() => {
      const controller = new AbortController();
      const focusTimer = window.setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);

      fetchCategories(controller.signal);

      return () => {
        controller.abort();
        window.clearTimeout(focusTimer);
      };
    }, []);

    // Live search debouncing is handled directly in the TextField's onChange
    // to avoid full component re-renders while typing.

    // Pagination removed

    useEffect(() => {
      const controller = new AbortController();
      fetchProducts(controller.signal);
      return () => controller.abort();
    }, [sortBy, sortOrder, fetchProducts]);

    useEffect(() => {
      const controller = new AbortController();
      fetchSummary(controller.signal);
      return () => controller.abort();
    }, [debouncedSearch, categoryFilter, fetchSummary]);

    useEffect(() => {
      const handleMouseMove = (event) => {
        if (isResizingLeft) {
          const nextWidth = Math.max(80, Math.min(window.innerWidth * 0.4, event.clientX - 40));
          setLeftPanelWidth(nextWidth);
          localStorage.setItem('inventoryLeftPanelWidth', nextWidth.toString());
        }
        if (isResizingRight) {
          const nextWidth = Math.max(
            100,
            Math.min(window.innerWidth * 0.5, window.innerWidth - event.clientX - 40)
          );
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
        return undefined;
      }

      const controller = new AbortController();

      const fetchSelectedDetails = async () => {
        setIsLoadingBatches(true);
        try {
          const data = await inventoryService.fetchProductById(selectedProduct.id, {
            signal: controller.signal,
          });
          setSelectedProductDetails(data.data || null);
        } catch (error) {
          if (isRequestCanceled(error)) return;
          console.error(error);
          setSelectedProductDetails(null);
        } finally {
          if (!controller.signal.aborted) {
            setIsLoadingBatches(false);
          }
        }
      };

      fetchSelectedDetails();

      return () => controller.abort();
    }, [selectedProduct?.id, selectedProductRefresh]);

    useEffect(() => {
      if (!historyOpen || !selectedProduct?.id) return undefined;

      const controller = new AbortController();

      const fetchHistory = async () => {
        setIsHistoryLoading(true);
        try {
          const data = await inventoryService.fetchProductHistory(
            selectedProduct.id,
            { range: historyRange },
            { signal: controller.signal }
          );
          setHistoryData(data.data || null);
        } catch (error) {
          if (isRequestCanceled(error)) return;
          console.error(error);
          setHistoryData(null);
        } finally {
          if (!controller.signal.aborted) {
            setIsHistoryLoading(false);
          }
        }
      };

      fetchHistory();

      return () => controller.abort();
    }, [historyOpen, historyRange, selectedProduct?.id]);

    // Filter products based on stock status
    // Filter products based on search term and stock status locally for instant reflection
    const displayedProducts = useMemo(() => {
      let baseProducts = products;

      // Apply category filter locally
      if (categoryFilter && categoryFilter !== 'all') {
        if (categoryFilter === 'uncategorized') {
          baseProducts = baseProducts.filter((p) => !p.category || p.category.trim() === '');
        } else {
          // Hierarchical filtering: exact match or starts with category/
          const prefix = `${categoryFilter}/`;
          baseProducts = baseProducts.filter(
            (p) => p.category === categoryFilter || (p.category && p.category.startsWith(prefix))
          );
        }
      }

      // Apply stock filters first to the pool of products
      if (stockFilter === 'low') {
        baseProducts = baseProducts.filter(
          (p) =>
            p.lowStockWarningEnabled && p.total_stock > 0 && p.total_stock <= p.lowStockThreshold
        );
      } else if (stockFilter === 'zero') {
        baseProducts = baseProducts.filter((p) => p.total_stock === 0);
      }

      if (!debouncedSearch) {
        return baseProducts.slice(0, 1000);
      }

      const query = debouncedSearch.toLowerCase();

      const namePrefix = [];
      const barcodePrefix = [];
      const nameContains = [];
      const barcodeContains = [];

      for (const p of baseProducts) {
        const name = p._searchName || (p._searchName = p.name.toLowerCase());
        const barcodes =
          p._searchBarcodes ||
          (p._searchBarcodes = p.barcode
            ? p.barcode
                .toLowerCase()
                .split('|')
                .map((b) => b.trim())
            : []);

        if (name.startsWith(query)) {
          namePrefix.push(p);
        } else if (barcodes.some((b) => b.startsWith(query))) {
          barcodePrefix.push(p);
        } else if (name.includes(query)) {
          nameContains.push(p);
        } else if (barcodes.some((b) => b.includes(query))) {
          barcodeContains.push(p);
        }
      }

      // Within buckets, sort alphabetically for consistent display
      const sortFn = (a, b) => (a.name || '').localeCompare(b.name || '');
      namePrefix.sort(sortFn);
      barcodePrefix.sort(sortFn);
      nameContains.sort(sortFn);
      barcodeContains.sort(sortFn);

      return [...namePrefix, ...barcodePrefix, ...nameContains, ...barcodeContains].slice(0, 1000);
    }, [products, debouncedSearch, stockFilter, categoryFilter]);

    const clearSearch = React.useCallback(() => {
      if (searchInputRef.current) searchInputRef.current.value = '';
      setSearchTerm('');
      onSearchChange('');
      setFilteredProducts(null);
    }, [onSearchChange]);

    const handleProductDoubleClick = React.useCallback(() => {
      setSelectedProduct(null);
      setSelectedProductDetails(null);
    }, []);

    const handleDelete = React.useCallback(
      async (id) => {
        const confirmed = await showConfirm(
          'Deleting this product will also delete all associated batches and related data. This action cannot be undone. Are you sure you want to continue?'
        );
        if (confirmed) {
          try {
            await inventoryService.deleteProduct(id);
            fetchProducts();
            fetchSummary();
          } catch (error) {
            console.error(error);
            showError(
              'Failed to delete product: ' + (error.response?.data?.error || error.message)
            );
          }
        }
      },
      [fetchProducts, fetchSummary, showConfirm, showError]
    );

    const handleEditClick = React.useCallback((product) => {
      setCurrentProduct(product);
      setEditOpen(true);
    }, []);

    const handleBatchEditClick = (batch) => {
      setCurrentBatch({
        ...batch,
        expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : '',
      });
      setBatchEditOpen(true);
    };

    const toTitleCase = (str) => {
      if (!str) return str;
      return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const handleEditSave = async () => {
      // This handler is called by EditProductDialog's onProductUpdated callback
      fetchProducts();
      fetchSummary();
      fetchCategories();
      setSelectedProductRefresh((prev) => prev + 1);
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
      const confirmed = await showConfirm(
        'Are you sure you want to delete this batch? This action cannot be undone.'
      );
      if (!confirmed) {
        return;
      }
      try {
        await inventoryService.deleteBatch(batchId);
        fetchProducts();
        fetchSummary();
        setSelectedProductRefresh((value) => value + 1);
      } catch (error) {
        console.error(error);
        showError('Failed to delete batch: ' + (error.response?.data?.error || error.message));
      }
    };

    const handleRowClick = (product, event) => {
      const id = String(product.id);

      // If clicking the same product without modifier keys, do nothing to avoid resetting state
      // and causing the "No stock available" flash on the right panel.
      const isCurrentlySelected = selectedProduct?.id === product.id;
      if (
        isCurrentlySelected &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        selectedIds.has(id) &&
        selectedIds.size === 1
      ) {
        return;
      }

      let nextSelected = new Set(selectedIds);

      if (event.shiftKey && lastSelectedId) {
        // Range selection
        const displayedIds = displayedProducts.map((p) => String(p.id));
        const startIdx = displayedIds.indexOf(String(lastSelectedId));
        const endIdx = displayedIds.indexOf(id);
        if (startIdx !== -1 && endIdx !== -1) {
          const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
          const rangeIds = displayedIds.slice(min, max + 1);
          rangeIds.forEach((rid) => nextSelected.add(rid));
        }
      } else if (event.ctrlKey || event.metaKey) {
        // Toggle individual
        if (nextSelected.has(id)) {
          nextSelected.delete(id);
        } else {
          nextSelected.add(id);
        }
      } else {
        // Single selection
        nextSelected = new Set([id]);
      }

      setSelectedIds(nextSelected);
      setLastSelectedId(id);

      // Only reset details and signal loading if selecting a different product
      if (!isCurrentlySelected) {
        setSelectedProduct(product);
        setSelectedProductDetails(null);
        setIsLoadingBatches(true); // Signal loading immediately to avoid "No stock" flash
      }
    };

    const handleListDragStart = (e, product) => {
      const id = String(product.id);
      let dragIds = [id];

      if (selectedIds.has(id)) {
        dragIds = Array.from(selectedIds);
      } else {
        // If dragging unselected item, select it and drag only it
        const isCurrentlySelected = selectedProduct?.id === product.id;
        setSelectedIds(new Set([id]));
        setLastSelectedId(id);

        if (!isCurrentlySelected) {
          setSelectedProduct(product);
          setSelectedProductDetails(null);
          setIsLoadingBatches(true);
        }
      }

      e.dataTransfer.setData('text/plain', dragIds.join(','));
      e.dataTransfer.effectAllowed = 'move';
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
    const handleCategorySelect = React.useCallback(
      (path) => {
        onCategoryChange(path);
        setSelectedProduct(null);
        setSelectedProductDetails(null);
      },
      [onCategoryChange]
    );
    const averageMargin = useMemo(() => {
      if (summaryTotals.totalSelling > 0) {
        return (
          ((summaryTotals.totalSelling - summaryTotals.totalCost) / summaryTotals.totalSelling) *
          100
        ).toFixed(1);
      }
      return '0.0';
    }, [summaryTotals.totalCost, summaryTotals.totalSelling]);

    const averageDiscount = useMemo(() => {
      if (summaryTotals.totalMrp > 0) {
        return (
          ((summaryTotals.totalMrp - summaryTotals.totalSelling) / summaryTotals.totalMrp) *
          100
        ).toFixed(1);
      }
      return '0.0';
    }, [summaryTotals.totalMrp, summaryTotals.totalSelling]);
    const categoryLabel =
      categoryFilter === 'all'
        ? 'All Categories'
        : categoryFilter === 'uncategorized'
          ? 'Uncategorized'
          : categoryFilter;
    const displayProduct = selectedProductDetails || selectedProduct;
    const handleSortRequest = (field) => {
      setSortOrder((prevOrder) =>
        sortBy === field ? (prevOrder === 'asc' ? 'desc' : 'asc') : 'asc'
      );
      setSortBy(field);
    };
    const handleToggleExpand = React.useCallback((id) => {
      setExpandedCategoryIds((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    }, []);
    const openCategoryMenu = (event, category) => {
      event.preventDefault();
      setActiveCategory(category);
      setContextMenu(
        contextMenu
          ? null
          : {
              mouseX: event.clientX - 2,
              mouseY: event.clientY - 4,
            }
      );
    };
    const closeCategoryMenu = React.useCallback(() => {
      setContextMenu(null);
    }, []);
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

      const isRename = categoryDialogMode === 'edit';
      const oldPath = categoryDialogTarget?.path;

      try {
        if (isRename && categoryDialogTarget) {
          await inventoryService.updateCategory(categoryDialogTarget.id, {
            name: trimmed,
          });

          // If the currently filtered category was renamed, update the filter to new path
          if (categoryFilter === oldPath) {
            const parts = oldPath.split('/');
            parts[parts.length - 1] = trimmed;
            const newPath = parts.join('/');
            onCategoryChange(newPath);
          }
        } else {
          await inventoryService.createCategory({
            name: trimmed,
            parentId: categoryDialogParent?.id || null,
          });
        }

        setAddCategoryOpen(false);
        setNewCategoryName('');

        // Critical: fetchProducts and fetchSummary ensure the counts and product cards update instantly
        fetchCategories();
        fetchProducts();
        fetchSummary();
      } catch (error) {
        console.error(error);
        showError('Failed to save category: ' + (error.response?.data?.error || error.message));
      }
    };
    const handleDeleteCategory = async (category) => {
      if (!category) return;
      const confirmed = await showConfirm(
        `Delete category "${category.name}" and all subcategories?`
      );
      if (!confirmed) return;
      try {
        await inventoryService.deleteCategory(category.id);
        if (categoryFilter === category.path || categoryFilter.startsWith(`${category.path}/`)) {
          onCategoryChange('all');
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
      const productIdsStr = event.dataTransfer.getData('text/plain');
      if (!productIdsStr) return;
      const productIds = productIdsStr.split(',').filter(Boolean);
      if (productIds.length === 0) return;

      const nextCategory = targetCategory === 'uncategorized' ? null : targetCategory;

      // Filter out products already in the target category
      const productsToMove = productIds
        .map((id) => products.find((item) => String(item.id) === String(id)))
        .filter((p) => p && (p.category || null) !== nextCategory);

      if (productsToMove.length === 0) return;

      try {
        // Optimistic Update for all products
        setProducts((prev) =>
          prev.map((p) => {
            if (productIds.includes(String(p.id))) {
              return { ...p, category: nextCategory };
            }
            return p;
          })
        );

        // Optimistic update for category counts
        setCategoryCounts((prev) => {
          const next = { ...prev };

          productsToMove.forEach((product) => {
            const oldCategory = product.category;

            // Decrement old
            if (oldCategory) {
              const oldParts = oldCategory
                .split('/')
                .map((part) => part.trim())
                .filter(Boolean);
              let path = '';
              oldParts.forEach((part) => {
                path = path ? `${path}/${part}` : part;
                if (next[path] > 0) next[path]--;
              });
            } else {
              setUncategorizedCount((c) => Math.max(0, c - 1));
            }

            // Increment new
            if (nextCategory) {
              const newParts = nextCategory
                .split('/')
                .map((part) => part.trim())
                .filter(Boolean);
              let path = '';
              newParts.forEach((part) => {
                path = path ? `${path}/${part}` : part;
                next[path] = (next[path] || 0) + 1;
              });
            } else {
              setUncategorizedCount((c) => c + 1);
            }
          });

          return next;
        });

        // Perform bulk updates (sequentially or in parallel - parallel is faster)
        await Promise.all(
          productsToMove.map((p) =>
            inventoryService.updateProduct(p.id, {
              name: toTitleCase(p.name),
              barcode: p.barcode,
              category: nextCategory,
              batchTrackingEnabled: p.batchTrackingEnabled,
            })
          )
        );

        fetchProducts();
        fetchSummary();
        fetchCategories();
      } catch (error) {
        console.error(error);
        showError('Failed to move products: ' + (error.response?.data?.error || error.message));
        fetchProducts(); // Rollback/Sync
      }
    };
    const handleCategoryDragOver = React.useCallback((event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }, []);
    const sortedCategoryTree = useMemo(() => {
      const sort = (nodes) =>
        [...nodes]
          .sort((a, b) =>
            categorySortOrder === 'asc'
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name)
          )
          .map((node) => ({
            ...node,
            children: node.children ? sort(node.children) : [],
          }));
      return sort(categories);
    }, [categories, categorySortOrder]);

    const rowVirtualizer = useVirtualizer({
      count: displayedProducts.length,
      getScrollElement: () => tableContainerRef.current,
      estimateSize: () => 40,
      overscan: 10,
    });

    const handleCategorySortToggle = React.useCallback(
      () => setCategorySortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc')),
      []
    );
    const handleCategoryDialogClose = React.useCallback(() => setAddCategoryOpen(false), []);
    const handleResizeStartLeft = React.useCallback(() => setIsResizingLeft(true), []);

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: showCategories
              ? displayProduct
                ? `${leftPanelWidth}px 1fr ${rightPanelWidth}px`
                : `${leftPanelWidth}px 1fr`
              : displayProduct
                ? `1fr ${rightPanelWidth}px`
                : '1fr',
          },
          gap: 1.5,
          height: '100%',
          minHeight: 0,
          alignItems: 'stretch',
        }}
      >
        {/* Category List */}
        {showCategories && (
          <CategorySidebar
            sortedCategoryTree={sortedCategoryTree}
            categoryCounts={categoryCounts}
            expandedCategoryIds={expandedCategoryIds}
            categoryFilter={categoryFilter}
            totalCount={totalCount}
            uncategorizedCount={uncategorizedCount}
            hasUncategorized={hasUncategorized}
            categorySortOrder={categorySortOrder}
            isResizingLeft={isResizingLeft}
            contextMenu={contextMenu}
            activeCategory={activeCategory}
            addCategoryOpen={addCategoryOpen}
            newCategoryName={newCategoryName}
            categoryDialogMode={categoryDialogMode}
            categoryDialogParent={categoryDialogParent}
            onCategorySelect={handleCategorySelect}
            onCategorySortToggle={handleCategorySortToggle}
            onAddCategoryDialog={openAddCategoryDialog}
            onCategoryDragOver={handleCategoryDragOver}
            onCategoryDrop={handleCategoryDrop}
            onToggleExpand={handleToggleExpand}
            onOpenCategoryMenu={openCategoryMenu}
            onCloseContextMenu={closeCategoryMenu}
            onAddSubcategory={openAddCategoryDialog}
            onEditCategory={openEditCategoryDialog}
            onDeleteCategory={handleDeleteCategory}
            onCategoryDialogClose={handleCategoryDialogClose}
            onCategoryNameChange={setNewCategoryName}
            onSaveCategory={handleSaveCategory}
            onResizeStart={handleResizeStartLeft}
            onDoubleClick={displayProduct ? handleOpenHistory : undefined}
          />
        )}
        {/* Left Side: Product List */}
        <Paper
          elevation={0}
          sx={{ p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {/* Redesigned Product Card Header for Flexibility */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Products
                </Typography>
                <Chip
                  label={categoryLabel}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(31, 41, 55, 0.15)',
                    color: '#1f2937',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '22px',
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
                          color: '#1f2937',
                        },
                      },
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
                      onSearchChange(val.trim());
                    }, 400);
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const val = e.target.value.trim();
                      setSearchTerm(val);
                      if (!val) return;
                      const barcode = val;
                      // Priority 1: Check existing products in memory (fastest)
                      let found = products.find(
                        (p) => p.barcode && p.barcode.split('|').some((b) => b.trim() === barcode)
                      );

                      if (!found) {
                        try {
                          // Priority 2: Fetch from server if not in current page memory
                          const data = await inventoryService.fetchProductByBarcode(barcode);
                          if (data && data.product) {
                            found = data.product;
                            if (data.batches) {
                              found.total_stock = data.batches.reduce(
                                (sum, b) => sum + b.quantity,
                                0
                              );
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
                        <IconButton size="small" onClick={clearSearch} edge="end">
                          <ClearIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </InputAdornment>
                    ),
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
                      },
                    },
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={showCategories ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  onClick={() => setShowCategories((prev) => !prev)}
                  sx={{
                    color: '#1f2937',
                    borderColor: 'rgba(31, 41, 55, 0.4)',
                    fontSize: '0.75rem',
                    padding: '4px 12px',
                    '&:hover': {
                      borderColor: 'rgba(31, 41, 55, 0.7)',
                      bgcolor: 'rgba(31, 41, 55, 0.1)',
                    },
                  }}
                >
                  {showCategories ? 'Hide Categories' : 'Show Categories'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RestartAltIcon />}
                  onClick={() => {
                    onCategoryChange('all');
                    setSortBy('name');
                    setSortOrder('asc');
                    setSearchTerm('');
                    setFilteredProducts(null);
                    setSelectedProduct(null);
                    setSelectedProductDetails(null);
                    setSelectedProductRefresh(0);
                    setSelectedIds(new Set()); // Clear selected IDs on reset
                    setLastSelectedId(null);
                  }}
                  sx={{
                    color: '#1f2937',
                    borderColor: 'rgba(31, 41, 55, 0.4)',
                    fontSize: '0.75rem',
                    padding: '4px 12px',
                    '&:hover': {
                      borderColor: 'rgba(31, 41, 55, 0.7)',
                      bgcolor: 'rgba(31, 41, 55, 0.1)',
                    },
                  }}
                >
                  Reset
                </Button>
                <ToggleButtonGroup
                  value={stockFilter}
                  exclusive
                  onChange={(_, value) => {
                    if (value) setStockFilter(value);
                    onCategoryChange('all');
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
            <ProductSummaryBar
              summaryTotals={summaryTotals}
              averageMargin={averageMargin}
              averageDiscount={averageDiscount}
            />
          </Box>
          <TableContainer
            ref={tableContainerRef}
            sx={{
              flex: 1,
              overflow: 'auto',
              overflowX: 'scroll',
              opacity: isPending ? 0.6 : 1, // Visual feedback during transition
              transition: 'opacity 0.2s ease',
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell
                    sx={{
                      whiteSpace: 'nowrap',
                      py: 0.5,
                      px: 1.5,
                      width: '50px',
                      fontWeight: 'bold',
                    }}
                  >
                    S.No.
                  </TableCell>
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
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>
                    <TableSortLabel
                      active={sortBy === 'batchTrackingEnabled'}
                      direction={sortBy === 'batchTrackingEnabled' ? sortOrder : 'asc'}
                      onClick={() => handleSortRequest('batchTrackingEnabled')}
                    >
                      Batch Tracking
                    </TableSortLabel>
                  </TableCell>

                  <TableCell align="center" sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>
                    <TableSortLabel
                      active={sortBy === 'lowStockWarningEnabled'}
                      direction={sortBy === 'lowStockWarningEnabled' ? sortOrder : 'asc'}
                      onClick={() => handleSortRequest('lowStockWarningEnabled')}
                    >
                      Low Stock
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
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1.5 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const virtualItems = rowVirtualizer.getVirtualItems();
                  const totalSize = rowVirtualizer.getTotalSize();
                  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
                  const paddingBottom =
                    virtualItems.length > 0
                      ? totalSize - virtualItems[virtualItems.length - 1].end
                      : 0;
                  return (
                    <>
                      {paddingTop > 0 && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ height: paddingTop, p: 0, border: 0 }} />
                        </TableRow>
                      )}
                      {virtualItems.map((virtualRow) => {
                        const product = displayedProducts[virtualRow.index];
                        return (
                          <ProductRow
                            key={product.id}
                            product={product}
                            index={virtualRow.index}
                            isSelected={selectedIds.has(String(product.id))}
                            onSelect={handleRowClick}
                            onDragStart={handleListDragStart}
                            onEdit={handleEditClick}
                            onDelete={handleDelete}
                            onDoubleClick={handleProductDoubleClick}
                          />
                        );
                      })}
                      {paddingBottom > 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            sx={{ height: paddingBottom, p: 0, border: 0 }}
                          />
                        </TableRow>
                      )}
                    </>
                  );
                })()}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Pagination removed as per request */}
        </Paper>

        {/* Right Side: Batch Details */}
        {displayProduct && (
          <ProductDetailPanel
            displayProduct={displayProduct}
            isLoadingBatches={isLoadingBatches}
            isResizingRight={isResizingRight}
            onResizeStart={() => setIsResizingRight(true)}
            onAddStock={handleAddStock}
            onOpenHistory={handleOpenHistory}
            onBatchEditClick={handleBatchEditClick}
            onBatchDelete={handleBatchDelete}
            onQuickInventoryOpen={handleQuickInventoryOpen}
          />
        )}

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
  }
);
export default ProductList;
