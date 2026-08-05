import { useMemo, useCallback } from 'react';
import type { Batch, Product } from '@/shared/types/models';
import type {
  PromoSettings,
  PromoThresholdConfig,
} from '@/domains/promotions/types';

interface UsePOSPromotionsArgs {
  /** The buy-X-get-free settings blob; null when the feature is off. */
  promoSettings?: PromoSettings | null;
  /** Cart total before discounts, which decides which tier applies. */
  baseTotalAmount: number;
  totalProfit: number;
  products: Product[];
  /** productId -> units sold, from /api/reports/top-selling; ranks the gifts. */
  productSales: Record<number, number>;
  addFreeProductHook: (
    product: Product,
    config: PromoThresholdConfig | null,
    totalProfitValue: number
  ) => boolean | undefined;
  showNotification: (message: string, severity?: string) => void;
  refocus: () => void;
}

export const usePOSPromotions = ({
  promoSettings,
  baseTotalAmount,
  totalProfit,
  products,
  productSales,
  addFreeProductHook,
  showNotification,
  refocus,
}: UsePOSPromotionsArgs) => {
  const activeConfig = useMemo(() => {
    if (!promoSettings?.enabled || !promoSettings?.config?.length) return null;
    const metConfigs = promoSettings.config.filter(
      (c: PromoThresholdConfig) =>
        Number(baseTotalAmount) >= Number(c.threshold) && c.isActive !== false
    );
    if (metConfigs.length === 0) return null;
    return metConfigs.reduce((prev: PromoThresholdConfig, curr: PromoThresholdConfig) =>
      Number(curr.threshold) > Number(prev.threshold) ? curr : prev
    );
  }, [baseTotalAmount, promoSettings]);

  const eligibleFreeProducts = useMemo(() => {
    if (!activeConfig) return [];
    const profitLimit = Number(totalProfit) * (Number(activeConfig.profitPercentage || 20) / 100);
    const minCost = Number(activeConfig.minCostPrice || 0);
    const effectiveMaxCost =
      activeConfig.maxCostPrice !== null && activeConfig.maxCostPrice !== undefined
        ? Math.min(Number(activeConfig.maxCostPrice), profitLimit)
        : profitLimit;

    const filtered = products.filter((p: Product) => {
      const allowedGroups = activeConfig.allowedGroups || [];
      const productCategory = p.category || '';
      if (allowedGroups.length > 0) {
        const isAllowed = allowedGroups.some(
          (group: string) =>
            productCategory === group || productCategory.startsWith(`${group}/`)
        );
        if (!isAllowed) return false;
      }
      const disallowedGroups = activeConfig.disallowedGroups || [];
      if (disallowedGroups.length > 0) {
        const isDisallowed = disallowedGroups.some(
          (group: string) =>
            productCategory === group || productCategory.startsWith(`${group}/`)
        );
        if (isDisallowed) return false;
      }
      return (
        p.batches &&
        p.batches.some((b: Batch) => {
          const cp = Number(b.costPrice);
          return cp >= minCost && cp <= effectiveMaxCost + 0.001 && b.quantity > 0;
        })
      );
    });

    let finalGifts = filtered;
    if (activeConfig.sortBySales === 'most') {
      finalGifts = [...filtered].sort(
        (a: Product, b: Product) => (productSales[b.id] || 0) - (productSales[a.id] || 0)
      );
    } else if (activeConfig.sortBySales === 'least') {
      finalGifts = [...filtered].sort(
        (a: Product, b: Product) => (productSales[a.id] || 0) - (productSales[b.id] || 0)
      );
    }
    return finalGifts.slice(
      0,
      activeConfig.maxGiftsToShow !== undefined ? activeConfig.maxGiftsToShow : 5
    );
  }, [activeConfig, totalProfit, products, productSales]);

  const addFreeProduct = useCallback((product: Product) => {
    const success = addFreeProductHook(product, activeConfig, totalProfit);
    if (success) {
      showNotification(`${product.name} added as a free gift!`);
      refocus();
    } else {
      showNotification('No eligible batch found for this free product.', 'error');
    }
  }, [addFreeProductHook, activeConfig, totalProfit, showNotification, refocus]);

  return {
    activeConfig,
    eligibleFreeProducts,
    addFreeProduct,
  };
};
