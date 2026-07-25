/**
 * Normalises API responses into a predictable shape.
 *
 * The backend currently emits three different envelopes depending on each
 * handler's `format` option:
 *
 *   raw      →  T                              (36 handlers)
 *   merge    →  { success, message, ...T }      (22 handlers)
 *   wrapped  →  { success, message, data: T }   (default)
 *
 * These guards absorb that inconsistency at the boundary so components stay
 * unaware of it. If the envelopes are ever unified server-side, this module is
 * the single place that has to change.
 */

/** A response that may arrive bare or wrapped in a `data` envelope. */
type MaybeWrapped<T> = T | { data?: T } | null | undefined;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Extracts an array from a response, whether it arrived bare or under `data`.
 * Returns `[]` rather than throwing, so callers can render empty state safely.
 */
export const getResponseArray = <T = unknown>(response: MaybeWrapped<T[]>): T[] => {
  if (Array.isArray(response)) return response;

  const inner = (response as { data?: T[] } | null | undefined)?.data;
  if (Array.isArray(inner)) return inner;

  return [];
};

/**
 * Extracts an object from a response, unwrapping a nested `data` envelope when
 * present. Returns `{}` for arrays, primitives, and nullish values.
 */
export const getResponseObject = <T extends object = Record<string, unknown>>(
  response: MaybeWrapped<T>
): T | Record<string, never> => {
  if (isPlainObject(response)) {
    const inner = response.data;
    if (isPlainObject(inner)) {
      return inner as unknown as T;
    }
    return response as unknown as T;
  }
  return {};
};
