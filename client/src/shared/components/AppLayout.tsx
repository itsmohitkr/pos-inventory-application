import React from 'react';
import { Box } from '@mui/material';

interface AppLayoutProps {
  children?: React.ReactNode;
  /** Applies the `monochrome` CSS class used by the thermal-printer theme. */
  monochromeMode?: boolean;
  appBar?: React.ReactNode;
}

const AppLayout = ({ children, monochromeMode, appBar }: AppLayoutProps) => {
  return (
    <Box
      className={monochromeMode ? 'monochrome' : ''}
      sx={{
        flexGrow: 1,
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {appBar}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>{children}</Box>
    </Box>
  );
};

export default AppLayout;
