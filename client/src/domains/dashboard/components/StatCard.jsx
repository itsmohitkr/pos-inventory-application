import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

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
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        width: width,
        p: 3,
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: bgcolor,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: textColor === '#f8fafc' ? '#94a3b8' : '#64748b', fontWeight: 500 }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: '#94a3b8', mb: 1 }}>
          {subtitle}
        </Typography>
      )}
      <Typography
        variant="h2"
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
