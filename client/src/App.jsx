import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Pages and Components
import POSPage from '@/domains/pos/pages/POSPage';
import InventoryPage from '@/domains/inventory/pages/InventoryPage';
import DashboardPage from '@/domains/dashboard/pages/DashboardPage';
import OverviewPage from '@/domains/dashboard/pages/OverviewPage';
import Reporting from '@/domains/reporting/components/Reporting';
import ExpenseManagement from '@/domains/expenses/components/ExpenseManagement';
import Refund from '@/domains/refund/components/Refund';
import ReceiptPreviewDialog from '@/domains/pos/components/ReceiptPreviewDialog';
import SaleHistory from '@/domains/saleHistory/components/SaleHistory';
import PromotionManagement from '@/domains/promotions/components/PromotionManagement';
import CustomersPage from '@/domains/customers/pages/CustomersPage';
import LoginPage from '@/domains/auth/components/LoginPage';
import UserManagementDialog from '@/domains/auth/components/UserManagementDialog';
import AccountDetailsDialog from '@/domains/settings/components/AccountDetailsDialog';
import CustomDialog from '@/shared/components/CustomDialog';
import AdminElevationDialog from '@/domains/auth/components/AdminElevationDialog';
import GlobalAppBar from '@/shared/components/GlobalAppBar';
import AppLayout from '@/shared/components/AppLayout';
import SettingsMenu from '@/domains/settings/components/SettingsMenu';
import ChangePasswordDialog from '@/domains/auth/components/ChangePasswordDialog';

// Hooks
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useSettings } from '@/domains/settings/hooks/useSettings';
import useCustomDialog from '@/shared/hooks/useCustomDialog';

const SAMPLE_SALE = {
  id: 1001,
  createdAt: new Date().toISOString(),
  discount: 10,
  totalAmount: 190,
  items: [
    {
      quantity: 2,
      sellingPrice: 40,
      batch: {
        mrp: 50,
        expiryDate: null,
        product: { name: 'Sample Tea 200g', barcode: '8900000000011' },
      },
    },
    {
      quantity: 1,
      sellingPrice: 120,
      batch: {
        mrp: 140,
        expiryDate: null,
        product: { name: 'Sample Milk 1L', barcode: '8900000000012' },
      },
    },
  ],
};

function App() {
  const navigate = useNavigate();
  const { dialogState, showError, showSuccess, closeDialog } = useCustomDialog();
  const {
    currentUser,
    loading,
    handleLogin: authLogin,
    handleLogout,
    handleAdminLogin,
    handleAdminLogout,
    adminLogoutTimer,
  } = useAuth();

  const {
    shopName,
    receiptSettings,
    draftReceiptSettings,
    setDraftReceiptSettings,
    shopMetadata,
    monochromeMode,
    printers,
    defaultPrinter,
    handleShopMetadataChange,
    handleSaveBillSettings,
    isFullscreen,
  } = useSettings(showError);

  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showUserManagementDialog, setShowUserManagementDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showAdminLoginDialog, setShowAdminLoginDialog] = useState(false);

  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  const handleOpenSettingsMenu = (event) => setSettingsAnchorEl(event.currentTarget);
  const handleCloseSettingsMenu = () => {
    setSettingsAnchorEl(null);
    window.dispatchEvent(new Event('pos-refocus'));
  };

  const handleLogin = (user) => {
    authLogin(user);
    navigate('/pos');
  };

  const handleFullscreenToggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
      handleCloseSettingsMenu();
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const handleAdminElevation = async () => {
    const result = await handleAdminLogin(adminPassword);
    if (result.success) {
      setShowAdminLoginDialog(false);
      setAdminPassword('');
      setAdminLoginError('');
      navigate('/pos');
      window.dispatchEvent(new Event('pos-refocus'));
    } else {
      setAdminLoginError(result.error);
    }
  };

  if (loading)
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        Loading...
      </Box>
    );
  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  const isAdmin = currentUser?.role === 'admin';
  const permissions = {
    canAccessInventory: isAdmin,
    canAccessReports: isAdmin,
    canAccessDashboard: isAdmin,
    canAccessRefund: isAdmin || currentUser?.role === 'salesman',
    canAccessSaleHistory: isAdmin || currentUser?.role === 'salesman',
    canAccessPromotions: isAdmin,
    canAccessExpenses: isAdmin,
    canAccessCustomers: isAdmin,
  };

  return (
    <AppLayout
      monochromeMode={monochromeMode}
      appBar={
        <GlobalAppBar
          shopName={shopName}
          currentUser={currentUser}
          onAdminLogout={handleAdminLogout}
          adminLogoutTimer={adminLogoutTimer}
          onOpenSettingsMenu={handleOpenSettingsMenu}
          permissions={permissions}
        />
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/pos" replace />} />
        <Route
          path="/pos"
          element={
            <POSPage
              receiptSettings={receiptSettings}
              shopName={shopName}
              shopMetadata={shopMetadata}
              printers={printers}
              defaultPrinter={defaultPrinter}
            />
          }
        />
        <Route
          path="/overview"
          element={<OverviewPage shopName={shopName} userRole={currentUser.role} />}
        />
        {permissions.canAccessSaleHistory && (
          <Route
            path="/sale-history"
            element={
              <SaleHistory
                receiptSettings={receiptSettings}
                shopName={shopName}
                shopMetadata={shopMetadata}
                printers={printers}
                defaultPrinter={defaultPrinter}
                showError={showError}
              />
            }
          />
        )}
        {permissions.canAccessInventory && (
          <Route path="/inventory" element={<InventoryPage />} />
        )}
        {permissions.canAccessReports && (
          <Route
            path="/reports"
            element={
              <Reporting
                receiptSettings={receiptSettings}
                shopMetadata={shopMetadata}
                printers={printers}
                defaultPrinter={defaultPrinter}
              />
            }
          />
        )}
        {permissions.canAccessExpenses && (
          <Route path="/expenses" element={<ExpenseManagement />} />
        )}
        {permissions.canAccessRefund && <Route path="/refund" element={<Refund />} />}
        {permissions.canAccessPromotions && (
          <Route path="/promotions" element={<PromotionManagement />} />
        )}
        {permissions.canAccessDashboard && (
          <Route
            path="/dashboard"
            element={<DashboardPage shopName={shopName} userRole={currentUser.role} />}
          />
        )}
        {permissions.canAccessCustomers && (
          <Route path="/customers" element={<CustomersPage />} />
        )}
      </Routes>

      <SettingsMenu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleCloseSettingsMenu}
        onFullscreenToggle={handleFullscreenToggle}
        isFullscreen={isFullscreen}
        isAdmin={isAdmin}
        onOpenBillDialog={() => {
          setShowBillDialog(true);
          setDraftReceiptSettings({ ...receiptSettings, customShopName: shopName });
        }}
        onChangePassword={() => setShowChangePasswordDialog(true)}
        onAdminLogin={() => setShowAdminLoginDialog(true)}
        onManageUsers={() => setShowUserManagementDialog(true)}
        onOpenSettings={() => setShowAccountDialog(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <AccountDetailsDialog
        open={showAccountDialog}
        onClose={() => {
          setShowAccountDialog(false);
          window.dispatchEvent(new Event('pos-refocus'));
        }}
        shopName={shopName}
        shopMetadata={shopMetadata}
        onMetadataChange={handleShopMetadataChange}
        currentUser={currentUser}
      />

      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onClose={() => setShowChangePasswordDialog(false)}
        currentUser={currentUser}
        showSuccess={showSuccess}
      />

      <ReceiptPreviewDialog
        open={showBillDialog}
        onClose={() => {
          setShowBillDialog(false);
          window.dispatchEvent(new Event('pos-refocus'));
        }}
        lastSale={SAMPLE_SALE}
        receiptSettings={draftReceiptSettings}
        onSettingChange={(field) =>
          setDraftReceiptSettings((prev) => ({ ...prev, [field]: !prev[field] }))
        }
        onTextSettingChange={(field, value) =>
          setDraftReceiptSettings((prev) => ({ ...prev, [field]: value }))
        }
        onSave={async () => {
          const success = await handleSaveBillSettings(draftReceiptSettings);
          if (success) {
            setShowBillDialog(false);
            showSuccess('Bill settings saved successfully');
            window.dispatchEvent(new Event('pos-refocus'));
          }
        }}
        isAdmin={isAdmin}
        showPrint={false}
        showShopNameField={false}
        saveLabel="Save settings"
        shopMetadata={shopMetadata}
        printers={printers}
        defaultPrinter={defaultPrinter}
      />

      <UserManagementDialog
        open={showUserManagementDialog}
        onClose={() => {
          setShowUserManagementDialog(false);
          window.dispatchEvent(new Event('pos-refocus'));
        }}
        currentUser={currentUser}
      />

      <AdminElevationDialog
        open={showAdminLoginDialog}
        onClose={() => {
          setShowAdminLoginDialog(false);
          setAdminPassword('');
          setAdminLoginError('');
        }}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        adminLoginError={adminLoginError}
        onAdminLogin={handleAdminElevation}
      />

      <CustomDialog {...dialogState} onClose={closeDialog} />
    </AppLayout>
  );
}

export default App;
