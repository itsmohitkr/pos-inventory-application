import { useState, useEffect, useCallback } from 'react';

interface UseResizablePanelArgs {
  /** localStorage key the chosen width persists under. */
  storageKey: string;
  defaultWidth: number;
  min: number;
  max: number;
}

/**
 * A draggable-width right-hand panel, generalized from
 * client/src/domains/pos/hooks/usePOSLayout.ts's resize slice. Kept
 * standalone rather than importing that hook so POS's own behavior stays
 * untouched — this is a second, independent instance of the same pattern.
 */
export const useResizablePanel = ({ storageKey, defaultWidth, min, max }: UseResizablePanelArgs) => {
  const [width, setWidth] = useState(() => Number(localStorage.getItem(storageKey)) || defaultWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX - 24;
        if (newWidth > min && newWidth < max) {
          setWidth(newWidth);
          localStorage.setItem(storageKey, newWidth.toString());
        }
      }
    },
    [isResizing, min, max, storageKey]
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

  return { width, isResizing, startResizing };
};
