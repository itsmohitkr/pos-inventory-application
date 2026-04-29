import React from 'react';
import { Box, Divider, FormControlLabel, Paper, Switch, Typography } from '@mui/material';
import { WhatsApp as WhatsAppIcon } from '@mui/icons-material';
import WhatsAppQRPanel from '@/domains/settings/components/WhatsAppQRPanel';

const WhatsAppSettingsTab = ({ whatsappEnabled, setWhatsappEnabled }) => {
  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} />
          WhatsApp Communication
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
              color="success"
            />
          }
          label={
            <Box>
              <Typography variant="body1" fontWeight="600">
                Enable WhatsApp Communication
              </Typography>
              <Typography variant="caption" color="text.secondary">
                When enabled, customers can be searched by phone number in POS and receive their
                unique barcode card via WhatsApp on first visit.
              </Typography>
            </Box>
          }
        />

        {whatsappEnabled && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              WhatsApp Account
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Pair your WhatsApp account below. You only need to do this once — the session is
              saved automatically.
            </Typography>
            <WhatsAppQRPanel />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default WhatsAppSettingsTab;
