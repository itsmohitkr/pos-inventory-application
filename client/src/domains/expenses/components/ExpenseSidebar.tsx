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

// Same selection treatment as CategorySidebar.tsx's category list (Inventory
// tab): MUI's own default ListItemButton `.Mui-selected` recipe — a
// primary-tinted background (alpha(primary.main, 0.08), 0.12 on hover) and a
// background-color-only transition — rather than a hand-picked color. Kept
// as explicit constants so the exact same values are reused verbatim across
// every in-tab sidebar for a consistent nav language app-wide.
const activeItemSx = {
  bgcolor: 'rgba(11, 29, 57, 0.08)',
  borderRadius: '8px',
  mb: 0.75,
  transition: 'background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: 'rgba(11, 29, 57, 0.12)' },
  '& .MuiListItemIcon-root': { color: '#0b1d39' },
  '& .MuiListItemText-primary': { color: '#475569', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap' },
};

const inactiveItemSx = {
  color: '#475569',
  borderRadius: '8px',
  mb: 0.75,
  transition: 'background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  whiteSpace: 'nowrap',
  '&:hover': {
    bgcolor: 'rgba(0, 0, 0, 0.04)',
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
