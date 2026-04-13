import React, { useState, useEffect } from 'react';
import settingsService from '../../shared/api/settingsService';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close as CloseIcon,
  Store as StoreIcon,
  DeleteForever as DeleteForeverIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
  DisplaySettings as DisplayIcon,
} from '@mui/icons-material';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../shared/hooks/useCustomDialog';
import PaymentSettingsPanel from './PaymentSettingsPanel';
import AccountDetailsTab from './AccountDetailsTab';
import DisplaySettingsTab from './DisplaySettingsTab';
import WipeDatabaseConfirmation from './WipeDatabaseConfirmation';
import {
  getChangeCalculatorEnabled,
  setChangeCalculatorEnabled,
  getPaymentMethodsEnabled,
  setPaymentMethodsEnabled,
  STORAGE_KEYS,
  getFullscreenEnabled,
  getNotificationDuration,
  getExtraDiscountEnabled,
  getCalculatorEnabled,
  setCalculatorEnabled,
  getAdminAutoLogoutTime,
  setAdminAutoLogoutTime,
  DEFAULT_PAYMENT_SETTINGS,
  getDecodedPricesEnabled,
} from '../../shared/utils/paymentSettings';

const AccountDetailsDialog = ({
  open,
  onClose,
  shopName,
  shopMetadata,
  onMetadataChange,
  currentUser,
}) => {
  const { dialogState, showSuccess, showError, closeDialog } = useCustomDialog();
  const [editedShopName, setEditedShopName] = useState(shopName);
  const [shopMobile, setShopMobile] = useState(shopMetadata.shopMobile);
  const [shopMobile2, setShopMobile2] = useState(shopMetadata.shopMobile2);
  const [shopAddress, setShopAddress] = useState(shopMetadata.shopAddress);
  const [shopEmail, setShopEmail] = useState(shopMetadata.shopEmail);
  const [shopGST, setShopGST] = useState(shopMetadata.shopGST);
  const [logoUrl, setLogoUrl] = useState(shopMetadata.shopLogo);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [updateMessage, setUpdateMessage] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [appMetadata, setAppMetadata] = useState({ version: 'Unknown', lastUpdate: 'Unknown' });
  // Add missing state variables
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipePassword, setWipePassword] = useState('');
  const [wipeLoading, setWipeLoading] = useState(false);
  const [uiZoom, setUiZoom] = useState(Number(localStorage.getItem('posUiZoom')) || 100);
  const [monochrome, setMonochrome] = useState(
    localStorage.getItem('posMonochromeMode') === 'true'
  );
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
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [showDecodedPrices, setShowDecodedPrices] = useState(getDecodedPricesEnabled());
  const [tabValue, setTabValue] = useState(0);

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

  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      // Fetch metadata
      window.electron.ipcRenderer.invoke('get-app-metadata').then((data) => {
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
      const onError = (_event, msg) => {
        setUpdateStatus('error');
        setUpdateMessage('Update error: ' + msg);
      };
      const onNotAvailable = () => {
        setUpdateStatus('latest');
        setUpdateMessage('You are on the latest version!');
      };
      const onProgress = (_event, percent) => {
        setUpdateStatus('downloading');
        setDownloadProgress(Math.round(percent));
      };

      window.electron.ipcRenderer.on('update-available', onAvailable);
      window.electron.ipcRenderer.on('update-downloaded', onDownloaded);
      window.electron.ipcRenderer.on('update-error', onError);
      window.electron.ipcRenderer.on('update-not-available', onNotAvailable);
      window.electron.ipcRenderer.on('download-progress', onProgress);

      return () => {
        window.electron.ipcRenderer.off('update-available', onAvailable);
        window.electron.ipcRenderer.off('update-downloaded', onDownloaded);
        window.electron.ipcRenderer.off('update-error', onError);
        window.electron.ipcRenderer.off('update-not-available', onNotAvailable);
        window.electron.ipcRenderer.off('download-progress', onProgress);
      };
    }
  }, []);

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
        console.error('Failed to fetch UI settings:', error);
      }
    };
    if (open) {
      fetchUISettings();
    }
  }, [open]);

  const handleSave = () => {
    onMetadataChange({
      shopName: editedShopName,
      shopMobile,
      shopMobile2,
      shopAddress,
      shopEmail,
      shopGST,
      shopLogo: logoUrl,
    });

    localStorage.setItem('posUiZoom', uiZoom.toString());
    localStorage.setItem('posMonochromeMode', monochrome.toString());
    localStorage.setItem('posLooseSaleEnabled', looseSaleEnabled.toString());
    localStorage.setItem(STORAGE_KEYS.enableFullscreen, JSON.stringify(fullscreenEnabled));
    localStorage.setItem(STORAGE_KEYS.enableChangeCalculator, JSON.stringify(changeCalculatorEnabled));
    localStorage.setItem(STORAGE_KEYS.enablePaymentMethods, JSON.stringify(paymentMethodsEnabled));
    localStorage.setItem(STORAGE_KEYS.enableCalculator, JSON.stringify(calculatorEnabled));
    localStorage.setItem(STORAGE_KEYS.paymentSettings, JSON.stringify(paymentSettings));
    localStorage.setItem(STORAGE_KEYS.enableDecodedPrices, JSON.stringify(showDecodedPrices));
    localStorage.setItem(STORAGE_KEYS.adminAutoLogoutTime, adminAutoLogoutTime.toString());

    // Dispatch events immediately for instant UI response
    window.dispatchEvent(new Event('pos-settings-updated'));
    window.dispatchEvent(new Event('pos-ui-zoom-updated'));

    const saveSettingsToServer = async () => {
      try {
        await settingsService.updateSettings({
          key: 'posEnableExtraDiscount',
          value: extraDiscountEnabled,
        });
        await settingsService.updateSettings({
          key: 'posNotificationDuration',
          value: notificationDuration * 1000,
        });
        await settingsService.updateSettings({
          key: 'posAdminAutoLogoutTime',
          value: adminAutoLogoutTime,
        });
        await settingsService.updateSettings({
          key: 'posEnableWeightedAverageCost',
          value: weightedAverageCostEnabled,
        });
        await settingsService.updateSettings({
          key: 'posPaymentSettings',
          value: paymentSettings,
        });
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    };
    saveSettingsToServer();

    setChangeCalculatorEnabled(changeCalculatorEnabled);
    setPaymentMethodsEnabled(paymentMethodsEnabled);
    setCalculatorEnabled(calculatorEnabled);
    setAdminAutoLogoutTime(adminAutoLogoutTime);

    showSuccess('Settings saved successfully!');
    onClose();
  };

  const handleWipeDatabase = async () => {
    if (!wipePassword) {
      showError('Please enter your admin password');
      return;
    }

    setWipeLoading(true);

    try {
      await settingsService.wipeDatabase({
        username: currentUser.username,
        password: wipePassword,
      });

      showSuccess('Database wiped successfully! The application will reload.');
      window.location.reload();
    } catch (error) {
      console.error('Wipe error:', error);
      showError(error.response?.data?.error || 'Failed to wipe database');
      setWipeLoading(false);
    }
  };

  const handleClose = () => {
    if (showWipeConfirm) {
      setShowWipeConfirm(false);
      setWipePassword('');
    } else {
      setEditedShopName(shopName);
      onClose();
    }
  };

  const handleDialogClose = (_event, reason) => {
    if (showWipeConfirm && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    handleClose();
  };

  const handleCheckForUpdates = () => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('check-for-updates');
      setUpdateStatus('checking');
      setUpdateMessage('Checking...');
    }
  };

  const handleStartDownload = () => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('start-download');
      setUpdateStatus('downloading');
    }
  };

  const handleRestartApp = () => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('restart-app');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={showWipeConfirm}
        onKeyDown={(event) => {
          if (event.defaultPrevented) return;
          if (event.key !== 'Enter') return;
          if (event.shiftKey) return;
          if (event.target?.tagName === 'TEXTAREA') return;
          event.preventDefault();
          if (showWipeConfirm) {
            if (!wipePassword || wipeLoading) return;
            handleWipeDatabase();
            return;
          }
          handleSave();
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StoreIcon color="primary" />
            <Typography variant="h6">Settings</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            aria-label="settings tabs"
          >
            <Tab icon={<StoreIcon />} label="Account Details" sx={{ gap: 1 }} />
            <Tab icon={<PaymentIcon />} label="Payment Settings" sx={{ gap: 1 }} />
            <Tab icon={<DisplayIcon />} label="Display Settings" sx={{ gap: 1 }} />
          </Tabs>
        </Box>

        <DialogContent dividers>
          {/* Tab 0: Account Details */}
          {tabValue === 0 && !showWipeConfirm && (
            <AccountDetailsTab
              editedShopName={editedShopName}
              shopMobile={shopMobile}
              shopMobile2={shopMobile2}
              shopAddress={shopAddress}
              shopEmail={shopEmail}
              shopGST={shopGST}
              logoUrl={logoUrl}
              setEditedShopName={setEditedShopName}
              setShopMobile={setShopMobile}
              setShopMobile2={setShopMobile2}
              setShopAddress={setShopAddress}
              setShopEmail={setShopEmail}
              setShopGST={setShopGST}
              setLogoUrl={setLogoUrl}
              updateStatus={updateStatus}
              updateMessage={updateMessage}
              downloadProgress={downloadProgress}
              appMetadata={appMetadata}
              handleCheckForUpdates={handleCheckForUpdates}
              handleStartDownload={handleStartDownload}
              handleRestartApp={handleRestartApp}
              currentUser={currentUser}
              setShowWipeConfirm={setShowWipeConfirm}
            />
          )}

          {/* Tab 1: Payment Settings */}
          {tabValue === 1 && (
            <PaymentSettingsPanel
              paymentSettings={paymentSettings}
              setPaymentSettings={setPaymentSettings}
              showDecodedPrices={showDecodedPrices}
              setShowDecodedPrices={setShowDecodedPrices}
            />
          )}

          {/* Tab 2: UI Settings */}
          {tabValue === 2 && (
            <DisplaySettingsTab
              uiZoom={uiZoom}
              setUiZoom={setUiZoom}
              monochrome={monochrome}
              setMonochrome={setMonochrome}
              looseSaleEnabled={looseSaleEnabled}
              setLooseSaleEnabled={setLooseSaleEnabled}
              fullscreenEnabled={fullscreenEnabled}
              setFullscreenEnabled={setFullscreenEnabled}
              weightedAverageCostEnabled={weightedAverageCostEnabled}
              setWeightedAverageCostEnabled={setWeightedAverageCostEnabled}
              extraDiscountEnabled={extraDiscountEnabled}
              setExtraDiscountEnabledState={setExtraDiscountEnabledState}
              notificationDuration={notificationDuration}
              setNotificationDurationState={setNotificationDurationState}
              adminAutoLogoutTime={adminAutoLogoutTime}
              setAdminAutoLogoutTimeState={setAdminAutoLogoutTimeState}
              calculatorEnabled={calculatorEnabled}
              setCalculatorEnabledState={setCalculatorEnabledState}
              changeCalculatorEnabled={changeCalculatorEnabled}
              setChangeCalculatorEnabledState={setChangeCalculatorEnabledState}
              paymentMethodsEnabled={paymentMethodsEnabled}
              setPaymentMethodsEnabledState={setPaymentMethodsEnabledState}
            />
          )}

          {/* Wipe Database Confirmation */}
          {tabValue === 0 && showWipeConfirm && (
            <WipeDatabaseConfirmation
              wipePassword={wipePassword}
              setWipePassword={setWipePassword}
              currentUser={currentUser}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          {!showWipeConfirm ? (
            <>
              <Button onClick={handleClose} variant="outlined">
                Cancel
              </Button>
              <Button onClick={handleSave} variant="contained">
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setShowWipeConfirm(false);
                  setWipePassword('');
                }}
                variant="outlined"
                disabled={wipeLoading}
              >
                Go Back
              </Button>
              <Button
                onClick={handleWipeDatabase}
                variant="contained"
                color="error"
                startIcon={<DeleteForeverIcon />}
                disabled={!wipePassword || wipeLoading}
              >
                {wipeLoading ? 'Wiping...' : 'Confirm & Wipe Database'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      <CustomDialog {...dialogState} onClose={closeDialog} />
    </>
  );
};

export default AccountDetailsDialog;
