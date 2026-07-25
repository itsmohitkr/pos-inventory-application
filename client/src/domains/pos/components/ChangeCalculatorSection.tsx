import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

const ChangeCalculatorSection = ({
  changeCalculatorEnabled,
  receivedAmount,
  changeDue,
  setShowNumpad,
}) => {
  if (!changeCalculatorEnabled) return null;

  return (
    <Box
      sx={{
        mb: 1,
        p: 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(0,0,0,0.01)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.05em' }}
        >
          Change Calculator
        </Typography>
        <Chip
          label="F9"
          size="small"
          sx={{
            height: 18,
            fontSize: '0.65rem',
            fontWeight: 900,
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          onClick={() => setShowNumpad(true)}
          sx={{
            bgcolor: '#f8fafc',
            p: 1.5,
            borderRadius: 1,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { borderColor: 'primary.main', bgcolor: '#f1f5f9' },
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 65,
            flex: 1,
            maxWidth: '46%',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.5, fontWeight: 700, fontSize: '0.8rem' }}
          >
            Received Amount
          </Typography>
          <Typography variant="h5" fontWeight="900" color="primary.main">
            ₹{receivedAmount.toFixed(0)}
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: '#f5f3ff',
            p: 1.5,
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: '#4f46e5',
            border: '1px solid',
            borderColor: '#e0e7ff',
            minHeight: 65,
            flex: 1,
            maxWidth: '46%',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 0.5,
              fontWeight: 700,
              fontSize: '0.8rem',
              color: 'indigo.500',
            }}
          >
            Return Amount
          </Typography>
          <Typography variant="h5" fontWeight="900">
            ₹{changeDue.toFixed(0)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(ChangeCalculatorSection);
