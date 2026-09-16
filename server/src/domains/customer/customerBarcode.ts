/**
 * Customer barcodes are derived from the customer's own database id, not
 * randomly generated — the id is already unique forever (never reused, since
 * customers are never deleted), so there is nothing left to check or retry.
 *
 * Format: standard UPC-A, 12 digits.
 *   - Digit 1: GS1 "restricted circulation" system digit, always `2`. UPC-A
 *     reserves this digit worldwide for in-store/internal use (scales,
 *     loyalty cards, etc.) specifically so it can never collide with a real
 *     manufacturer's product barcode.
 *   - Digits 2-11: the customer's id, zero-padded to 10 digits.
 *   - Digit 12: the standard UPC-A check digit, so a scanner misread is
 *     caught instead of silently resolving to the wrong customer.
 */

const ID_DIGITS = 10;
const SYSTEM_DIGIT = '2';
const BARCODE_PATTERN = /^2\d{11}$/;

const computeUpcCheckDigit = (elevenDigits: string): number => {
  let sum = 0;
  for (let i = 0; i < elevenDigits.length; i++) {
    const digit = Number(elevenDigits[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
};

export const buildCustomerBarcode = (id: number): string => {
  const idPart = String(id).padStart(ID_DIGITS, '0');
  if (idPart.length > ID_DIGITS) {
    throw new Error(`Customer id ${id} exceeds ${ID_DIGITS} digits; cannot encode as a UPC-A barcode`);
  }
  const message = `${SYSTEM_DIGIT}${idPart}`;
  return `${message}${computeUpcCheckDigit(message)}`;
};

export const isValidCustomerBarcode = (value: string): boolean => {
  if (!BARCODE_PATTERN.test(value)) return false;
  const message = value.slice(0, 11);
  const checkDigit = Number(value[11]);
  return computeUpcCheckDigit(message) === checkDigit;
};
