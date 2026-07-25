import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface StatCardProps {
  title?: React.ReactNode;
  value?: React.ReactNode;
  subtitle?: React.ReactNode;
  footerLabel?: React.ReactNode;
  footerValue?: React.ReactNode;
  bgcolor?: string;
  /** Drives the muted-text palette: '#f8fafc' selects the dark-card variant. */
  textColor?: string;
  valueColor?: string;
  width?: string | number;
}

const StatCard = ({
  title,
  value,
  subtitle,
  footerLabel,
  footerValue,
  bgcolor = '#0b1d39',
  textColor = '#f8fafc',
  valueColor = '#f8fafc',
  width = '100%',
}: StatCardProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        width: width,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: bgcolor,
      }}
    >
      <Typography variant="h6" sx={{ color: textColor === '#f8fafc' ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1 }}>
          {subtitle}
        </Typography>
      )}
      <Typography
        variant="h3"
        sx={{ fontWeight: 800, color: valueColor, mt: 0, letterSpacing: '-1px' }}
      >
        {value}
      </Typography>

      {(footerLabel || footerValue) && (
        <Box
          sx={{
            mt: 'auto',
            pt: 2,
            borderTop: `1px solid ${bgcolor === '#0b1d39' ? '#1e293b' : '#e2e8f0'}`,
          }}
        >
          {footerLabel && (
            <Typography
              variant="body2"
              sx={{ color: textColor === '#f8fafc' ? '#94a3b8' : '#64748b' }}
            >
              {footerLabel}
            </Typography>
          )}
          {footerValue && (
            <Typography
              variant="subtitle2"
              sx={{ color: textColor === '#f8fafc' ? '#e2e8f0' : '#0b1d39', fontWeight: 600 }}
            >
              {footerValue}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default StatCard;
