import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  DonutLarge as ProfitIcon,
  Category as CategoryIcon,
  Assignment as ItemSalesIcon,
  Inventory as StockIcon,
  LocalPrintshop as LooseIcon,
  AccountBalanceWallet as SummaryIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';

const REPORT_ITEMS = [
  {
    type: 'financial_group',
    label: 'Financial Summary',
    Icon: SummaryIcon,
    children: [
      { type: 'cash_flow', label: 'Cash Flow Report' },
      { type: 'profit_payout', label: 'Profit & Payout' },
      { type: 'analytics', label: 'Category Analytics' },
    ],
  },
  {
    type: 'profit_margin',
    label: 'Profit & Margin',
    Icon: ProfitIcon,
  },
  {
    type: 'item_sales',
    label: 'Item-Wise Sales',
    Icon: ItemSalesIcon,
  },
  {
    type: 'category_sales',
    label: 'Sales by Category',
    Icon: CategoryIcon,
  },
  {
    type: 'expiry_report',
    label: 'Expiring Products',
    Icon: CalendarIcon,
  },
  {
    type: 'low_stock',
    label: 'Low Stock',
    Icon: StockIcon,
  },
  {
    type: 'loose_sales',
    label: 'Loose Sales',
    Icon: LooseIcon,
  },
];

// Styles for Parent / Top-Level active items (Primary Highlight)
const parentActiveSx = {
  bgcolor: '#0b1d39',
  color: '#ffffff',
  '&:hover': { bgcolor: '#162b4d' },
  '& .MuiListItemIcon-root': { color: '#ffffff' },
  '& .MuiListItemText-primary': { color: '#ffffff', fontWeight: 700 },
  '& .MuiSvgIcon-root': { color: '#ffffff' },
};

// Styles for Active Child items (Distinct Visual Hierarchy)
const childActiveSx = {
  bgcolor: '#f1f5f9',
  color: '#0b1d39',
  borderLeft: '4px solid #0b1d39',
  borderRadius: '0 4px 4px 0',
  '&:hover': { bgcolor: '#e2e8f0' },
  '& .MuiListItemText-primary': { color: '#0b1d39', fontWeight: 800 },
};

const ReportSidebar = ({ reportType, onReportTypeChange }) => {
  const [openGroup, setOpenGroup] = useState('financial_group');

  const handleGroupClick = (groupType) => {
    setOpenGroup(prev => prev === groupType ? null : groupType);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: { xs: '100%', md: 280 },
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
          Reports & Analytics
        </Typography>
      </Box>

      <Box sx={{ px: 1, py: 1.5 }}>
        <Typography 
          variant="caption" 
          sx={{ px: 1.5, py: 1, display: 'block', color: '#94a3b8', fontWeight: 700, letterSpacing: 1 }}
        >
          SALES REPORT
        </Typography>

        <List sx={{ pt: 0.5 }}>
          {REPORT_ITEMS.map((item, idx) => {
            const IconComponent = item.Icon;
            const hasChildren = !!item.children;
            const isGroupOpen = openGroup === item.type;
            const isChildSelected = hasChildren && item.children.some(c => c.type === reportType);
            const isParentSelected = reportType === item.type || isChildSelected;

            return (
              <React.Fragment key={item.type}>
                <ListItem
                  disablePadding
                  sx={{ mb: idx < REPORT_ITEMS.length - 1 ? 0.5 : 0 }}
                >
                  <ListItemButton
                    selected={isParentSelected}
                    onClick={() => {
                      if (hasChildren) {
                        handleGroupClick(item.type);
                      } else {
                        onReportTypeChange(item.type);
                      }
                    }}
                    sx={{
                      borderRadius: 1,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&.Mui-selected': parentActiveSx,
                      px: 1.5,
                      minHeight: 44,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isParentSelected ? '#ffffff' : '#64748b',
                      }}
                    >
                      {IconComponent && <IconComponent sx={{ fontSize: '1.25rem' }} />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label} 
                      primaryTypographyProps={{ 
                        fontWeight: isParentSelected ? 700 : 500, 
                        fontSize: '0.9rem',
                        color: isParentSelected ? '#ffffff' : '#475467'
                      }} 
                    />
                    {hasChildren && (
                      <Box sx={{ display: 'flex', color: isParentSelected ? '#ffffff' : '#94a3b8' }}>
                        {isGroupOpen ? <ExpandLess sx={{ fontSize: '1.2rem' }} /> : <ExpandMore sx={{ fontSize: '1.2rem' }} />}
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>

                {hasChildren && (
                  <Collapse in={isGroupOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ mb: 1, mt: 0.5 }}>
                      {item.children.map((child) => {
                        const isChildActive = reportType === child.type;
                        return (
                          <ListItemButton
                            key={child.type}
                            onClick={() => onReportTypeChange(child.type)}
                            sx={{
                              pl: 6,
                              py: 0.75,
                              mb: 0.5,
                              mr: 1,
                              ml: 1,
                              borderRadius: '4px',
                              ...(isChildActive ? childActiveSx : {
                                '&:hover': { bgcolor: '#f8fafc' },
                                '& .MuiListItemText-primary': { color: '#64748b', fontWeight: 500 }
                              }),
                            }}
                          >
                            <ListItemText 
                              primary={child.label} 
                              primaryTypographyProps={{ 
                                fontSize: '0.85rem',
                                color: isChildActive ? '#0b1d39' : 'inherit'
                              }} 
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
};

export default ReportSidebar;
