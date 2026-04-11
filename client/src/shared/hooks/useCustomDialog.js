import { useState, useCallback } from 'react';

const useCustomDialog = () => {
    const [dialogState, setDialogState] = useState({
        open: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null,
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false
    });

    const showAlert = useCallback((message, title = 'Alert', type = 'info') => {
        return new Promise((resolve) => {
            setDialogState({
                open: true,
                title,
                message,
                type,
                onConfirm: () => resolve(true),
                confirmText: 'OK',
                showCancel: false
            });
        });
    }, []);

    const showConfirm = useCallback((message, title = 'Confirm') => {
        return new Promise((resolve) => {
            setDialogState({
                open: true,
                title,
                message,
                type: 'confirm',
                onConfirm: () => resolve(true),
                confirmText: 'Yes',
                cancelText: 'No',
                showCancel: true
            });
        });
    }, []);

    const showSuccess = useCallback((message, title = 'Success') => {
        return showAlert(message, title, 'success');
    }, [showAlert]);

    const showError = useCallback((message, title = 'Error') => {
        return showAlert(message, title, 'error');
    }, [showAlert]);

    const showWarning = useCallback((message, title = 'Warning') => {
        return showAlert(message, title, 'warning');
    }, [showAlert]);

    const closeDialog = useCallback(() => {
        setDialogState((prev) => ({ ...prev, open: false }));
    }, []);

    return {
        dialogState,
        showAlert,
        showConfirm,
        showSuccess,
        showError,
        showWarning,
        closeDialog
    };
};

export default useCustomDialog;
