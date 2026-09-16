/**
 * Mirrors the shape/checksum check in
 * server/src/domains/customer/customerBarcode.ts (a separate package, so the
 * ~10 lines of UPC-A check-digit math can't be imported directly — kept
 * intentionally identical instead of duplicated-and-drifted). See that file
 * for the format rationale: 12-digit UPC-A, leading digit `2` (GS1
 * "restricted circulation" — reserved for in-store/internal use, so it can
 * never collide with a real product's barcode).
 */

const BARCODE_PATTERN = /^2\d{11}$/;

const computeUpcCheckDigit = (elevenDigits: string): number => {
  let sum = 0;
  for (let i = 0; i < elevenDigits.length; i++) {
    const digit = Number(elevenDigits[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
};

export const isCustomerBarcode = (value: string): boolean => {
  if (!BARCODE_PATTERN.test(value)) return false;
  const message = value.slice(0, 11);
  const checkDigit = Number(value[11]);
  return computeUpcCheckDigit(message) === checkDigit;
};
