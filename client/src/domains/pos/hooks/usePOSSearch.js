import { useMemo, useCallback } from 'react';

export const usePOSSearch = (products) => {
  // Precompute search fields alongside the barcode map — avoids mutating state objects during render
  const { barcodeMap, searchIndex } = useMemo(() => {
    const map = new Map();
    const index = new Map();
    products.forEach((p) => {
      const searchName = String(p.name || '').toLowerCase();
      const searchBarcode = String(p.barcode || '').toLowerCase();
      const searchPrices = (p.batches || []).map((b) => String(b.sellingPrice || ''));
      index.set(p, { searchName, searchBarcode, searchPrices });
      if (p.barcode) {
        String(p.barcode).split('|').forEach((code) => {
          map.set(code.trim().toLowerCase(), p);
        });
      }
    });
    return { barcodeMap: map, searchIndex: index };
  }, [products]);

  const filterOptions = useCallback(
    (options, { inputValue }) => {
      const normalizedInput = inputValue.trim().toLowerCase();
      if (!normalizedInput) return [];

      const exactMatch = barcodeMap.get(normalizedInput);
      const namePrefix = [];
      const barcodePrefix = [];
      const nameContains = [];
      const barcodeContains = [];
      const priceMatches = [];

      if (exactMatch) barcodePrefix.push(exactMatch);

      for (const option of options) {
        if (!option || option === exactMatch) continue;
        const meta = searchIndex.get(option);
        if (!meta) continue;
        const { searchName, searchBarcode, searchPrices } = meta;

        if (searchName.startsWith(normalizedInput)) namePrefix.push(option);
        else if (searchBarcode.startsWith(normalizedInput)) barcodePrefix.push(option);
        else if (searchName.includes(normalizedInput)) nameContains.push(option);
        else if (searchBarcode.includes(normalizedInput)) barcodeContains.push(option);
        else if (searchPrices.some((p) => p.includes(normalizedInput))) priceMatches.push(option);
      }

      const sortFn = (a, b) => (a.name || '').localeCompare(b.name || '');
      namePrefix.sort(sortFn);
      barcodePrefix.sort(sortFn);
      nameContains.sort(sortFn);
      barcodeContains.sort(sortFn);
      priceMatches.sort(sortFn);

      return [
        ...namePrefix,
        ...barcodePrefix,
        ...nameContains,
        ...barcodeContains,
        ...priceMatches,
      ].slice(0, 50);
    },
    [barcodeMap, searchIndex]
  );

  return {
    barcodeMap,
    filterOptions,
  };
};
