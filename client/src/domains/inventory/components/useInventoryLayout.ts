import { useState } from 'react';
import { useResizablePanel } from '@/shared/hooks/useResizablePanel';

export const useInventoryLayout = () => {
  const left = useResizablePanel({
    storageKey: 'inventoryLeftPanelWidth',
    defaultWidth: 280,
    min: 80,
    maxRatio: 0.4,
    offset: 40,
    anchor: 'left',
  });
  const right = useResizablePanel({
    storageKey: 'inventoryRightPanelWidth',
    defaultWidth: 360,
    min: 100,
    maxRatio: 0.5,
    offset: 40,
    anchor: 'right',
  });
  const [showCategories, setShowCategories] = useState(true);

  return {
    leftPanelWidth: left.width,
    rightPanelWidth: right.width,
    showCategories,
    setShowCategories,
    handleResizeStartLeft: left.startResizing,
    handleResizeStartRight: right.startResizing,
    isResizingLeft: left.isResizing,
    isResizingRight: right.isResizing,
  };
};
