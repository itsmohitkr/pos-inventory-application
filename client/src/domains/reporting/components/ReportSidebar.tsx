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

// Same selection treatment as CategorySidebar.tsx's category list (Inventory
// tab): MUI's own default ListItemButton `.Mui-selected` recipe — a
// primary-tinted background (alpha(primary.main, 0.08), 0.12 on hover) and a
// background-color-only transition — rather than a hand-picked color. Kept
// as an explicit constant (instead of just the `selected` prop) so the exact
// same values are reused verbatim across every in-tab sidebar for a
// consistent nav language app-wide.
const parentActiveSx = {
  bgcolor: 'rgba(11, 29, 57, 0.08)',
  '&:hover': { bgcolor: 'rgba(11, 29, 57, 0.12)' },
};

// Active Child items — identical recipe, indented one level deeper.
const childActiveSx = {
  bgcolor: 'rgba(11, 29, 57, 0.08)',
  borderRadius: '0 4px 4px 0',
  '&:hover': { bgcolor: 'rgba(11, 29, 57, 0.12)' },
};

interface ReportSidebarProps {
  reportType: string;
  onReportTypeChange: (type: string) => void;
}

const ReportSidebar = ({ reportType, onReportTypeChange }: ReportSidebarProps) => {
  const [openGroup, setOpenGroup] = useState<string | null>('financial_group');

  const handleGroupClick = (groupType: string) => {
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
        <List sx={{ pt: 0 }}>
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
                      transition: 'background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&.Mui-selected': parentActiveSx,
                      px: 1.5,
                      minHeight: 44,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isParentSelected ? '#0b1d39' : '#64748b',
                      }}
                    >
                      {IconComponent && <IconComponent sx={{ fontSize: '1.25rem' }} />}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isParentSelected ? 700 : 500,
                        fontSize: '0.9rem',
                        color: '#475467'
                      }}
                    />
                    {hasChildren && (
                      <Box sx={{ display: 'flex', color: isParentSelected ? '#0b1d39' : '#94a3b8' }}>
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
                              transition: 'background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                              ...(isChildActive ? childActiveSx : {
                                borderRadius: '4px',
                                '&:hover': { bgcolor: '#f8fafc' },
                              }),
                            }}
                          >
                            <ListItemText
                              primary={child.label}
                              primaryTypographyProps={{
                                fontSize: '0.85rem',
                                fontWeight: isChildActive ? 700 : 500,
                                color: '#475467'
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
