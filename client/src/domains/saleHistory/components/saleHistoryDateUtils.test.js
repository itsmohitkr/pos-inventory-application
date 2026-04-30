import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSaleHistoryRange, buildInclusiveSaleHistoryRange } from './saleHistoryDateUtils';

describe('saleHistoryDateUtils', () => {
  describe('getSaleHistoryRange', () => {
    beforeEach(() => {
      // Mock "now" to a specific date: 2026-04-30 (Thursday)
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-30T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns correct range for "day"', () => {
      const range = getSaleHistoryRange('day');
      expect(new Date(range.start).getHours()).toBe(0);
      expect(new Date(range.end).getHours()).toBe(23);
      expect(new Date(range.start).getDate()).toBe(30);
    });

    it('returns correct range for "yesterday"', () => {
      const range = getSaleHistoryRange('yesterday');
      expect(new Date(range.start).getDate()).toBe(29);
      expect(new Date(range.end).getDate()).toBe(29);
    });

    it('returns correct range for "this_week"', () => {
      const range = getSaleHistoryRange('this_week');
      // Monday of that week was April 27th
      expect(new Date(range.start).getDate()).toBe(27);
      expect(new Date(range.end).getDate()).toBe(30);
    });

    it('returns correct range for "this_month"', () => {
      const range = getSaleHistoryRange('this_month');
      expect(new Date(range.start).getDate()).toBe(1);
      expect(new Date(range.start).getMonth()).toBe(3); // April is index 3
      expect(new Date(range.end).getDate()).toBe(30);
    });
  });

  describe('buildInclusiveSaleHistoryRange', () => {
    it('returns null for missing dates', () => {
      expect(buildInclusiveSaleHistoryRange(null, '2026-04-30')).toBeNull();
      expect(buildInclusiveSaleHistoryRange('2026-04-30', null)).toBeNull();
    });

    it('returns null for invalid dates', () => {
      expect(buildInclusiveSaleHistoryRange('invalid', '2026-04-30')).toBeNull();
    });

    it('returns inclusive ISO strings for valid dates', () => {
      const range = buildInclusiveSaleHistoryRange('2026-04-01', '2026-04-30');
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);

      expect(startDate.getFullYear()).toBe(2026);
      expect(startDate.getMonth()).toBe(3);
      expect(startDate.getDate()).toBe(1);
      expect(startDate.getHours()).toBe(0);

      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(3);
      expect(endDate.getDate()).toBe(30);
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
    });
  });
});
