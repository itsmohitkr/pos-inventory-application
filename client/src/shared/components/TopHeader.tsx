import React from 'react';
import { Box, Typography, IconButton, Stack, Chip, Button, Avatar } from '@mui/material';
import { Menu as MenuIcon, Wifi as WifiIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';
import type { AuthUser } from '@/shared/types/auth';
import useOnlineStatus from '@/shared/hooks/useOnlineStatus';

interface TopHeaderProps {
  shopName?: string;
  onOpenSidebar: () => void;
  currentUser?: AuthUser | null;
  adminLogoutTimer?: number | null;
  onAdminLogout?: () => void;
  showUserInfo?: boolean;
}

const TopHeader = ({
  shopName = 'Trovix POS',
  onOpenSidebar,
  currentUser,
  adminLogoutTimer,
  onAdminLogout,
  showUserInfo = true,
}: TopHeaderProps) => {
  const isOnline = useOnlineStatus();

  const formatTimer = (seconds: number | null | undefined): string => {
    if (seconds == null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return ` (${mins}:${secs.toString().padStart(2, '0')})`;
  };

  return (
    <Box
      component="header"
      className="no-print"
      sx={{
        height: 48,
        minHeight: 48,
        bgcolor: '#0b1d39',
        background: 'linear-gradient(90deg, #0b1d39 0%, #11284b 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1.5,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 1100,
        userSelect: 'none',
      }}
    >
      {/* Left: Sidebar Toggle Icon + Shop Name */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <IconButton
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          size="small"
          sx={{
            color: '#f2b544',
            bgcolor: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            p: 0.75,
            flexShrink: 0,
            transition: 'all 0.15s ease-in-out',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
            },
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        {/* Shop Name & Status Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '6px',
              bgcolor: '#f2b544',
              color: '#0b1d39',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
            }}
          >
            {shopName.charAt(0).toUpperCase()}
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#ffffff',
              lineHeight: 1.2,
            }}
          >
            {shopName}
          </Typography>
          {isOnline ? (
            <WifiIcon titleAccess="Online" sx={{ fontSize: 16, color: '#22c55e' }} />
          ) : (
            <WifiOffIcon titleAccess="Offline" sx={{ fontSize: 16, color: '#ef4444' }} />
          )}
        </Box>
      </Stack>

      {/* Right: User identity & role + Elevated session timer */}
      <Stack direction="row" spacing={1.25} alignItems="center">
        {currentUser?.originalRole && (
          <Button
            onClick={onAdminLogout}
            variant="outlined"
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              py: 0.35,
              px: 1.25,
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

        {showUserInfo && currentUser && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              px: 1.25,
              py: 0.5,
            }}
          >
            <Avatar
              sx={{
                width: 24,
                height: 24,
                bgcolor: 'rgba(242, 181, 68, 0.25)',
                color: '#f2b544',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {currentUser.username?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: '#ffffff',
                fontSize: '0.82rem',
                textTransform: 'capitalize',
              }}
            >
              {currentUser.username}
            </Typography>
            <Chip
              label={currentUser.role}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                bgcolor: currentUser.role === 'admin' ? 'rgba(242, 181, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: currentUser.role === 'admin' ? '#f2b544' : 'rgba(255, 255, 255, 0.85)',
                borderRadius: '4px',
              }}
            />
            {currentUser.originalRole && (
              <Chip
                label="Elevated"
                size="small"
                color="warning"
                sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, borderRadius: '4px' }}
              />
            )}
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default TopHeader;
