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
            border: '1px solid rgba(255,255,255,0.1)',
            '&:hover': {
              bgcolor: '#1565c0',
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
            border: '1px solid rgba(255,255,255,0.1)',
            '&:hover': {
              bgcolor: '#0369a1',
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
