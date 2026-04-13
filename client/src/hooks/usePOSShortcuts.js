import { useEffect } from 'react';

/**
 * Custom hook to handle POS-specific keyboard shortcuts
 * @param {Object} handlers - Callback functions for actions
 * @param {Function} handlers.onPay - F10
 * @param {Function} handlers.onPayAndPrint - F11
 * @param {Function} handlers.onLooseSale - F8
 * @param {Function} handlers.onToggleNumpad - F9
 * @param {Object} options - Configuration options
 * @param {boolean} options.disabled - Whether to disable shortcuts (e.g. when a dialog is open)
 */
export const usePOSShortcuts = (handlers, { disabled } = {}) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (disabled) return;

            // Don't trigger if user is typing in an input field
            // exception: if we want shortcuts to work while in the search bar, 
            // we check if the target is an input but NOT the search bar if needed.
            // For F-keys, usually they are safe even if an input is focused.
            const isEditable = (target) => {
                return (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'SELECT' ||
                    target.isContentEditable
                );
            };

            // F-keys are usually safe even if an input is focused, 
            // but we should still check if we want to block them for some reason.
            // However, F-keys on Windows have system defaults (F10=menu, F11=fullscreen).
            // We MUST preventDefault for these.

            const { key } = event;

            switch (key) {
                case 'F8':
                    event.preventDefault();
                    handlers.onLooseSale?.();
                    break;
                case 'F9':
                    event.preventDefault();
                    handlers.onToggleNumpad?.();
                    break;
                case 'F10':
                    event.preventDefault();
                    handlers.onPay?.();
                    break;
                case 'F11':
                    event.preventDefault();
                    handlers.onPayAndPrint?.();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers, disabled]);
};
