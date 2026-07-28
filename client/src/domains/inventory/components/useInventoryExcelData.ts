import type { Product } from '@/shared/types/models';
import type { InventorySortConfig } from '@/domains/inventory/components/inventoryExcelUtils';
import { useMemo } from 'react';
import {
  flattenInventoryRows,
  applyInventorySearch,
  applyInventorySort,
  calculateInventoryTotals,
  getInventoryExpiryColor,
} from '@/domains/inventory/components/inventoryExcelUtils';

interface UseInventoryExcelDataArgs {
  products: Product[];
  /** 'all' or a category name. */
  localCategoryFilter: string;
  searchTerm: string;
  sortConfigs: InventorySortConfig[];
}

const useInventoryExcelData = ({
  products,
  localCategoryFilter,
  searchTerm,
  sortConfigs,
}: UseInventoryExcelDataArgs) => {
  const uniqueCategories = useMemo(() => {
    const categorySet = new Set(products.map((product) => product.category).filter(Boolean));
    return ['all', ...Array.from(categorySet).sort()];
  }, [products]);

  const flatData = useMemo(
    () => flattenInventoryRows(products, localCategoryFilter),
    [products, localCategoryFilter]
  );

  const filteredAndSortedData = useMemo(() => {
    const searchedRows = applyInventorySearch(flatData, searchTerm);
    return applyInventorySort(searchedRows, sortConfigs);
  }, [flatData, searchTerm, sortConfigs]);

  const totals = useMemo(
    () => calculateInventoryTotals(filteredAndSortedData),
    [filteredAndSortedData]
  );

  return {
    uniqueCategories,
    filteredAndSortedData,
    totals,
    getExpiryColor: getInventoryExpiryColor,
  };
};

export default useInventoryExcelData;
