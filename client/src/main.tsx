import { StrictMode, useEffect } from 'react';
import * as Sentry from "@sentry/react";
import {
  createRoutesFromElements,
  matchRoutes,
  useLocation,
  useNavigationType
} from "react-router-dom";
import type { ApiError } from '@/shared/api/api';

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
    beforeSend(event, hint) {
      // Expected API rejections (wrong password, validation failures, etc.)
      // surface as 4xx responses and are handled/shown to the user inline —
      // they are not application bugs, so don't let them pollute Sentry.
      // A 5xx or a status-less error (network drop, thrown before the
      // request completed) is still a real problem worth reporting.
      const status = (hint.originalException as ApiError | undefined)?.response?.status;
      if (status && status < 500) {
        return null;
      }
      return event;
    },
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
