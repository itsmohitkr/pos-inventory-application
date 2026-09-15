import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Store as StoreIcon,
  FeaturedPlayList as FeaturesIcon,
  Payment as PaymentIcon,
  DisplaySettings as DisplayIcon,
  ReceiptLong as ReceiptIcon,
  People as PeopleIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';

import type { AuthUser } from '@/shared/types/auth';
import type {
  ShopMetadata,
  ShopMetadataPatch,
  ReceiptSettings,
  PrinterInfo,
} from '@/domains/settings/hooks/useSettings';
import CustomDialog from '@/shared/components/CustomDialog';
import useCustomDialog from '@/shared/hooks/useCustomDialog';

import AccountDetailsTab from '@/domains/settings/components/AccountDetailsTab';
import POSFeaturesTab from '@/domains/settings/components/POSFeaturesTab';
import PaymentSettingsPanel from '@/domains/settings/components/PaymentSettingsPanel';
import DisplaySettingsTab from '@/domains/settings/components/DisplaySettingsTab';
import CustomizeBillTab from '@/domains/settings/components/CustomizeBillTab';
import UserManagementTab from '@/domains/settings/components/UserManagementTab';
import WipeDatabaseConfirmation, { CONFIRM_PHRASE } from '@/domains/settings/components/WipeDatabaseConfirmation';

import { useStoreSettings } from './useStoreSettings';

interface StoreSettingsPageProps {
  shopName: string;
  shopMetadata: ShopMetadata;
  onMetadataChange: (update: ShopMetadataPatch) => void | Promise<void>;
  currentUser?: AuthUser | null;
  showSuccess?: (message: string) => void;
  showError?: (message: string) => void;
  receiptSettings?: ReceiptSettings;
  onSaveBillSettings?: (newSettings: ReceiptSettings) => Promise<boolean>;
  printers?: PrinterInfo[];
  defaultPrinter?: string | null;
}

const StoreSettingsPage = ({
  shopName,
  shopMetadata,
  onMetadataChange,
  currentUser,
  showSuccess: propShowSuccess,
  showError: propShowError,
  receiptSettings,
  onSaveBillSettings,
  printers,
  defaultPrinter,
}: StoreSettingsPageProps) => {
  const { dialogState, showSuccess: localShowSuccess, showError: localShowError, closeDialog } = useCustomDialog();
  const showSuccess = propShowSuccess || localShowSuccess;
  const showError = propShowError || localShowError;

  const {
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
  } = useStoreSettings({
    shopName,
    shopMetadata,
    onMetadataChange,
    currentUser,
    showSuccess,
    showError,
    receiptSettings,
    onSaveBillSettings,
  });

  return (
    <Box
      data-testid="store-settings-page"
      sx={{
        bgcolor: '#f8fafc',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onKeyDown={(event) => {
        if (event.defaultPrevented) return;
        if (event.key !== 'Enter') return;
        if (event.shiftKey) return;
        if ((event.target as HTMLElement | null)?.tagName === 'TEXTAREA') return;
        if (showWipeConfirm) {
          if (!wipePassword || wipeConfirmPhrase !== CONFIRM_PHRASE || wipeLoading) return;
          event.preventDefault();
          handleWipeDatabase();
          return;
        }
        if (tabValue === 5) return;
        event.preventDefault();
        handleSave();
      }}
    >
      {/* Top Header matching Customers & Inventory */}
      <Paper
        elevation={0}
        sx={{
          m: 1.5,
          px: 2.5,
          py: 1.75,
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          bgcolor: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: -0.5,
              color: '#0b1d39',
            }}
          >
            Store Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your store profile, POS preferences, payment methods, and display settings.
          </Typography>
        </Box>
      </Paper>

      {/* Main Settings Body: Left Vertical Sidebar + Right Content & Bottom Action Bar */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          px: 1.5,
          pb: 1.5,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1.5,
          overflow: 'hidden',
        }}
      >
        {/* Left Vertical Navigation Sidebar */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: 260 },
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
            <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 1.2 }}>
              Settings Navigation
            </Typography>
          </Box>

          <Box sx={{ px: 1, py: 1.5, flex: 1, overflowY: 'auto' }}>
            <Tabs
              orientation="vertical"
              value={tabValue}
              onChange={(_e, newValue) => handleTabChange(newValue)}
              sx={{
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
                '& .MuiTab-root': {
                  minHeight: 46,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  justifyContent: 'flex-start',
                  px: 1.5,
                  py: 1,
                  color: '#475467',
                  borderRadius: '8px',
                  mb: 0.5,
                  transition: 'all 0.15s ease-in-out',
                  '&:hover': {
                    bgcolor: '#f1f5f9',
                    color: '#0b1d39',
                  },
                  '&.Mui-selected': {
                    bgcolor: '#0b1d39',
                    color: '#ffffff',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#162b4d' },
                    '& .MuiSvgIcon-root': { color: '#ffffff' },
                  },
                },
              }}
            >
              <Tab
                icon={<StoreIcon sx={{ fontSize: 19, mr: 1 }} />}
                iconPosition="start"
                label="Account"
              />
              <Tab
                icon={<FeaturesIcon sx={{ fontSize: 19, mr: 1 }} />}
                iconPosition="start"
                label="POS Features"
              />
              <Tab
                icon={<PaymentIcon sx={{ fontSize: 19, mr: 1 }} />}
                iconPosition="start"
                label="Payment"
              />
              <Tab
                icon={<ReceiptIcon sx={{ fontSize: 19, mr: 1 }} />}
                iconPosition="start"
                label="Customize Bill"
              />
              <Tab
                icon={<DisplayIcon sx={{ fontSize: 19, mr: 1 }} />}
                iconPosition="start"
                label="Display & Zoom"
              />
              <Tab
                icon={<PeopleIcon sx={{ fontSize: 19, mr: 1 }} />}
                iconPosition="start"
                label="User Management"
              />
            </Tabs>
          </Box>

          {/* Footer Info in Sidebar */}
          <Box sx={{ p: 2, borderTop: '1px solid #f1f5f9', bgcolor: '#fafafa' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>
              Trovix POS {appMetadata?.version ? `v${appMetadata.version}` : ''}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              {currentUser?.username ? `Admin: ${currentUser.username}` : 'Store Configuration'}
            </Typography>
          </Box>
        </Paper>

        {/* Right Settings Content Panel with Bottom Action Bar */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            bgcolor: '#ffffff',
            minHeight: 0,
          }}
        >
          {/* Scrollable Settings Content Area */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              p: { xs: 2, md: 3 },
              bgcolor: '#ffffff',
            }}
          >
            <Box sx={{ maxWidth: tabValue === 3 ? '1200px' : tabValue === 5 ? '1100px' : '960px', mx: 'auto', width: '100%' }}>
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
                  updateStatus={updateStatus ?? undefined}
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

              {/* Tab 0: Wipe Database Flow */}
              {tabValue === 0 && showWipeConfirm && (
                <WipeDatabaseConfirmation
                  wipePassword={wipePassword}
                  setWipePassword={setWipePassword}
                  confirmPhrase={wipeConfirmPhrase}
                  setConfirmPhrase={setWipeConfirmPhrase}
                  currentUser={currentUser}
                />
              )}

              {/* Tab 1: POS Features */}
              {tabValue === 1 && (
                <POSFeaturesTab
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
                  customerFeatureEnabled={customerFeatureEnabled}
                  setCustomerFeatureEnabledState={setCustomerFeatureEnabledState}
                />
              )}

              {/* Tab 2: Payment Settings */}
              {tabValue === 2 && (
                <PaymentSettingsPanel
                  paymentSettings={paymentSettings}
                  setPaymentSettings={setPaymentSettings}
                  showDecodedPrices={showDecodedPrices}
                  setShowDecodedPrices={setShowDecodedPrices}
                />
              )}

              {/* Tab 3: Customize Bill */}
              {tabValue === 3 && (
                <CustomizeBillTab
                  billSettings={billSettings}
                  onSettingChange={handleBillSettingChange}
                  onTextSettingChange={handleBillTextSettingChange}
                  shopMetadata={shopMetadata}
                  printers={printers}
                  defaultPrinter={defaultPrinter}
                  customerFeatureEnabled={customerFeatureEnabled}
                />
              )}

              {/* Tab 4: Display & Zoom Settings */}
              {tabValue === 4 && (
                <DisplaySettingsTab
                  uiZoom={uiZoom}
                  setUiZoom={setUiZoom}
                />
              )}

              {/* Tab 5: User Management */}
              {tabValue === 5 && !showWipeConfirm && (
                <UserManagementTab currentUser={currentUser} />
              )}
            </Box>
          </Box>

          {/* Bottom Action Bar */}
          <Box
            sx={{
              px: 3,
              py: 1.75,
              borderTop: '1px solid #e2e8f0',
              bgcolor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
              {showWipeConfirm
                ? 'Warning: Database wipe is permanent and cannot be undone.'
                : tabValue === 5
                  ? 'User accounts and permission changes take effect immediately.'
                  : 'All settings take effect across connected POS registers upon saving.'}
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center">
              {!showWipeConfirm && tabValue !== 5 ? (
                <>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<ResetIcon />}
                    onClick={handleReset}
                    disabled={isSaving}
                    sx={{
                      color: '#64748b',
                      borderColor: '#cbd5e1',
                      borderRadius: '8px',
                      fontWeight: 600,
                      textTransform: 'none',
                      px: 2,
                      py: 0.75,
                      '&:hover': {
                        borderColor: '#94a3b8',
                        bgcolor: '#f1f5f9',
                      },
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={isSaving ? undefined : <SaveIcon />}
                    onClick={handleSave}
                    disabled={isSaving}
                    sx={{
                      bgcolor: '#0b1d39',
                      borderRadius: '8px',
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 2.5,
                      py: 0.75,
                      minWidth: 152,
                      boxShadow: '0 2px 8px rgba(11, 29, 57, 0.15)',
                      '&:hover': {
                        bgcolor: '#1a365d',
                      },
                      '&.Mui-disabled': {
                        bgcolor: '#0b1d39',
                        color: 'rgba(255, 255, 255, 0.75)',
                      },
                    }}
                  >
                    {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
                  </Button>
                </>
              ) : showWipeConfirm ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowWipeConfirm(false);
                      setWipePassword('');
                      setWipeConfirmPhrase('');
                    }}
                    disabled={wipeLoading}
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 600,
                      textTransform: 'none',
                      px: 2,
                      py: 0.75,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteForeverIcon />}
                    onClick={handleWipeDatabase}
                    disabled={!wipePassword || wipeConfirmPhrase !== CONFIRM_PHRASE || wipeLoading}
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 2.5,
                      py: 0.75,
                    }}
                  >
                    {wipeLoading ? 'Wiping...' : 'Confirm & Wipe Database'}
                  </Button>
                </>
              ) : null}
            </Stack>
          </Box>
        </Paper>
      </Box>

      <CustomDialog {...dialogState} onClose={closeDialog} />
    </Box>
  );
};

export default StoreSettingsPage;
