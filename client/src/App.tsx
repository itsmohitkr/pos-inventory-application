import type { AuthUser } from '@/shared/types/auth';
import { useState, lazy, Suspense } from 'react';
import * as Sentry from '@sentry/react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, LinearProgress } from '@mui/material';

// Pages and Components — POS and auth are eager (critical path)
import POSPage from '@/domains/pos/pages/POSPage';
import LoginPage from '@/domains/auth/components/LoginPage';
import OnboardingWizard from '@/domains/onboarding/components/OnboardingWizard';

const REQUIRED_ONBOARDING_VERSION = 1;

// Admin/back-office routes loaded on first navigation
const InventoryPage      = lazy(() => import('@/domains/inventory/pages/InventoryPage'));
const DashboardPage      = lazy(() => import('@/domains/dashboard/pages/DashboardPage'));
const OverviewPage       = lazy(() => import('@/domains/dashboard/pages/OverviewPage'));
const Reporting          = lazy(() => import('@/domains/reporting/components/Reporting'));
const ExpenseManagement  = lazy(() => import('@/domains/expenses/components/ExpenseManagement'));
const Refund             = lazy(() => import('@/domains/refund/components/Refund'));
const SaleHistory        = lazy(() => import('@/domains/saleHistory/components/SaleHistory'));
const PromotionManagement = lazy(() => import('@/domains/promotions/components/PromotionManagement'));
const CustomersPage      = lazy(() => import('@/domains/customers/pages/CustomersPage'));
const StoreSettingsPage  = lazy(() => import('@/domains/settings/pages/StoreSettingsPage'));
import UserManagementDialog from '@/domains/auth/components/UserManagementDialog';
import CustomDialog from '@/shared/components/CustomDialog';
import AdminElevationDialog from '@/domains/auth/components/AdminElevationDialog';
import GlobalSidebar from '@/shared/components/GlobalSidebar';
import TopHeader from '@/shared/components/TopHeader';
import AppLayout from '@/shared/components/AppLayout';
import ChangePasswordDialog from '@/domains/auth/components/ChangePasswordDialog';

// Hooks
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useSettings } from '@/domains/settings/hooks/useSettings';
import useCustomDialog from '@/shared/hooks/useCustomDialog';

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
    shopMetadata,
    monochromeMode,
    printers,
    defaultPrinter,
    handleShopMetadataChange,
    handleSaveBillSettings,
    onboardingVersion,
    settingsLoaded,
    fetchSettings,
  } = useSettings(showError);

  const [showUserManagementDialog, setShowUserManagementDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showAdminLoginDialog, setShowAdminLoginDialog] = useState(false);

  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Force the sidebar open whenever the route changes away from /pos, but
  // otherwise leave it alone so the manual collapse/expand toggle still
  // works. Adjusted during render (comparing to the previous pathname)
  // rather than in a useEffect, per React's guidance for state that needs
  // to react to a prop/route change without an extra render cycle.
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (location.pathname !== '/pos') {
      setIsSidebarOpen(true);
    }
  }

  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  const handleLogin = (user: AuthUser) => {
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
      window.dispatchEvent(new Event('pos-refocus'));
    } catch (error) {
      Sentry.captureException(error, { tags: { feature: 'fullscreen-toggle' } });
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
      setAdminLoginError(result.error || 'Invalid admin password');
    }
  };

  if (loading || !settingsLoaded)
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        Loading...
      </Box>
    );

  const onboardingComplete =
    onboardingVersion != null && onboardingVersion >= REQUIRED_ONBOARDING_VERSION;

  if (!onboardingComplete)
    return <OnboardingWizard onComplete={fetchSettings} />;

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

  const isPosRoute = location.pathname === '/pos';

  return (
    <AppLayout
      monochromeMode={monochromeMode}
      sidebar={
        isSidebarOpen ? (
          <GlobalSidebar
            shopName={shopName}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onAdminLogout={handleAdminLogout}
            adminLogoutTimer={adminLogoutTimer}
            permissions={permissions}
            onPosClick={() => setIsSidebarOpen(false)}
            onToggleSidebar={() => setIsSidebarOpen(false)}
            onOpenSettings={() => navigate('/settings')}
            onChangePassword={() => setShowChangePasswordDialog(true)}
            onAdminLogin={() => setShowAdminLoginDialog(true)}
            onManageUsers={() => setShowUserManagementDialog(true)}
            onFullscreenToggle={handleFullscreenToggle}
            onLogout={handleLogout}
          />
        ) : null
      }
      appBar={
        !isSidebarOpen ? (
          <TopHeader
            shopName={shopName}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            currentUser={currentUser}
            adminLogoutTimer={adminLogoutTimer}
            onAdminLogout={handleAdminLogout}
            showUserInfo={!isPosRoute}
          />
        ) : null
      }
    >
      <Suspense fallback={<LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }} />}>
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
              <Reporting />
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
            element={<DashboardPage />}
          />
        )}
        {permissions.canAccessCustomers && (
          <Route path="/customers" element={<CustomersPage />} />
        )}
        {isAdmin && (
          <Route
            path="/settings"
            element={
              <StoreSettingsPage
                shopName={shopName}
                shopMetadata={shopMetadata}
                onMetadataChange={handleShopMetadataChange}
                currentUser={currentUser}
                showSuccess={showSuccess}
                showError={showError}
                receiptSettings={receiptSettings}
                onSaveBillSettings={handleSaveBillSettings}
                printers={printers}
                defaultPrinter={defaultPrinter}
              />
            }
          />
        )}
      </Routes>
      </Suspense>

      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onClose={() => setShowChangePasswordDialog(false)}
        currentUser={currentUser}
        showSuccess={showSuccess}
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
