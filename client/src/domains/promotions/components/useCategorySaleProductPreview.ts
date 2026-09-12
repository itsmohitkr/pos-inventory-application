import React, { useState, useEffect } from 'react';
import type { CategorySale, CategorySaleProductPreview } from '@/domains/promotions/types';
import categorySaleService from '@/shared/api/categorySaleService';
import type { ProductOverride } from '@/domains/promotions/components/useCategorySaleOverrides';

type SortField = keyof CategorySaleProductPreview;

/** Which bucket a preview row falls into — drives both the summary counts and the filter chips. */
export type RowStatusFilter =
  | 'all'
  | 'eligible'
  | 'alreadyBetter'
  | 'marginProtected'
  | 'overridden'
  | 'noPricingData'
  | 'excluded';

interface UseCategorySaleProductPreviewArgs {
  open: boolean;
  category: string;
  discountPercentage: string;
  saleToEdit?: CategorySale | null;
  productOverrides: Map<number, ProductOverride>;
}

/**
 * Fetches (debounced) the products a category-sale discount would apply to,
 * plus everything derived from that list: sorting, the include/exclude
 * selection, the status filter chips, and the summary counts they share.
 */
export function useCategorySaleProductPreview({
  open,
  category,
  discountPercentage,
  saleToEdit,
  productOverrides,
}: UseCategorySaleProductPreviewArgs) {
  const [previewProducts, setPreviewProducts] = useState<CategorySaleProductPreview[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RowStatusFilter>('all');

  const [orderBy, setOrderBy] = useState<SortField>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const handleRequestSort = (property: SortField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedProducts = React.useMemo(() => {
    return [...previewProducts].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return order === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
  }, [previewProducts, orderBy, order]);

  // Reset the view filter whenever the dialog is (re)opened for a different
  // sale — mirrors the field-population effect in useCategorySaleForm.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusFilter('all');
  }, [saleToEdit, open]);

  // Debounced product preview fetching to prevent recalculation screen flickering
  useEffect(() => {
    // A new category/discount invalidates the previous filter selection —
    // reset it before the (debounced) refetch below replaces the underlying data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusFilter('all');
    const discount = parseFloat(discountPercentage);
    if (!category || isNaN(discount) || discount <= 0 || discount > 100) {
      setPreviewProducts([]);
      setSelectedProductIds(new Set());
      return;
    }

    let isMounted = true;
    setLoadingPreview(true);
    setPreviewError(null);

    const timer = setTimeout(() => {
      categorySaleService
        .previewProducts(category, discount)
        .then((data) => {
          if (isMounted) {
            setPreviewProducts(data);
            setLoadingPreview(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setPreviewError('Failed to load product preview');
            setLoadingPreview(false);
          }
        });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [category, discountPercentage]);

  // Sync selectedProductIds when previewProducts or saleToEdit changes
  useEffect(() => {
    if (previewProducts.length > 0) {
      if (saleToEdit && saleToEdit.category === category && saleToEdit.excludedProductIds) {
        const excluded = new Set(saleToEdit.excludedProductIds);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedProductIds(new Set(previewProducts.map((p) => p.id).filter((id) => !excluded.has(id))));
      } else {
        setSelectedProductIds(new Set(previewProducts.map((p) => p.id)));
      }
    } else {
      setSelectedProductIds(new Set());
    }
  }, [previewProducts, saleToEdit, category]);

  const handleToggleProduct = (id: number) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedProductIds(new Set(previewProducts.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedProductIds(new Set());
  };

  const isAllSelected =
    previewProducts.length > 0 && previewProducts.every((p) => selectedProductIds.has(p.id));
  const isSomeSelected =
    previewProducts.some((p) => selectedProductIds.has(p.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      handleDeselectAll();
    } else {
      handleSelectAll();
    }
  };

  /**
   * Single source of truth for which bucket a row falls into — used by both
   * the summary counts and the clickable filter chips, so they can never
   * disagree with each other.
   */
  const getRowStatus = React.useCallback(
    (p: CategorySaleProductPreview): RowStatusFilter => {
      if (!selectedProductIds.has(p.id)) return 'excluded';
      if (!p.hasPricingData) return 'noPricingData';
      if (productOverrides.has(p.id)) return 'overridden';
      if (p.noAdditionalDiscount) return 'alreadyBetter';
      if (p.marginProtected) return 'marginProtected';
      return 'eligible';
    },
    [selectedProductIds, productOverrides]
  );

  // Cheap to derive from what's already loaded — no separate server call.
  const summaryCounts = React.useMemo(() => {
    const counts = {
      eligible: 0,
      alreadyBetter: 0,
      marginProtected: 0,
      overridden: 0,
      noPricingData: 0,
      excluded: 0,
    };
    previewProducts.forEach((p) => {
      const status = getRowStatus(p);
      counts[status] += 1;
    });
    return counts;
  }, [previewProducts, getRowStatus]);

  /**
   * Rough guidance for picking a discount: what suppliers already give us
   * (vendor discount off MRP) vs. what we already pass on to customers
   * (regular selling-price discount off MRP), averaged across products that
   * actually have pricing data. Purely informational — not used in any
   * calculation.
   */
  const avgDiscounts = React.useMemo(() => {
    const priced = previewProducts.filter((p) => p.hasPricingData);
    if (priced.length === 0) return null;
    const avgVendor =
      priced.reduce((sum, p) => sum + p.vendorDiscountPercentage, 0) / priced.length;
    const avgCustomer =
      priced.reduce((sum, p) => sum + p.currentCustomerDiscountPercentage, 0) / priced.length;
    return { avgVendor, avgCustomer };
  }, [previewProducts]);

  const filteredProducts = React.useMemo(() => {
    if (statusFilter === 'all') return sortedProducts;
    return sortedProducts.filter((p) => getRowStatus(p) === statusFilter);
  }, [sortedProducts, statusFilter, getRowStatus]);

  return {
    previewProducts,
    selectedProductIds,
    loadingPreview,
    previewError,
    statusFilter,
    setStatusFilter,
    orderBy,
    order,
    handleRequestSort,
    filteredProducts,
    handleToggleProduct,
    handleSelectAll,
    handleDeselectAll,
    isAllSelected,
    isSomeSelected,
    handleToggleSelectAll,
    getRowStatus,
    summaryCounts,
    avgDiscounts,
  };
}
