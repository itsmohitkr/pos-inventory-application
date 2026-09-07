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
