import { useState, useEffect } from 'react';
import settingsService from '../shared/api/settingsService';

const STORAGE_KEYS = {
  receipt: 'posReceiptSettings',
  shopName: 'posShopName',
  uiZoom: 'posUiZoom',
  monochromeMode: 'posMonochromeMode',
};

const DEFAULT_RECEIPT_SETTINGS = {
  shopName: true,
  header: true,
  footer: true,
  mrp: true,
  price: true,
  discount: true,
  totalValue: true,
  productName: true,
  exp: true,
  barcode: true,
  totalSavings: true,
  customShopName: 'Bachat Bazaar',
  customHeader: '123 Business Street, City',
  customFooter: 'Thank You! Visit Again',
  directPrint: true,
  printerType: '',
  paperSize: '72mm',
  fontSize: 0.7,
  itemFontSize: 0.7,
};

const getStoredShopName = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.shopName) || 'Bachat Bazaar';
  } catch {
    return 'Bachat Bazaar';
  }
};

const getStoredReceiptSettings = (fallbackShopName) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.receipt));
    return {
      ...DEFAULT_RECEIPT_SETTINGS,
      ...stored,
      customShopName: stored?.customShopName || fallbackShopName,
    };
  } catch {
    return {
      ...DEFAULT_RECEIPT_SETTINGS,
      customShopName: fallbackShopName,
    };
  }
};

export const useSettings = (showError) => {
  const initialShopName = getStoredShopName();
  const [shopName, setShopName] = useState(initialShopName);
  const [receiptSettings, setReceiptSettings] = useState(() =>
    getStoredReceiptSettings(initialShopName)
  );
  const [draftReceiptSettings, setDraftReceiptSettings] = useState(() =>
    getStoredReceiptSettings(initialShopName)
  );

  const [uiZoom, setUiZoom] = useState(
    () => Number(localStorage.getItem(STORAGE_KEYS.uiZoom)) || 100
  );
  const [monochromeMode, setMonochromeMode] = useState(
    () => localStorage.getItem(STORAGE_KEYS.monochromeMode) === 'true'
  );
  const [printers, setPrinters] = useState([]);
  const [defaultPrinter, setDefaultPrinter] = useState(null);

  const [shopMetadata, setShopMetadata] = useState({
    shopMobile: '',
    shopMobile2: '',
    shopAddress: '',
    shopEmail: '',
    shopGST: '',
    shopLogo: '',
  });

  const fetchSettings = async (retries = 3) => {
    try {
      const settings = await settingsService.fetchSettings();
      const data = settings.data;
      if (data.posShopName) setShopName(data.posShopName);
      if (data.posReceiptSettings) {
        setReceiptSettings(data.posReceiptSettings);
        setDraftReceiptSettings(data.posReceiptSettings);
      }
      setShopMetadata({
        shopMobile: data.shopMobile || '',
        shopMobile2: data.shopMobile2 || '',
        shopAddress: data.shopAddress || '',
        shopEmail: data.shopEmail || '',
        shopGST: data.shopGST || '',
        shopLogo: data.shopLogo || '',
      });
    } catch (error) {
      console.error(`Failed to fetch settings (remaining retries: ${retries}):`, error);
      if (retries > 0) {
        setTimeout(() => fetchSettings(retries - 1), 1000);
      }
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleSettingsUpdated = () => {
      setMonochromeMode(localStorage.getItem(STORAGE_KEYS.monochromeMode) === 'true');
    };
    window.addEventListener('pos-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('pos-settings-updated', handleSettingsUpdated);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${uiZoom}%`;
    localStorage.setItem(STORAGE_KEYS.uiZoom, uiZoom.toString());
  }, [uiZoom]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.monochromeMode, monochromeMode.toString());
  }, [monochromeMode]);

  useEffect(() => {
    const handleZoomUpdated = () => {
      setUiZoom(Number(localStorage.getItem(STORAGE_KEYS.uiZoom)) || 100);
    };
    window.addEventListener('pos-ui-zoom-updated', handleZoomUpdated);
    return () => window.removeEventListener('pos-ui-zoom-updated', handleZoomUpdated);
  }, []);

  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const printerList = await window.electron.ipcRenderer.invoke('get-printers');
        const list = Array.isArray(printerList) ? printerList : [];
        setPrinters(list);
        const defaultP = list.find((p) => p.isDefault);
        if (defaultP) setDefaultPrinter(defaultP.name);
      } catch (err) {
        console.error('Failed to get printers:', err);
        setPrinters([]);
      }
    };
    if (window.electron) fetchPrinters();
  }, []);

  const handleShopMetadataChange = async (newData) => {
    if (newData.shopName !== undefined) {
      setShopName(newData.shopName);
      setReceiptSettings((prev) => ({ ...prev, customShopName: newData.shopName }));
    }

    setShopMetadata((prev) => ({ ...prev, ...newData }));

    try {
      const settingsToUpdate = {};
      if (newData.shopName !== undefined) {
        settingsToUpdate.posShopName = newData.shopName;
        settingsToUpdate['posReceiptSettings.customShopName'] = newData.shopName;
      }

      const metadataKeys = [
        'shopMobile',
        'shopMobile2',
        'shopAddress',
        'shopEmail',
        'shopGST',
        'shopLogo',
      ];
      metadataKeys.forEach((key) => {
        if (newData[key] !== undefined) {
          settingsToUpdate[key] = newData[key];
        }
      });

      if (Object.keys(settingsToUpdate).length > 0) {
        await settingsService.updateSettings({ settings: settingsToUpdate });
      }
    } catch (error) {
      console.error('Failed to save shop metadata:', error);
      if (showError) showError('Failed to save some settings');
    }
  };

  const handleSaveBillSettings = async (newSettings) => {
    setReceiptSettings(newSettings);
    try {
      await settingsService.updateSettings({
        key: 'posReceiptSettings',
        value: newSettings,
      });
      return true;
    } catch (error) {
      console.error('Failed to save bill settings:', error);
      if (showError) showError('Failed to save bill settings');
      return false;
    }
  };

  return {
    shopName,
    setShopName,
    receiptSettings,
    setReceiptSettings,
    draftReceiptSettings,
    setDraftReceiptSettings,
    shopMetadata,
    uiZoom,
    setUiZoom,
    monochromeMode,
    setMonochromeMode,
    printers,
    defaultPrinter,
    handleShopMetadataChange,
    handleSaveBillSettings,
    fetchSettings,
  };
};
