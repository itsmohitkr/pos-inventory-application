import React from 'react';
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DisplaySettings as DisplayIcon } from '@mui/icons-material';
import {
  setCalculatorEnabled,
  setChangeCalculatorEnabled,
  setPaymentMethodsEnabled,
  STORAGE_KEYS,
} from '../../shared/utils/paymentSettings';

const DisplaySettingsTab = ({
  uiZoom,
  setUiZoom,
  monochrome,
  setMonochrome,
  looseSaleEnabled,
  setLooseSaleEnabled,
  fullscreenEnabled,
  setFullscreenEnabled,
  weightedAverageCostEnabled,
  setWeightedAverageCostEnabled,
  extraDiscountEnabled,
  setExtraDiscountEnabledState,
  notificationDuration,
  setNotificationDurationState,
  adminAutoLogoutTime,
  setAdminAutoLogoutTimeState,
  calculatorEnabled,
  setCalculatorEnabledState,
  changeCalculatorEnabled,
  setChangeCalculatorEnabledState,
  paymentMethodsEnabled,
  setPaymentMethodsEnabledState,
}) => {
  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <DisplayIcon fontSize="small" color="primary" />
          Display & Zoom Settings
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Application Zoom
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Increase the size of text and buttons across the entire application. This is
              particularly useful for touchscreens or high-resolution displays.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {[100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150].map((level) => (
                <Button
                  key={level}
                  variant={uiZoom === level ? 'contained' : 'outlined'}
                  onClick={() => {
                    setUiZoom(level);
                    localStorage.setItem('posUiZoom', level.toString());
                    window.dispatchEvent(new Event('pos-ui-zoom-updated'));
                  }}
                  sx={{
                    minWidth: 80,
                    py: 1.5,
                    fontWeight: 'bold',
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
                bgcolor: 'primary.light',
                borderRadius: 2,
                opacity: 0.8,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'primary.contrastText',
                  fontStyle: 'italic',
                }}
              >
                Preview: This is how your buttons and text will look.
              </Typography>
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Visual Mode
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Switch to monochrome mode for a high-contrast, black-and-white interface.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={monochrome}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setMonochrome(val);
                    localStorage.setItem('posMonochromeMode', val.toString());
                    window.dispatchEvent(new Event('pos-settings-updated'));
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
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              POS Features
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enable or disable specific features on the POS terminal.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={looseSaleEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setLooseSaleEnabled(val);
                    localStorage.setItem('posLooseSaleEnabled', val.toString());
                    window.dispatchEvent(new Event('pos-settings-updated'));
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
                  checked={weightedAverageCostEnabled}
                  onChange={(e) => setWeightedAverageCostEnabled(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Enable Weighted Average Cost
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatically calculate new cost price when adding stock in Quick Inventory
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

            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                Admin Elevation Auto-Logout
              </Typography>
              <TextField
                type="number"
                size="small"
                value={adminAutoLogoutTime}
                onChange={(e) => setAdminAutoLogoutTimeState(parseInt(e.target.value, 10))}
                inputProps={{ min: 1, max: 120, step: 1 }}
                label="Time (minutes)"
                helperText="How long admin elevation remains active before timing out"
                sx={{ maxWidth: 250, mt: 1 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={calculatorEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setCalculatorEnabledState(val);
                    setCalculatorEnabled(val);
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Enable POS Calculator
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Shows a calculator button on the POS screen for quick math.
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={changeCalculatorEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setChangeCalculatorEnabledState(val);
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
  );
};

export default DisplaySettingsTab;
