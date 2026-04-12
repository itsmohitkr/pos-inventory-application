import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Settings as SettingsIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';

const PromotionSidebar = ({ activeTab, onChangeTab }) => (
  <Paper
    elevation={0}
    sx={{
      width: 280,
      border: '1px solid rgba(0,0,0,0.06)',
      bgcolor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 2,
      p: 1.5,
      gap: 0.5,
      flexShrink: 0,
    }}
  >
    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b' }}>
        PROMOTION MODULES
      </Typography>
    </Box>
    <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Button
        fullWidth
        onClick={() => onChangeTab('threshold')}
        sx={{
          justifyContent: 'flex-start',
          py: 1.5,
          px: 2,
          borderRadius: 2,
          bgcolor: activeTab === 'threshold' ? 'rgba(11, 29, 57, 0.04)' : 'transparent',
          color: activeTab === 'threshold' ? '#0b1d39' : '#64748b',
          fontWeight: activeTab === 'threshold' ? 700 : 500,
          textTransform: 'none',
          '&:hover': { bgcolor: 'rgba(11, 29, 57, 0.08)' },
        }}
        startIcon={
          <SettingsIcon sx={{ color: activeTab === 'threshold' ? '#0b1d39' : '#94a3b8' }} />
        }
      >
        Order Thresholding
      </Button>
      <Button
        fullWidth
        onClick={() => onChangeTab('sales')}
        sx={{
          justifyContent: 'flex-start',
          py: 1.5,
          px: 2,
          borderRadius: 2,
          bgcolor: activeTab === 'sales' ? 'rgba(11, 29, 57, 0.04)' : 'transparent',
          color: activeTab === 'sales' ? '#0b1d39' : '#64748b',
          fontWeight: activeTab === 'sales' ? 700 : 500,
          textTransform: 'none',
          '&:hover': { bgcolor: 'rgba(11, 29, 57, 0.08)' },
        }}
        startIcon={<CalendarIcon sx={{ color: activeTab === 'sales' ? '#0b1d39' : '#94a3b8' }} />}
      >
        Scheduled Sales
      </Button>
    </Box>
  </Paper>
);

export default PromotionSidebar;
