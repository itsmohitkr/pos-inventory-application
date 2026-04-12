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
  CalendarToday as CalendarIcon,
  DonutLarge as ProfitIcon,
  Category as CategoryIcon,
  Assignment as ItemSalesIcon,
  Inventory as StockIcon,
  LocalPrintshop as LooseIcon,
  AccountBalanceWallet as SummaryIcon,
} from '@mui/icons-material';

const REPORT_ITEMS = [
  {
    type: 'financial_summary',
    label: 'Financial Summary',
    Icon: SummaryIcon,
    color: 'primary.main',
  },
  {
    type: 'profit_margin',
    label: 'Profit & Margin',
    Icon: ProfitIcon,
    color: 'secondary.main',
  },
  {
    type: 'category_sales',
    label: 'Sales by Category',
    Icon: CategoryIcon,
    color: 'secondary.main',
  },
  {
    type: 'expiry_report',
    label: 'Expiring Products',
    Icon: CalendarIcon,
    color: 'error.main',
  },
  {
    type: 'item_sales',
    label: 'Item-Wise Sales',
    Icon: ItemSalesIcon,
    color: 'success.main',
  },
  {
    type: 'low_stock',
    label: 'Low Stock',
    Icon: StockIcon,
    color: 'warning.main',
  },
  {
    type: 'loose_sales',
    label: 'Loose Sales',
    Icon: LooseIcon,
    color: 'secondary.main',
  },
];

const selectedSx = {
  bgcolor: 'primary.main',
  color: 'white',
  '&:hover': { bgcolor: 'primary.dark' },
  '& .MuiListItemIcon-root': { color: 'white' },
};

const ReportSidebar = ({ reportType, onReportTypeChange }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        width: { xs: '100%', md: 280 },
        bgcolor: '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 2,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b' }}>
          Select Report
        </Typography>
      </Box>
      <List sx={{ p: 1 }}>
        {REPORT_ITEMS.map((item, idx) => {
          const IconComponent = item.Icon;
          return (
            <ListItem
              key={item.type}
              disablePadding
              sx={{ mb: idx < REPORT_ITEMS.length - 1 ? 1 : 0 }}
            >
              <ListItemButton
                selected={reportType === item.type}
                onClick={() => onReportTypeChange(item.type)}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': selectedSx,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: reportType === item.type ? 'inherit' : item.color,
                  }}
                >
                  <IconComponent />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

export default ReportSidebar;
