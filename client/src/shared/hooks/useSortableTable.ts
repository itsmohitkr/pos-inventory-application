import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T & string;
  direction: SortDirection;
  /** Pulls nested or computed values instead of reading `key` directly. */
  getter?: ((item: T) => unknown) | null;
}

/**
 * Sorting is inherently dynamic here — values are read by key at runtime and
 * compared with `<`/`>`, which TypeScript cannot narrow. `SortableRow` keeps the
 * hook generic over the row shape while allowing that indexed access.
 */
type SortableRow = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const useSortableTable = <T extends SortableRow>(
  data: T[],
  defaultSortConfig: SortConfig<T> | null = null
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(defaultSortConfig);

  const sortedData = useMemo(() => {
    const sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Explicitly `any`: values come from dynamic key access or a custom
        // getter, then get compared with `<`/`>`. TypeScript cannot narrow that,
        // and `unknown` would reject both the getter assignment and the compare.
        /* eslint-disable @typescript-eslint/no-explicit-any */
        let aVal: any = a[sortConfig.key];
        let bVal: any = b[sortConfig.key];
        /* eslint-enable @typescript-eslint/no-explicit-any */

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

  const requestSort = (key: keyof T & string, getter: ((item: T) => unknown) | null = null) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction, getter });
  };

  return { items: sortedData, requestSort, sortConfig };
};

export default useSortableTable;
