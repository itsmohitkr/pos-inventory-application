import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, CircularProgress, Typography, Chip } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  QrCode2 as QrCodeIcon,
  WifiOff as DisconnectedIcon,
} from '@mui/icons-material';
import whatsappService from '@/shared/api/whatsappService';

const POLL_INTERVAL = 3000;

const WhatsAppQRPanel = () => {
  const [status, setStatus] = useState('disconnected');
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await whatsappService.getStatus();
      // sendSuccessResponse with format:'raw' returns the object directly
      setStatus(res?.status || 'disconnected');
      setQr(res?.qr || null);
    } catch {
      // Server may not be ready; silently ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await whatsappService.initialize();
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await whatsappService.destroy();
      setQr(null);
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'ready') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
        <CheckCircleIcon sx={{ fontSize: 56, color: '#16a34a' }} />
        <Typography variant="h6" fontWeight="bold" color="success.main">
          WhatsApp Connected
        </Typography>
        <Chip label="Active" color="success" size="small" />
        <Button variant="outlined" color="error" onClick={handleDisconnect} disabled={loading} size="small">
          {loading ? <CircularProgress size={16} /> : 'Disconnect'}
        </Button>
      </Box>
    );
  }

  if (status === 'qr_pending' && qr) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Scan with WhatsApp on your phone
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Open WhatsApp → ⋮ Menu → Linked Devices → Link a Device
        </Typography>
        <Box
          component="img"
          src={qr}
          alt="WhatsApp QR Code"
          sx={{ width: 220, height: 220, border: '4px solid #25D366', borderRadius: 2 }}
        />
        <Typography variant="caption" color="text.secondary">
          QR code refreshes automatically
        </Typography>
      </Box>
    );
  }

  if (status === 'initializing') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Starting WhatsApp… this may take 20–30 seconds
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
      <DisconnectedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Typography variant="body2" color="text.secondary">
        Not connected. Click Connect to pair your WhatsApp account.
      </Typography>
      <Button
        variant="contained"
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <QrCodeIcon />}
        onClick={handleConnect}
        disabled={loading}
        sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}
      >
        Connect WhatsApp
      </Button>
    </Box>
  );
};

export default WhatsAppQRPanel;
