import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Settings as SettingsIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';

interface PromotionSidebarProps {
  /** 'scheduled' or 'thresholds'. */
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

// Same selection treatment as CategorySidebar.tsx's category list (Inventory
// tab): MUI's own default ListItemButton `.Mui-selected` recipe — a
// primary-tinted background (alpha(primary.main, 0.08), 0.12 on hover) and a
// background-color-only transition — rather than a hand-picked color. Kept
// as explicit constants so the exact same values are reused verbatim across
// every in-tab sidebar (Reports, Expenses, Promotions, Store Settings) for a
// consistent nav language app-wide.
const navItemSx = (isActive: boolean) => ({
  justifyContent: 'flex-start',
  py: 1.25,
  px: 2,
  borderRadius: '8px',
  bgcolor: isActive ? 'rgba(11, 29, 57, 0.08)' : 'transparent',
  color: isActive ? '#0b1d39' : '#334155',
  fontWeight: isActive ? 600 : 500,
  fontSize: '0.85rem',
  textTransform: 'none' as const,
  transition: 'background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    bgcolor: isActive ? 'rgba(11, 29, 57, 0.12)' : '#f8fafc',
  },
});

const navIconSx = (isActive: boolean) => ({ color: isActive ? '#0b1d39' : '#64748b' });

const PromotionSidebar = ({ activeTab, onChangeTab }: PromotionSidebarProps) => (
  <Paper
    elevation={0}
    sx={{
      width: 260,
      border: '1px solid #e2e8f0',
      bgcolor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '10px',
      overflow: 'hidden',
      flexShrink: 0,
    }}
  >
    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem', display: 'block' }}>
        PROMOTION MODULES
      </Typography>
    </Box>
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Button
        fullWidth
        onClick={() => onChangeTab('threshold')}
        sx={navItemSx(activeTab === 'threshold')}
        startIcon={<SettingsIcon sx={navIconSx(activeTab === 'threshold')} />}
      >
        Order Thresholding
      </Button>
      <Button
        fullWidth
        onClick={() => onChangeTab('sales')}
        sx={navItemSx(activeTab === 'sales')}
        startIcon={<CalendarIcon sx={navIconSx(activeTab === 'sales')} />}
      >
        Scheduled Sales
      </Button>
      <Button
        fullWidth
        onClick={() => onChangeTab('category-sales')}
        sx={navItemSx(activeTab === 'category-sales')}
        startIcon={<CalendarIcon sx={navIconSx(activeTab === 'category-sales')} />}
      >
        Category Sales
      </Button>
    </Box>
  </Paper>
);

export default PromotionSidebar;
