import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import type { Customer } from '@/shared/api/customerService';

interface CustomerSummaryBarProps {
  totalCount: number;
  customers: Customer[];
}

interface StatItem {
  label: string;
  value: string;
  accentColor: string;
}

export const CustomerSummaryBar = ({ totalCount, customers }: CustomerSummaryBarProps) => {
  const { totalSpend, totalPurchases, activeCustomersCount } = useMemo(
    () => ({
      totalSpend: customers.reduce((acc, c) => acc + (c.totalSpend || 0), 0),
      totalPurchases: customers.reduce((acc, c) => acc + (c._count?.sales || 0), 0),
      activeCustomersCount: customers.filter((c) => (c._count?.sales || 0) > 0).length,
    }),
    [customers]
  );

  const stats: StatItem[] = [
    {
      label: 'Recognized Customers',
      value: totalCount.toLocaleString(),
      accentColor: '#3b82f6',
    },
    {
      label: 'Current Page Spend',
      value: `₹${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      accentColor: '#10b981',
    },
    {
      label: 'Page Transactions',
      value: totalPurchases.toLocaleString(),
      accentColor: '#8b5cf6',
    },
    {
      label: 'Active Buyers (Page)',
      value: `${activeCustomersCount} / ${customers.length}`,
      accentColor: '#06b6d4',
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 1.25,
        pt: 1.5,
        borderTop: '1px solid #e2e8f0',
      }}
    >
      {stats.map(({ label, value, accentColor }) => (
        <Box
          key={label}
          sx={{
            border: '1px solid',
            borderColor: `${accentColor}33`,
            borderRadius: '8px',
            py: 1,
            px: 1.25,
            bgcolor: `${accentColor}0A`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: `${accentColor}1A`,
              borderColor: `${accentColor}66`,
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: accentColor,
              textTransform: 'uppercase',
              fontSize: '0.68rem',
              letterSpacing: '0.5px',
              fontWeight: 600,
              display: 'block',
              mb: 0.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.88rem',
              color: '#1e293b',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default CustomerSummaryBar;
