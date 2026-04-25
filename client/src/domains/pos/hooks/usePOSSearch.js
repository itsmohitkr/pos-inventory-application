import { useMemo, useCallback } from 'react';

export const usePOSSearch = (products) => {
  const barcodeMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (p.barcode) {
        // Handle multiple barcodes separated by |
        const codes = String(p.barcode).split('|');
        codes.forEach(code => {
          map.set(code.trim().toLowerCase(), p);
        });
      }
    });
    return map;
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
        const name =
          option._searchName || (option._searchName = String(option.name || '').toLowerCase());
        const barcode =
          option._searchBarcode ||
          (option._searchBarcode = String(option.barcode || '').toLowerCase());

        if (name.startsWith(normalizedInput)) namePrefix.push(option);
        else if (barcode.startsWith(normalizedInput)) barcodePrefix.push(option);
        else if (name.includes(normalizedInput)) nameContains.push(option);
        else if (barcode.includes(normalizedInput)) barcodeContains.push(option);
        else {
          const priceMatch = (option.batches || []).some(
            (batch) =>
              batch &&
              (
                batch._searchPrice || (batch._searchPrice = String(batch.sellingPrice || ''))
              ).includes(normalizedInput)
          );
          if (priceMatch) priceMatches.push(option);
        }
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
    [barcodeMap]
  );

  return {
    barcodeMap,
    filterOptions,
  };
};
