import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as Sentry from '@sentry/react';

import { IPC } from '@/shared/ipcChannels';
import type { AuthUser } from '@/shared/types/auth';
import type {
  ShopMetadata,
  ShopMetadataPatch,
  ReceiptSettings,
} from '@/domains/settings/hooks/useSettings';
import settingsService from '@/shared/api/settingsService';
import { getApiErrorMessage } from '@/shared/api/api';
import { CONFIRM_PHRASE } from '@/domains/settings/components/WipeDatabaseConfirmation';

import {
  getChangeCalculatorEnabled,
  getPaymentMethodsEnabled,
  STORAGE_KEYS,
  getFullscreenEnabled,
  getNotificationDuration,
  getExtraDiscountEnabled,
  getCalculatorEnabled,
  getAdminAutoLogoutTime,
  DEFAULT_PAYMENT_SETTINGS,
  getDecodedPricesEnabled,
  getCustomerFeatureEnabled,
} from '@/shared/utils/paymentSettings';

interface UseStoreSettingsArgs {
  shopName: string;
  shopMetadata: ShopMetadata;
  onMetadataChange: (update: ShopMetadataPatch) => void | Promise<void>;
  currentUser?: AuthUser | null;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  receiptSettings?: ReceiptSettings;
  onSaveBillSettings?: (newSettings: ReceiptSettings) => Promise<boolean>;
}

export const useStoreSettings = ({
  shopName,
  shopMetadata,
  onMetadataChange,
  currentUser,
  showSuccess,
  showError,
  receiptSettings,
  onSaveBillSettings,
}: UseStoreSettingsArgs) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'bill') return 3;
    if (tabParam === 'account') return 0;
    if (tabParam === 'features') return 1;
    if (tabParam === 'payment') return 2;
    if (tabParam === 'display') return 4;
    if (tabParam === 'users') return 5;
    return 0;
  };

  const [tabValue, setTabValue] = useState(getInitialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'bill') setTabValue(3);
    else if (tabParam === 'account') setTabValue(0);
    else if (tabParam === 'features') setTabValue(1);
    else if (tabParam === 'payment') setTabValue(2);
    else if (tabParam === 'display') setTabValue(4);
    else if (tabParam === 'users') setTabValue(5);
  }, [searchParams]);

  // Bill & Receipt Settings State
  const [billSettings, setBillSettings] = useState<ReceiptSettings>(() => receiptSettings || {});

  useEffect(() => {
    if (receiptSettings) {
      setBillSettings(receiptSettings);
    }
  }, [receiptSettings]);

  const handleBillSettingChange = (field: string) => {
    setBillSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleBillTextSettingChange = (field: string, value: unknown) => {
    setBillSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Shop Account Info
  const [editedShopName, setEditedShopName] = useState(shopName);
  const [shopMobile, setShopMobile] = useState(shopMetadata.shopMobile || '');
  const [shopMobile2, setShopMobile2] = useState(shopMetadata.shopMobile2 || '');
  const [shopAddress, setShopAddress] = useState(shopMetadata.shopAddress || '');
  const [shopEmail, setShopEmail] = useState(shopMetadata.shopEmail || '');
  const [shopGST, setShopGST] = useState(shopMetadata.shopGST || '');
  const [logoUrl, setLogoUrl] = useState(shopMetadata.shopLogo || '');

  // App Updates
  const [updateStatus, setUpdateStatus] = useState<
    'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'latest' | null
  >(null);
  const [updateMessage, setUpdateMessage] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [appMetadata, setAppMetadata] = useState({ version: 'Unknown', lastUpdate: 'Unknown' });

  // Database Wipe
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipePassword, setWipePassword] = useState('');
  const [wipeConfirmPhrase, setWipeConfirmPhrase] = useState('');
  const [wipeLoading, setWipeLoading] = useState(false);

  // Display & Zoom
  const [uiZoom, setUiZoom] = useState(Number(localStorage.getItem('posUiZoom')) || 100);

  // POS Features
  const [looseSaleEnabled, setLooseSaleEnabled] = useState(
    localStorage.getItem('posLooseSaleEnabled') === 'true'
  );
  const [changeCalculatorEnabled, setChangeCalculatorEnabledState] = useState(
    getChangeCalculatorEnabled()
  );
  const [paymentMethodsEnabled, setPaymentMethodsEnabledState] = useState(
    getPaymentMethodsEnabled()
  );
  const [fullscreenEnabled, setFullscreenEnabled] = useState(getFullscreenEnabled());
  const [extraDiscountEnabled, setExtraDiscountEnabledState] = useState(getExtraDiscountEnabled());
  const [notificationDuration, setNotificationDurationState] = useState(
    () => getNotificationDuration() / 1000
  );
  const [calculatorEnabled, setCalculatorEnabledState] = useState(getCalculatorEnabled());
  const [adminAutoLogoutTime, setAdminAutoLogoutTimeState] = useState(getAdminAutoLogoutTime());
  const [weightedAverageCostEnabled, setWeightedAverageCostEnabled] = useState(false);
  const [customerFeatureEnabled, setCustomerFeatureEnabledState] = useState(getCustomerFeatureEnabled());

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [showDecodedPrices, setShowDecodedPrices] = useState(getDecodedPricesEnabled());

  // Saving indicator
  const [isSaving, setIsSaving] = useState(false);

  // Sync with metadata prop changes
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setEditedShopName(shopName || '');
      setShopMobile(shopMetadata.shopMobile || '');
      setShopMobile2(shopMetadata.shopMobile2 || '');
      setShopAddress(shopMetadata.shopAddress || '');
      setShopEmail(shopMetadata.shopEmail || '');
      setShopGST(shopMetadata.shopGST || '');
      setLogoUrl(shopMetadata.shopLogo || '');
    });

    return () => window.cancelAnimationFrame(frame);
  }, [shopName, shopMetadata]);

  // App Metadata & IPC Updater listeners
  useEffect(() => {
    const electron = window.electron;
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer
        .invoke<{ version: string; lastUpdate: string }>(IPC.GET_APP_METADATA)
        .then((data) => {
          setAppMetadata(data);
        });

      const onAvailable = () => {
        setUpdateStatus('available');
        setUpdateMessage('New update available!');
      };
      const onDownloaded = () => {
        setUpdateStatus('downloaded');
        setUpdateMessage('Update downloaded!');
      };
      const onError = (_event: unknown, msg: unknown) => {
        setUpdateStatus('error');
        setUpdateMessage('Update error: ' + String(msg));
      };
      const onNotAvailable = () => {
        setUpdateStatus('latest');
        setUpdateMessage('You are on the latest version!');
      };
      const onProgress = (_event: unknown, percent: unknown) => {
        setUpdateStatus('downloading');
        setDownloadProgress(Math.round(Number(percent)));
      };

      electron.ipcRenderer.on(IPC.UPDATE_AVAILABLE, onAvailable);
      electron.ipcRenderer.on(IPC.UPDATE_DOWNLOADED, onDownloaded);
      electron.ipcRenderer.on(IPC.UPDATE_ERROR, onError);
      electron.ipcRenderer.on(IPC.UPDATE_NOT_AVAILABLE, onNotAvailable);
      electron.ipcRenderer.on(IPC.DOWNLOAD_PROGRESS, onProgress);

      return () => {
        electron.ipcRenderer.off(IPC.UPDATE_AVAILABLE, onAvailable);
        electron.ipcRenderer.off(IPC.UPDATE_DOWNLOADED, onDownloaded);
        electron.ipcRenderer.off(IPC.UPDATE_ERROR, onError);
        electron.ipcRenderer.off(IPC.UPDATE_NOT_AVAILABLE, onNotAvailable);
        electron.ipcRenderer.off(IPC.DOWNLOAD_PROGRESS, onProgress);
      };
    }
  }, []);

  // Fetch UI server settings on mount
  useEffect(() => {
    const fetchUISettings = async () => {
      try {
        const res = await settingsService.fetchSettings();
        const settings = res.data;
        if (settings.posEnableExtraDiscount !== undefined) {
          setExtraDiscountEnabledState(settings.posEnableExtraDiscount);
        }
        if (settings.posNotificationDuration !== undefined) {
          setNotificationDurationState(settings.posNotificationDuration / 1000);
        }
        if (settings.posEnableWeightedAverageCost !== undefined) {
          setWeightedAverageCostEnabled(settings.posEnableWeightedAverageCost);
        }
        if (settings.posPaymentSettings) {
          setPaymentSettings(settings.posPaymentSettings);
        }
      } catch (error) {
        Sentry.captureException(error, { tags: { feature: 'settings-fetch-ui' } });
        console.error('Failed to fetch UI settings:', error);
      }
    };
    fetchUISettings();
  }, []);

  const handleTabChange = (newValue: number) => {
    if (showWipeConfirm) {
      setShowWipeConfirm(false);
      setWipePassword('');
      setWipeConfirmPhrase('');
    }
    setTabValue(newValue);
    const tabNames = ['account', 'features', 'payment', 'bill', 'display', 'users'];
    if (tabNames[newValue]) {
      setSearchParams({ tab: tabNames[newValue] }, { replace: true });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const saveStartedAt = Date.now();
    try {
      await onMetadataChange({
        shopName: editedShopName,
        shopMobile,
        shopMobile2,
        shopAddress,
        shopEmail,
        shopGST,
        shopLogo: logoUrl,
      });

      localStorage.setItem('posUiZoom', uiZoom.toString());
      localStorage.setItem('posLooseSaleEnabled', looseSaleEnabled.toString());
      localStorage.setItem(STORAGE_KEYS.enableFullscreen, JSON.stringify(fullscreenEnabled));
      localStorage.setItem(STORAGE_KEYS.enableChangeCalculator, JSON.stringify(changeCalculatorEnabled));
      localStorage.setItem(STORAGE_KEYS.enablePaymentMethods, JSON.stringify(paymentMethodsEnabled));
      localStorage.setItem(STORAGE_KEYS.enableCalculator, JSON.stringify(calculatorEnabled));
      localStorage.setItem(STORAGE_KEYS.paymentSettings, JSON.stringify(paymentSettings));
      localStorage.setItem(STORAGE_KEYS.enableDecodedPrices, JSON.stringify(showDecodedPrices));
      localStorage.setItem(STORAGE_KEYS.adminAutoLogoutTime, adminAutoLogoutTime.toString());
      localStorage.setItem(STORAGE_KEYS.enableExtraDiscount, JSON.stringify(extraDiscountEnabled));
      localStorage.setItem(STORAGE_KEYS.enableWeightedAverageCost, JSON.stringify(weightedAverageCostEnabled));
      localStorage.setItem(STORAGE_KEYS.notificationDuration, (notificationDuration * 1000).toString());
      localStorage.setItem(STORAGE_KEYS.enableCustomerFeature, JSON.stringify(customerFeatureEnabled));

      // Dispatch events immediately for instant UI response
      window.dispatchEvent(new Event('pos-settings-updated'));
      window.dispatchEvent(new Event('pos-ui-zoom-updated'));

      await Promise.all([
        settingsService.updateSettings({
          key: 'posEnableExtraDiscount',
          value: extraDiscountEnabled,
        }),
        settingsService.updateSettings({
          key: 'posNotificationDuration',
          value: notificationDuration * 1000,
        }),
        settingsService.updateSettings({
          key: 'posAdminAutoLogoutTime',
          value: adminAutoLogoutTime,
        }),
        settingsService.updateSettings({
          key: 'posEnableWeightedAverageCost',
          value: weightedAverageCostEnabled,
        }),
        settingsService.updateSettings({
          key: 'posPaymentSettings',
          value: paymentSettings,
        }),
      ]);

      if (onSaveBillSettings && billSettings) {
        await onSaveBillSettings(billSettings);
      }

      showSuccess('Settings saved successfully!');
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'settings-save-server' } });
      console.error('Failed to save settings:', error);
      showError('Failed to save some settings. Please try again.');
    } finally {
      // The save itself is usually near-instant (local settings + fast API
      // calls), so without a floor the button flips disabled->enabled fast
      // enough that its hover-color transition animates mid-flight and reads
      // as a flicker rather than a deliberate loading state.
      const MIN_SAVING_DURATION_MS = 400;
      const elapsed = Date.now() - saveStartedAt;
      if (elapsed < MIN_SAVING_DURATION_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_SAVING_DURATION_MS - elapsed));
      }
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEditedShopName(shopName || '');
    setShopMobile(shopMetadata.shopMobile || '');
    setShopMobile2(shopMetadata.shopMobile2 || '');
    setShopAddress(shopMetadata.shopAddress || '');
    setShopEmail(shopMetadata.shopEmail || '');
    setShopGST(shopMetadata.shopGST || '');
    setLogoUrl(shopMetadata.shopLogo || '');
    if (receiptSettings) {
      setBillSettings(receiptSettings);
    }
    setUiZoom(Number(localStorage.getItem('posUiZoom')) || 100);
    setLooseSaleEnabled(localStorage.getItem('posLooseSaleEnabled') === 'true');
    setFullscreenEnabled(getFullscreenEnabled());
    setChangeCalculatorEnabledState(getChangeCalculatorEnabled());
    setPaymentMethodsEnabledState(getPaymentMethodsEnabled());
    setCalculatorEnabledState(getCalculatorEnabled());
    setExtraDiscountEnabledState(getExtraDiscountEnabled());
    setAdminAutoLogoutTimeState(getAdminAutoLogoutTime());
    setShowDecodedPrices(getDecodedPricesEnabled());
    setCustomerFeatureEnabledState(getCustomerFeatureEnabled());
    showSuccess('Settings reverted to saved values.');
  };

  const handleWipeDatabase = async () => {
    if (!wipePassword) {
      showError('Please enter your admin password');
      return;
    }
    if (wipeConfirmPhrase !== CONFIRM_PHRASE) {
      showError('Please type the confirmation phrase exactly as shown');
      return;
    }

    if (!currentUser) {
      showError('No active session');
      return;
    }

    setWipeLoading(true);

    try {
      await settingsService.wipeDatabase({
        username: currentUser.username,
        password: wipePassword,
        confirmPhrase: wipeConfirmPhrase,
      });

      showSuccess('Database wiped successfully! The application will reload.');
      window.location.reload();
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'wipe-database' } });
      console.error('Wipe error:', error);
      showError(getApiErrorMessage(error, 'Failed to wipe database'));
      setWipeLoading(false);
    }
  };

  const handleCheckForUpdates = () => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send(IPC.CHECK_FOR_UPDATES);
      setUpdateStatus('checking');
      setUpdateMessage('Checking...');
    }
  };

  const handleStartDownload = () => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send(IPC.START_DOWNLOAD);
      setUpdateStatus('downloading');
    }
  };

  const handleRestartApp = () => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send(IPC.RESTART_APP);
    }
  };

  return {
    tabValue,
    handleTabChange,

    billSettings,
    handleBillSettingChange,
    handleBillTextSettingChange,

    editedShopName,
    setEditedShopName,
    shopMobile,
    setShopMobile,
    shopMobile2,
    setShopMobile2,
    shopAddress,
    setShopAddress,
    shopEmail,
    setShopEmail,
    shopGST,
    setShopGST,
    logoUrl,
    setLogoUrl,

    updateStatus,
    updateMessage,
    downloadProgress,
    appMetadata,
    handleCheckForUpdates,
    handleStartDownload,
    handleRestartApp,

    showWipeConfirm,
    setShowWipeConfirm,
    wipePassword,
    setWipePassword,
    wipeConfirmPhrase,
    setWipeConfirmPhrase,
    wipeLoading,
    handleWipeDatabase,

    uiZoom,
    setUiZoom,

    looseSaleEnabled,
    setLooseSaleEnabled,
    fullscreenEnabled,
    setFullscreenEnabled,
    weightedAverageCostEnabled,
    setWeightedAverageCostEnabled,
    extraDiscountEnabled,
    setExtraDiscountEnabledState,
    notificationDuration,
    setNotificationDurationState,
    adminAutoLogoutTime,
    setAdminAutoLogoutTimeState,
    calculatorEnabled,
    setCalculatorEnabledState,
    changeCalculatorEnabled,
    setChangeCalculatorEnabledState,
    paymentMethodsEnabled,
    setPaymentMethodsEnabledState,
    customerFeatureEnabled,
    setCustomerFeatureEnabledState,

    paymentSettings,
    setPaymentSettings,
    showDecodedPrices,
    setShowDecodedPrices,

    isSaving,
    handleSave,
    handleReset,
  };
};
