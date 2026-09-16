import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';

export type ExpenseNavTab = 'operating_expenses' | 'inventory_purchases';

interface ExpenseSidebarProps {
  activeTab: ExpenseNavTab;
  onTabChange: (tab: ExpenseNavTab) => void;
}

const activeItemSx = {
  bgcolor: '#0b1d39',
  color: '#ffffff',
  borderRadius: '8px',
  mb: 0.75,
  transition: 'all 0.15s ease-in-out',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: '#162b4d' },
  '& .MuiListItemIcon-root': { color: '#ffffff' },
  '& .MuiListItemText-primary': { color: '#ffffff', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap' },
};

const inactiveItemSx = {
  color: '#475569',
  borderRadius: '8px',
  mb: 0.75,
  transition: 'all 0.15s ease-in-out',
  whiteSpace: 'nowrap',
  '&:hover': {
    bgcolor: '#f1f5f9',
    color: '#0b1d39',
    '& .MuiListItemIcon-root': { color: '#0b1d39' },
  },
  '& .MuiListItemIcon-root': { color: '#64748b' },
  '& .MuiListItemText-primary': { fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap' },
};

const ExpenseSidebar = ({
  activeTab,
  onTabChange,
}: ExpenseSidebarProps) => {
  const items = [
    {
      id: 'operating_expenses' as ExpenseNavTab,
      label: 'Operating Expenses',
      Icon: ReceiptIcon,
    },
    {
      id: 'inventory_purchases' as ExpenseNavTab,
      label: 'Inventory Purchases',
      Icon: ShippingIcon,
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        width: { xs: '100%', md: 230, lg: 240 },
        bgcolor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 1.2 }}>
          EXPENSE MANAGEMENT
        </Typography>
      </Box>

      <List sx={{ p: 1.25 }}>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const { Icon } = item;

          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => onTabChange(item.id)}
                sx={isActive ? activeItemSx : inactiveItemSx}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Icon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

export default ExpenseSidebar;
