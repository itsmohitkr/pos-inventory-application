import { StrictMode, useEffect } from 'react';
import * as Sentry from "@sentry/react";
import { 
  createRoutesFromElements, 
  matchRoutes, 
  useLocation, 
  useNavigationType 
} from "react-router-dom";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromElements,
        matchRoutes,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE || "production",
  });
}

import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { HashRouter } from 'react-router-dom';
import '@/index.css';
import App from '@/App';
import theme from '@/theme';
import GlobalErrorBoundary from '@/shared/components/GlobalErrorBoundary';

// In production (Electron build), axios baseURL is handled in src/api.js

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found — check index.html');
}

createRoot(rootElement).render(
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
