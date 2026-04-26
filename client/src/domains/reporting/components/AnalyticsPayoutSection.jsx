import React from 'react';
import { Box, Typography, Paper, Grid, TextField } from '@mui/material';

const AnalyticsPayoutSection = ({ totalProfit, netProfit, totalExpenses }) => {
  const [ownerSharePercent, setOwnerSharePercent] = React.useState(50);
  const ownerPayout = (netProfit * ownerSharePercent) / 100;

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ color: '#64748b', fontWeight: 800, letterSpacing: 1.5, mb: 2, display: 'block' }}
      >
        Profit & Takeout Calculation
      </Typography>
      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#fafbfc' }}>
        <Grid container spacing={3} alignItems="stretch">
          {/* Profit Calculation */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ p: 3, bgcolor: '#fff', borderRadius: 2, border: '2px solid #f0fdf4', height: '100%' }}>
              <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span style={{ color: '#16a34a' }}>📊</span> Profit Calculation
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Gross Profit:</Typography>
                <Typography sx={{ color: '#16a34a', fontWeight: 700, fontSize: '1rem' }}>
                  ₹ {totalProfit.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Less: Expenses:</Typography>
                <Typography sx={{ color: '#dc2626', fontWeight: 700, fontSize: '1rem' }}>
                  - ₹ {totalExpenses.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, px: 2, mt: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 1.5 }}>
                <Typography sx={{ color: '#166534', fontWeight: 700 }}>Net Profit</Typography>
                <Typography sx={{ color: '#166534', fontWeight: 800, fontSize: '1.1rem' }}>
                  ₹ {netProfit.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Owner Payout */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%' }}>
              <Box sx={{ p: 3, bgcolor: '#fff', borderRadius: 2, border: '2px solid #e0e7ff' }}>
                <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ color: '#6366f1' }}>⚙️</span> Owner Takeout Percentage
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    type="number"
                    variant="outlined"
                    size="small"
                    value={ownerSharePercent}
                    onChange={(e) => setOwnerSharePercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{ width: 100, '& .MuiOutlinedInput-root': { fontWeight: 700, textAlign: 'center' } }}
                  />
                  <Typography sx={{ color: '#64748b', fontWeight: 600 }}>% of Net Profit</Typography>
                </Box>
              </Box>
              <Box sx={{ p: 3, bgcolor: '#eff6ff', border: '2px solid #7dd3fc', borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                <Typography sx={{ color: '#0c4a6e', fontWeight: 700, fontSize: '0.9rem', mb: 1 }}>
                  💰 Your Payout
                </Typography>
                <Typography sx={{ color: '#0c4a6e', fontWeight: 700, fontSize: '0.85rem', mb: 2 }}>
                  ({ownerSharePercent}% of ₹ {netProfit.toLocaleString()})
                </Typography>
                <Typography sx={{ color: '#0c4a6e', fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.5px' }}>
                  ₹ {ownerPayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AnalyticsPayoutSection;
