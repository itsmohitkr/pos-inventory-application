import React from 'react';
import { Box, Typography, Paper, Grid, TextField } from '@mui/material';

import {
  TrendingUp,
  Settings as SettingsIcon,
  AccountBalanceWallet as PayoutIcon,
} from '@mui/icons-material';

const AnalyticsPayoutSection = ({ totalProfit, netProfit, totalExpenses }) => {
  const [ownerSharePercent, setOwnerSharePercent] = React.useState(50);
  const ownerPayout = (netProfit * ownerSharePercent) / 100;

  return (
    <Box sx={{ p: 1 }}>
      <Grid container spacing={3} alignItems="stretch">
        {/* Profit Calculation Card */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  bgcolor: 'rgba(22, 163, 74, 0.1)',
                  color: '#16a34a',
                  display: 'flex',
                }}
              >
                <TrendingUp fontSize="small" />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                Profit Summary
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pb: 2,
                  borderBottom: '1px dashed #e2e8f0',
                }}
              >
                <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>
                  Gross Profit
                </Typography>
                <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '1rem' }}>
                  ₹ {totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pb: 2,
                  borderBottom: '1px dashed #e2e8f0',
                }}
              >
                <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>
                  Total Expenses
                </Typography>
                <Typography sx={{ color: '#ef4444', fontWeight: 700, fontSize: '1rem' }}>
                  - ₹ {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  mt: 1,
                  borderRadius: '10px',
                  bgcolor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                }}
              >
                <Typography sx={{ color: '#166534', fontWeight: 700 }}>Net Profit</Typography>
                <Typography sx={{ color: '#166534', fontWeight: 900, fontSize: '1.25rem' }}>
                  ₹ {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Configuration & Payout Result */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            {/* Setting Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: '8px',
                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    display: 'flex',
                  }}
                >
                  <SettingsIcon fontSize="small" />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  Takeout Configuration
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  type="number"
                  variant="outlined"
                  size="small"
                  value={ownerSharePercent}
                  onChange={(e) =>
                    setOwnerSharePercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))
                  }
                  inputProps={{ min: 0, max: 100 }}
                  sx={{
                    width: 100,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      fontWeight: 700,
                      bgcolor: '#f8fafc',
                    },
                  }}
                />
                <Typography sx={{ color: '#64748b', fontWeight: 600 }}>% of Net Profit</Typography>
              </Box>
            </Paper>

            {/* Payout Result Card */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                flex: 1,
                borderRadius: '12px',
                bgcolor: '#0b1d39',
                backgroundImage: 'linear-gradient(135deg, #0b1d39 0%, #1a365d 100%)',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  opacity: 0.1,
                  transform: 'rotate(-15deg)',
                }}
              >
                <PayoutIcon sx={{ fontSize: 160 }} />
              </Box>

              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  mb: 1,
                }}
              >
                Owner Payout Amount
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  mb: 2,
                }}
              >
                ({ownerSharePercent}% of ₹ {netProfit.toLocaleString()})
              </Typography>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: '2.75rem',
                  letterSpacing: '-1px',
                  color: '#ffffff',
                }}
              >
                ₹{' '}
                {ownerPayout.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPayoutSection;
