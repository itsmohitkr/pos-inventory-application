import React from 'react';
import { Box } from '@mui/material';

const AppLayout = ({ children, monochromeMode, appBar }) => {
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
