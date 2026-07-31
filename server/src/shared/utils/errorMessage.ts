/**
 * `catch` variables are `unknown` under strict mode — this is the one-line
 * narrowing every catch block that only wants a loggable message needs.
 */
export const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);
