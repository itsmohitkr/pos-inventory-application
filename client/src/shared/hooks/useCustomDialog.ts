import { useState, useCallback } from 'react';

export type DialogType = 'info' | 'success' | 'error' | 'warning' | 'confirm';

export interface DialogState {
  open: boolean;
  title: string;
  message: string;
  type: DialogType;
  onConfirm: (() => void) | null;
  confirmText: string;
  /**
   * Optional because showAlert *replaces* the whole state object and omits this
   * key, leaving cancelText undefined until the next showConfirm. Consumers
   * must tolerate that.
   */
  cancelText?: string;
  showCancel: boolean;
}

const useCustomDialog = () => {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
  });

  const showAlert = useCallback(
    (message: string, title = 'Alert', type: DialogType = 'info'): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          open: true,
          title,
          message,
          type,
          onConfirm: () => resolve(true),
          confirmText: 'OK',
          showCancel: false,
        });
      });
    },
    []
  );

  // KNOWN ISSUE (pre-existing, deliberately unchanged during TS conversion):
  // this promise only ever resolves `true`, via onConfirm. Dismissing the dialog
  // calls closeDialog, which never settles it — so `await showConfirm(...)`
  // hangs forever if the user cancels. Fixing it changes runtime behaviour and
  // belongs in its own change, with a test.
  const showConfirm = useCallback((message: string, title = 'Confirm'): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title,
        message,
        type: 'confirm',
        onConfirm: () => resolve(true),
        confirmText: 'Yes',
        cancelText: 'No',
        showCancel: true,
      });
    });
  }, []);

  const showSuccess = useCallback(
    (message: string, title = 'Success'): Promise<boolean> => {
      return showAlert(message, title, 'success');
    },
    [showAlert]
  );

  const showError = useCallback(
    (message: string, title = 'Error'): Promise<boolean> => {
      return showAlert(message, title, 'error');
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (message: string, title = 'Warning'): Promise<boolean> => {
      return showAlert(message, title, 'warning');
    },
    [showAlert]
  );

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
    closeDialog,
  };
};

export default useCustomDialog;
