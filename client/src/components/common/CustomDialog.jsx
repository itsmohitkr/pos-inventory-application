import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box
} from '@mui/material';
import {
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';

const CustomDialog = ({
    open,
    onClose,
    title,
    message,
    type = 'info', // 'success', 'error', 'warning', 'info', 'confirm'
    onConfirm,
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <SuccessIcon sx={{ fontSize: 48, color: 'success.main' }} />;
            case 'error':
                return <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />;
            case 'warning':
            case 'confirm':
                return <WarningIcon sx={{ fontSize: 48, color: 'warning.main' }} />;
            default:
                return <InfoIcon sx={{ fontSize: 48, color: 'info.main' }} />;
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success':
                return 'success.main';
            case 'error':
                return 'error.main';
            case 'warning':
            case 'confirm':
                return 'warning.main';
            default:
                return 'info.main';
        }
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={type === 'confirm' ? undefined : onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    p: 1
                }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getIcon()}
                    <Typography variant="h6" sx={{ color: getColor(), fontWeight: 600 }}>
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ color: 'text.primary', mt: 1 }}>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                {(showCancel || type === 'confirm') && (
                    <Button onClick={onClose} variant="outlined" color="inherit">
                        {cancelText}
                    </Button>
                )}
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color={type === 'error' ? 'error' : 'primary'}
                    autoFocus
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CustomDialog;
