import { buildCustomerBarcode, isValidCustomerBarcode } from '../../src/domains/customer/customerBarcode';

describe('customerBarcode', () => {
  describe('buildCustomerBarcode', () => {
    it('produces a 12-digit code starting with the GS1 restricted-circulation digit 2', () => {
      const barcode = buildCustomerBarcode(1);
      expect(barcode).toMatch(/^2\d{11}$/);
    });

    it('encodes the id, zero-padded, in the middle of the code', () => {
      expect(buildCustomerBarcode(42)).toBe('200000000424');
      expect(buildCustomerBarcode(1)).toBe('200000000011');
    });

    it('produces different codes for different ids', () => {
      expect(buildCustomerBarcode(1)).not.toBe(buildCustomerBarcode(2));
    });

    it('throws if the id cannot fit in the reserved digit width', () => {
      expect(() => buildCustomerBarcode(10_000_000_000)).toThrow();
    });
  });

  describe('isValidCustomerBarcode', () => {
    it('accepts a code this module generated', () => {
      expect(isValidCustomerBarcode(buildCustomerBarcode(12345))).toBe(true);
    });

    it('rejects a code with a tampered check digit', () => {
      const barcode = buildCustomerBarcode(12345);
      const tampered = barcode.slice(0, -1) + (Number(barcode.at(-1)) === 0 ? '1' : '0');
      expect(isValidCustomerBarcode(tampered)).toBe(false);
    });

    it('rejects codes that are not 12 digits', () => {
      expect(isValidCustomerBarcode('12345')).toBe(false);
      expect(isValidCustomerBarcode('2000000004241')).toBe(false);
    });

    it('rejects codes that are not digits-only', () => {
      expect(isValidCustomerBarcode('CUST-ABCD1234')).toBe(false);
      expect(isValidCustomerBarcode('20000000042a')).toBe(false);
    });

    it('rejects a code not starting with the reserved system digit 2', () => {
      const barcode = buildCustomerBarcode(42);
      expect(isValidCustomerBarcode('1' + barcode.slice(1))).toBe(false);
    });

    it('rejects a code with any single digit altered', () => {
      const barcode = buildCustomerBarcode(42);
      for (let i = 0; i < barcode.length; i++) {
        const original = barcode[i];
        const altered = original === '9' ? '8' : String(Number(original) + 1);
        const mutated = barcode.slice(0, i) + altered + barcode.slice(i + 1);
        expect(isValidCustomerBarcode(mutated)).toBe(false);
      }
    });
  });
});
