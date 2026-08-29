import type { InventorySummaryTotals, Product, ProductHistory } from './inventoryTypes';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import inventoryService from '@/shared/api/inventoryService';
import { getApiErrorMessage } from '@/shared/api/api';
import { isRequestCanceled } from '@/shared/api/api';
import useCustomDialog from '@/shared/hooks/useCustomDialog';
import { getResponseArray, getResponseObject } from '@/shared/utils/responseGuards';

// Sub-hooks
import { useInventoryLayout } from '@/domains/inventory/components/useInventoryLayout';
import { useProductSelection } from '@/domains/inventory/components/useProductSelection';
import { useCategoryManagement } from '@/domains/inventory/components/useCategoryManagement';
import { useProductActions } from '@/domains/inventory/components/useProductActions';

/**
 * A product with the lowercased search keys cached onto it.
 *
 * useProductList memoises these on first use so the filter loop does not
 * re-lowercase every name and barcode on each keystroke. They are runtime-only
 * additions, not server fields.
 */
interface SearchableProduct extends Product {
  _searchName?: string;
  _searchBarcodes?: string[];
}

/**
 * What the right-hand panel is showing. A single value instead of a bare
 * `isAddingProduct` boolean kept manually in sync with `selectedProduct` —
 * every state-changing call site sets this one value instead of updating
 * two things at once, so 'adding' and 'viewing' can't both be true from a
 * call site that forgets to clear the other.
 */
type PanelMode = 'none' | 'viewing' | 'adding';

interface UseProductListArgs {
  /** Selected category path, or 'all'. */
  categoryFilter: string;
  onCategoryChange: (path: string) => void;
  debouncedSearch: string;
  onSearchChange: (value: string) => void;
}

export default function useProductList({
  categoryFilter,
  onCategoryChange,
  debouncedSearch,
  onSearchChange,
}: UseProductListArgs) {
  const { dialogState, showError, showConfirm, closeDialog } = useCustomDialog();

  /** Auto-dismissing toast — not a blocking dialog, for confirmations that
   * don't need to interrupt the user (e.g. after they've already confirmed
   * the action itself via showConfirm). */
  const [notice, setNotice] = useState({ open: false, message: '' });
  const showNotification = useCallback((message: string) => {
    setNotice({ open: true, message });
  }, []);

  const [products, setProducts] = useState<SearchableProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>('none');
  const [selectedProductRefresh, setSelectedProductRefresh] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRange, setHistoryRange] = useState('thisMonth');
  /** Only read when historyRange === 'custom'; ISO date strings from a date input. */
  const [historyCustomStart, setHistoryCustomStart] = useState('');
  const [historyCustomEnd, setHistoryCustomEnd] = useState('');
  const [historyData, setHistoryData] = useState<ProductHistory | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [summaryTotals, setSummaryTotals] = useState<InventorySummaryTotals>({
    productCount: 0, totalQty: 0, totalCost: 0, totalSelling: 0, totalMrp: 0,
  });
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [stockFilter, setStockFilter] = useState('all');
  const [barcodeOverride, setBarcodeOverride] = useState<SearchableProduct[] | null>(null);

  const productsRequestId = useRef(0);
  const summaryRequestId = useRef(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const selectedProductRef = useRef<Product | null>(null);
  selectedProductRef.current = selectedProduct;

  const toTitleCase = (str: string): string => {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const fetchProducts = useCallback(async () => {
    const requestId = ++productsRequestId.current;
    setBarcodeOverride(null);
    try {
      const data = await inventoryService.fetchProducts({
        category: 'all',
        sortBy,
        sortOrder,
        pageSize: 10000,
      });
      const productsData = getResponseArray(data) as Product[];
      if (productsRequestId.current !== requestId) return;
      setProducts(productsData);

      if (selectedProductRef.current) {
        const refreshed = productsData.find(
          (p) => String(p.id) === String(selectedProductRef.current?.id)
        );
        if (refreshed) setSelectedProduct(refreshed);
      }
    } catch (error) {
      if (isRequestCanceled(error)) return;
      Sentry.captureException(error, { tags: { feature: 'inventory-products-fetch' } });
      console.error(error);
    }
  }, [sortBy, sortOrder]);

  // Always requests the same global, unfiltered totals — search/category
  // filtering of what's *displayed* is handled entirely client-side by
  // effectiveSummaryTotals below, which only falls back to summaryTotals
  // when no filter is active (see its early-return check). So this never
  // needs to vary by debouncedSearch/categoryFilter, and doesn't depend on
  // either.
  const fetchSummary = useCallback(async () => {
    const requestId = ++summaryRequestId.current;
    try {
      const data = await inventoryService.fetchSummary({ search: '', category: 'all' });
      if (summaryRequestId.current !== requestId) return;
      const totalsData = getResponseObject(data);
      setSummaryTotals(
        totalsData.totals || { productCount: 0, totalQty: 0, totalCost: 0, totalSelling: 0, totalMrp: 0 }
      );
      setCategoryCounts(totalsData.categoryCounts || {});
      setUncategorizedCount(totalsData.uncategorizedCount || 0);
      setTotalCount(totalsData.totalCount || 0);
    } catch (error) {
      if (isRequestCanceled(error)) return;
      Sentry.captureException(error, { tags: { feature: 'inventory-summary-fetch' } });
      console.error(error);
    }
  }, []);

  // Compose with specialized hooks
  const layout = useInventoryLayout();

  /** O(1) exact-barcode lookup for a scan, keyed by each pipe-separated
   * barcode segment — mirrors usePOSSearch.ts's barcodeMap, but keeps the
   * exact (not lowercased) match this page has always used, so scanning
   * behaves identically to before, just without the O(n) scan per lookup. */
  const barcodeMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      if (!p.barcode) continue;
      for (const code of p.barcode.split('|')) {
        map.set(code.trim(), p);
      }
    }
    return map;
  }, [products]);

  const displayedProducts = useMemo(() => {
    if (barcodeOverride) return barcodeOverride;
    let baseProducts = products;

    // Search should be global, ignore category filter if searching
    if (!debouncedSearch && categoryFilter && categoryFilter !== 'all') {
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
        (p) =>
          p.lowStockWarningEnabled &&
          (p.total_stock ?? 0) > 0 &&
          (p.total_stock ?? 0) <= p.lowStockThreshold
      );
    } else if (stockFilter === 'zero') {
      baseProducts = baseProducts.filter((p) => p.total_stock === 0);
    }

    if (!debouncedSearch) return baseProducts.slice(0, 1000);

    const query = debouncedSearch.toLowerCase();
    const namePrefix: SearchableProduct[] = [],
      barcodePrefix: SearchableProduct[] = [],
      nameContains: SearchableProduct[] = [],
      barcodeContains: SearchableProduct[] = [];

    for (const p of baseProducts) {
      const name = p._searchName || (p._searchName = p.name.toLowerCase());
      const barcodes =
        p._searchBarcodes ||
        (p._searchBarcodes = p.barcode
          ? p.barcode.toLowerCase().split('|').map((b: string) => b.trim())
          : []);

      if (name.startsWith(query)) namePrefix.push(p);
      else if (barcodes.some((b: string) => b.startsWith(query))) barcodePrefix.push(p);
      else if (name.includes(query)) nameContains.push(p);
      else if (barcodes.some((b: string) => b.includes(query))) barcodeContains.push(p);
    }

    const sortFn = (a: Product, b: Product) => (a.name || '').localeCompare(b.name || '');
    namePrefix.sort(sortFn);
    barcodePrefix.sort(sortFn);
    nameContains.sort(sortFn);
    barcodeContains.sort(sortFn);

    return [...namePrefix, ...barcodePrefix, ...nameContains, ...barcodeContains].slice(0, 1000);
  }, [barcodeOverride, products, debouncedSearch, stockFilter, categoryFilter]);

  const selectProduct = useCallback((product: Product | null) => {
    if (product?.id === selectedProduct?.id && panelMode !== 'adding') return;
    setPanelMode(product ? 'viewing' : 'none');
    setSelectedProduct(product);
    setSelectedProductDetails(null);
    setIsLoadingBatches(true);
    // Reset synchronously in the same batch as selectedProduct, not via a
    // round-trip through ProductDetailPanel's product-change effect — that
    // effect fires one render cycle later, which raced the history-fetch
    // effect below into fetching one extra product's history before the
    // panel's own tab-reset effect got a chance to close it.
    setHistoryOpen(false);
  }, [selectedProduct?.id, panelMode]);

  const selection = useProductSelection(displayedProducts, selectProduct);

  /** Selects + highlights a product outside the normal row-click path (e.g.
   * a barcode scan) — handleRowClick can't be reused here since it expects
   * a real React.MouseEvent for its shift/ctrl-click logic. */
  const selectProductProgrammatically = useCallback((product: Product) => {
    const id = String(product.id);
    selection.setSelectedIds(new Set([id]));
    selection.setLastSelectedId(id);
    selectProduct(product);
  }, [selection, selectProduct]);

  const handleOpenAddProduct = useCallback(() => {
    setPanelMode('adding');
    setSelectedProduct(null);
    setSelectedProductDetails(null);
    setHistoryOpen(false);
    selection.resetSelection();
  }, [selection]);

  const handleCloseAddProduct = useCallback(() => {
    setPanelMode('none');
  }, []);

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
    showError,
    showNotification
  );

  // Lifecycle
  useEffect(() => {
    setBarcodeOverride(null);
    setSelectedProduct(null);
    setSelectedProductDetails(null);
    setPanelMode('none');
    setHistoryOpen(false);
    selection.resetSelection();
  }, [categoryFilter]);

  useEffect(() => {
    if (!debouncedSearch && barcodeOverride) {
      setBarcodeOverride(null);
    }
  }, [debouncedSearch, barcodeOverride]);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    }, 100);
    const { fetchCategories } = categoriesContext;
    fetchCategories();
    return () => window.clearTimeout(focusTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesContext.fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [sortBy, sortOrder, fetchProducts]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

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
        Sentry.captureException(error, { tags: { feature: 'inventory-product-details-fetch' } });
        console.error(error);
        setSelectedProductDetails(null);
      } finally {
        if (!controller.signal.aborted) setIsLoadingBatches(false);
      }
    };
    fetchSelectedDetails();
    return () => controller.abort();
  }, [selectedProduct?.id, selectedProductRefresh]);

  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);

  const buildHistoryParams = useCallback(
    (page: number) =>
      historyRange === 'custom'
        ? { range: historyRange, startDate: historyCustomStart, endDate: historyCustomEnd, page }
        : { range: historyRange, page },
    [historyRange, historyCustomStart, historyCustomEnd]
  );

  useEffect(() => {
    if (!historyOpen || !selectedProduct?.id) return undefined;
    // Custom range needs both bounds before it's worth a request.
    if (historyRange === 'custom' && (!historyCustomStart || !historyCustomEnd)) return undefined;
    const controller = new AbortController();
    const fetchHistory = async () => {
      setIsHistoryLoading(true);
      setHistoryError(null);
      try {
        const data = await inventoryService.fetchProductHistory(
          selectedProduct.id,
          buildHistoryParams(1),
          { signal: controller.signal }
        );
        setHistoryData(data.data || null);
      } catch (error) {
        if (isRequestCanceled(error)) return;
        Sentry.captureException(error, { tags: { feature: 'inventory-product-history-fetch' } });
        console.error(error);
        setHistoryData(null);
        setHistoryError(getApiErrorMessage(error, 'Failed to load product history'));
      } finally {
        if (!controller.signal.aborted) setIsHistoryLoading(false);
      }
    };
    fetchHistory();
    return () => controller.abort();
  }, [historyOpen, historyRange, historyCustomStart, historyCustomEnd, selectedProduct?.id, buildHistoryParams]);

  const loadMoreHistory = useCallback(async () => {
    if (!selectedProduct?.id || isLoadingMoreHistory) return;
    const pagination = historyData?.pagination;
    if (!pagination || pagination.page >= pagination.totalPages) return;
    setIsLoadingMoreHistory(true);
    try {
      const data = await inventoryService.fetchProductHistory(
        selectedProduct.id,
        buildHistoryParams(pagination.page + 1)
      );
      const nextPage = data.data;
      if (!nextPage) return;
      setHistoryData((prev) =>
        prev
          ? { ...nextPage, movements: [...prev.movements, ...nextPage.movements] }
          : nextPage
      );
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'inventory-product-history-load-more' } });
      console.error(error);
      showError(getApiErrorMessage(error, 'Failed to load more history'));
    } finally {
      setIsLoadingMoreHistory(false);
    }
  }, [selectedProduct?.id, isLoadingMoreHistory, historyData?.pagination, buildHistoryParams, showError]);

  const effectiveSummaryTotals = useMemo<InventorySummaryTotals>(() => {
    let catProducts = products;

    if (barcodeOverride) {
      // A scan bypasses category/search/stock filtering entirely, same as
      // displayedProducts below — the summary must total just the one
      // scanned product, not whatever was filtered before the scan.
      catProducts = barcodeOverride;
    } else {
      // Mirrors displayedProducts' own rule below: search is global, so a
      // search term overrides the category filter rather than combining with
      // it. These two filters must stay in lockstep — if they diverge, the
      // summary bar and the table it sits above show different numbers for
      // the same on-screen state.
      if (!debouncedSearch && categoryFilter && categoryFilter !== 'all') {
        if (categoryFilter === 'uncategorized') {
          catProducts = catProducts.filter((p) => !p.category || p.category.trim() === '');
        } else {
          const prefix = `${categoryFilter}/`;
          catProducts = catProducts.filter(
            (p) => p.category === categoryFilter || (p.category && p.category.startsWith(prefix))
          );
        }
      }

      if (debouncedSearch) {
        const query = debouncedSearch.trim().toLowerCase();
        catProducts = catProducts.filter((p) => {
          const name = (p.name || '').toLowerCase();
          // Pipe-separated, matching how barcodes are actually stored/searched
          // elsewhere (see displayedProducts' _searchBarcodes below) — this
          // used to split on ',' instead, which doesn't match this app's
          // multi-barcode format at all.
          const barcodes = Array.isArray(p.barcode)
            ? p.barcode.map((b) => String(b).toLowerCase())
            : (p.barcode || '').toLowerCase().split('|').map((b) => b.trim());
          return name.includes(query) || barcodes.some((b) => b.includes(query));
        });
      }

      if (stockFilter === 'low') {
        catProducts = catProducts.filter(
          (p) =>
            p.lowStockWarningEnabled &&
            (p.total_stock ?? 0) > 0 &&
            (p.total_stock ?? 0) <= p.lowStockThreshold
        );
      } else if (stockFilter === 'zero') {
        catProducts = catProducts.filter((p) => (p.total_stock ?? 0) === 0);
      }
    }

    if (
      !barcodeOverride &&
      categoryFilter === 'all' &&
      !debouncedSearch &&
      stockFilter === 'all' &&
      summaryTotals.productCount > 0
    ) {
      return summaryTotals;
    }

    const productCount = catProducts.length;
    let totalQty = 0;
    let totalCost = 0;
    let totalSelling = 0;
    let totalMrp = 0;

    for (const p of catProducts) {
      const qty = Number(p.total_stock) || 0;
      totalQty += qty;

      let cost = Number(p.total_cost) || 0;
      let selling = Number(p.total_selling) || 0;
      let mrp = Number(p.mrp) || 0;

      if (!cost && p.batches && p.batches.length > 0) {
        cost = p.batches.reduce((sum, b) => sum + (Number(b.costPrice) || 0) * (Number(b.quantity) || 0), 0);
      } else if (!cost) {
        cost = (Number(p.cost_price) || 0) * qty;
      }

      if (!selling && p.batches && p.batches.length > 0) {
        selling = p.batches.reduce((sum, b) => sum + (Number(b.sellingPrice) || 0) * (Number(b.quantity) || 0), 0);
      } else if (!selling) {
        selling = (Number(p.selling_price) || 0) * qty;
      }

      if (!mrp && p.batches && p.batches.length > 0) {
        mrp = p.batches.reduce((sum, b) => sum + (Number(b.mrp) || 0) * (Number(b.quantity) || 0), 0);
      } else if (!mrp) {
        mrp = (Number(p.mrp) || 0) * qty;
      }

      totalCost += cost;
      totalSelling += selling;
      totalMrp += mrp > selling ? mrp : selling;
    }

    return {
      productCount,
      totalQty,
      totalCost,
      totalSelling,
      totalMrp,
    };
  }, [products, categoryFilter, debouncedSearch, stockFilter, summaryTotals, barcodeOverride]);

  // Computed values
  const averageMargin = useMemo(() => {
    if (effectiveSummaryTotals.totalSelling > 0) {
      return (((effectiveSummaryTotals.totalSelling - effectiveSummaryTotals.totalCost) / effectiveSummaryTotals.totalSelling) * 100).toFixed(1);
    }
    return '0.0';
  }, [effectiveSummaryTotals.totalCost, effectiveSummaryTotals.totalSelling]);

  const averageDiscount = useMemo(() => {
    if (effectiveSummaryTotals.totalMrp > 0) {
      return (((effectiveSummaryTotals.totalMrp - effectiveSummaryTotals.totalSelling) / effectiveSummaryTotals.totalMrp) * 100).toFixed(1);
    }
    return '0.0';
  }, [effectiveSummaryTotals.totalMrp, effectiveSummaryTotals.totalSelling]);

  const categoryLabel = categoryFilter === 'all' ? 'All Categories' : categoryFilter === 'uncategorized' ? 'Uncategorized' : categoryFilter;
  const displayProduct = selectedProductDetails || selectedProduct;
  const hasUncategorized = uncategorizedCount > 0;

  // Additional handlers
  const clearSearch = useCallback(() => {
    if (searchInputRef.current) searchInputRef.current.value = '';
    setSearchTerm('');
    onSearchChange('');
    setBarcodeOverride(null);
  }, [onSearchChange]);

  const handleReset = useCallback(() => {
    onCategoryChange('all');
    setStockFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setSearchTerm('');
    if (searchInputRef.current) searchInputRef.current.value = '';
    onSearchChange('');
    setBarcodeOverride(null);
    setPanelMode('none');
    setSelectedProduct(null);
    setSelectedProductDetails(null);
    setSelectedProductRefresh(0);
    setHistoryOpen(false);
    selection.resetSelection();
  }, [onCategoryChange, onSearchChange, selection]);

  const handleProductDoubleClick = useCallback(() => {
    setPanelMode('none');
    setSelectedProduct(null);
    setSelectedProductDetails(null);
    setHistoryOpen(false);
  }, []);

  const handleOpenHistory = useCallback(() => {
    setHistoryOpen(true);
  }, []);

  const handleListDragStart = (e: React.DragEvent, product: Product) => {
    const id = String(product.id);
    let dragIds: string[] = [String(id)];
    if (selection.selectedIds.has(id)) {
      dragIds = Array.from(selection.selectedIds).map(String);
    } else {
      selection.setSelectedIds(new Set([id]));
      selection.setLastSelectedId(id);
      setPanelMode('viewing');
      setSelectedProduct(product);
      setSelectedProductDetails(null);
      setIsLoadingBatches(true);
      setHistoryOpen(false);
    }
    e.dataTransfer.setData('text/plain', dragIds.join(','));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDrop = async (event: React.DragEvent, targetCategory: string) => {
    event.preventDefault();
    const productIdsStr = event.dataTransfer.getData('text/plain');
    if (!productIdsStr) return;
    const productIds = productIdsStr.split(',').filter(Boolean);
    const nextCategory = targetCategory === 'uncategorized' ? null : targetCategory;
    const productsToMove = productIds
      .map((id: string) => products.find((item) => String(item.id) === String(id)))
      .filter((p): p is SearchableProduct => Boolean(p) && (p!.category || null) !== nextCategory);

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
      Sentry.captureException(error, { tags: { feature: 'inventory-move-products' } });
      console.error(error);
      showError('Failed to move products: ' + getApiErrorMessage(error));
      fetchProducts();
    }
  };

  const handleSortRequest = (field: string) => {
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
    notice, setNotice,
    products, setProducts,
    setFilteredProducts: setBarcodeOverride,
    searchTerm, setSearchTerm,
    selectedProduct,
    selectedProductDetails,
    panelMode,
    historyOpen, setHistoryOpen,
    historyRange, setHistoryRange,
    historyCustomStart, setHistoryCustomStart,
    historyCustomEnd, setHistoryCustomEnd,
    historyData, historyError, isHistoryLoading,
    isLoadingMoreHistory, loadMoreHistory,
    sortBy, sortOrder,
    isLoadingBatches,
    summaryTotals: effectiveSummaryTotals, categoryCounts, uncategorizedCount, totalCount,
    stockFilter, setStockFilter,
    searchInputRef,
    barcodeMap,
    selectProductProgrammatically,
    // Computed
    displayedProducts, averageMargin, averageDiscount,
    categoryLabel, displayProduct, hasUncategorized,
    // Handlers
    fetchProducts, fetchSummary,
    clearSearch, handleReset,
    handleOpenAddProduct, handleCloseAddProduct,
    handleProductDoubleClick, handleListDragStart,
    handleOpenHistory, handleCloseHistory: () => setHistoryOpen(false),
    handleSortRequest, handleCategoryDrop,
    handleCategoryDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
  };
}
