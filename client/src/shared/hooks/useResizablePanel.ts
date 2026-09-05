import { useState, useEffect, useCallback } from 'react';

interface UseResizablePanelArgs {
  /** localStorage key the chosen width persists under. */
  storageKey: string;
  defaultWidth: number;
  min: number;
  /** Fixed upper bound in pixels. Mutually exclusive with `maxRatio`. */
  max?: number;
  /**
   * Upper bound as a fraction of window.innerWidth, recomputed on every
   * pointer move (so it stays correct across a window resize, unlike a
   * `max` snapshotted once at mount). Mutually exclusive with `max`.
   */
  maxRatio?: number;
  /** Pixels subtracted from the raw pointer-derived width. Defaults to 24. */
  offset?: number;
  /** Which edge event.clientX is measured from. Defaults to 'right'. */
  anchor?: 'left' | 'right';
}

const readStoredWidth = (storageKey: string, defaultWidth: number): number => {
  const stored = Number(localStorage.getItem(storageKey));
  return Number.isFinite(stored) && stored > 0 ? stored : defaultWidth;
};

/**
 * A draggable-width panel, generalized from
 * client/src/domains/pos/hooks/usePOSLayout.ts's resize slice. The dragged
 * width is always clamped to [min, effectiveMax] (rather than frozen once
 * the pointer leaves that range) — a single, predictable strategy shared by
 * every caller (SaleHistory, Inventory's two panels, Customers).
 */
export const useResizablePanel = ({
  storageKey,
  defaultWidth,
  min,
  max,
  maxRatio,
  offset = 24,
  anchor = 'right',
}: UseResizablePanelArgs) => {
  const [width, setWidth] = useState(() => readStoredWidth(storageKey, defaultWidth));
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
      if (!isResizing) return;
      const rawWidth = anchor === 'left' ? e.clientX - offset : window.innerWidth - e.clientX - offset;
      const effectiveMax = maxRatio !== undefined ? window.innerWidth * maxRatio : (max ?? Infinity);
      const nextWidth = Math.max(min, Math.min(effectiveMax, rawWidth));
      setWidth(nextWidth);
      localStorage.setItem(storageKey, nextWidth.toString());
    },
    [isResizing, min, max, maxRatio, offset, anchor, storageKey]
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
