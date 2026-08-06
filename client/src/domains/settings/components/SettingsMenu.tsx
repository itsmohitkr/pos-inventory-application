import React from 'react';
import type { AuthUser } from '@/shared/types/auth';

interface SettingsMenuProps {
  /** Null closes the menu. */
  anchorEl?: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onFullscreenToggle: () => void;
  isFullscreen?: boolean;
  isAdmin?: boolean;
  onOpenBillDialog: () => void;
  onChangePassword: () => void;
  onAdminLogin: () => void;
  onManageUsers: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  currentUser?: AuthUser | null;
}
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
}: SettingsMenuProps) => {
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
      {/*
        Shown whenever there is no active elevation countdown (i.e. not
        already elevated from a lower role — that case has its own "Log out
        Admin" timer instead). This includes users who logged in directly as
        the admin account: their elevation token (server-side, ~15 min TTL by
        default) expires independently of their login session, and without
        this item there was no way to re-verify short of a full logout —
        admin-gated actions (e.g. category-sale product overrides) would fail
        with "verify as admin" for a user who never left the admin account.
      */}
      {!currentUser?.originalRole && <Divider />}
      {!currentUser?.originalRole && (
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
            {currentUser?.role === 'admin' ? 'Verify Admin' : 'Admin Login'}
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
