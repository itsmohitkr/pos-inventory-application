import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';

const POSFloatingActions = ({
  fullscreenEnabled,
  isFullscreen,
  onToggleFullscreen,
  isCalculatorEnabled,
  onOpenCalculator,
}) => (
  <>
    {fullscreenEnabled && (
      <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
        <IconButton
          className="pos-action-btn"
          onClick={onToggleFullscreen}
          size="large"
          sx={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            zIndex: 999,
            width: 56,
            height: 56,
            bgcolor: '#1976d2',
            color: 'white',
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            border: 'none',
            '&:hover': {
              bgcolor: '#1565c0',
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.5)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {isFullscreen ? (
            <FullscreenExitIcon sx={{ fontSize: '1.8rem' }} />
          ) : (
            <FullscreenIcon sx={{ fontSize: '1.8rem' }} />
          )}
        </IconButton>
      </Tooltip>
    )}

    {isCalculatorEnabled && (
      <Tooltip title="Open POS Calculator">
        <IconButton
          className="pos-action-btn"
          onClick={onOpenCalculator}
          size="large"
          sx={{
            position: 'fixed',
            bottom: fullscreenEnabled ? 86 : 20,
            left: 20,
            zIndex: 999,
            width: 56,
            height: 56,
            bgcolor: '#0284c7',
            color: 'white',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            border: 'none',
            '&:hover': {
              bgcolor: '#0369a1',
              boxShadow: '0 6px 16px rgba(2, 132, 199, 0.5)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <CalculateIcon sx={{ fontSize: '1.8rem' }} />
        </IconButton>
      </Tooltip>
    )}
  </>
);

export default React.memo(POSFloatingActions);
