import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import inventoryService from '@/shared/api/inventoryService';
import { isRequestCanceled } from '@/shared/api/api';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import { getResponseArray, getResponseObject } from '@/shared/utils/responseGuards';

// Sub-hooks
import { useInventoryLayout } from '@/domains/inventory/components/useInventoryLayout';
import { useProductSelection } from '@/domains/inventory/components/useProductSelection';
import { useCategoryManagement } from '@/domains/inventory/components/useCategoryManagement';
import { useProductActions } from '@/domains/inventory/components/useProductActions';

export default function useProductList({ categoryFilter, onCategoryChange, debouncedSearch, onSearchChange }) {
  const { dialogState, showError, showConfirm, closeDialog } = useCustomDialog();

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedProductRefresh, setSelectedProductRefresh] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRange, setHistoryRange] = useState('thisMonth');
  const [historyData, setHistoryData] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [summaryTotals, setSummaryTotals] = useState({
    productCount: 0, totalQty: 0, totalCost: 0, totalSelling: 0, totalMrp: 0,
  });
  const [categoryCounts, setCategoryCounts] = useState({});
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [stockFilter, setStockFilter] = useState('all');

  const productsRequestId = useRef(0);
  const summaryRequestId = useRef(0);
  const searchInputRef = useRef(null);
  const selectedProductRef = useRef(null);
  selectedProductRef.current = selectedProduct;

  const toTitleCase = (str) => {
    if (!str) return str;
    return str.toLowerCase().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const fetchProducts = useCallback(async () => {
    const requestId = ++productsRequestId.current;
    try {
      const data = await inventoryService.fetchProducts({
        category: 'all',
        sortBy,
        sortOrder,
        pageSize: 10000,
      });
      const productsData = getResponseArray(data);
      if (productsRequestId.current !== requestId) return;
      setProducts(productsData);

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

  const fetchSummary = useCallback(async () => {
    const requestId = ++summaryRequestId.current;
    try {
      const isAllNoSearch = (categoryFilter === 'all' || !categoryFilter) && !debouncedSearch;
      let totalsData, sidebarData;

      if (isAllNoSearch) {
        const data = await inventoryService.fetchSummary({ search: '', category: 'all' });
        if (summaryRequestId.current !== requestId) return;
        totalsData = getResponseObject(data);
        sidebarData = totalsData;
      } else {
        const [totalsRes, sidebarRes] = await Promise.all([
          inventoryService.fetchSummary({ search: debouncedSearch, category: categoryFilter }),
          inventoryService.fetchSummary({ search: '', category: 'all' }),
        ]);
        if (summaryRequestId.current !== requestId) return;
        totalsData = getResponseObject(totalsRes);
        sidebarData = getResponseObject(sidebarRes);
      }

      setSummaryTotals(
        totalsData.totals || { productCount: 0, totalQty: 0, totalCost: 0, totalSelling: 0, totalMrp: 0 }
      );
      setCategoryCounts(sidebarData.categoryCounts || {});
      setUncategorizedCount(sidebarData.uncategorizedCount || 0);
      setTotalCount(sidebarData.totalCount || 0);
    } catch (error) {
      if (isRequestCanceled(error)) return;
      console.error(error);
    }
  }, [debouncedSearch, categoryFilter]);

  // Compose with specialized hooks
  const layout = useInventoryLayout();
  
  const displayedProducts = useMemo(() => {
    let baseProducts = products;

    if (categoryFilter && categoryFilter !== 'all') {
      if (categoryFilter === 'uncategorized') {
        baseProducts = baseProducts.filter((p) => !p.category || p.category.trim() === '');
      } else {
        const prefix = `${categoryFilter}/`;
        baseProducts = baseProducts.filter(
          (p) => p.category === categoryFilter || (p.category && p.category.startsWith(prefix))
        );
      }
    }

    if (stockFilter === 'low') {
      baseProducts = baseProducts.filter(
        (p) => p.lowStockWarningEnabled && p.total_stock > 0 && p.total_stock <= p.lowStockThreshold
      );
    } else if (stockFilter === 'zero') {
      baseProducts = baseProducts.filter((p) => p.total_stock === 0);
    }

    if (!debouncedSearch) return baseProducts.slice(0, 1000);

    const query = debouncedSearch.toLowerCase();
    const namePrefix = [], barcodePrefix = [], nameContains = [], barcodeContains = [];

    for (const p of baseProducts) {
      const name = p._searchName || (p._searchName = p.name.toLowerCase());
      const barcodes =
        p._searchBarcodes ||
        (p._searchBarcodes = p.barcode
          ? p.barcode.toLowerCase().split('|').map((b) => b.trim())
          : []);

      if (name.startsWith(query)) namePrefix.push(p);
      else if (barcodes.some((b) => b.startsWith(query))) barcodePrefix.push(p);
      else if (name.includes(query)) nameContains.push(p);
      else if (barcodes.some((b) => b.includes(query))) barcodeContains.push(p);
    }

    const sortFn = (a, b) => (a.name || '').localeCompare(b.name || '');
    namePrefix.sort(sortFn);
    barcodePrefix.sort(sortFn);
    nameContains.sort(sortFn);
    barcodeContains.sort(sortFn);

    return [...namePrefix, ...barcodePrefix, ...nameContains, ...barcodeContains].slice(0, 1000);
  }, [products, debouncedSearch, stockFilter, categoryFilter]);

  const selection = useProductSelection(displayedProducts, (product) => {
    setSelectedProduct(product);
    setSelectedProductDetails(null);
    setIsLoadingBatches(true);
  });

  const categoriesContext = useCategoryManagement(
    categoryFilter, 
    onCategoryChange, 
    fetchProducts, 
    fetchSummary, 
    showError, 
    showConfirm
  );

  const actions = useProductActions(
    fetchProducts,
    fetchSummary,
    categoriesContext.fetchCategories,
    setSelectedProduct,
    setSelectedProductDetails,
    setSelectedProductRefresh,
    showConfirm,
    showError
  );

  // Lifecycle
  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    }, 100);
    categoriesContext.fetchCategories();
    return () => window.clearTimeout(focusTimer);
  }, [categoriesContext.fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [sortBy, sortOrder, fetchProducts]);

  useEffect(() => {
    fetchSummary();
  }, [debouncedSearch, categoryFilter, fetchSummary]);

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
        if (!controller.signal.aborted) setIsLoadingBatches(false);
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
        if (!controller.signal.aborted) setIsHistoryLoading(false);
      }
    };
    fetchHistory();
    return () => controller.abort();
  }, [historyOpen, historyRange, selectedProduct?.id]);

  // Computed values
  const averageMargin = useMemo(() => {
    if (summaryTotals.totalSelling > 0) {
      return (((summaryTotals.totalSelling - summaryTotals.totalCost) / summaryTotals.totalSelling) * 100).toFixed(1);
    }
    return '0.0';
  }, [summaryTotals.totalCost, summaryTotals.totalSelling]);

  const averageDiscount = useMemo(() => {
    if (summaryTotals.totalMrp > 0) {
      return (((summaryTotals.totalMrp - summaryTotals.totalSelling) / summaryTotals.totalMrp) * 100).toFixed(1);
    }
    return '0.0';
  }, [summaryTotals.totalMrp, summaryTotals.totalSelling]);

  const categoryLabel = categoryFilter === 'all' ? 'All Categories' : categoryFilter === 'uncategorized' ? 'Uncategorized' : categoryFilter;
  const displayProduct = selectedProductDetails || selectedProduct;
  const hasUncategorized = uncategorizedCount > 0;

  // Additional handlers
  const clearSearch = useCallback(() => {
    if (searchInputRef.current) searchInputRef.current.value = '';
    setSearchTerm('');
    onSearchChange('');
  }, [onSearchChange]);

  const handleReset = useCallback(() => {
    onCategoryChange('all');
    setSortBy('name');
    setSortOrder('asc');
    setSearchTerm('');
    if (searchInputRef.current) searchInputRef.current.value = '';
    onSearchChange('');
    setSelectedProduct(null);
    setSelectedProductDetails(null);
    setSelectedProductRefresh(0);
    selection.resetSelection();
  }, [onCategoryChange, onSearchChange, selection]);

  const handleProductDoubleClick = useCallback(() => {
    setSelectedProduct(null);
    setSelectedProductDetails(null);
  }, []);

  const handleListDragStart = (e, product) => {
    const id = String(product.id);
    let dragIds = [id];
    if (selection.selectedIds.has(id)) {
      dragIds = Array.from(selection.selectedIds);
    } else {
      selection.setSelectedIds(new Set([id]));
      selection.setLastSelectedId(id);
      setSelectedProduct(product);
      setSelectedProductDetails(null);
      setIsLoadingBatches(true);
    }
    e.dataTransfer.setData('text/plain', dragIds.join(','));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDrop = async (event, targetCategory) => {
    event.preventDefault();
    const productIdsStr = event.dataTransfer.getData('text/plain');
    if (!productIdsStr) return;
    const productIds = productIdsStr.split(',').filter(Boolean);
    const nextCategory = targetCategory === 'uncategorized' ? null : targetCategory;
    const productsToMove = productIds
      .map((id) => products.find((item) => String(item.id) === String(id)))
      .filter((p) => p && (p.category || null) !== nextCategory);

    if (productsToMove.length === 0) return;

    try {
      setProducts((prev) => prev.map((p) => (productIds.includes(String(p.id)) ? { ...p, category: nextCategory } : p)));
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
      categoriesContext.fetchCategories();
    } catch (error) {
      console.error(error);
      showError('Failed to move products: ' + (error.response?.data?.error || error.message));
      fetchProducts();
    }
  };

  const handleSortRequest = (field) => {
    setSortOrder((prevOrder) => (sortBy === field ? (prevOrder === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortBy(field);
  };

  return {
    // Layout
    ...layout,
    // Selection
    ...selection,
    // Categories
    ...categoriesContext,
    // Actions
    ...actions,
    // State
    dialogState, showError, closeDialog,
    products, setProducts,
    searchTerm, setSearchTerm,
    selectedProduct,
    selectedProductDetails,
    historyOpen, setHistoryOpen,
    historyRange, setHistoryRange,
    historyData, isHistoryLoading,
    sortBy, sortOrder,
    isLoadingBatches,
    summaryTotals, categoryCounts, uncategorizedCount, totalCount,
    stockFilter, setStockFilter,
    searchInputRef,
    // Computed
    displayedProducts, averageMargin, averageDiscount,
    categoryLabel, displayProduct, hasUncategorized,
    // Handlers
    fetchProducts, fetchSummary,
    clearSearch, handleReset,
    handleProductDoubleClick, handleListDragStart,
    handleOpenHistory, handleCloseHistory: () => setHistoryOpen(false),
    handleSortRequest, handleCategoryDrop,
    handleCategoryDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
  };
}
