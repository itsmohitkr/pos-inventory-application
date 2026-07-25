import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Settings as SettingsIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';

const PromotionSidebar = ({ activeTab, onChangeTab }) => (
  <Paper
    elevation={0}
    sx={{
      width: 280,
      border: '1px solid #e2e8f0',
      bgcolor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '12px',
      overflow: 'hidden',
      flexShrink: 0,
    }}
  >
    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>
        PROMOTION MODULES
      </Typography>
    </Box>
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Button
        fullWidth
        onClick={() => onChangeTab('threshold')}
        sx={{
          justifyContent: 'flex-start',
          py: 1.5,
          px: 2,
          borderRadius: '10px',
          bgcolor: activeTab === 'threshold' ? '#0f172a' : 'transparent',
          color: activeTab === 'threshold' ? '#ffffff' : '#475569',
          fontWeight: 800,
          textTransform: 'none',
          '&:hover': { 
            bgcolor: activeTab === 'threshold' ? '#1e293b' : '#f1f5f9',
            color: activeTab === 'threshold' ? '#ffffff' : '#0f172a'
          },
          transition: 'all 0.2s ease'
        }}
        startIcon={
          <SettingsIcon sx={{ color: activeTab === 'threshold' ? '#ffffff' : '#94a3b8' }} />
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
          borderRadius: '10px',
          bgcolor: activeTab === 'sales' ? '#0f172a' : 'transparent',
          color: activeTab === 'sales' ? '#ffffff' : '#475569',
          fontWeight: 800,
          textTransform: 'none',
          '&:hover': { 
            bgcolor: activeTab === 'sales' ? '#1e293b' : '#f1f5f9',
            color: activeTab === 'sales' ? '#ffffff' : '#0f172a'
          },
          transition: 'all 0.2s ease'
        }}
        startIcon={<CalendarIcon sx={{ color: activeTab === 'sales' ? '#ffffff' : '#94a3b8' }} />}
      >
        Scheduled Sales
      </Button>
    </Box>
  </Paper>
);

export default PromotionSidebar;
