import React from 'react';
import { Box, Typography } from '@mui/material';

export interface ReportStatItem {
  label: string;
  value: string | number;
  accentColor: string;
}

interface ReportSummaryBarProps {
  stats: ReportStatItem[];
}

export const ReportSummaryBar = ({ stats }: ReportSummaryBarProps) => {
  if (!stats || stats.length === 0) return null;

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

export default ReportSummaryBar;
