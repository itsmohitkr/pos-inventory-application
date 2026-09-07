import { useResizablePanel } from '@/shared/hooks/useResizablePanel';

export const useCustomerLayout = () => {
  const { width, startResizing, isResizing } = useResizablePanel({
    storageKey: 'customerRightPanelWidth',
    defaultWidth: 480,
    min: 320,
    maxRatio: 0.55,
    offset: 32,
    anchor: 'right',
  });

  return {
    rightPanelWidth: width,
    handleResizeStartRight: startResizing,
    isResizingRight: isResizing,
  };
};

export default useCustomerLayout;
