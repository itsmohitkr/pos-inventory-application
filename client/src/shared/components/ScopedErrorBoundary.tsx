import React from 'react';
import * as Sentry from '@sentry/react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface ScopedErrorBoundaryProps {
  /** Used only in the fallback copy and the Sentry extra payload — keeps
   * this component reusable for any screen, not POS-specific. */
  label: string;
  children?: React.ReactNode;
}

interface ScopedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Nested screen-level boundary. Unlike GlobalErrorBoundary (mounted once at
 * the app root, full-screen takeover, recovers via a hard reload to '/'),
 * this catches a crash on one screen without unmounting AppLayout's
 * sidebar/nav, and its retry just clears local state so the user can keep
 * working without losing the app shell.
 */
class ScopedErrorBoundary extends React.Component<
  ScopedErrorBoundaryProps,
  ScopedErrorBoundaryState
> {
  constructor(props: ScopedErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ScopedErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error on screen "${this.props.label}":`, error, errorInfo);
    Sentry.captureException(error, {
      extra: { screen: this.props.label, componentStack: errorInfo.componentStack },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f8fafc',
            p: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 420,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a202c', mb: 1 }}>
              {this.props.label} hit a problem
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Something went wrong on this screen. Your data is safe — you can try again, or use
              the navigation to switch screens.
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
              sx={{ borderRadius: 2, px: 3, py: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ScopedErrorBoundary;
