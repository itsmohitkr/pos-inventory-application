import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const SuccessNotification = ({ 
    open, 
    message, 
    onClose, 
    duration = 3000,
    severity = 'success',
    anchorOrigin = { vertical: 'top', horizontal: 'center' }
}) => {
    return (
        <Snackbar
            open={open}
            autoHideDuration={duration}
            onClose={onClose}
            anchorOrigin={anchorOrigin}
        >
            <Alert 
                onClose={onClose} 
                severity={severity}
                variant="filled"
                sx={{ 
                    width: '100%',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: 3
                }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default SuccessNotification;
