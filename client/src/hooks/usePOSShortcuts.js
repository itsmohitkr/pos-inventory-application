import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle POS-specific keyboard shortcuts
 * @param {Object} handlers - Callback functions for actions
 * @param {Object} options - Configuration options
 */
export const usePOSShortcuts = (handlers, { disabled } = {}) => {
    // Use a ref to keep handlers current without re-triggering the effect
    const handlersRef = useRef(handlers);

    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    useEffect(() => {
        if (disabled) return;

        const handleKeyDown = (event) => {
            // ...
            const { key } = event;
            const currentHandlers = handlersRef.current;

            switch (key) {
                case 'F8':
                    event.preventDefault();
                    currentHandlers.onLooseSale?.();
                    break;
                case 'F9':
                    event.preventDefault();
                    currentHandlers.onToggleNumpad?.();
                    break;
                case 'F10':
                    event.preventDefault();
                    currentHandlers.onPay?.();
                    break;
                case 'F11':
                    event.preventDefault();
                    currentHandlers.onPayAndPrint?.();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [disabled]);
};
