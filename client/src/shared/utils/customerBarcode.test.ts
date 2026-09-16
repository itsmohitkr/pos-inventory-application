import { describe, expect, it } from 'vitest';
import { isCustomerBarcode } from './customerBarcode';

describe('isCustomerBarcode', () => {
  it('accepts a valid 12-digit code with the reserved system digit and a correct check digit', () => {
    expect(isCustomerBarcode('200000000011')).toBe(true);
    expect(isCustomerBarcode('200000005016')).toBe(true);
  });

  it('rejects the old CUST- prefixed format', () => {
    expect(isCustomerBarcode('CUST-ABCD1234')).toBe(false);
  });

  it('rejects a value that is not 12 digits', () => {
    expect(isCustomerBarcode('20000000001')).toBe(false);
    expect(isCustomerBarcode('2000000000111')).toBe(false);
  });

  it('rejects a value not starting with the reserved system digit 2', () => {
    expect(isCustomerBarcode('100000000019')).toBe(false);
  });

  it('rejects a value with an incorrect check digit', () => {
    expect(isCustomerBarcode('200000000010')).toBe(false);
  });

  it('rejects a bare 12-digit product-style barcode (no reserved leading digit)', () => {
    expect(isCustomerBarcode('123456789012')).toBe(false);
  });
});
