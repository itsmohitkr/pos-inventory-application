import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Divider,
  Avatar,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  PointOfSale as POSIcon,
  ReceiptLong as SaleHistoryIcon,
  AssignmentReturn as ReturnsIcon,
  Inventory2 as InventoryIcon,
  People as CustomersIcon,
  AccountBalanceWallet as ExpensesIcon,
  LocalOffer as PromotionsIcon,
  Assessment as ReportsIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  MenuOpen as MenuOpenIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Store as StoreIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import type { ButtonProps } from '@mui/material';
import type { AuthUser } from '@/shared/types/auth';

type NavButtonProps = Omit<ButtonProps<typeof RouterLink>, 'component'>;

export interface NavPermissions {
  canAccessSaleHistory?: boolean;
  canAccessInventory?: boolean;
  canAccessReports?: boolean;
  canAccessExpenses?: boolean;
  canAccessRefund?: boolean;
  canAccessPromotions?: boolean;
  canAccessDashboard?: boolean;
  canAccessCustomers?: boolean;
  [key: string]: boolean | undefined;
}

export type GlobalSidebarUser = AuthUser;

interface GlobalSidebarProps {
  shopName?: string;
  currentUser?: GlobalSidebarUser | null;
  isAdmin?: boolean;
  onAdminLogout?: () => void;
  adminLogoutTimer?: number | null;
  permissions: NavPermissions;
  onPosClick?: () => void;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
  onChangePassword?: () => void;
  onAdminLogin?: () => void;
  onFullscreenToggle?: () => void;
  onLogout?: () => void;
}

const SidebarNavButton = ({
  to,
  children,
  startIcon,
  onClick,
  ...props
}: NavButtonProps & { startIcon?: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Button
      component={RouterLink}
      to={to}
      onClick={onClick}
      startIcon={startIcon}
      fullWidth
      sx={{
        justifyContent: 'flex-start',
        px: 2,
        py: 1,
        fontSize: '0.875rem',
        fontWeight: isActive ? 700 : 500,
        bgcolor: isActive ? 'rgba(242, 181, 68, 0.15)' : 'transparent',
        color: isActive ? '#f2b544' : 'rgba(248, 245, 240, 0.85)',
        borderLeft: isActive ? '3px solid #f2b544' : '3px solid transparent',
        borderRadius: '0 8px 8px 0',
        transition: 'all 0.15s ease-in-out',
        textTransform: 'none',
        '&:hover': {
          bgcolor: isActive ? 'rgba(242, 181, 68, 0.22)' : 'rgba(255, 255, 255, 0.08)',
          color: isActive ? '#f2b544' : '#ffffff',
        },
        '& .MuiButton-startIcon': {
          color: isActive ? '#f2b544' : 'rgba(248, 245, 240, 0.7)',
          mr: 1.5,
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

interface SidebarMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  linkTo?: string;
  isActive?: boolean;
  variant?: 'default' | 'warning';
}

const SidebarMenuItem = ({
  icon,
  label,
  onClick,
  linkTo,
  isActive = false,
  variant = 'default',
}: SidebarMenuItemProps) => {
  const linkProps = linkTo ? { component: RouterLink, to: linkTo } : {};

  if (variant === 'warning') {
    return (
      <Button
        role="menuitem"
        fullWidth
        onClick={onClick}
        startIcon={icon}
        sx={{
          justifyContent: 'flex-start',
          px: 1.5,
          py: 0.75,
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: '#f59e0b',
          borderRadius: '6px',
          textTransform: 'none',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            bgcolor: 'rgba(245, 158, 11, 0.12)',
            color: '#fbbf24',
          },
          '& .MuiButton-startIcon': {
            mr: 1,
          },
        }}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      role="menuitem"
      fullWidth
      onClick={onClick}
      startIcon={icon}
      {...linkProps}
      sx={{
        justifyContent: 'flex-start',
        px: 1.5,
        py: 0.75,
        fontSize: '0.8125rem',
        fontWeight: isActive ? 700 : 500,
        color: isActive ? '#f2b544' : 'rgba(248, 245, 240, 0.8)',
        bgcolor: isActive ? 'rgba(242, 181, 68, 0.15)' : 'transparent',
        borderRadius: '6px',
        textTransform: 'none',
        transition: 'all 0.15s ease-in-out',
        '&:hover': {
          bgcolor: isActive ? 'rgba(242, 181, 68, 0.22)' : 'rgba(255, 255, 255, 0.08)',
          color: isActive ? '#f2b544' : '#ffffff',
        },
        '& .MuiButton-startIcon': {
          color: isActive ? '#f2b544' : 'rgba(248, 245, 240, 0.65)',
          mr: 1,
        },
      }}
    >
      {label}
    </Button>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <Typography
    variant="caption"
    sx={{
      px: 2,
      pt: 1.5,
      pb: 0.5,
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: 'rgba(255, 255, 255, 0.4)',
      textTransform: 'uppercase',
      display: 'block',
    }}
  >
    {title}
  </Typography>
);

const formatUserName = (name?: string): string => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const GlobalSidebar = ({
  shopName = 'Trovix POS',
  currentUser,
  isAdmin,
  onAdminLogout,
  adminLogoutTimer,
  permissions,
  onPosClick,
  onToggleSidebar,
  onOpenSettings,
  onChangePassword,
  onAdminLogin,
  onFullscreenToggle,
  onLogout,
}: GlobalSidebarProps) => {
  const location = useLocation();
  const isSettingsRoute = location.pathname === '/settings';
  const [isSettingsOpen, setIsSettingsOpen] = useState(isSettingsRoute);
  const [isFullscreenActive, setIsFullscreenActive] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false;
  });

  // Force the Settings accordion open whenever the route becomes /settings,
  // but otherwise leave it alone so the manual expand/collapse toggle still
  // works while already on that route. Adjusted during render (comparing to
  // the previous route flag) rather than in a useEffect, per React's
  // guidance for state that needs to react to a prop/route change without
  // an extra render cycle.
  const [prevIsSettingsRoute, setPrevIsSettingsRoute] = useState(isSettingsRoute);
  if (isSettingsRoute !== prevIsSettingsRoute) {
    setPrevIsSettingsRoute(isSettingsRoute);
    if (isSettingsRoute) {
      setIsSettingsOpen(true);
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreenActive(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleFullscreen = () => {
    onFullscreenToggle?.();
  };

  const formatTimer = (seconds: number | null | undefined): string => {
    if (seconds == null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return ` (${mins}:${secs.toString().padStart(2, '0')})`;
  };

  const {
    canAccessSaleHistory,
    canAccessInventory,
    canAccessReports,
    canAccessExpenses,
    canAccessRefund,
    canAccessPromotions,
    canAccessDashboard,
    canAccessCustomers,
  } = permissions;

  const hasOperations =
    canAccessInventory || canAccessCustomers || canAccessExpenses || canAccessPromotions;
  const hasInsights = canAccessReports || canAccessDashboard;

  return (
    <Box
      component="aside"
      className="no-print"
      sx={{
        width: 240,
        height: '100vh',
        bgcolor: '#0b1d39',
        background: 'linear-gradient(180deg, #0b1d39 0%, #0e2343 50%, #08162b 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        flexShrink: 0,
        userSelect: 'none',
        zIndex: 1100,
      }}
    >
      {/* 1. Header: Shop Name & Status */}
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <RouterLink
            to="/"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: 0,
              flex: 1,
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '6px',
                bgcolor: '#f2b544',
                color: '#0b1d39',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem',
                flexShrink: 0,
              }}
            >
              {shopName.charAt(0).toUpperCase()}
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {shopName}
            </Typography>
            <Box
              sx={{
                width: 8,
                height: 8,
                bgcolor: '#22c55e',
                borderRadius: '50%',
                flexShrink: 0,
                boxShadow: '0 0 6px #22c55e',
                ml: 0.25,
              }}
            />
          </RouterLink>

          {onToggleSidebar && (
            <IconButton
              size="small"
              onClick={onToggleSidebar}
              aria-label="Collapse sidebar"
              title="Collapse Sidebar"
              sx={{
                color: 'rgba(255, 255, 255, 0.65)',
                borderRadius: '6px',
                p: 0.5,
                flexShrink: 0,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                },
              }}
            >
              <MenuOpenIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* 2. Navigation Items (Scrollable if needed) */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1, pr: 1 }}>
        {/* Counter Operations */}
        <SectionHeader title="Counter Sales" />
        <SidebarNavButton to="/pos" startIcon={<POSIcon />} onClick={onPosClick}>
          POS
        </SidebarNavButton>
        {canAccessSaleHistory && (
          <SidebarNavButton to="/sale-history" startIcon={<SaleHistoryIcon />}>
            Sale History
          </SidebarNavButton>
        )}
        {canAccessRefund && (
          <SidebarNavButton to="/refund" startIcon={<ReturnsIcon />}>
            Returns
          </SidebarNavButton>
        )}

        {/* Store Management Operations */}
        {hasOperations && (
          <>
            <SectionHeader title="Store Management" />
            {canAccessInventory && (
              <SidebarNavButton to="/inventory" startIcon={<InventoryIcon />}>
                Inventory
              </SidebarNavButton>
            )}
            {canAccessCustomers && (
              <SidebarNavButton to="/customers" startIcon={<CustomersIcon />}>
                Customers
              </SidebarNavButton>
            )}
            {canAccessExpenses && (
              <SidebarNavButton to="/expenses" startIcon={<ExpensesIcon />}>
                Expenses
              </SidebarNavButton>
            )}
            {canAccessPromotions && (
              <SidebarNavButton to="/promotions" startIcon={<PromotionsIcon />}>
                Promotions
              </SidebarNavButton>
            )}
          </>
        )}

        {/* Intelligence & Analytics */}
        {hasInsights && (
          <>
            <SectionHeader title="Analytics" />
            {canAccessReports && (
              <SidebarNavButton to="/reports" startIcon={<ReportsIcon />}>
                Reports
              </SidebarNavButton>
            )}
            {canAccessDashboard && (
              <SidebarNavButton to="/dashboard" startIcon={<DashboardIcon />}>
                Dashboard
              </SidebarNavButton>
            )}
          </>
        )}

        {/* Settings & Tools Accordion */}
        <SectionHeader title="Settings" />
        <Button
          fullWidth
          onClick={() => setIsSettingsOpen((prev) => !prev)}
          aria-label="Settings"
          aria-expanded={isSettingsOpen}
          startIcon={<SettingsIcon />}
          endIcon={
            isSettingsOpen ? (
              <ExpandLessIcon sx={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.5)' }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.5)' }} />
            )
          }
          sx={{
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            fontSize: '0.875rem',
            fontWeight: isSettingsOpen ? 700 : 500,
            bgcolor: isSettingsOpen ? 'rgba(242, 181, 68, 0.12)' : 'transparent',
            color: isSettingsOpen ? '#f2b544' : 'rgba(248, 245, 240, 0.85)',
            borderLeft: isSettingsOpen ? '3px solid #f2b544' : '3px solid transparent',
            borderRadius: '0 8px 8px 0',
            transition: 'all 0.15s ease-in-out',
            textTransform: 'none',
            '&:hover': {
              bgcolor: isSettingsOpen ? 'rgba(242, 181, 68, 0.18)' : 'rgba(255, 255, 255, 0.08)',
              color: isSettingsOpen ? '#f2b544' : '#ffffff',
            },
            '& .MuiButton-startIcon': {
              color: isSettingsOpen ? '#f2b544' : 'rgba(248, 245, 240, 0.7)',
              mr: 1.5,
            },
          }}
        >
          <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
            Settings
          </Box>
        </Button>

        <Collapse in={isSettingsOpen} timeout="auto" unmountOnExit={false}>
          <Box
            sx={{
              pl: 1.5,
              pr: 1,
              py: 0.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.25,
              borderLeft: '2px solid rgba(242, 181, 68, 0.25)',
              ml: 2.5,
              my: 0.5,
            }}
          >
            {/* Admin-Gated Operations */}
            {isAdmin && (
              <>
                <SidebarMenuItem
                  icon={<StoreIcon fontSize="small" />}
                  label="Store Settings"
                  linkTo="/settings"
                  onClick={onOpenSettings}
                  isActive={isSettingsRoute}
                />

                <SidebarMenuItem
                  icon={<LockIcon fontSize="small" />}
                  label="Change Password"
                  onClick={onChangePassword}
                />
              </>
            )}

            {/* Non-Admin Session Elevation */}
            {!isAdmin && (
              <SidebarMenuItem
                icon={<LockIcon fontSize="small" sx={{ color: '#f59e0b' }} />}
                label="Admin Login"
                onClick={onAdminLogin}
                variant="warning"
              />
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Partition above sticky Full Screen option */}
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Full Screen Toggle — sticky (outside the scrollable nav area), available to every logged-in user */}
      <Box sx={{ flexShrink: 0, pr: 1, py: 0.5 }}>
        <Button
          fullWidth
          onClick={handleFullscreen}
          startIcon={
            isFullscreenActive ? (
              <FullscreenExitIcon />
            ) : (
              <FullscreenIcon />
            )
          }
          sx={{
            justifyContent: 'flex-start',
            px: 2,
            py: 1,
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'rgba(248, 245, 240, 0.85)',
            borderLeft: '3px solid transparent',
            borderRadius: '0 8px 8px 0',
            transition: 'all 0.15s ease-in-out',
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
            },
            '& .MuiButton-startIcon': {
              color: 'rgba(248, 245, 240, 0.7)',
              mr: 1.5,
            },
          }}
        >
          {isFullscreenActive ? 'Exit full screen' : 'Enter full screen'}
        </Button>
      </Box>

      {/* Partition just above username / user footer */}
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* 3. Footer: User Info & Logout (separate stacked cards for both non-admin and admin users) */}
      <Box sx={{ p: 1.5, flexShrink: 0 }}>
        <Stack spacing={1}>
          {/* User Profile Card (text only, no avatar) */}
          <Box
            sx={{
              p: 1.25,
              borderRadius: '8px',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                <Box component="span" sx={{ textTransform: 'capitalize' }}>
                  {formatUserName(currentUser?.username)}
                </Box>{' '}
                <Box
                  component="span"
                  sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500, textTransform: 'capitalize' }}
                >
                  ({currentUser?.role || 'user'})
                </Box>
              </Typography>
              {currentUser?.originalRole && (
                <Chip
                  label="Elevated"
                  size="small"
                  color="warning"
                  sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                />
              )}
            </Stack>
          </Box>

          {/* Exit Admin Mode Action (Drop Temporary Admin Elevation) */}
          {currentUser?.originalRole && (
            <Button
              onClick={onAdminLogout}
              component={RouterLink}
              to="/"
              variant="outlined"
              size="small"
              fullWidth
              sx={{
                fontWeight: 700,
                fontSize: '0.74rem',
                py: 0.6,
                borderRadius: '6px',
                color: '#f59e0b',
                borderColor: 'rgba(245, 158, 11, 0.45)',
                bgcolor: 'rgba(245, 158, 11, 0.08)',
                textTransform: 'none',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                  borderColor: '#f59e0b',
                  bgcolor: 'rgba(245, 158, 11, 0.18)',
                  color: '#fbbf24',
                },
              }}
            >
              Exit Admin Mode{formatTimer(adminLogoutTimer)}
            </Button>
          )}

          {/* Sign Out Button (separate card) */}
          <Tooltip title="Sign Out">
            <Button
              fullWidth
              onClick={onLogout}
              aria-label="Sign Out"
              size="small"
              startIcon={<LogoutIcon sx={{ fontSize: '1rem !important' }} />}
              sx={{
                color: '#ffffff',
                bgcolor: '#dc2626',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '6px',
                px: 2,
                py: 0.7,
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.35)',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  boxShadow: '0 4px 10px rgba(220, 38, 38, 0.5)',
                },
                '& .MuiButton-startIcon': {
                  color: '#ffffff',
                  mr: 0.75,
                },
              }}
            >
              Sign Out
            </Button>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
};

export default GlobalSidebar;
