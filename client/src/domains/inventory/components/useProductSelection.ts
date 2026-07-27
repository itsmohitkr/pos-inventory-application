import React, { useState, useCallback } from 'react';
import type { Product } from '@/shared/types/models';

export const useProductSelection = (
  displayedProducts: Product[],
  /** Called with the clicked row plus the resulting selection set. */
  onSelect: (
    product: Product | null,
    event?: React.MouseEvent,
    nextSelected?: Set<string>
  ) => void
) => {
  /** Row ids as strings, matching String(product.id). */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const handleRowClick = useCallback((product: Product, event: React.MouseEvent) => {
    const id = String(product.id);
    let nextSelected = new Set(selectedIds);

    if (event.shiftKey && lastSelectedId) {
      const displayedIds = displayedProducts.map((p: Product) => String(p.id));
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
