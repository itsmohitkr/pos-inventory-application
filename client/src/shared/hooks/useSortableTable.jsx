import { useState, useMemo } from 'react';

const useSortableTable = (data, defaultSortConfig = null) => {
  const [sortConfig, setSortConfig] = useState(defaultSortConfig);

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Allow custom sort getters to pull nested or computed data
        if (sortConfig.getter) {
          aVal = sortConfig.getter(a);
          bVal = sortConfig.getter(b);
        }

        // Handle string comparisons
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        // Handle null/undefined values by pushing them to the bottom
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key, getter = null) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction, getter });
  };

  return { items: sortedData, requestSort, sortConfig };
};

export default useSortableTable;
