import React, { useState } from 'react';
import posService from '@/shared/api/posService';
import {
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon, Undo as UndoIcon } from '@mui/icons-material';
import RefundProcessor from '@/domains/refund/components/RefundProcessor';

const Refund = () => {
  const [orderId, setOrderId] = useState('');
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    setSale(null);
    try {
      // Remove 'ORD-' prefix if entered
      const id = orderId.replace('ORD-', '');
      const saleData = await posService.fetchSaleById(id);
      setSale(saleData);
    } catch (err) {
      setError(err.response?.data?.error || 'Order not found or an error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundSuccess = () => {
    setSale(null);
    setOrderId('');
  };

  return (
    <Box
      sx={{
        bgcolor: '#f8fafc',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header Bar */}
      <Paper
        elevation={0}
        sx={{
          m: 1.5,
          px: 2.5,
          py: 1.75,
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#0b1d39' }}>
            Process Returns
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search an order and choose items to return with confidence.
          </Typography>
        </Box>
        <UndoIcon sx={{ fontSize: 32, color: '#94a3b8', opacity: 0.5 }} />
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0, px: 1.5, pb: 1.5 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 2,
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff'
          }}
        >
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', mb: 2, textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              FIND ORDER TO PROCESS
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                autoFocus
                fullWidth
                placeholder="Enter Order ID (e.g. ORD-17)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchOrder()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '10px',
                    bgcolor: '#f8fafc',
                    fontWeight: 700,
                    '& fieldset': { borderColor: '#e2e8f0' },
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={fetchOrder}
                disabled={loading}
                sx={{
                  px: 4,
                  borderRadius: '10px',
                  fontWeight: 800,
                  bgcolor: '#0f172a',
                  '&:hover': { bgcolor: '#1e293b' },
                  textTransform: 'none'
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'SEARCH'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              borderRadius: '10px', 
              fontWeight: 600,
              border: '1px solid #fee2e2'
            }}
          >
            {error}
          </Alert>
        )}

        {sale && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              bgcolor: '#ffffff',
              height: 'calc(100% - 180px)', // Adjust height to allow for search box
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <RefundProcessor sale={sale} onRefundSuccess={handleRefundSuccess} />
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default Refund;
