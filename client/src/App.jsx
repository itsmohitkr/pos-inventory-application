import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ReceiptLong as ReceiptIcon,
  Store as StoreIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

// Pages and Components
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import DashboardPage from './pages/DashboardPage';
import OverviewPage from './pages/OverviewPage';
import Reporting from './components/Reporting/Reporting';
import ExpenseManagement from './components/Expenses/ExpenseManagement';
import Refund from './components/Refund/Refund';
import ReceiptPreviewDialog from './components/POS/ReceiptPreviewDialog';
import SaleHistory from './components/SaleHistory/SaleHistory';
import PromotionManagement from './components/Promotions/PromotionManagement';
import LoginPage from './components/Auth/LoginPage';
import UserManagementDialog from './components/Auth/UserManagementDialog';
import AccountDetailsDialog from './components/Settings/AccountDetailsDialog';
import CustomDialog from './components/common/CustomDialog';
import AdminElevationDialog from './components/Auth/AdminElevationDialog';
import GlobalAppBar from './components/common/GlobalAppBar';
import AppLayout from './components/common/AppLayout';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useSettings } from './hooks/useSettings';
import useCustomDialog from './shared/hooks/useCustomDialog';

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
    setIsFullscreen: _setIsFullscreen,
  } = useSettings(showError);

  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showUserManagementDialog, setShowUserManagementDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showAdminLoginDialog, setShowAdminLoginDialog] = useState(false);

  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

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

  const handleChangePassword = async () => {
    // API call for changing password - remained in service since it's a specific auth action
    // Usually I'd put this in authService, but App.jsx had it inline.
    // I already created settingsService with changePasscode.
    setPasswordError('');
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    try {
      // In a real app, I'd move this to authService
      import('./shared/api/api')
        .then(async ({ default: api }) => {
          await api.put(`/api/auth/users/${currentUser.id}/change-password`, {
            oldPassword: passwordData.oldPassword,
            newPassword: passwordData.newPassword,
          });
          setShowChangePasswordDialog(false);
          setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
          showSuccess('Password changed successfully');
        })
        .catch(() => setPasswordError('Failed to change password'));
    } catch {
      setPasswordError('Failed to change password');
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
                shopMetadata={shopMetadata}
                printers={printers}
                defaultPrinter={defaultPrinter}
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
      </Routes>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleCloseSettingsMenu}
      >
        <MenuItem onClick={handleFullscreenToggle} disabled={isFullscreen}>
          <ListItemIcon>
            <FullscreenIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Enter full screen</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleFullscreenToggle} disabled={!isFullscreen}>
          <ListItemIcon>
            <FullscreenExitIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Exit full screen</ListItemText>
        </MenuItem>
        {isAdmin && <Divider />}
        {isAdmin && (
          <MenuItem
            onClick={() => {
              setShowBillDialog(true);
              setDraftReceiptSettings({ ...receiptSettings, customShopName: shopName });
              handleCloseSettingsMenu();
            }}
          >
            <ListItemIcon>
              <ReceiptIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Customize bill</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setShowChangePasswordDialog(true);
            handleCloseSettingsMenu();
          }}
        >
          <ListItemIcon>
            <LockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Password</ListItemText>
        </MenuItem>
        {!currentUser.originalRole && currentUser.role !== 'admin' && <Divider />}
        {!currentUser.originalRole && currentUser.role !== 'admin' && (
          <MenuItem
            onClick={() => {
              setShowAdminLoginDialog(true);
              handleCloseSettingsMenu();
            }}
          >
            <ListItemIcon>
              <LockIcon fontSize="small" sx={{ color: 'warning.main' }} />
            </ListItemIcon>
            <ListItemText sx={{ color: 'warning.main', fontWeight: 'bold' }}>
              Admin Login
            </ListItemText>
          </MenuItem>
        )}
        {isAdmin && <Divider />}
        {isAdmin && (
          <MenuItem
            onClick={() => {
              setShowUserManagementDialog(true);
              handleCloseSettingsMenu();
            }}
          >
            <ListItemIcon>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage Users</ListItemText>
          </MenuItem>
        )}
        {isAdmin && <Divider />}
        {isAdmin && (
          <MenuItem
            onClick={() => {
              setShowAccountDialog(true);
              handleCloseSettingsMenu();
            }}
          >
            <ListItemIcon>
              <StoreIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

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

      <Dialog
        open={showChangePasswordDialog}
        onClose={() => {
          setShowChangePasswordDialog(false);
          window.dispatchEvent(new Event('pos-refocus'));
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {passwordError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {passwordError}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Old Password"
              type="password"
              fullWidth
              size="small"
              value={passwordData.oldPassword}
              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              size="small"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              size="small"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setShowChangePasswordDialog(false);
              window.dispatchEvent(new Event('pos-refocus'));
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button onClick={handleChangePassword} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

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
