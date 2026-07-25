import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
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

const SettingsMenu = ({
  anchorEl,
  open,
  onClose,
  onFullscreenToggle,
  isFullscreen,
  isAdmin,
  onOpenBillDialog,
  onChangePassword,
  onAdminLogin,
  onManageUsers,
  onOpenSettings,
  onLogout,
  currentUser,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
    >
      <MenuItem onClick={onFullscreenToggle} disabled={isFullscreen}>
        <ListItemIcon>
          <FullscreenIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Enter full screen</ListItemText>
      </MenuItem>
      <MenuItem onClick={onFullscreenToggle} disabled={!isFullscreen}>
        <ListItemIcon>
          <FullscreenExitIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Exit full screen</ListItemText>
      </MenuItem>
      {isAdmin && <Divider />}
      {isAdmin && (
        <MenuItem
          onClick={() => {
            onOpenBillDialog();
            onClose();
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
          onChangePassword();
          onClose();
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
            onAdminLogin();
            onClose();
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
            onManageUsers();
            onClose();
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
            onOpenSettings();
            onClose();
          }}
        >
          <ListItemIcon>
            <StoreIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
      )}
      <MenuItem onClick={onLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default SettingsMenu;
