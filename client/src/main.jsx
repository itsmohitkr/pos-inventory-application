import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { HashRouter } from 'react-router-dom';
import '@/index.css';
import App from '@/App.jsx';
import theme from '@/theme.js';
import GlobalErrorBoundary from '@/shared/components/GlobalErrorBoundary';

// In production (Electron build), axios baseURL is handled in src/api.js

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HashRouter>
          <App />
        </HashRouter>
      </ThemeProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);
