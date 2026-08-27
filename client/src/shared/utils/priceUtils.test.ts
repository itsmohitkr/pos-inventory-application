import { describe, it, expect } from 'vitest';
import { limitTwoDecimals, formatPrice } from './priceUtils';

describe('priceUtils', () => {
  describe('limitTwoDecimals', () => {
    it('limits inputs with more than two decimals to 2 decimal places', () => {
      expect(limitTwoDecimals('10.1234')).toBe('10.12');
      expect(limitTwoDecimals('99.999')).toBe('99.99');
      expect(limitTwoDecimals(15.678)).toBe('15.67');
    });

    it('preserves single decimal or integer strings without extra trailing zeros', () => {
      expect(limitTwoDecimals('10.5')).toBe('10.5');
      expect(limitTwoDecimals('100')).toBe('100');
      expect(limitTwoDecimals('')).toBe('');
      expect(limitTwoDecimals(null)).toBe('');
      expect(limitTwoDecimals(undefined)).toBe('');
    });
  });

  describe('formatPrice', () => {
    it('formats integer values without trailing zeros and decimals to 2 decimal places', () => {
      expect(formatPrice(10.5)).toBe('10.50');
      expect(formatPrice(100)).toBe('100');
      expect(formatPrice('49.9')).toBe('49.90');
      expect(formatPrice(99.999)).toBe('100');
      expect(formatPrice(100.75)).toBe('100.75');
    });

    it('returns 0 for empty or invalid values', () => {
      expect(formatPrice(null)).toBe('0');
      expect(formatPrice(undefined)).toBe('0');
      expect(formatPrice('abc')).toBe('0');
    });
  });
});
