import { z } from 'zod';

/**
 * Zod equivalents of the Joi idioms this codebase used.
 *
 * COERCION
 * --------
 * Joi ran with `convert: true`, which silently turned "42" into 42 and "true"
 * into true. Zod does not coerce by default, so every scalar that previously
 * relied on that behaviour uses a coercing helper here. Without this, params
 * (always strings) and string-valued JSON bodies would start failing
 * validation that used to pass.
 *
 * Note that coerced *query* values are still discarded downstream — Express 5
 * makes req.query read-only — but the coercion is required for the value to
 * pass validation at all.
 */

/** Joi.number() with convert:true — accepts 42 or "42". */
export const num = () => z.coerce.number({ error: 'Must be a valid number' });

/** Joi.number().integer() */
export const int = () =>
  z.coerce.number({ error: 'Must be a valid number' }).int('Must be a whole number');

/** Joi.number().integer().positive() — the common id shape. */
export const id = () =>
  z.coerce
    .number({ error: 'Must be a valid number' })
    .int('Must be a whole number')
    .positive('Must be a positive number');

/**
 * Joi.boolean() with convert:true.
 *
 * NOT z.coerce.boolean(): that applies JavaScript's Boolean(), which turns the
 * string "false" into `true`. Joi parsed "false" as false, so the string forms
 * are handled explicitly.
 */
export const bool = () =>
  z.union([
    z.boolean(),
    z.literal('true').transform(() => true),
    z.literal('false').transform(() => false),
  ]);

/** Joi.date().iso() with convert:true — accepts a Date or an ISO string. */
export const date = () => z.coerce.date({ error: 'Must be a valid date' });

/** Joi.string().trim() */
export const str = () => z.string({ error: 'Must be text' }).trim();

/**
 * Joi's `.allow('', null)` — permits empty string and null alongside the type.
 * Combine with `.optional()` where Joi also had `.optional()`.
 */
export const nullableStr = () => z.string({ error: 'Must be text' }).trim().nullable();

/**
 * Joi.object().unknown(true) — keeps unrecognised keys instead of stripping
 * them. Plain z.object() strips, which matches Joi's `stripUnknown: true`.
 */
export const looseObject = () => z.looseObject({});

/** The `{ id }` route-param shape, identical across every domain's id-param schema. */
export const idParamSchema = () => z.object({ id: id() });

/**
 * An id that may arrive as a coerced number or a numeric string — used for
 * nested body/item ids (e.g. a product_id inside a batch payload), not route
 * params, where `id()` alone is enough.
 */
export const numericId = () =>
  z.union([id(), str().regex(/^\d+$/, 'Must be a positive number')]);

/**
 * The startDate/endDate query-param pair accepted by every date-range
 * report or list endpoint. Spread into the enclosing object schema, e.g.
 * `z.object({ ...dateRangeShape(), category: str().optional() })`.
 */
export const dateRangeShape = () => ({
  startDate: z.union([z.coerce.date(), str()]).optional(),
  endDate: z.union([z.coerce.date(), str()]).optional(),
});

/** Joi.number().min(0) — a non-negative monetary amount. */
export const moneyValue = () => num().min(0, 'Amount must be zero or greater');

/** The amount/date/note/paymentMethod shape shared by every "record a payment" endpoint. */
export const paymentBodySchema = () =>
  z.object({
    amount: moneyValue(),
    date: z.union([z.coerce.date(), str().min(1, 'Date is required')]).optional(),
    note: z.string().nullable().optional(),
    paymentMethod: str().nullable().optional(),
  });

/**
 * Joi's `.min(1)` on an all-optional object — refuses an empty update body.
 * Use as `.refine(atLeastOneField, { message: AT_LEAST_ONE_FIELD_MESSAGE })`.
 */
export const atLeastOneField = (value: object): boolean => Object.keys(value).length >= 1;
export const AT_LEAST_ONE_FIELD_MESSAGE = 'at least one field is required';

export { z };
