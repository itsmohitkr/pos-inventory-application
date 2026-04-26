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
  STORAGE_KEYS,
} from '@/shared/utils/paymentSettings';

const DisplaySettingsTab = ({
  uiZoom,
  setUiZoom,
  monochrome,
  setMonochrome,
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
              Increase the size of text and buttons across the entire application.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {[100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150].map((level) => (
                <Button
                  key={level}
                  variant={uiZoom === level ? 'contained' : 'outlined'}
                  onClick={() => {
                    setUiZoom(level);
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
                    setMonochrome(e.target.checked);
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
        </Stack>
      </Paper>
    </Box>
  );
};

export default DisplaySettingsTab;
