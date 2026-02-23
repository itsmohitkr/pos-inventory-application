import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Button, CircularProgress, Box } from '@mui/material';

const UpdateNotifier = () => {
    const [updateState, setUpdateState] = useState({
        open: false,
        message: '',
        severity: 'info',
        action: null,
        loading: false
    });

    useEffect(() => {
        if (!window.electron) return;

        const handleAvailable = () => {
            setUpdateState({
                open: true,
                message: 'A new update is available. Downloading...',
                severity: 'info',
                loading: true
            });
        };

        const handleDownloaded = () => {
            setUpdateState({
                open: true,
                message: 'Update downloaded! Restart to apply.',
                severity: 'success',
                action: (
                    <Button color="inherit" size="small" onClick={() => window.electron.app.restartAppToUpdate()}>
                        RESTART & INSTALL
                    </Button>
                ),
                loading: false
            });
        };

        const handleError = (event, errorMessage) => {
            setUpdateState({
                open: true,
                message: `Update error: ${errorMessage}`,
                severity: 'error',
                loading: false
            });
        };

        window.electron.ipcRenderer.on('update-available', handleAvailable);
        window.electron.ipcRenderer.on('update-downloaded', handleDownloaded);
        window.electron.ipcRenderer.on('update-error', handleError);

        return () => {
            window.electron.ipcRenderer.removeAllListeners('update-available');
            window.electron.ipcRenderer.removeAllListeners('update-downloaded');
            window.electron.ipcRenderer.removeAllListeners('update-error');
        };
    }, []);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setUpdateState(prev => ({ ...prev, open: false }));
    };

    return (
        <Snackbar
            open={updateState.open}
            autoHideDuration={updateState.severity === 'success' ? null : 6000}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert
                onClose={handleClose}
                severity={updateState.severity}
                variant="filled"
                sx={{ width: '100%', alignItems: 'center' }}
                action={updateState.action}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {updateState.loading && <CircularProgress size={16} color="inherit" />}
                    {updateState.message}
                </Box>
            </Alert>
        </Snackbar>
    );
};

export default UpdateNotifier;
