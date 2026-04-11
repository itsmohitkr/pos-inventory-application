import React from 'react';
import { AppBar, Toolbar, Box, Typography, Button, Stack, IconButton } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Settings as SettingsIcon } from '@mui/icons-material';

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
          borderRadius: '4px',
        },
        ...props.sx,
      }}
    >
      {children}
    </Button>
  );
};

const GlobalAppBar = ({
  shopName,
  currentUser,
  onAdminLogout,
  adminLogoutTimer,
  onOpenSettingsMenu,
  permissions,
}) => {
  const formatTimer = (seconds) => {
    if (seconds === null) return '';
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
  } = permissions;

  return (
    <AppBar position="sticky" elevation={0} className="no-print">
      <Toolbar sx={{ gap: 2 }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              <RouterLink
                to="/"
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {shopName}
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: '#4caf50',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                />
              </RouterLink>
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(248, 245, 240, 0.7)' }}>
              {currentUser.username} • {currentUser.role} {currentUser.originalRole && '(Elevated)'}
            </Typography>
          </Box>
          {currentUser.originalRole && (
            <Button
              onClick={onAdminLogout}
              component={RouterLink}
              to="/"
              variant="contained"
              size="small"
              color="error"
              sx={{ ml: 3, fontWeight: 'bold' }}
            >
              Log out Admin{formatTimer(adminLogoutTimer)}
            </Button>
          )}
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <NavButton to="/pos">POS</NavButton>
          {canAccessSaleHistory && <NavButton to="/sale-history">Sale History</NavButton>}
          {canAccessInventory && <NavButton to="/inventory">Inventory</NavButton>}
          {canAccessReports && <NavButton to="/reports">Reports</NavButton>}
          {canAccessExpenses && <NavButton to="/expenses">Expenses</NavButton>}
          {canAccessRefund && <NavButton to="/refund">Returns</NavButton>}
          {canAccessPromotions && <NavButton to="/promotions">Promotions</NavButton>}
          {canAccessDashboard && <NavButton to="/dashboard">Dashboard</NavButton>}
          <IconButton
            color="inherit"
            onClick={onOpenSettingsMenu}
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
              transition: 'all 0.2s ease',
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default GlobalAppBar;
