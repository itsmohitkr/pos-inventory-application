import type { Product } from '@/shared/types/models';

export const POS_SEARCH_TIMINGS = {
  AUTO_FOCUS_DELAY: 150,
  AUTO_FOCUS_REFOCUS_DELAY: 20,
  BARCODE_NOT_FOUND_CLEAR_DELAY: 300,
  SELECTION_RESET_DELAY: 10,
};

/**
 * Which product Enter should add: the highlighted option if the user arrowed to
 * one, otherwise the first match for what they typed.
 */
export const resolveEnterKeyProduct = ({
  products,
  filterOptions,
  searchQuery,
  highlighted,
}: {
  products: Product[];
  /** The Autocomplete's own filter, so Enter matches what is on screen. */
  filterOptions: (options: Product[], state: { inputValue: string }) => Product[];
  searchQuery: string;
  highlighted?: Product | null;
}): Product | null => {
  const filtered = filterOptions(products, { inputValue: searchQuery });
  return highlighted || filtered[0] || null;
};

export const dispatchBarcodeNotFound = (searchQuery: string): void => {
  if (window?.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('pos-barcode-not-found', { detail: searchQuery }));
  }
};
