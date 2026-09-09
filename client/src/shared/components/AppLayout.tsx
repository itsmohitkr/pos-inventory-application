import React from 'react';
import { Box } from '@mui/material';

interface AppLayoutProps {
  children?: React.ReactNode;
  /** Applies the `monochrome` CSS class used by the thermal-printer theme. */
  monochromeMode?: boolean;
  appBar?: React.ReactNode;
  sidebar?: React.ReactNode;
}

const AppLayout = ({ children, monochromeMode, appBar, sidebar }: AppLayoutProps) => {
  return (
    <Box
      className={monochromeMode ? 'monochrome' : ''}
      sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {sidebar}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minWidth: 0,
        }}
      >
        {appBar}
        <Box sx={{ flexGrow: 1, overflow: 'hidden', height: '100%', position: 'relative' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
