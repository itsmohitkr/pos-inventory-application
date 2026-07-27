/**
 * Readers for `req.query` and `req.params`.
 *
 * Express does not guarantee a query value is a string. `?page=1&page=2`
 * yields `['1','2']`, and `?page[x]=1` yields a nested object — both typed as
 * `string | string[] | ParsedQs | ParsedQs[]`. Controllers previously read
 * these as if they were always strings, so a repeated parameter reached the
 * service layer as an array and failed there (`search.trim is not a function`)
 * rather than being rejected at the edge.
 *
 * These helpers collapse the non-string forms to a fallback so a malformed
 * query degrades to the default instead of crashing deeper in.
 */

/** A single string query value, or `undefined` if absent/repeated/nested. */
export const queryStr = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

/**
 * A string query value with a default.
 * Mirrors the previous `req.query.x || fallback`.
 */
export const queryStrOr = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value !== '' ? value : fallback;

/**
 * An integer query value with a default, preserving 0.
 *
 * Use this wherever zero is a meaningful value — `?month=0` is January, and a
 * helper that treated 0 as "missing" would silently read it as the current
 * month. Falls back only when the value is absent or unparseable.
 */
export const queryInt = (value: unknown, fallback: number): number => {
  const parsed = parseInt(typeof value === 'string' ? value : '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

/**
 * A count-style integer (page, limit) with a default.
 *
 * Mirrors the previous `parseInt(req.query.x) || fallback`, where 0 falls back
 * rather than paging from zero — `page=0` would otherwise compute a negative
 * skip and fail in Prisma.
 */
export const queryCount = (value: unknown, fallback: number): number =>
  parseInt(typeof value === 'string' ? value : '', 10) || fallback;

/**
 * A route parameter, passed through as-is.
 *
 * IMPORTANT: params are not necessarily strings by the time a controller runs.
 * `validateRequest` assigns the Zod-parsed result back onto `req.params`, and
 * the `id()` schema is `z.coerce.number()`, so a validated `:id` arrives as a
 * **number** even though Express types it as `string | string[]`. Services on
 * these routes accept `string | number` for exactly that reason.
 *
 * Anything else (a repeated segment, which Express surfaces as an array)
 * collapses to '' and is rejected downstream as a malformed id already was.
 */
export const paramValue = (value: unknown): string | number =>
  typeof value === 'string' || typeof value === 'number' ? value : '';

/**
 * A route parameter as a string.
 *
 * Numbers are stringified for the same reason paramValue exists: a validated
 * param may already have been coerced by its schema.
 */
export const paramStr = (value: unknown): string => {
  if (typeof value === 'string') return value;
  return typeof value === 'number' ? String(value) : '';
};

/**
 * A route parameter as an integer.
 *
 * Handles the already-coerced number case above; a non-numeric id yields NaN,
 * which the service layer rejects as before.
 */
export const paramInt = (value: unknown): number => {
  if (typeof value === 'number') return value;
  return parseInt(typeof value === 'string' ? value : '', 10);
};
