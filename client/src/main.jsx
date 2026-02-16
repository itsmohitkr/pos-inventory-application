import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import './index.css';
import App from './App.jsx';
import theme from './theme.js';
import axios from 'axios';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';

// In production (Electron build), use the local server URL
// In development, the Vite proxy handles /api requests
if (import.meta.env.PROD) {
  axios.defaults.baseURL = 'http://localhost:5001';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);
