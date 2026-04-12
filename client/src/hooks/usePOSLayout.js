import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage POS UI layout and state
 */
export const usePOSLayout = () => {
  const [transactionPanelWidth, setTransactionPanelWidth] = useState(() => {
    return Number(localStorage.getItem('posTransactionPanelWidth')) || 450;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [showLooseSaleDialog, setShowLooseSaleDialog] = useState(false);
  const [showPromoGifts, setShowPromoGifts] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const searchBarRef = useRef(null);
  const refocusTimerRef = useRef(null);

  // Resizing logic
  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX - 24;
        if (newWidth > 320 && newWidth < window.innerWidth * 0.6) {
          setTransactionPanelWidth(newWidth);
          localStorage.setItem('posTransactionPanelWidth', newWidth.toString());
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
    };
  }, [isResizing, resize, stopResizing]);

  // Fullscreen logic
  const handleFullscreenToggle = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Failed to enter fullscreen mode', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Failed to exit fullscreen mode', err);
      }
    }
  }, []);

  // Focus management
  const refocus = useCallback((options = {}) => {
    const { delay = 150, force = false } = options;

    if (refocusTimerRef.current) {
      window.clearTimeout(refocusTimerRef.current);
    }

    refocusTimerRef.current = window.setTimeout(() => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.isContentEditable);

      if ((force || !isInput) && searchBarRef.current) {
        searchBarRef.current.focus();
      }
    }, delay);
  }, []);

  useEffect(() => {
    return () => {
      if (refocusTimerRef.current) {
        window.clearTimeout(refocusTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      refocus();
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [refocus]);

  return {
    transactionPanelWidth,
    isResizing,
    startResizing,
    isFullscreen,
    handleFullscreenToggle,
    showCalculator,
    setShowCalculator,
    showNumpad,
    setShowNumpad,
    showLooseSaleDialog,
    setShowLooseSaleDialog,
    showPromoGifts,
    setShowPromoGifts,
    showReceipt,
    setShowReceipt,
    searchBarRef,
    refocus,
  };
};
