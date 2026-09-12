/**
 * Extracts the YYYY-MM-DD portion of a date value for use as a native date
 * input's min/value. Defensive against non-string values reaching here
 * (e.g. a Date object, or malformed legacy data from the DB) — untrusted
 * API/DB data isn't guaranteed to match its declared TS type at runtime,
 * and every call site already treats '' as "no constraint" for the
 * null/undefined case, so that's the safe fallback here too.
 */
export const splitIsoDate = (value: unknown): string => {
  if (typeof value === 'string') return value.split('T')[0];
  if (!value) return '';
  const date = new Date(value as string | number | Date);
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

/** ISO-8601 start/end pair, in local time, inclusive of both dates. */
export interface InclusiveIsoRange {
  start: string;
  end: string;
}

/**
 * Turns a pair of YYYY-MM-DD date-input values into an inclusive local-time
 * ISO range (00:00:00.000 on startDate to 23:59:59.999 on endDate). Shared by
 * the reporting and sale-history custom date-range pickers, which previously
 * carried byte-identical copies of this parsing logic.
 */
export const buildInclusiveDateRange = (
  startDate?: string | null,
  endDate?: string | null
): InclusiveIsoRange | null => {
  if (!startDate || !endDate) return null;

  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);

  if ([sy, sm, sd, ey, em, ed].some((value) => Number.isNaN(value))) {
    return null;
  }

  const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
  const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};
