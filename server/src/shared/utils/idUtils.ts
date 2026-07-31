/**
 * Coerces an id that arrived as a coerced number or a numeric string (e.g. a
 * nested item id inside an already-validated request body) to a number.
 *
 * Distinct from `requestParams.ts`'s `paramInt`/`paramValue`: those read raw,
 * untyped `req.params`/`req.query` values, while this operates on a
 * service-layer input already narrowed to `string | number` by Zod.
 */
export const toId = (value: string | number): number =>
  typeof value === 'number' ? value : parseInt(value, 10);
