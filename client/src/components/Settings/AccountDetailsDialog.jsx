import React, { useState, useEffect } from "react";
import api from "../../api";
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
  Tab,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Close as CloseIcon,
  Store as StoreIcon,
  DeleteForever as DeleteForeverIcon,
  Warning as WarningIcon,
  PhotoCamera as PhotoCameraIcon,
  Payment as PaymentIcon,
  DisplaySettings as DisplayIcon,
} from "@mui/icons-material";
import CustomDialog from "../common/CustomDialog";
import useCustomDialog from "../../hooks/useCustomDialog";
import PaymentSettingsPanel from "./PaymentSettingsPanel";
import {
  getChangeCalculatorEnabled,
  setChangeCalculatorEnabled,
  getPaymentMethodsEnabled,
  setPaymentMethodsEnabled,
  getStoredPaymentSettings,
  STORAGE_KEYS,
  getFullscreenEnabled,
  getNotificationDuration,
  setNotificationDuration,
  getExtraDiscountEnabled,
  setExtraDiscountEnabled
} from "../../utils/paymentSettings";
import { Snackbar, Alert as MuiAlert } from "@mui/material";

const AccountDetailsDialog = ({
  open,
  onClose,
  shopName,
  shopMetadata,
  onMetadataChange,
  currentUser,
}) => {
  const { dialogState, showSuccess, showError, closeDialog } =
    useCustomDialog();
  const [editedShopName, setEditedShopName] = useState(shopName);
  const [shopMobile, setShopMobile] = useState(shopMetadata.shopMobile);
  const [shopMobile2, setShopMobile2] = useState(shopMetadata.shopMobile2);
  const [shopAddress, setShopAddress] = useState(shopMetadata.shopAddress);
  const [shopEmail, setShopEmail] = useState(shopMetadata.shopEmail);
  const [shopGST, setShopGST] = useState(shopMetadata.shopGST);
  const [logoUrl, setLogoUrl] = useState(shopMetadata.shopLogo);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [updateMessage, setUpdateMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  // Add missing state variables
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipePassword, setWipePassword] = useState("");
  const [wipeLoading, setWipeLoading] = useState(false);
  const [uiZoom, setUiZoom] = useState(
    Number(localStorage.getItem("posUiZoom")) || 100,
  );
  const [monochrome, setMonochrome] = useState(
    localStorage.getItem("posMonochromeMode") === "true",
  );
  const [looseSaleEnabled, setLooseSaleEnabled] = useState(
    localStorage.getItem("posLooseSaleEnabled") === "true",
  );
  const [changeCalculatorEnabled, setChangeCalculatorEnabledState] = useState(
    getChangeCalculatorEnabled(),
  );
  const [paymentMethodsEnabled, setPaymentMethodsEnabledState] = useState(
    getPaymentMethodsEnabled(),
  );
  const [fullscreenEnabled, setFullscreenEnabled] = useState(getFullscreenEnabled());
  const [extraDiscountEnabled, setExtraDiscountEnabledState] = useState(getExtraDiscountEnabled());
  const [notificationDuration, setNotificationDurationState] = useState(() => getNotificationDuration() / 1000);
  const [tabValue, setTabValue] = useState(0);

  // Sync with metadata prop changes
  useEffect(() => {
    // Only update state if values actually changed to avoid unnecessary renders
    if (editedShopName !== shopName) setEditedShopName(shopName);
    if (shopMobile !== shopMetadata.shopMobile)
      setShopMobile(shopMetadata.shopMobile);
    if (shopMobile2 !== shopMetadata.shopMobile2)
      setShopMobile2(shopMetadata.shopMobile2);
    if (shopAddress !== shopMetadata.shopAddress)
      setShopAddress(shopMetadata.shopAddress);
    if (shopEmail !== shopMetadata.shopEmail)
      setShopEmail(shopMetadata.shopEmail);
    if (shopGST !== shopMetadata.shopGST) setShopGST(shopMetadata.shopGST);
    if (logoUrl !== shopMetadata.shopLogo) setLogoUrl(shopMetadata.shopLogo);
  }, [shopName, shopMetadata]);

  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      const onAvailable = () => {
        setUpdateStatus("info");
        setUpdateMessage("A new update is available. Downloading...");
        setSnackbarOpen(true);
      };
      const onDownloaded = () => {
        setUpdateStatus("success");
        setUpdateMessage("Update downloaded! Restart the app to apply.");
        setSnackbarOpen(true);
      };
      const onError = (_event, msg) => {
        setUpdateStatus("error");
        setUpdateMessage("Update error: " + msg);
        setSnackbarOpen(true);
      };
      const onNotAvailable = () => {
        setUpdateStatus("success");
        setUpdateMessage("You are on the latest version!");
        setSnackbarOpen(true);
      };

      window.electron.ipcRenderer.on("update-available", onAvailable);
      window.electron.ipcRenderer.on("update-downloaded", onDownloaded);
      window.electron.ipcRenderer.on("update-error", onError);
      window.electron.ipcRenderer.on("update-not-available", onNotAvailable);

      return () => {
        window.electron.ipcRenderer.off("update-available", onAvailable);
        window.electron.ipcRenderer.off("update-downloaded", onDownloaded);
        window.electron.ipcRenderer.off("update-error", onError);
        window.electron.ipcRenderer.off("update-not-available", onNotAvailable);
      };
    }
  }, []);

  useEffect(() => {
    const fetchUISettings = async () => {
      try {
        const res = await api.get('/api/settings');
        const settings = res.data.data;
        if (settings.posEnableExtraDiscount !== undefined) {
          setExtraDiscountEnabledState(settings.posEnableExtraDiscount);
        }
        if (settings.posNotificationDuration !== undefined) {
          setNotificationDurationState(settings.posNotificationDuration / 1000);
        }
      } catch (error) {
        console.error('Failed to fetch UI settings:', error);
      }
    };
    if (open && tabValue === 2) {
      fetchUISettings();
    }
  }, [open, tabValue]);

  const handleSave = () => {
    onMetadataChange({
      shopName: editedShopName,
      shopMobile,
      shopMobile2,
      shopAddress,
      shopEmail,
      shopGST,
      shopLogo: logoUrl,
    });

    localStorage.setItem("posUiZoom", uiZoom.toString());
    localStorage.setItem("posMonochromeMode", monochrome.toString());
    localStorage.setItem("posLooseSaleEnabled", looseSaleEnabled.toString());
    localStorage.setItem(STORAGE_KEYS.enableFullscreen, JSON.stringify(fullscreenEnabled));

    setChangeCalculatorEnabled(changeCalculatorEnabled);
    setPaymentMethodsEnabled(paymentMethodsEnabled);

    const saveSettingsToServer = async () => {
      try {
        await api.post('/api/settings', {
          key: 'posEnableExtraDiscount',
          value: extraDiscountEnabled
        });
        await api.post('/api/settings', {
          key: 'posNotificationDuration',
          value: notificationDuration * 1000
        });
        window.dispatchEvent(new Event("pos-settings-updated"));
      } catch (error) {
        console.error('Failed to save UI settings:', error);
      }
    };
    saveSettingsToServer();

    window.dispatchEvent(new Event("pos-ui-zoom-updated"));
    window.dispatchEvent(new Event("pos-settings-updated"));

    let message = "Settings saved successfully!";
    if (tabValue === 0) message = "Shop information updated successfully!";
    if (tabValue === 2) message = "Display settings updated successfully!";

    showSuccess(message);
    if (!showWipeConfirm) {
      onClose();
    }
  };

  const handleWipeDatabase = async () => {
    if (!wipePassword) {
      showError("Please enter your admin password");
      return;
    }

    setWipeLoading(true);

    try {
      const response = await api.post("/api/auth/wipe-database", {
        username: currentUser.username,
        password: wipePassword,
      });

      showSuccess("Database wiped successfully! The application will reload.");
      window.location.reload();
    } catch (error) {
      console.error("Wipe error:", error);
      showError(error.response?.data?.error || "Failed to wipe database");
      setWipeLoading(false);
    }
  };

  const handleClose = () => {
    if (showWipeConfirm) {
      setShowWipeConfirm(false);
      setWipePassword("");
    } else {
      setEditedShopName(shopName);
      onClose();
    }
  };

  const handleDialogClose = (_event, reason) => {
    if (
      showWipeConfirm &&
      (reason === "backdropClick" || reason === "escapeKeyDown")
    ) {
      return;
    }
    handleClose();
  };

  const handleCheckForUpdates = () => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send("check-for-updates");
      setUpdateStatus("info");
      setUpdateMessage("Checking for updates...");
      setSnackbarOpen(true);
    }
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
          if (event.key !== "Enter") return;
          if (event.shiftKey) return;
          if (event.target?.tagName === "TEXTAREA") return;
          event.preventDefault();
          if (showWipeConfirm) {
            if (!wipePassword || wipeLoading) return;
            handleWipeDatabase();
            return;
          }
          handleSave();
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <StoreIcon color="primary" />
            <Typography variant="h6">Settings</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            aria-label="settings tabs"
          >
            <Tab icon={<StoreIcon />} label="Account Details" sx={{ gap: 1 }} />
            <Tab
              icon={<PaymentIcon />}
              label="Payment Settings"
              sx={{ gap: 1 }}
            />
            <Tab
              icon={<DisplayIcon />}
              label="Display Settings"
              sx={{ gap: 1 }}
            />
          </Tabs>
        </Box>

        <DialogContent dividers>
          {/* Tab 0: Account Details */}
          {tabValue === 0 && !showWipeConfirm && (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <StoreIcon fontSize="small" color="primary" />
                  Shop Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      src={logoUrl}
                      sx={{ width: 80, height: 80, bgcolor: "primary.light" }}
                    >
                      {editedShopName?.charAt(0) || "S"}
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
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: "block" }}
                      >
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

                  <Box sx={{ display: "flex", gap: 2 }}>
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

                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleCheckForUpdates}
                  sx={{ mt: 2 }}
                >
                  Check for Updates
                </Button>
              </Paper>

              {/* Database Settings Section - Admin Only */}
              {currentUser?.role === "admin" && (
                <Paper
                  variant="outlined"
                  sx={{ p: 2, border: "2px solid", borderColor: "error.light" }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "error.main",
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
                      bgcolor: "grey.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "grey.300",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Wipe All Data
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Permanently delete all products, sales records,
                      categories, and user accounts (except yours). This action
                      cannot be undone.
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
          {tabValue === 1 && <PaymentSettingsPanel showSuccess={showSuccess} />}

          {/* Tab 2: UI Settings */}
          {tabValue === 2 && (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <DisplayIcon fontSize="small" color="primary" />
                  Display & Zoom Settings
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Application Zoom
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Increase the size of text and buttons across the entire
                      application. This is particularly useful for touchscreens
                      or high-resolution displays.
                    </Typography>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                      {[
                        100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150,
                      ].map((level) => (
                        <Button
                          key={level}
                          variant={uiZoom === level ? "contained" : "outlined"}
                          onClick={() => {
                            setUiZoom(level);
                            // Apply immediately for live preview
                            localStorage.setItem("posUiZoom", level.toString());
                            window.dispatchEvent(
                              new Event("pos-ui-zoom-updated"),
                            );
                          }}
                          sx={{
                            minWidth: 80,
                            py: 1.5,
                            fontWeight: "bold",
                            borderRadius: 2,
                          }}
                        >
                          {level}%
                        </Button>
                      ))}
                    </Box>

                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        bgcolor: "primary.light",
                        borderRadius: 2,
                        opacity: 0.8,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "primary.contrastText",
                          fontStyle: "italic",
                        }}
                      >
                        Preview: This is how your buttons and text will look.
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Visual Mode
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Switch to monochrome mode for a high-contrast,
                      black-and-white interface.
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={monochrome}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setMonochrome(val);
                            // Apply immediately for live preview
                            localStorage.setItem(
                              "posMonochromeMode",
                              val.toString(),
                            );
                            window.dispatchEvent(
                              new Event("pos-settings-updated"),
                            );
                          }}
                        />
                      }
                      label={
                        <Typography variant="body1" fontWeight={600}>
                          Enable Monochrome Mode
                        </Typography>
                      }
                    />
                  </Box>

                  <Divider />

                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      POS Features
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Enable or disable specific features on the POS terminal.
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={looseSaleEnabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setLooseSaleEnabled(val);
                            // Apply immediately for live preview and persistence
                            localStorage.setItem(
                              "posLooseSaleEnabled",
                              val.toString(),
                            );
                            window.dispatchEvent(
                              new Event("pos-settings-updated"),
                            );
                          }}
                        />
                      }
                      label={
                        <Typography variant="body1" fontWeight={600}>
                          Enable Loose Sale Button
                        </Typography>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={fullscreenEnabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setFullscreenEnabled(val);
                            localStorage.setItem(STORAGE_KEYS.enableFullscreen, JSON.stringify(val));
                            window.dispatchEvent(new Event('pos-settings-updated'));
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            Enable Fullscreen Toggle
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Shows a fullscreen button in the bottom-left corner of the POS screen
                          </Typography>
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={extraDiscountEnabled}
                          onChange={(e) => {
                            setExtraDiscountEnabledState(e.target.checked);
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            Enable Extra Discount Field
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Shows an extra discount field in the POS transaction panel
                          </Typography>
                        </Box>
                      }
                    />

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" fontWeight={600} gutterBottom>
                        Notification Duration
                      </Typography>
                      <TextField
                        type="number"
                        size="small"
                        value={notificationDuration}
                        onChange={(e) => setNotificationDurationState(parseFloat(e.target.value))}
                        inputProps={{ min: 1, max: 10, step: 0.5 }}
                        label="Duration (seconds)"
                        helperText="How long success notifications are displayed (1-10 seconds)"
                        sx={{ maxWidth: 250, mt: 1 }}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={changeCalculatorEnabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setChangeCalculatorEnabledState(val);
                            // Apply immediately for live preview
                            setChangeCalculatorEnabled(val);
                          }}
                        />
                      }
                      label={
                        <Typography variant="body1" fontWeight={600}>
                          Enable Change Calculator
                        </Typography>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={paymentMethodsEnabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setPaymentMethodsEnabledState(val);
                            // Apply immediately for live preview
                            setPaymentMethodsEnabled(val);
                          }}
                        />
                      }
                      label={
                        <Typography variant="body1" fontWeight={600}>
                          Enable Payment Methods
                        </Typography>
                      }
                    />
                  </Box>
                </Stack>
              </Paper>
            </Box>
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
                <Typography variant="body2" sx={{ mt: 2, fontWeight: "bold" }}>
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
                helperText={
                  wipePassword.length > 0 && wipePassword.length < 4
                    ? "Password too short"
                    : ""
                }
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: "block" }}
              >
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
              {(tabValue === 0 || tabValue === 2) && (
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
                  setWipePassword("");
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
                {wipeLoading ? "Wiping..." : "Confirm & Wipe Database"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      <CustomDialog {...dialogState} onClose={closeDialog} />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <MuiAlert
          onClose={() => setSnackbarOpen(false)}
          severity={updateStatus}
          sx={{ width: "100%" }}
        >
          {updateMessage}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default AccountDetailsDialog;
