import { useState, useEffect, useCallback } from 'react';

export const useInventoryLayout = () => {
  const [leftPanelWidth, setLeftPanelWidth] = useState(
    () => Number(localStorage.getItem('inventoryLeftPanelWidth')) || 280
  );
  const [rightPanelWidth, setRightPanelWidth] = useState(
    () => Number(localStorage.getItem('inventoryRightPanelWidth')) || 360
  );
  const [showCategories, setShowCategories] = useState(true);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (isResizingLeft) {
        const nextWidth = Math.max(80, Math.min(window.innerWidth * 0.4, event.clientX - 40));
        setLeftPanelWidth(nextWidth);
        localStorage.setItem('inventoryLeftPanelWidth', nextWidth.toString());
      }
      if (isResizingRight) {
        const nextWidth = Math.max(
          100,
          Math.min(window.innerWidth * 0.5, window.innerWidth - event.clientX - 40)
        );
        setRightPanelWidth(nextWidth);
        localStorage.setItem('inventoryRightPanelWidth', nextWidth.toString());
      }
    };
    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      document.body.style.cursor = 'default';
    };
    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isResizingLeft, isResizingRight]);

  const handleResizeStartLeft = useCallback(() => setIsResizingLeft(true), []);
  const handleResizeStartRight = useCallback(() => setIsResizingRight(true), []);

  return {
    leftPanelWidth,
    rightPanelWidth,
    showCategories,
    setShowCategories,
    handleResizeStartLeft,
    handleResizeStartRight,
    isResizingLeft,
    isResizingRight,
  };
};
