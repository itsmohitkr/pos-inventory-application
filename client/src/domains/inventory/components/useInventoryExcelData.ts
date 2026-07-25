import { useMemo } from 'react';
import {
  flattenInventoryRows,
  applyInventorySearch,
  applyInventorySort,
  calculateInventoryTotals,
  getInventoryExpiryColor,
} from '@/domains/inventory/components/inventoryExcelUtils';

const useInventoryExcelData = ({ products, localCategoryFilter, searchTerm, sortConfigs }) => {
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
