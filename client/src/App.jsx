import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link as RouterLink, useLocation, Navigate } from 'react-router-dom';
import api from './api';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  PointOfSale as PointOfSaleIcon,
  Inventory2 as InventoryIcon,
  Assessment as AssessmentIcon,
  Replay as ReplayIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ReceiptLong as ReceiptIcon,
  Store as StoreIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Lock as LockIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  DeleteForever as DeleteForeverIcon,
  LocalOffer as PromoIcon
} from '@mui/icons-material';
import AddProductForm from './components/Inventory/AddProductForm';
import ProductList from './components/Inventory/ProductList';
import InventoryTree from './components/Inventory/InventoryTree';
import BulkImportDialog from './components/Inventory/BulkImportDialog';
import POS from './components/POS/POS';
import Reporting from './components/Reporting/Reporting';
import Refund from './components/Refund/Refund';
import ReceiptPreviewDialog from './components/POS/ReceiptPreviewDialog';
import DashboardPage from './components/Dashboard/Dashboard';
import SaleHistory from './components/SaleHistory/SaleHistory';
import PromotionManagement from './components/Promotions/PromotionManagement';
import LoginPage from './components/Auth/LoginPage';
import UserManagementDialog from './components/Auth/UserManagementDialog';
import AccountDetailsDialog from './components/Settings/AccountDetailsDialog';
import CustomDialog from './components/common/CustomDialog';
import UpdateNotifier from './components/common/UpdateNotifier';
import useCustomDialog from './hooks/useCustomDialog';

const STORAGE_KEYS = {
  receipt: 'posReceiptSettings',
  shopName: 'posShopName'
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
  directPrint: false,
  printerType: 'Thermal Printer',
  paperSize: '80mm'
};

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
        product: { name: 'Sample Tea 200g', barcode: '8900000000011' }
      }
    },
    {
      quantity: 1,
      sellingPrice: 120,
      batch: {
        mrp: 140,
        expiryDate: null,
        product: { name: 'Sample Milk 1L', barcode: '8900000000012' }
      }
    }
  ]
};

const getStoredShopName = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.shopName) || 'Bachat Bazaar';
  } catch (error) {
    return 'Bachat Bazaar';
  }
};

const getStoredReceiptSettings = (fallbackShopName) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.receipt));
    return {
      ...DEFAULT_RECEIPT_SETTINGS,
      ...stored,
      customShopName: stored?.customShopName || fallbackShopName
    };
  } catch (error) {
    return {
      ...DEFAULT_RECEIPT_SETTINGS,
      customShopName: fallbackShopName
    };
  }
};

const NavButton = ({ to, children, ...props }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Button
      component={RouterLink}
      to={to}
      color="inherit"
      {...props}
      sx={{
        px: 2,
        py: 1,
        fontWeight: isActive ? 700 : 500,
        bgcolor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
        color: isActive ? '#ffffff' : 'rgba(248, 245, 240, 0.85)',
        borderBottom: isActive ? '3px solid #f2b544' : '3px solid transparent',
        borderRadius: '4px 4px 0 0',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          borderRadius: '4px'
        },
        ...props.sx
      }}
    >
      {children}
    </Button>
  );
};

const DashboardCard = ({ to, title, description, icon, tone }) => (
  <Paper
    component={RouterLink}
    to={to}
    elevation={0}
    sx={{
      p: 3,
      textDecoration: 'none',
      color: 'inherit',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.2,
      borderRadius: 2,
      background: 'linear-gradient(135deg, #ffffff 0%, #f9f3ea 100%)',
      transition: 'transform 150ms ease, box-shadow 150ms ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 18px 35px rgba(11, 29, 57, 0.14)'
      }
    }}
  >
    <Box
      sx={{
        width: 52,
        height: 52,
        borderRadius: 2.4,
        display: 'grid',
        placeItems: 'center',
        bgcolor: tone.bg,
        color: tone.color
      }}
    >
      {icon}
    </Box>
    <Typography variant="h6">{title}</Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Paper>
);

const Overview = ({ shopName, userRole }) => (
  <Container maxWidth="lg" sx={{ mt: { xs: 4, md: 7 }, mb: 8 }}>
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        mb: 4,
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(11, 29, 57, 0.95) 0%, rgba(27, 62, 111, 0.9) 100%)',
        color: '#f8f5f0',
        border: 'none'
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3" sx={{ mb: 1.2 }}>
            {shopName} POS Suite
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(248, 245, 240, 0.8)', maxWidth: 520 }}>
            {userRole === 'cashier'
              ? 'Process transactions quickly with our focused checkout interface.'
              : userRole === 'admin'
                ? 'Complete control over inventory, sales, and user management.'
                : 'Comprehensive sales and refund management capabilities.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          {userRole === 'admin' && (
            <>
              <Chip label="Inventory & Sales" sx={{ bgcolor: 'rgba(242, 181, 68, 0.18)', color: '#f2b544' }} />
              <Chip label="Full analytics" sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#f8f5f0' }} />
            </>
          )}
          {userRole === 'cashier' && (
            <Chip label="Fast checkout" sx={{ bgcolor: 'rgba(31, 138, 91, 0.2)', color: '#c7f0dc' }} />
          )}
          {userRole === 'salesman' && (
            <>
              <Chip label="Sales & refunds" sx={{ bgcolor: 'rgba(31, 138, 91, 0.2)', color: '#c7f0dc' }} />
            </>
          )}
        </Stack>
      </Stack>
    </Paper>

    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 3 }}>
      <DashboardCard
        to="/pos"
        title="POS Terminal"
        description="Scan, add discounts, and print receipts in seconds."
        icon={<PointOfSaleIcon fontSize="medium" />}
        tone={{ bg: 'rgba(11, 29, 57, 0.12)', color: 'primary.main' }}
      />
      {userRole === 'admin' && (
        <>
          <DashboardCard
            to="/inventory"
            title="Inventory Management"
            description="Control batches, pricing, and expiry in one clean table."
            icon={<InventoryIcon fontSize="medium" />}
            tone={{ bg: 'rgba(242, 181, 68, 0.18)', color: '#b76e00' }}
          />
          <DashboardCard
            to="/reports"
            title="Reports & Analytics"
            description="Track sales performance with rich, digestible analytics."
            icon={<AssessmentIcon fontSize="medium" />}
            tone={{ bg: 'rgba(31, 138, 91, 0.18)', color: '#1f8a5b' }}
          />
          <DashboardCard
            to="/promotions"
            title="Sales & Promotions"
            description="Manage temporary discounts and holiday sale events."
            icon={<PromoIcon fontSize="medium" />}
            tone={{ bg: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed' }}
          />
        </>
      )}
      {(userRole === 'admin' || userRole === 'salesman') && (
        <DashboardCard
          to="/refund"
          title="Refunds / Returns"
          description="Handle returns confidently with guided workflows."
          icon={<ReplayIcon fontSize="medium" />}
          tone={{ bg: 'rgba(217, 119, 6, 0.18)', color: '#b45309' }}
        />
      )}
      {userRole === 'admin' && (
        <DashboardCard
          to="/dashboard"
          title="Live Analytics"
          description="Deep insights into daily sales, revenue, and trends."
          icon={<AssessmentIcon fontSize="medium" />}
          tone={{ bg: 'rgba(31, 138, 91, 0.18)', color: '#1f8a5b' }}
        />
      )}
    </Box>
  </Container>
);

const Inventory = () => {
  const { showError } = useCustomDialog();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [inventoryKey, setInventoryKey] = useState(0);
  const inventoryRef = React.useRef();

  const handleProductAdded = () => {
    setInventoryKey(prev => prev + 1);
    if (inventoryRef.current?.refresh) {
      inventoryRef.current.refresh();
    }
    setShowAddProduct(false);
  };

  const handleImportComplete = () => {
    setInventoryKey(prev => prev + 1);
    if (inventoryRef.current?.refresh) {
      inventoryRef.current.refresh();
    }
    setShowImport(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/api/products/export', { responseType: 'blob' });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Container maxWidth="100%" disableGutters sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', px: { xs: 1, md: 2 }, py: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 2,
          borderRadius: 2,
          background: 'linear-gradient(120deg, #ffffff 0%, #f6efe6 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            Inventory Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse products by category and manage stock efficiently.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowImport(true)}
            sx={{ minWidth: 120 }}
          >
            Import CSV
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleExport}
            disabled={exporting}
            sx={{ minWidth: 120 }}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowAddProduct(true)}
            sx={{ minWidth: 140 }}
          >
            Add Product
          </Button>
        </Stack>
      </Paper>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
        {showAddProduct ? (
          <Container maxWidth="md" sx={{ height: '100%', overflowY: 'auto' }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button size="small" onClick={() => setShowAddProduct(false)}>Back to Inventory</Button>
              </Box>
              <AddProductForm onProductAdded={handleProductAdded} />
            </Paper>
          </Container>
        ) : (
          <ProductList key={inventoryKey} ref={inventoryRef} />
        )}
      </Box>

      <BulkImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImportComplete={handleImportComplete}
      />
    </Container>
  );
};

function App() {
  const { dialogState, showError, showSuccess, closeDialog } = useCustomDialog();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialShopName = getStoredShopName();
  const [shopName, setShopName] = useState(initialShopName);
  const [receiptSettings, setReceiptSettings] = useState(() => getStoredReceiptSettings(initialShopName));
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showUserManagementDialog, setShowUserManagementDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [draftReceiptSettings, setDraftReceiptSettings] = useState(() => getStoredReceiptSettings(initialShopName));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [uiZoom, setUiZoom] = useState(() => Number(localStorage.getItem('posUiZoom')) || 100);
  const [monochromeMode, setMonochromeMode] = useState(() => localStorage.getItem('posMonochromeMode') === 'true');

  const [shopMetadata, setShopMetadata] = useState({
    shopMobile: '',
    shopMobile2: '',
    shopAddress: '',
    shopEmail: '',
    shopGST: '',
    shopLogo: ''
  });

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/settings');
      const settings = res.data.data;
      if (settings.posShopName) setShopName(settings.posShopName);
      if (settings.posReceiptSettings) {
        setReceiptSettings(settings.posReceiptSettings);
        setDraftReceiptSettings(settings.posReceiptSettings);
      }
      setShopMetadata({
        shopMobile: settings.shopMobile || '',
        shopMobile2: settings.shopMobile2 || '',
        shopAddress: settings.shopAddress || '',
        shopEmail: settings.shopEmail || '',
        shopGST: settings.shopGST || '',
        shopLogo: settings.shopLogo || ''
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  useEffect(() => {
    const handleSettingsUpdated = () => {
      setMonochromeMode(localStorage.getItem('posMonochromeMode') === 'true');
    };
    window.addEventListener('pos-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('pos-settings-updated', handleSettingsUpdated);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${uiZoom}%`;
  }, [uiZoom]);

  useEffect(() => {
    const handleZoomUpdated = () => {
      setUiZoom(Number(localStorage.getItem('posUiZoom')) || 100);
    };
    window.addEventListener('pos-ui-zoom-updated', handleZoomUpdated);
    return () => window.removeEventListener('pos-ui-zoom-updated', handleZoomUpdated);
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('posCurrentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    fetchSettings();
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    // Local display settings only
    localStorage.setItem('posUiZoom', uiZoom.toString());
    localStorage.setItem('posMonochromeMode', monochromeMode.toString());
  }, [uiZoom, monochromeMode]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('posCurrentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('posCurrentUser');
    handleCloseSettingsMenu();
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

  const handleChangePassword = async () => {
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
      await api.put(`/api/auth/users/${currentUser.id}/change-password`, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setShowChangePasswordDialog(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      showSuccess('Password changed successfully');
    } catch (err) {
      setPasswordError('Failed to change password');
    }
  };

  const handleSettingChange = (field) => {
    setDraftReceiptSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTextSettingChange = (field, value) => {
    setDraftReceiptSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleShopMetadataChange = async (newData) => {
    // Update local state immediately
    if (newData.shopName !== undefined) {
      setShopName(newData.shopName);
      setReceiptSettings(prev => ({ ...prev, customShopName: newData.shopName }));
    }

    setShopMetadata(prev => ({
      ...prev,
      ...newData
    }));

    try {
      const settingsToUpdate = {};
      if (newData.shopName !== undefined) {
        settingsToUpdate.posShopName = newData.shopName;
        settingsToUpdate['posReceiptSettings.customShopName'] = newData.shopName;
      }

      // Map local metadata keys to backend keys
      const metadataKeys = ['shopMobile', 'shopMobile2', 'shopAddress', 'shopEmail', 'shopGST', 'shopLogo'];
      metadataKeys.forEach(key => {
        if (newData[key] !== undefined) {
          settingsToUpdate[key] = newData[key];
        }
      });

      if (Object.keys(settingsToUpdate).length > 0) {
        await api.post('/api/settings', { settings: settingsToUpdate });
      }
    } catch (error) {
      console.error('Failed to save shop metadata:', error);
      showError('Failed to save some settings');
    }
  };

  const handleOpenSettingsMenu = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleCloseSettingsMenu = () => {
    setSettingsAnchorEl(null);
  };

  const handleOpenBillSettings = () => {
    setDraftReceiptSettings({ ...receiptSettings, customShopName: shopName });
    setShowBillDialog(true);
    handleCloseSettingsMenu();
  };

  const handleSaveBillSettings = async () => {
    setReceiptSettings(draftReceiptSettings);
    setShowBillDialog(false);
    try {
      await api.post('/api/settings', {
        key: 'posReceiptSettings',
        value: draftReceiptSettings
      });
      showSuccess('Bill settings saved successfully');
    } catch (error) {
      console.error('Failed to save bill settings:', error);
      showError('Failed to save bill settings');
    }
  };

  const handleOpenAccountSettings = () => {
    setShowAccountDialog(true);
    handleCloseSettingsMenu();
  };

  const isAdmin = currentUser?.role === 'admin';
  const canAccessInventory = isAdmin;
  const canAccessReports = isAdmin;
  const canAccessDashboard = isAdmin;
  const canAccessRefund = isAdmin || currentUser?.role === 'salesman';
  const canAccessSaleHistory = isAdmin || currentUser?.role === 'salesman';
  const canAccessPromotions = isAdmin;

  if (loading) return <Box>Loading...</Box>;

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Box
        className={monochromeMode ? 'monochrome' : ''}
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'hidden',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{ gap: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                <RouterLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                  {shopName}
                </RouterLink>
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(248, 245, 240, 0.7)' }}>
                {currentUser.username} • {currentUser.role}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <NavButton to="/pos">POS</NavButton>
              {canAccessSaleHistory && <NavButton to="/sale-history">Sale History</NavButton>}
              {canAccessInventory && <NavButton to="/inventory">Inventory</NavButton>}
              {canAccessReports && <NavButton to="/reports">Reports</NavButton>}
              {canAccessRefund && <NavButton to="/refund">Refund</NavButton>}
              {canAccessPromotions && <NavButton to="/promotions">Promotions</NavButton>}
              {canAccessDashboard && <NavButton to="/dashboard">Dashboard</NavButton>}
              <IconButton
                color="inherit"
                onClick={handleOpenSettingsMenu}
                aria-label="Settings"
                sx={{
                  ml: 1,
                  width: 40,
                  height: 40,
                  alignSelf: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '50%',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.18)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<Box sx={{ bgcolor: 'background.default', height: '100%', overflow: 'auto' }}><Overview shopName={shopName} userRole={currentUser.role} /></Box>} />
            <Route path="/pos" element={<Box sx={{ bgcolor: 'background.default', height: '100%', overflow: 'hidden' }}><POS receiptSettings={receiptSettings} shopMetadata={shopMetadata} /></Box>} />
            {canAccessSaleHistory && (
              <Route
                path="/sale-history"
                element={
                  <Box
                    sx={{
                      bgcolor: 'background.default',
                      height: '100%',
                      overflow: 'hidden'
                    }}
                  >
                    <SaleHistory receiptSettings={receiptSettings} shopMetadata={shopMetadata} />
                  </Box>
                }
              />
            )}
            {canAccessInventory && <Route path="/inventory" element={<Box sx={{ bgcolor: 'background.default', height: '100%', overflow: 'hidden' }}><Inventory /></Box>} />}
            {canAccessReports && <Route path="/reports" element={<Box sx={{ bgcolor: 'background.default', height: '100%', overflow: 'hidden' }}><Reporting receiptSettings={receiptSettings} shopMetadata={shopMetadata} /></Box>} />}
            {canAccessRefund && <Route path="/refund" element={<Box sx={{ bgcolor: 'background.default', height: '100%', overflow: 'hidden' }}><Refund /></Box>} />}
            {canAccessPromotions && <Route path="/promotions" element={<Box sx={{ bgcolor: 'background.default', height: '100%', overflow: 'auto' }}><PromotionManagement /></Box>} />}
            {canAccessDashboard && <Route path="/dashboard" element={<Box sx={{ bgcolor: 'background.default', height: '100%', overflow: 'auto' }}><DashboardPage shopName={shopName} userRole={currentUser.role} /></Box>} />}
          </Routes>
        </Box>

        <UpdateNotifier />

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
            <MenuItem onClick={handleOpenBillSettings}>
              <ListItemIcon>
                <ReceiptIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Customize bill</ListItemText>
            </MenuItem>
          )}
          <MenuItem>
            <ListItemIcon>
              <LockIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText onClick={() => {
              setShowChangePasswordDialog(true);
              handleCloseSettingsMenu();
            }}>Change Password</ListItemText>
          </MenuItem>
          {isAdmin && <Divider />}
          {isAdmin && (
            <MenuItem onClick={() => {
              setShowUserManagementDialog(true);
              handleCloseSettingsMenu();
            }}>
              <ListItemIcon>
                <PeopleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Manage Users</ListItemText>
            </MenuItem>
          )}
          {isAdmin && <Divider />}
          {isAdmin && (
            <MenuItem onClick={handleOpenAccountSettings}>
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
          onClose={() => setShowAccountDialog(false)}
          shopName={shopName}
          shopMetadata={shopMetadata}
          onMetadataChange={handleShopMetadataChange}
          currentUser={currentUser}
        />

        <Dialog open={showChangePasswordDialog} onClose={() => setShowChangePasswordDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {passwordError && <Typography color="error" sx={{ mb: 2 }}>{passwordError}</Typography>}
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
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setShowChangePasswordDialog(false)} variant="outlined">Cancel</Button>
            <Button onClick={handleChangePassword} variant="contained">Change Password</Button>
          </DialogActions>
        </Dialog>

        <ReceiptPreviewDialog
          open={showBillDialog}
          onClose={() => setShowBillDialog(false)}
          lastSale={SAMPLE_SALE}
          receiptSettings={draftReceiptSettings}
          onSettingChange={handleSettingChange}
          onTextSettingChange={handleTextSettingChange}
          onSave={handleSaveBillSettings}
          isAdmin={isAdmin}
          showPrint={false}
          showShopNameField={false}
          saveLabel="Save settings"
          shopMetadata={shopMetadata}
        />

        <UserManagementDialog
          open={showUserManagementDialog}
          onClose={() => setShowUserManagementDialog(false)}
          currentUser={currentUser}
        />
        <CustomDialog {...dialogState} onClose={closeDialog} />
      </Box>
    </Router>
  );
}

export default App;
