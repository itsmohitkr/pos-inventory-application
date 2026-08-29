import { describe, it, expect } from 'vitest';
import { splitIsoDate } from '@/domains/expenses/components/expenseManagementUtils';

describe('splitIsoDate', () => {
  it('extracts the date portion of a normal ISO string', () => {
    expect(splitIsoDate('2026-03-05T10:15:30.000Z')).toBe('2026-03-05');
  });

  it('returns an empty string for null/undefined', () => {
    expect(splitIsoDate(null)).toBe('');
    expect(splitIsoDate(undefined)).toBe('');
  });

  it('returns an empty string for an empty string', () => {
    expect(splitIsoDate('')).toBe('');
  });

  it('safely converts a Date object instead of throwing', () => {
    const date = new Date('2026-07-01T00:00:00.000Z');
    expect(splitIsoDate(date)).toBe('2026-07-01');
  });

  it('returns an empty string for a non-date-coercible value instead of throwing', () => {
    expect(splitIsoDate({ not: 'a date' })).toBe('');
    expect(splitIsoDate(NaN)).toBe('');
  });
});
