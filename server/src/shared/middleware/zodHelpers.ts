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
export const num = () => z.coerce.number();

/** Joi.number().integer() */
export const int = () => z.coerce.number().int();

/** Joi.number().integer().positive() — the common id shape. */
export const id = () => z.coerce.number().int().positive();

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
export const date = () => z.coerce.date();

/** Joi.string().trim() */
export const str = () => z.string().trim();

/**
 * Joi's `.allow('', null)` — permits empty string and null alongside the type.
 * Combine with `.optional()` where Joi also had `.optional()`.
 */
export const nullableStr = () => z.string().trim().nullable();

/**
 * Joi.object().unknown(true) — keeps unrecognised keys instead of stripping
 * them. Plain z.object() strips, which matches Joi's `stripUnknown: true`.
 */
export const looseObject = () => z.looseObject({});

export { z };
