import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Batch, Product } from '@/shared/types/models';
import type { PromoThresholdConfig } from '@/domains/promotions/types';
import type { CartItem, OrderTab } from '@/domains/pos/types';

/**
 * Hook to manage POS tabs and cart state
 */
export const usePOSTabs = () => {
  // Multi-tab state
  const [tabs, setTabs] = useState<OrderTab[]>(() => {
    try {
      const savedTabs = sessionStorage.getItem('posOrderTabs');
      if (savedTabs) {
        return JSON.parse(savedTabs);
      }
    } catch {
      console.error('Failed to parse saved tabs from session storage');
    }
    return [{ id: 1, name: 'Order 1', cart: [], discount: 0 }];
  });

  const [activeTabId, setActiveTabId] = useState<number>(() => {
    try {
      const savedActiveTab = sessionStorage.getItem('posActiveTabId');
      if (savedActiveTab) {
        return parseInt(savedActiveTab, 10);
      }
    } catch {
      console.error('Failed to parse saved active tab from session storage');
    }
    return 1;
  });

  const [lastAddedItemId, setLastAddedItemId] = useState<number | null>(null);

  // Save state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('posOrderTabs', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    sessionStorage.setItem('posActiveTabId', activeTabId.toString());
  }, [activeTabId]);

  const activeTab = useMemo(
    () =>
      tabs.find((t: OrderTab) => t.id === activeTabId) ||
      tabs[0] || { id: 1, name: 'Order 1', cart: [], discount: 0 },
    [tabs, activeTabId]
  );

  const cart = useMemo(() => activeTab.cart || [], [activeTab.cart]);
  const discount = useMemo(() => activeTab.discount || 0, [activeTab.discount]);

  const updateTab = useCallback((tabId: number, updates: Partial<OrderTab>) => {
    setTabs((prev: OrderTab[]) => prev.map((tab: OrderTab) => (tab.id === tabId ? { ...tab, ...updates } : tab)));
  }, []);

  const handleAddTab = useCallback(() => {
    const newId = tabs.reduce((max: number, t: OrderTab) => (t.id > max ? t.id : max), 0) + 1;
    const newTab: OrderTab = { id: newId, name: `Order ${newId}`, cart: [], discount: 0 };
    setTabs((prev: OrderTab[]) => [...prev, newTab]);
    setActiveTabId(newId);
  }, [tabs]);

  const handleCloseTab = useCallback(
    (tabId: number) => {
      setTabs((prev: OrderTab[]) => {
        if (prev.length === 1) {
          return [{ id: tabId, name: prev[0].name, cart: [], discount: 0 }];
        }
        const newTabs = prev.filter((t: OrderTab) => t.id !== tabId);
        if (activeTabId === tabId) {
          setActiveTabId(newTabs[newTabs.length - 1].id);
        }
        return newTabs;
      });
    },
    [activeTabId]
  );

  const setCart = useCallback(
    (newCartOrFn: CartItem[] | ((current: CartItem[]) => CartItem[])) => {
      setTabs((prev: OrderTab[]) =>
        prev.map((tab: OrderTab) => {
          if (tab.id === activeTabId) {
            const currentCart = tab.cart || [];
            const newCart =
              typeof newCartOrFn === 'function' ? newCartOrFn(currentCart) : newCartOrFn;
            return { ...tab, cart: newCart };
          }
          return tab;
        })
      );
    },
    [activeTabId]
  );

  const setDiscount = useCallback(
    (newDiscount: number) => {
      updateTab(activeTabId, { discount: newDiscount });
    },
    [activeTabId, updateTab]
  );

  const addToCart = useCallback(
    (product: Product, batch: Batch) => {
      setCart((prev: CartItem[]) => {
        const existing = prev.find((item: CartItem) => item.batch_id === batch.id);
        const newQuantity = existing ? existing.quantity + 1 : 1;

        const getPrice = (qty: number): number => {
          if (
            batch.wholesaleEnabled &&
            batch.wholesaleMinQty &&
            qty >= batch.wholesaleMinQty &&
            batch.wholesalePrice != null
          ) {
            return batch.wholesalePrice;
          }
          if (product.isOnSale && product.promoPrice != null && product.promoPrice < batch.sellingPrice) {
            return product.promoPrice;
          }
          return batch.sellingPrice;
        };

        const effectivePrice = getPrice(newQuantity);

        if (existing) {
          return prev.map((item: CartItem) =>
            item.batch_id === batch.id
              ? { ...item, quantity: newQuantity, price: effectivePrice }
              : item
          );
        }

        return [
          ...prev,
          {
            product_id: product.id,
            batch_id: batch.id,
            name: product.name,
            price: effectivePrice,
            quantity: 1,
            batch_code: batch.batchCode,
            mrp: batch.mrp,
            max_quantity: batch.quantity,
            sellingPrice: batch.sellingPrice,
            wholesaleEnabled: batch.wholesaleEnabled,
            wholesalePrice: batch.wholesalePrice,
            wholesaleMinQty: batch.wholesaleMinQty,
            isOnSale: !!(product.isOnSale && product.promoPrice != null && product.promoPrice < batch.sellingPrice),
            promoPrice: product.promoPrice,
            costPrice: batch.costPrice,
            isFree: false,
          },
        ];
      });
      setLastAddedItemId(batch.id);
    },
    [setCart]
  );

  const removeFromCart = useCallback(
    (batchId: number) => {
      setCart((prev: CartItem[]) => prev.filter((item: CartItem) => item.batch_id !== batchId));
    },
    [setCart]
  );

  const updateQuantity = useCallback(
    (batchId: number, change: number) => {
      setCart((prev: CartItem[]) =>
        prev.map((item: CartItem) => {
          if (item.batch_id === batchId) {
            if (item.isFree) return item;
            const newQty = item.quantity + change;
            if (newQty < 1) return item;

            let newPrice = item.sellingPrice;
            // isOnSale must be recomputed alongside price, not carried over
            // from when the item was added — otherwise bumping quantity into
            // the wholesale tier leaves a stale isOnSale:true (from the
            // original promo) even though wholesale now wins, which mislabels
            // the wholesale discount as a "sale" saving in the cart/summary.
            let newIsOnSale = false;
            if (
              item.wholesaleEnabled &&
              item.wholesaleMinQty &&
              newQty >= item.wholesaleMinQty &&
              item.wholesalePrice != null
            ) {
              newPrice = item.wholesalePrice;
            } else if (item.isOnSale && item.promoPrice != null) {
              newPrice = item.promoPrice;
              newIsOnSale = true;
            }

            return { ...item, quantity: newQty, price: newPrice, isOnSale: newIsOnSale };
          }
          return item;
        })
      );
    },
    [setCart]
  );

  const handleSetQuantity = useCallback(
    (batchId: number, quantity: number) => {
      if (quantity < 1) return;
      setCart((prev: CartItem[]) =>
        prev.map((item: CartItem) => {
          if (item.batch_id === batchId) {
            if (item.isFree) return item;
            let newPrice = item.sellingPrice;
            // Same fix as updateQuantity above — recompute isOnSale, don't
            // carry over a stale value from when the item was added.
            let newIsOnSale = false;
            if (
              item.wholesaleEnabled &&
              item.wholesaleMinQty &&
              quantity >= item.wholesaleMinQty &&
              item.wholesalePrice != null
            ) {
              newPrice = item.wholesalePrice;
            } else if (item.isOnSale && item.promoPrice != null) {
              newPrice = item.promoPrice;
              newIsOnSale = true;
            }
            return { ...item, quantity, price: newPrice, isOnSale: newIsOnSale };
          }
          return item;
        })
      );
    },
    [setCart]
  );

  const addFreeProduct = useCallback(
    (product: Product, config: PromoThresholdConfig | null, totalProfitValue: number) => {
      if (!config) return;

      const profitLimit = Number(totalProfitValue) * (Number(config.profitPercentage || 20) / 100);
      const minCost = Number(config.minCostPrice || 0);
      const maxCost = config.maxCostPrice !== null ? Number(config.maxCostPrice) : profitLimit;

      const batch = (product.batches || []).find((b: Batch) => {
        const cp = Number(b.costPrice);
        return cp >= minCost && cp <= maxCost + 0.001 && b.quantity > 0;
      });

      if (!batch) return false;

      const newFreeItem: CartItem = {
        product_id: product.id,
        batch_id: batch.id,
        name: `(FREE) ${product.name}`,
        price: 0,
        quantity: 1,
        batch_code: batch.batchCode,
        mrp: batch.mrp,
        max_quantity: batch.quantity,
        sellingPrice: batch.sellingPrice,
        wholesaleEnabled: false,
        wholesalePrice: null,
        wholesaleMinQty: null,
        isOnSale: false,
        promoPrice: null,
        costPrice: batch.costPrice,
        isFree: true,
        freeGiftThresholdAmount: config.threshold,
      };

      setCart((prev: CartItem[]) => {
        const filtered = prev.filter((item: CartItem) => !item.isFree);
        return [...filtered, newFreeItem];
      });
      return true;
    },
    [setCart]
  );

  const clearCart = useCallback(() => {
    updateTab(activeTabId, { cart: [], discount: 0 });
  }, [activeTabId, updateTab]);

  const subTotal = useMemo(
    () => cart.reduce((sum: number, item: CartItem) => sum + (item?.price || 0) * (item?.quantity || 0), 0),
    [cart]
  );
  const totalMrp = useMemo(
    () => cart.reduce((sum: number, item: CartItem) => sum + (item?.mrp || 0) * (item?.quantity || 0), 0),
    [cart]
  );
  /**
   * Extra saved specifically from active promotions/category sales — the
   * discount off the regular sellingPrice, not the broader MRP-vs-paid
   * margin totalSavings already covers. Only counts items currently flagged
   * isOnSale by usePOSPromotions/addToCart.
   */
  const saleSavings = useMemo(
    () =>
      cart.reduce((sum: number, item: CartItem) => {
        if (!item.isOnSale) return sum;
        return sum + Math.max(0, (item.sellingPrice || 0) - (item.price || 0)) * (item.quantity || 0);
      }, 0),
    [cart]
  );
  const totalCostPrice = useMemo(
    () => cart.reduce((sum: number, item: CartItem) => sum + (item?.costPrice || 0) * (item?.quantity || 0), 0),
    [cart]
  );
  const totalQty = useMemo(
    () => cart.reduce((sum: number, item: CartItem) => sum + (item?.quantity || 0), 0),
    [cart]
  );
  const baseTotalAmount = useMemo(() => Math.max(0, subTotal - discount), [subTotal, discount]);
  const totalProfit = useMemo(() => {
    return cart.reduce((sum: number, item: CartItem) => {
      if (item.isFree) return sum;
      const profitPerUnit = (item.price || 0) - (item.costPrice || 0);
      return sum + profitPerUnit * item.quantity;
    }, 0);
  }, [cart]);

  const alreadyHasFreeProduct = useMemo(() => cart.some((item: CartItem) => item.isFree), [cart]);

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    activeTab,
    cart,
    discount,
    setDiscount,
    addToCart,
    removeFromCart,
    updateQuantity,
    handleSetQuantity,
    addFreeProduct,
    handleAddTab,
    handleCloseTab,
    clearCart,
    lastAddedItemId,
    setLastAddedItemId,
    subTotal,
    totalMrp,
    saleSavings,
    totalCostPrice,
    totalQty,
    baseTotalAmount,
    totalProfit,
    alreadyHasFreeProduct,
  };
};
