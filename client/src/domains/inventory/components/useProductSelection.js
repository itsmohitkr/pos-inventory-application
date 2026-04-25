import { useState, useCallback } from 'react';

export const useProductSelection = (displayedProducts, onSelect) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);

  const handleRowClick = useCallback((product, event) => {
    const id = String(product.id);
    const isCurrentlySelected = selectedIds.has(id) && selectedIds.size === 1;

    let nextSelected = new Set(selectedIds);

    if (event.shiftKey && lastSelectedId) {
      const displayedIds = displayedProducts.map((p) => String(p.id));
      const startIdx = displayedIds.indexOf(String(lastSelectedId));
      const endIdx = displayedIds.indexOf(id);
      if (startIdx !== -1 && endIdx !== -1) {
        const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
        displayedIds.slice(min, max + 1).forEach((rid) => nextSelected.add(rid));
      }
    } else if (event.ctrlKey || event.metaKey) {
      if (nextSelected.has(id)) nextSelected.delete(id);
      else nextSelected.add(id);
    } else {
      nextSelected = new Set([id]);
    }

    setSelectedIds(nextSelected);
    setLastSelectedId(id);
    
    if (onSelect) {
      onSelect(product, event, nextSelected);
    }
  }, [selectedIds, lastSelectedId, displayedProducts, onSelect]);

  const resetSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    lastSelectedId,
    setLastSelectedId,
    handleRowClick,
    resetSelection,
  };
};
