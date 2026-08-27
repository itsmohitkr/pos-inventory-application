/**
 * Utility functions for handling price inputs and price displays across POS.
 */

/**
 * Restricts a string input value to maximum 2 decimal places.
 * e.g., "12.3456" -> "12.34", "100.5" -> "100.5", "50" -> "50"
 */
export const limitTwoDecimals = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  const parts = str.split('.');
  if (parts.length > 1) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return str;
};

/**
 * Formats any price value to max 2 decimal places.
 * e.g., 99.999 -> "100.00", 10.5 -> "10.50", "0" -> "0.00"
 */
export const formatPrice = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '0.00';
  const num = Number(value);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};
