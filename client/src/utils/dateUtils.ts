/**
 * Date Utilities
 * Helper functions for date range calculations and formatting.
 */

export const getStartOfDay = (d: Date | string | number): Date => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getEndOfDay = (d: Date | string | number): Date => {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
};

/** The named ranges getDateRange understands; anything else falls back to today. */
export type DateRangePreset = 'today' | 'yesterday' | 'thisMonth' | 'lastMonth' | 'thisYear';

export const getDateRange = (type?: DateRangePreset | string): { start: Date; end: Date } => {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (type) {
    case 'today':
      start = getStartOfDay(now);
      end = getEndOfDay(now);
      break;
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      start = getStartOfDay(yesterday);
      end = getEndOfDay(yesterday);
      break;
    }
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = getEndOfDay(now);
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'thisYear':
      start = new Date(now.getFullYear(), 0, 1);
      end = getEndOfDay(now);
      break;
    default:
      start = getStartOfDay(now);
      end = getEndOfDay(now);
  }

  return { start, end };
};

export const formatShortNum = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const formatDateDisplay = (dateString?: string | Date | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    // Stringified so the declared string return holds for the Date input case;
    // for the string inputs this function actually receives it is a no-op.
    return String(dateString);
  }
};

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
export const FULL_MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

export const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];
