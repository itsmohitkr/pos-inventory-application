import { useState, useEffect, useCallback, useRef } from 'react';
import inventoryService from '@/shared/api/inventoryService';
import settingsService from '@/shared/api/settingsService';
import dashboardService from '@/shared/api/dashboardService';
import {
  getStoredPaymentSettings,
  getFullscreenEnabled,
  getNotificationDuration,
  getExtraDiscountEnabled,
  getChangeCalculatorEnabled,
  getPaymentMethodsEnabled,
  getCalculatorEnabled,
  getDecodedPricesEnabled,
  getCustomerFeatureEnabled,
} from '@/shared/utils/paymentSettings';
import { getStoredReceiptSettings } from '@/domains/pos/components/posReceiptSettings';

export const usePOSData = (propReceiptSettings, propShopMetadata) => {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('posCachedProducts');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('posCurrentUser'));
    } catch {
      return null;
    }
  });

  const [receiptSettings, setReceiptSettings] = useState(
    () => propReceiptSettings || getStoredReceiptSettings()
  );
  const [paymentSettings, setPaymentSettings] = useState(() => getStoredPaymentSettings());
  const [fullscreenEnabled, setFullscreenEnabled] = useState(getFullscreenEnabled);
  const [extraDiscountEnabled, setExtraDiscountEnabled] = useState(() => getExtraDiscountEnabled());
  const [isCalculatorEnabled, setCalculatorEnabledState] = useState(getCalculatorEnabled);
  const [changeCalculatorEnabled, setChangeCalculatorEnabledState] = useState(
    getChangeCalculatorEnabled()
  );
  const [paymentMethodsEnabled, setPaymentMethodsEnabledState] = useState(getPaymentMethodsEnabled());
  const [notificationDuration, setNotificationDuration] = useState(() => getNotificationDuration());
  const [decodedPricesEnabled, setDecodedPricesEnabledState] = useState(() =>
    getDecodedPricesEnabled()
  );
  const [looseSaleEnabled, setLooseSaleEnabled] = useState(
    () => localStorage.getItem('posLooseSaleEnabled') !== 'false'
  );
  const [customerFeatureEnabled, setCustomerFeatureEnabled] = useState(() => getCustomerFeatureEnabled());
  const [promoSettings, setPromoSettings] = useState({ enabled: false, config: [] });
  const [productSales, setProductSales] = useState({});
  const [shopMetadata, setShopMetadata] = useState(
    () =>
      propShopMetadata || {
        shopMobile: '',
        shopMobile2: '',
        shopAddress: '',
        shopEmail: '',
        shopGST: '',
        shopLogo: '',
      }
  );

  const _refreshSettings = useCallback(async function runRefreshSettings(retries = 3) {
    try {
      const [settingsRes, topSellingData] = await Promise.all([
        settingsService.fetchSettings(),
        dashboardService.fetchTopSelling(),
      ]);

      const sett = settingsRes.data;

      if (sett.posReceiptSettings) {
        setReceiptSettings(prev => {
          if (JSON.stringify(prev) === JSON.stringify(sett.posReceiptSettings)) return prev;
          return sett.posReceiptSettings;
        });
      }

      if (sett.posPaymentSettings) {
        setPaymentSettings(prev => {
          if (JSON.stringify(prev) === JSON.stringify(sett.posPaymentSettings)) return prev;
          return sett.posPaymentSettings;
        });
      }

      if (sett.posEnableExtraDiscount !== undefined) {
        setExtraDiscountEnabled(prev => prev === sett.posEnableExtraDiscount ? prev : sett.posEnableExtraDiscount);
      }

      if (sett.posNotificationDuration !== undefined) {
        setNotificationDuration(prev => prev === sett.posNotificationDuration ? prev : sett.posNotificationDuration);
      }

      setProductSales(prev => {
        if (JSON.stringify(prev) === JSON.stringify(topSellingData)) return prev;
        return topSellingData || {};
      });

      setShopMetadata(prev => {
        const next = {
          shopMobile: sett.shopMobile || '',
          shopMobile2: sett.shopMobile2 || '',
          shopAddress: sett.shopAddress || '',
          shopEmail: sett.shopEmail || '',
          shopGST: sett.shopGST || '',
          shopLogo: sett.shopLogo || '',
        };
        if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
        return next;
      });

      if (sett.promotion_buy_x_get_free) {
        const data = sett.promotion_buy_x_get_free;
        if (data.thresholds && !data.config) {
          const migratedConfig = data.thresholds.map((t) => ({
            threshold: t,
            isActive: true,
            profitPercentage: data.profitPercentage || 20,
            minCostPrice: data.minCostPrice || 0,
            maxCostPrice: data.maxCostPrice || null,
            sortBySales: data.sortBySales || 'none',
            maxGiftsToShow: data.maxGiftsToShow || 5,
          }));
          setPromoSettings(prev => {
            const next = { enabled: data.enabled || false, config: migratedConfig };
            if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
            return next;
          });
        } else {
          setPromoSettings(prev => {
            const next = { enabled: data.enabled || false, config: data.config || [] };
            if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
            return next;
          });
        }
      }
    } catch (error) {
      console.error(`Failed to refresh POS settings (remaining retries: ${retries}):`, error);
      if (retries > 0 && mountedRef.current) setTimeout(() => runRefreshSettings(retries - 1), 1000);
    }
  }, []);

  const fetchProducts = useCallback(async function runFetchProducts(retries = 3) {
    try {
      const res = await inventoryService.fetchProducts({ includeBatches: true });
      const data = res.data;
      setProducts(data);
      try {
        localStorage.setItem('posCachedProducts', JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to cache products:', e);
      }
    } catch (err) {
      console.error(`Error fetching products (remaining retries: ${retries}):`, err);
      if (retries > 0 && mountedRef.current) setTimeout(() => runFetchProducts(retries - 1), 1000);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    _refreshSettings();
    const interval = setInterval(() => {
      fetchProducts();
      _refreshSettings();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchProducts, _refreshSettings]);

  useEffect(() => {
    const handleSettingsUpdated = () => {
      setReceiptSettings(getStoredReceiptSettings());
      setFullscreenEnabled(getFullscreenEnabled());
      setPaymentSettings(getStoredPaymentSettings());
      setNotificationDuration(getNotificationDuration());
      setExtraDiscountEnabled(getExtraDiscountEnabled());
      setChangeCalculatorEnabledState(getChangeCalculatorEnabled());
      setPaymentMethodsEnabledState(getPaymentMethodsEnabled());
      setDecodedPricesEnabledState(getDecodedPricesEnabled());
      setCalculatorEnabledState(getCalculatorEnabled());
      setLooseSaleEnabled(localStorage.getItem('posLooseSaleEnabled') !== 'false');
      setCustomerFeatureEnabled(getCustomerFeatureEnabled());
    };
    window.addEventListener('pos-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('pos-settings-updated', handleSettingsUpdated);
  }, []);

  return {
    products,
    currentUser,
    receiptSettings,
    setReceiptSettings,
    paymentSettings,
    fullscreenEnabled,
    extraDiscountEnabled,
    isCalculatorEnabled,
    changeCalculatorEnabled,
    paymentMethodsEnabled,
    notificationDuration,
    decodedPricesEnabled,
    looseSaleEnabled,
    promoSettings,
    productSales,
    shopMetadata,
    fetchProducts,
    customerFeatureEnabled,
    _refreshSettings,
  };
};
