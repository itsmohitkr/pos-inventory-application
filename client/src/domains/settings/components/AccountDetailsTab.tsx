import React from 'react';
import type { AuthUser } from '@/shared/types/auth';

/** Version info shown in the About section. */
export interface AppMetadata {
  version: string;
  lastUpdate: string;
}

/** Auto-update lifecycle state from the updater IPC events. */
export type UpdateStatus =
  | ''
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error';

interface AccountDetailsTabProps {
  editedShopName: string;
  shopMobile: string;
  shopMobile2: string;
  shopAddress: string;
  shopEmail: string;
  shopGST: string;
  logoUrl: string;
  setEditedShopName: (value: string) => void;
  setShopMobile: (value: string) => void;
  setShopMobile2: (value: string) => void;
  setShopAddress: (value: string) => void;
  setShopEmail: (value: string) => void;
  setShopGST: (value: string) => void;
  setLogoUrl: (value: string) => void;
  updateStatus?: UpdateStatus | string;
  updateMessage?: string;
  /** 0-100 while an update downloads. */
  downloadProgress?: number;
  appMetadata: AppMetadata;
  handleCheckForUpdates: () => void;
  handleStartDownload: () => void;
  handleRestartApp: () => void;
  currentUser?: AuthUser | null;
  setShowWipeConfirm: (show: boolean) => void;
}
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  DeleteForever as DeleteForeverIcon,
  PhotoCamera as PhotoCameraIcon,
  Store as StoreIcon,
  SystemUpdate as UpdateIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const AccountDetailsTab = ({
  editedShopName,
  shopMobile,
  shopMobile2,
  shopAddress,
  shopEmail,
  shopGST,
  logoUrl,
  setEditedShopName,
  setShopMobile,
  setShopMobile2,
  setShopAddress,
  setShopEmail,
  setShopGST,
  setLogoUrl,
  updateStatus,
  updateMessage,
  downloadProgress,
  appMetadata,
  handleCheckForUpdates,
  handleStartDownload,
  handleRestartApp,
  currentUser,
  setShowWipeConfirm,
}: AccountDetailsTabProps) => {
  return (
    <Box>
      {/* 1. Shop Information Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 2.5,
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: '8px',
              bgcolor: 'rgba(11, 29, 57, 0.08)',
              color: '#0b1d39',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StoreIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '1.05rem', lineHeight: 1.2 }}>
              Shop Information
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
              Store contact numbers, receipt branding, and billing details
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2, borderColor: '#f1f5f9' }} />

        <Stack spacing={2.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              p: 2,
              borderRadius: '8px',
              bgcolor: '#f8fafc',
              border: '1px solid #edf2f7',
            }}
          >
            <Avatar
              src={logoUrl}
              sx={{
                width: 68,
                height: 68,
                bgcolor: '#0b1d39',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1.5rem',
                border: '2px solid #e2e8f0',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              {editedShopName?.charAt(0)?.toUpperCase() || 'S'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Logo URL"
                size="small"
                fullWidth
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                InputProps={{
                  endAdornment: <PhotoCameraIcon color="action" fontSize="small" />,
                }}
                sx={{
                  bgcolor: '#ffffff',
                  '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.75, display: 'block', fontSize: '0.75rem' }}
              >
                Provide an image URL to print on customer bills and invoices
              </Typography>
            </Box>
          </Box>

          <TextField
            label="Shop Name"
            size="small"
            fullWidth
            value={editedShopName}
            onChange={(e) => setEditedShopName(e.target.value)}
            placeholder="My Shop"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Mobile Number 1"
              size="small"
              fullWidth
              value={shopMobile}
              onChange={(e) => setShopMobile(e.target.value)}
              placeholder="+91 98765 43210"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <TextField
              label="Mobile Number 2 (Optional)"
              size="small"
              fullWidth
              value={shopMobile2}
              onChange={(e) => setShopMobile2(e.target.value)}
              placeholder="+91 88888 88888"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Box>

          <TextField
            label="Email Address"
            size="small"
            fullWidth
            type="email"
            value={shopEmail}
            onChange={(e) => setShopEmail(e.target.value)}
            placeholder="shop@example.com"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />

          <TextField
            label="Shop Address"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={shopAddress}
            onChange={(e) => setShopAddress(e.target.value)}
            placeholder="123 Business Street, City - 400001"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />

          <TextField
            label="GST Number (Optional)"
            size="small"
            fullWidth
            value={shopGST}
            onChange={(e) => setShopGST(e.target.value)}
            placeholder="22AAAAA0000A1Z5"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </Stack>
      </Paper>

      {/* 2. Application Updates Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 2.5,
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: '8px',
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UpdateIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '1.05rem', lineHeight: 1.2 }}>
              Application Updates
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
              Keep your point-of-sale client up to date with new features and security fixes
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2, borderColor: '#f1f5f9' }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={handleCheckForUpdates}
            disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
            size="small"
            sx={{
              borderRadius: '8px',
              borderColor: '#cbd5e1',
              color: '#0b1d39',
              fontWeight: 600,
              textTransform: 'none',
              px: 2,
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
            }}
          >
            {updateStatus === 'checking' ? 'Checking...' : 'Check for Updates'}
          </Button>

          {updateStatus === 'available' && (
            <Button
              variant="contained"
              onClick={handleStartDownload}
              size="small"
              sx={{ bgcolor: '#0b1d39', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Update Now
            </Button>
          )}

          {updateStatus === 'downloaded' && (
            <Button
              variant="contained"
              color="success"
              onClick={handleRestartApp}
              size="small"
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
            >
              Restart Now
            </Button>
          )}

          {updateStatus && (
            <Typography
              variant="body2"
              sx={{
                color:
                  updateStatus === 'error'
                    ? 'error.main'
                    : updateStatus === 'available'
                      ? 'info.main'
                      : updateStatus === 'downloaded'
                        ? 'success.main'
                        : 'text.secondary',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              {updateStatus === 'downloading' ? `Downloading: ${downloadProgress}%` : updateMessage}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5, fontWeight: 500 }}>
              Current Version
            </Typography>
            <Typography variant="body1" fontWeight={700} sx={{ color: '#0b1d39' }}>
              v{appMetadata.version || '2.0'}
            </Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5, fontWeight: 500 }}>
              Last System Update
            </Typography>
            <Typography variant="body1" fontWeight={700} sx={{ color: '#0b1d39' }}>
              {appMetadata.lastUpdate || 'Up to date'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 3. Danger Zone / Database Settings */}
      {currentUser?.role === 'admin' && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: '10px',
            border: '1px solid #fecaca',
            bgcolor: '#fffbfb',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                p: 0.75,
                borderRadius: '8px',
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WarningIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#dc2626', fontSize: '1.05rem', lineHeight: 1.2 }}>
                Database Settings
              </Typography>
              <Typography variant="caption" sx={{ color: '#7f1d1d', fontSize: '0.78rem' }}>
                Administrative data management and terminal reset
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 2, borderColor: '#fee2e2' }} />

          <Alert
            severity="error"
            variant="outlined"
            sx={{
              mb: 2.5,
              borderRadius: '8px',
              bgcolor: '#ffffff',
              border: '1px solid #fca5a5',
              '& .MuiAlert-message': { color: '#991b1b' },
            }}
          >
            <Typography variant="body2" fontWeight={700}>
              Danger Zone
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#b91c1c' }}>
              These operations permanently erase records and cannot be rolled back.
            </Typography>
          </Alert>

          <Box
            sx={{
              p: 2.5,
              bgcolor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#991b1b' }}>
                Wipe All Data
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                Permanently delete all sales records, inventory stock, batches, and transactions.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setShowWipeConfirm(true)}
              sx={{
                borderRadius: '8px',
                fontWeight: 700,
                textTransform: 'none',
                px: 2,
                flexShrink: 0,
                '&:hover': { bgcolor: '#fef2f2' },
              }}
            >
              Wipe Database
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AccountDetailsTab;
