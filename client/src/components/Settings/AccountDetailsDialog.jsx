import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  IconButton,
  Alert,
  Paper,
  Avatar,
  Stack,
  Tabs,
  Tab
} from '@mui/material';
import {
  Close as CloseIcon,
  Store as StoreIcon,
  DeleteForever as DeleteForeverIcon,
  Warning as WarningIcon,
  PhotoCamera as PhotoCameraIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import CustomDialog from '../common/CustomDialog';
import useCustomDialog from '../../hooks/useCustomDialog';
import PaymentSettingsPanel from './PaymentSettingsPanel';

const AccountDetailsDialog = ({ open, onClose, shopName, onShopNameChange, currentUser }) => {
  const { dialogState, showSuccess, showError, closeDialog } = useCustomDialog();
  const [editedShopName, setEditedShopName] = useState(shopName);
  const [shopMobile, setShopMobile] = useState(localStorage.getItem('posShopMobile') || '');
  const [shopAddress, setShopAddress] = useState(localStorage.getItem('posShopAddress') || '');
  const [shopEmail, setShopEmail] = useState(localStorage.getItem('posShopEmail') || '');
  const [shopGST, setShopGST] = useState(localStorage.getItem('posShopGST') || '');
  const [logoUrl, setLogoUrl] = useState(localStorage.getItem('posShopLogo') || '');
  
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipePassword, setWipePassword] = useState('');
  const [wipeLoading, setWipeLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleSave = () => {
    onShopNameChange(editedShopName);
    localStorage.setItem('posShopMobile', shopMobile);
    localStorage.setItem('posShopAddress', shopAddress);
    localStorage.setItem('posShopEmail', shopEmail);
    localStorage.setItem('posShopGST', shopGST);
    localStorage.setItem('posShopLogo', logoUrl);
    
    showSuccess('Shop details saved successfully!');
    if (!showWipeConfirm) {
      onClose();
    }
  };

  const handleWipeDatabase = async () => {
    if (!wipePassword) {
      showError('Please enter your admin password');
      return;
    }

    setWipeLoading(true);

    try {
      const response = await fetch('/api/auth/wipe-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          password: wipePassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || 'Failed to wipe database');
        setWipeLoading(false);
        return;
      }

      showSuccess('Database wiped successfully! The application will reload.');
      window.location.reload();
    } catch (error) {
      console.error('Wipe error:', error);
      showError('Failed to wipe database');
      setWipeLoading(false);
    }
  };

  const handleClose = () => {
    if (showWipeConfirm) {
      setShowWipeConfirm(false);
      setWipePassword('');
    } else {
      setEditedShopName(shopName);
      onClose();
    }
  };

  const handleDialogClose = (_event, reason) => {
    if (showWipeConfirm && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    handleClose();
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={showWipeConfirm}
      onKeyDown={(event) => {
        if (event.defaultPrevented) return;
        if (event.key !== 'Enter') return;
        if (event.shiftKey) return;
        if (event.target?.tagName === 'TEXTAREA') return;
        event.preventDefault();
        if (showWipeConfirm) {
          if (!wipePassword || wipeLoading) return;
          handleWipeDatabase();
          return;
        }
        handleSave();
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StoreIcon color="primary" />
          <Typography variant="h6">Settings</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          aria-label="settings tabs"
        >
          <Tab 
            icon={<StoreIcon />} 
            label="Account Details" 
            sx={{ gap: 1 }}
          />
          <Tab 
            icon={<PaymentIcon />} 
            label="Payment Settings" 
            sx={{ gap: 1 }}
          />
        </Tabs>
      </Box>

      <DialogContent dividers>
        {/* Tab 0: Account Details */}
        {tabValue === 0 && !showWipeConfirm && (
          <Box>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StoreIcon fontSize="small" color="primary" />
                Shop Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    src={logoUrl}
                    sx={{ width: 80, height: 80, bgcolor: 'primary.light' }}
                  >
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
                        endAdornment: <PhotoCameraIcon color="action" />
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

                <TextField
                  label="Mobile Number"
                  fullWidth
                  value={shopMobile}
                  onChange={(e) => setShopMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                />

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

            {/* Database Settings Section - Admin Only */}
            {currentUser?.role === 'admin' && (
              <Paper variant="outlined" sx={{ p: 2, border: '2px solid', borderColor: 'error.light' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
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

                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Wipe All Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Permanently delete all products, sales records, categories, and user accounts (except yours). This action cannot be undone.
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
        )}

        {/* Tab 1: Payment Settings */}
        {tabValue === 1 && (
          <PaymentSettingsPanel />
        )}

        {/* Wipe Database Confirmation */}
        {tabValue === 0 && showWipeConfirm && (
          <Box>
            <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                ⚠️ FINAL WARNING
              </Typography>
              <Typography variant="body1" gutterBottom>
                You are about to permanently delete:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>All products and inventory batches</li>
                <li>All sales records and transaction history</li>
                <li>All categories and subcategories</li>
                <li>All user accounts (except yours)</li>
              </Box>
              <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                This action is IRREVERSIBLE and will take effect immediately!
              </Typography>
            </Alert>

            <Typography variant="body1" sx={{ mb: 2 }}>
              To proceed, enter your admin password:
            </Typography>

            <TextField
              label="Admin Password"
              type="password"
              fullWidth
              value={wipePassword}
              onChange={(e) => setWipePassword(e.target.value)}
              autoFocus
              error={wipePassword.length > 0 && wipePassword.length < 4}
              helperText={wipePassword.length > 0 && wipePassword.length < 4 ? 'Password too short' : ''}
            />

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Logged in as: <strong>{currentUser?.username}</strong> (Admin)
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {!showWipeConfirm ? (
          <>
            <Button onClick={handleClose} variant="outlined">
              Cancel
            </Button>
            {tabValue === 0 && (
              <Button onClick={handleSave} variant="contained">
                Save Changes
              </Button>
            )}
          </>
        ) : (
          <>
            <Button 
              onClick={() => {
                setShowWipeConfirm(false);
                setWipePassword('');
              }} 
              variant="outlined"
              disabled={wipeLoading}
            >
              Go Back
            </Button>
            <Button
              onClick={handleWipeDatabase}
              variant="contained"
              color="error"
              startIcon={<DeleteForeverIcon />}
              disabled={!wipePassword || wipeLoading}
            >
              {wipeLoading ? 'Wiping...' : 'Confirm & Wipe Database'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
    <CustomDialog {...dialogState} onClose={closeDialog} />
    </>
  );
};

export default AccountDetailsDialog;
