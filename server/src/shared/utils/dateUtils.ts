/** The named ranges `getDateRange` understands. Anything else yields nulls. */
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'custom';

/** Both bounds are null when the range cannot be resolved. */
export interface DateRange {
  start: string | null;
  end: string | null;
}

/**
 * `type` is widened to string because it arrives from an unvalidated query
 * parameter; unrecognised values fall through to the null range rather than
 * throwing. See DateRangePreset for the values that resolve.
 */
const getDateRange = (
  type?: DateRangePreset | string,
  customStart: string | Date | null = null,
  customEnd: string | Date | null = null
): DateRange => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  // Helper to reset hours for start/end
  const startOfDay = (d: Date): Date => {
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const endOfDay = (d: Date): Date => {
    d.setHours(23, 59, 59, 999);
    return d;
  };

  switch (type) {
    case 'today':
      startOfDay(start);
      endOfDay(end);
      break;

    case 'yesterday':
      start.setDate(now.getDate() - 1);
      startOfDay(start);
      end.setDate(now.getDate() - 1);
      endOfDay(end);
      break;

    case 'thisWeek': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
      start.setDate(diff);
      startOfDay(start);
      endOfDay(end);
      break;
    }

    case 'lastWeek': {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diffToMonday - 7);
      startOfDay(start);
      end.setDate(diffToMonday - 1);
      endOfDay(end);
      break;
    }

    case 'thisMonth':
      start.setDate(1);
      startOfDay(start);
      endOfDay(end);
      break;

    case 'lastMonth':
      start.setMonth(now.getMonth() - 1);
      start.setDate(1);
      startOfDay(start);
      end.setDate(0); // Last day of previous month
      endOfDay(end);
      break;

    case 'thisYear':
      start.setMonth(0, 1);
      startOfDay(start);
      endOfDay(end);
      break;

    case 'lastYear':
      start.setFullYear(now.getFullYear() - 1);
      start.setMonth(0, 1);
      startOfDay(start);
      end.setFullYear(now.getFullYear() - 1);
      end.setMonth(11, 31);
      endOfDay(end);
      break;

    case 'custom':
      if (customStart && customEnd) {
        start = new Date(customStart);
        end = new Date(customEnd);
      } else {
        return { start: null, end: null };
      }
      break;

    default:
      return { start: null, end: null };
  }

  return { start: start.toISOString(), end: end.toISOString() };
};

/** Appends the current time-of-day to a date-only string, e.g. from a date input. */
const getDateWithCurrentTime = (dateString?: string | Date | null): Date => {
  if (!dateString) return new Date();
  const dateObj = new Date(dateString);
  const now = new Date();
  dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return dateObj;
};

/**
 * Builds a Prisma `{ gte, lte }` filter from optional start/end bounds.
 * Returns undefined when neither bound is given, so a `where.field = ...`
 * assignment can be skipped rather than set to an empty object.
 */
const dateRangeWhere = (
  start?: string | Date | null,
  end?: string | Date | null
): { gte?: Date; lte?: Date } | undefined => {
  if (!start && !end) return undefined;
  const range: { gte?: Date; lte?: Date } = {};
  if (start) range.gte = new Date(start);
  if (end) range.lte = new Date(end);
  return range;
};

export { getDateRange, getDateWithCurrentTime, dateRangeWhere };
