export const POS_SEARCH_TIMINGS = {
  AUTO_FOCUS_DELAY: 150,
  AUTO_FOCUS_REFOCUS_DELAY: 20,
  BARCODE_NOT_FOUND_CLEAR_DELAY: 300,
  SELECTION_RESET_DELAY: 10,
};

export const resolveEnterKeyProduct = ({ products, filterOptions, searchQuery, highlighted }) => {
  const filtered = filterOptions(products, { inputValue: searchQuery });
  return highlighted || filtered[0] || null;
};

export const dispatchBarcodeNotFound = (searchQuery) => {
  if (window?.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('pos-barcode-not-found', { detail: searchQuery }));
  }
};
