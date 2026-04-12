import React from 'react';
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
}) => {
  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StoreIcon fontSize="small" color="primary" />
          Shop Information
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2,
            }}
          >
            <Avatar src={logoUrl} sx={{ width: 80, height: 80, bgcolor: 'primary.light' }}>
              {editedShopName?.charAt(0) || 'S'}
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
                  endAdornment: <PhotoCameraIcon color="action" />,
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Enter a URL for your shop logo
              </Typography>
            </Box>
          </Box>

          <TextField
            label="Shop Name"
            fullWidth
            value={editedShopName}
            onChange={(e) => setEditedShopName(e.target.value)}
            placeholder="My Shop"
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Mobile Number 1"
              fullWidth
              value={shopMobile}
              onChange={(e) => setShopMobile(e.target.value)}
              placeholder="+91 98765 43210"
            />
            <TextField
              label="Mobile Number 2 (Optional)"
              fullWidth
              value={shopMobile2}
              onChange={(e) => setShopMobile2(e.target.value)}
              placeholder="+91 88888 88888"
            />
          </Box>

          <TextField
            label="Email Address"
            fullWidth
            type="email"
            value={shopEmail}
            onChange={(e) => setShopEmail(e.target.value)}
            placeholder="shop@example.com"
          />

          <TextField
            label="Shop Address"
            fullWidth
            multiline
            rows={2}
            value={shopAddress}
            onChange={(e) => setShopAddress(e.target.value)}
            placeholder="123 Business Street, City - 400001"
          />

          <TextField
            label="GST Number (Optional)"
            fullWidth
            value={shopGST}
            onChange={(e) => setShopGST(e.target.value)}
            placeholder="22AAAAA0000A1Z5"
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UpdateIcon fontSize="small" color="primary" />
          Application Updates
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleCheckForUpdates}
            disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
            size="small"
          >
            {updateStatus === 'checking' ? 'Checking...' : 'Check for Updates'}
          </Button>

          {updateStatus === 'available' && (
            <Button variant="contained" color="primary" onClick={handleStartDownload} size="small">
              Update Now
            </Button>
          )}

          {updateStatus === 'downloaded' && (
            <Button variant="contained" color="success" onClick={handleRestartApp} size="small">
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
                fontWeight: 500,
              }}
            >
              {updateStatus === 'downloading' ? `Downloading: ${downloadProgress}%` : updateMessage}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Current Version
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: 'primary.main' }}>
              {appMetadata.version}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Last System Update
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: 'primary.main' }}>
              {appMetadata.lastUpdate}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {currentUser?.role === 'admin' && (
        <Paper variant="outlined" sx={{ p: 2, border: '2px solid', borderColor: 'error.light' }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'error.main',
            }}
          >
            <WarningIcon />
            Database Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Danger Zone
            </Typography>
            <Typography variant="body2">
              These actions are irreversible. Use with extreme caution.
            </Typography>
          </Alert>

          <Box
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.300',
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Wipe All Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Permanently delete all products, sales records, categories, and user accounts (except
              yours). This action cannot be undone.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setShowWipeConfirm(true)}
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
