import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook to manage POS tabs and cart state
 */
export const usePOSTabs = () => {
  // Multi-tab state
  const [tabs, setTabs] = useState(() => {
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

  const [activeTabId, setActiveTabId] = useState(() => {
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

  const [lastAddedItemId, setLastAddedItemId] = useState(null);

  // Save state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('posOrderTabs', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    sessionStorage.setItem('posActiveTabId', activeTabId.toString());
  }, [activeTabId]);

  const activeTab = useMemo(
    () =>
      tabs.find((t) => t.id === activeTabId) ||
      tabs[0] || { id: 1, name: 'Order 1', cart: [], discount: 0 },
    [tabs, activeTabId]
  );

  const cart = useMemo(() => activeTab.cart || [], [activeTab.cart]);
  const discount = useMemo(() => activeTab.discount || 0, [activeTab.discount]);

  const updateTab = useCallback((tabId, updates) => {
    setTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)));
  }, []);

  const handleAddTab = useCallback(() => {
    const newId = Math.max(...tabs.map((t) => t.id), 0) + 1;
    const newTab = { id: newId, name: `Order ${newId}`, cart: [], discount: 0 };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  }, [tabs]);

  const handleCloseTab = useCallback(
    (tabId) => {
      setTabs((prev) => {
        if (prev.length === 1) {
          return [{ id: tabId, name: prev[0].name, cart: [], discount: 0 }];
        }
        const newTabs = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          setActiveTabId(newTabs[newTabs.length - 1].id);
        }
        return newTabs;
      });
    },
    [activeTabId]
  );

  const setCart = useCallback(
    (newCartOrFn) => {
      setTabs((prev) =>
        prev.map((tab) => {
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
    (newDiscount) => {
      updateTab(activeTabId, { discount: newDiscount });
    },
    [activeTabId, updateTab]
  );

  const addToCart = useCallback(
    (product, batch) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.batch_id === batch.id);
        const newQuantity = existing ? existing.quantity + 1 : 1;

        const getPrice = (qty) => {
          if (batch.wholesaleEnabled && batch.wholesaleMinQty && qty >= batch.wholesaleMinQty) {
            return batch.wholesalePrice;
          }
          if (product.isOnSale && product.promoPrice < batch.sellingPrice) {
            return product.promoPrice;
          }
          return batch.sellingPrice;
        };

        const effectivePrice = getPrice(newQuantity);

        if (existing) {
          return prev.map((item) =>
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
            isOnSale: product.isOnSale && product.promoPrice < batch.sellingPrice,
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
    (batchId) => {
      setCart((prev) => prev.filter((item) => item.batch_id !== batchId));
    },
    [setCart]
  );

  const updateQuantity = useCallback(
    (batchId, change) => {
      setCart((prev) =>
        prev.map((item) => {
          if (item.batch_id === batchId) {
            if (item.isFree) return item;
            const newQty = item.quantity + change;
            if (newQty < 1) return item;

            let newPrice = item.sellingPrice;
            if (item.wholesaleEnabled && item.wholesaleMinQty && newQty >= item.wholesaleMinQty) {
              newPrice = item.wholesalePrice;
            } else if (item.isOnSale) {
              newPrice = item.promoPrice;
            }

            return { ...item, quantity: newQty, price: newPrice };
          }
          return item;
        })
      );
    },
    [setCart]
  );

  const handleSetQuantity = useCallback(
    (batchId, quantity) => {
      if (quantity < 1) return;
      setCart((prev) =>
        prev.map((item) => {
          if (item.batch_id === batchId) {
            if (item.isFree) return item;
            let newPrice = item.sellingPrice;
            if (item.wholesaleEnabled && item.wholesaleMinQty && quantity >= item.wholesaleMinQty) {
              newPrice = item.wholesalePrice;
            } else if (item.isOnSale) {
              newPrice = item.promoPrice;
            }
            return { ...item, quantity, price: newPrice };
          }
          return item;
        })
      );
    },
    [setCart]
  );

  const addFreeProduct = useCallback(
    (product, config, totalProfitValue) => {
      if (!config) return;

      const profitLimit = Number(totalProfitValue) * (Number(config.profitPercentage || 20) / 100);
      const minCost = Number(config.minCostPrice || 0);
      const maxCost = config.maxCostPrice !== null ? Number(config.maxCostPrice) : profitLimit;

      const batch = product.batches.find((b) => {
        const cp = Number(b.costPrice);
        return cp >= minCost && cp <= maxCost + 0.001 && b.quantity > 0;
      });

      if (!batch) return false;

      const newFreeItem = {
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
      };

      setCart((prev) => {
        const filtered = prev.filter((item) => !item.isFree);
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
    () => cart.reduce((sum, item) => sum + (item?.price || 0) * (item?.quantity || 0), 0),
    [cart]
  );
  const totalMrp = useMemo(
    () => cart.reduce((sum, item) => sum + (item?.mrp || 0) * (item?.quantity || 0), 0),
    [cart]
  );
  const totalCostPrice = useMemo(
    () => cart.reduce((sum, item) => sum + (item?.costPrice || 0) * (item?.quantity || 0), 0),
    [cart]
  );
  const totalQty = useMemo(
    () => cart.reduce((sum, item) => sum + (item?.quantity || 0), 0),
    [cart]
  );
  const baseTotalAmount = useMemo(() => Math.max(0, subTotal - discount), [subTotal, discount]);
  const totalProfit = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.isFree) return sum;
      const profitPerUnit = (item.price || 0) - (item.costPrice || 0);
      return sum + profitPerUnit * item.quantity;
    }, 0);
  }, [cart]);

  const alreadyHasFreeProduct = useMemo(() => cart.some((item) => item.isFree), [cart]);

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
    totalCostPrice,
    totalQty,
    baseTotalAmount,
    totalProfit,
    alreadyHasFreeProduct,
  };
};
