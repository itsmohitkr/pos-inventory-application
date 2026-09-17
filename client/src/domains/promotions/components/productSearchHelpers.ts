import type { Product } from '@/shared/types/models';

/** First segment of a pipe-delimited multi-barcode string. */
export const getPrimaryBarcode = (product?: Product | null) => {
  if (!product?.barcode) return '';
  const parts = String(product.barcode).split('|');
  return parts[0]?.trim() || '';
};

export const matchProductByBarcodeOrQuery = (
  products: Product[],
  rawQuery: string
): Product | null => {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return null;

  // 1. Exact match on any barcode
  const barcodeExact = products.find((p) => {
    if (!p.barcode) return false;
    const codes = String(p.barcode)
      .split('|')
      .map((c) => c.trim().toLowerCase());
    return codes.includes(query);
  });
  if (barcodeExact) return barcodeExact;

  // 2. Exact SKU match
  const skuExact = products.find((p) => p.sku && String(p.sku).trim().toLowerCase() === query);
  if (skuExact) return skuExact;

  // 3. Exact name match
  const nameExact = products.find((p) => (p.name || '').trim().toLowerCase() === query);
  if (nameExact) return nameExact;

  // 4. Barcode prefix match
  const barcodePrefix = products.find((p) => {
    if (!p.barcode) return false;
    const codes = String(p.barcode)
      .split('|')
      .map((c) => c.trim().toLowerCase());
    return codes.some((c) => c.startsWith(query));
  });
  if (barcodePrefix) return barcodePrefix;

  // 5. Name prefix match
  const namePrefix = products.find((p) => (p.name || '').toLowerCase().startsWith(query));
  if (namePrefix) return namePrefix;

  // 6. Name or barcode substring match
  return (
    products.find((p) => {
      const nameMatch = (p.name || '').toLowerCase().includes(query);
      const barcodeMatch = p.barcode && String(p.barcode).toLowerCase().includes(query);
      return nameMatch || barcodeMatch;
    }) || null
  );
};

export const filterProductsForSearch = (
  options: Product[],
  { inputValue }: { inputValue: string }
): Product[] => {
  const query = inputValue.trim().toLowerCase();
  if (!query) return options.slice(0, 50);

  const exactBarcode: Product[] = [];
  const startsBarcode: Product[] = [];
  const exactName: Product[] = [];
  const startsName: Product[] = [];
  const contains: Product[] = [];

  options.forEach((p) => {
    const pName = (p.name || '').toLowerCase();
    const barcodes = p.barcode
      ? String(p.barcode)
          .split('|')
          .map((b) => b.trim().toLowerCase())
      : [];

    if (barcodes.includes(query)) {
      exactBarcode.push(p);
    } else if (pName === query) {
      exactName.push(p);
    } else if (barcodes.some((b) => b.startsWith(query))) {
      startsBarcode.push(p);
    } else if (pName.startsWith(query)) {
      startsName.push(p);
    } else if (pName.includes(query) || barcodes.some((b) => b.includes(query))) {
      contains.push(p);
    }
  });

  return [...exactBarcode, ...exactName, ...startsBarcode, ...startsName, ...contains].slice(0, 50);
};
