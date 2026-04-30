import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, CircularProgress, Typography, Chip, LinearProgress } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  QrCode2 as QrCodeIcon,
  WifiOff as DisconnectedIcon,
  ErrorOutline as ErrorIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import whatsappService from '@/shared/api/whatsappService';

const POLL_INTERVAL = 3000;
const INSTALL_POLL_INTERVAL = 1000;

const formatBytes = (bytes) => {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const WhatsAppQRPanel = () => {
  // Browser install state — gate that runs before any WhatsApp UI
  const [browserStatus, setBrowserStatus] = useState('checking');
  const [installProgress, setInstallProgress] = useState({ progress: 0, bytesDownloaded: 0, bytesTotal: 0 });
  const [browserError, setBrowserError] = useState(null);

  // WhatsApp connection state
  const [status, setStatus] = useState('disconnected');
  const [qr, setQr] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBrowserStatus = useCallback(async () => {
    try {
      const res = await whatsappService.getBrowserStatus();
      setBrowserStatus(res?.status || 'missing');
      setInstallProgress({
        progress: res?.progress || 0,
        bytesDownloaded: res?.bytesDownloaded || 0,
        bytesTotal: res?.bytesTotal || 0,
      });
      setBrowserError(res?.error || null);
    } catch {
      // Server may not be ready
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await whatsappService.getStatus();
      setStatus(res?.status || 'disconnected');
      setQr(res?.qr || null);
      setErrorMessage(res?.error || null);
    } catch {
      // Server may not be ready
    }
  }, []);

  // Poll browser status. While installing we poll faster so the progress bar
  // looks responsive. Once ready, we switch to the WhatsApp status poll.
  useEffect(() => {
    fetchBrowserStatus();
    const interval = setInterval(
      fetchBrowserStatus,
      browserStatus === 'installing' ? INSTALL_POLL_INTERVAL : POLL_INTERVAL
    );
    return () => clearInterval(interval);
  }, [fetchBrowserStatus, browserStatus]);

  // Only poll WhatsApp connection status once the browser is installed.
  useEffect(() => {
    if (browserStatus !== 'ready') return;
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus, browserStatus]);

  const handleInstallBrowser = async () => {
    setLoading(true);
    try {
      await whatsappService.installBrowser();
      // Server now downloads in the background. Our poll picks up progress.
      await fetchBrowserStatus();
    } finally {
      setLoading(false);
    }
  };

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
      setErrorMessage(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Browser install gate ────────────────────────────────────────────────────
  // Until the headless browser component is installed, we never show the
  // WhatsApp Connect button — clicking it would only fail.

  if (browserStatus === 'checking') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (browserStatus === 'installing') {
    const { progress, bytesDownloaded, bytesTotal } = installProgress;
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3, px: 4 }}>
        <DownloadIcon sx={{ fontSize: 48, color: '#25D366' }} />
        <Typography variant="subtitle1" fontWeight="bold">
          Downloading WhatsApp browser component…
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          One-time setup. {formatBytes(bytesDownloaded)} of {formatBytes(bytesTotal)} ({progress}%)
        </Typography>
        <Box sx={{ width: '100%', maxWidth: 320 }}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
        <Typography variant="caption" color="text.secondary" textAlign="center">
          You can leave this page — the download will continue in the background.
        </Typography>
      </Box>
    );
  }

  if (browserStatus === 'missing') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3, px: 4 }}>
        <DownloadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
        <Typography variant="subtitle1" fontWeight="bold" textAlign="center">
          One-time WhatsApp setup
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          WhatsApp needs a small browser component (~150 MB) to connect to WhatsApp Web.
          This is a one-time download — internet is required only for setup.
        </Typography>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
          onClick={handleInstallBrowser}
          disabled={loading}
          sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}
        >
          Set up WhatsApp
        </Button>
      </Box>
    );
  }

  if (browserStatus === 'error') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3, px: 4 }}>
        <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
        <Typography variant="body2" color="error" textAlign="center">
          {browserError || 'Browser component download failed.'}
        </Typography>
        <Typography variant="caption" color="text.secondary" textAlign="center">
          Check your internet connection and try again.
        </Typography>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
          onClick={handleInstallBrowser}
          disabled={loading}
          sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}
        >
          Retry download
        </Button>
      </Box>
    );
  }

  // ── WhatsApp connection states (browser is installed) ───────────────────────

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
          Starting WhatsApp… this may take 20–60 seconds on first launch
        </Typography>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
        <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
        <Typography variant="body2" color="error" textAlign="center">
          {errorMessage || 'WhatsApp failed to start.'}
        </Typography>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <QrCodeIcon />}
          onClick={handleConnect}
          disabled={loading}
          sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}
        >
          Retry
        </Button>
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
