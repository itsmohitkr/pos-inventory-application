import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('CRITICAL APP ERROR:', error, errorInfo);
    }

    handleReset = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f8fafc',
                    p: 3
                }}>
                    <Paper elevation={0} sx={{ p: 6, textAlign: 'center', maxWidth: 500, borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a202c', mb: 2 }}>
                            Something Went Wrong
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
                            An unexpected error occurred. Don't worry, your data is safe. We can restore the application state for you.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                onClick={this.handleReset}
                                sx={{ borderRadius: 2, px: 3, py: 1, textTransform: 'none', fontWeight: 600 }}
                            >
                                Reload Application
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
