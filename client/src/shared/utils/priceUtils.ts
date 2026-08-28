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
 * Formats any price value dynamically:
 * - If the price is a whole integer (e.g., 100 or "100.00"), returns integer "100".
 * - If the price contains fractional decimals (e.g., 100.5 or 100.75), returns formatted "100.50" or "100.75".
 */
export const formatPrice = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';

  const fixed = num.toFixed(2);
  const roundedNum = Number(fixed);
  if (Number.isInteger(roundedNum)) {
    return roundedNum.toString();
  }
  return fixed;
};
