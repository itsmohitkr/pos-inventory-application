import { buildInclusiveDateRange } from '@/shared/utils/isoDate';

/** ISO-8601 range plus the local-date (en-CA, i.e. YYYY-MM-DD) equivalents. */
export interface ReportRange {
  start: string;
  end: string;
  localStart: string;
  localEnd: string;
}

/** ISO-8601 range only — buildInclusiveRangeFromLocalDates omits the local pair. */
export type IsoRange = Pick<ReportRange, 'start' | 'end'>;

/**
 * Deliberately not shared with saleHistoryDateUtils.getSaleHistoryRange or
 * dateUtils.getDateRange despite the similar switch structure: for the
 * current week/month/year, this returns the *full* calendar period (end =
 * Sunday / last day of month / Dec 31), where the other two clip `end` to
 * `now`. Merging them would change what date range is displayed to the user
 * for those presets.
 */
export const getReportRange = (type: string): ReportRange => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (type) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      break;
    case 'thisWeek': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59, 999);
      break;
    }
    case 'lastWeek': {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diffToMonday - 7, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), diffToMonday - 1, 23, 59, 59, 999);
      break;
    }
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'lastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'thisYear':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'lastYear':
      start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    default:
      break;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    localStart: start.toLocaleDateString('en-CA'),
    localEnd: end.toLocaleDateString('en-CA'),
  };
};

export const buildInclusiveRangeFromLocalDates = (
  startDate: string,
  endDate: string
): IsoRange | null => buildInclusiveDateRange(startDate, endDate);
