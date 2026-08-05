import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { createHttpError } from '../error/appError';

/** Which parts of an IPC payload to validate, and with which schema — mirrors validateRequest's RequestSchemas. */
type PayloadSchemas = Partial<Record<'body' | 'query' | 'params', z.ZodType>>;

/** The raw parts of an IPC payload to validate against PayloadSchemas. */
type PayloadParts = Partial<Record<'body' | 'query' | 'params', unknown>>;

/**
 * Shapes Zod issues into the `details` array the HTTP API has always
 * returned. Identical to validateRequest.ts's formatValidationDetails —
 * duplicated rather than imported because validateRequest.ts stays
 * Express-coupled (still needed for the dev-browser/HTTP path) and this
 * needs to stay Express-free. Keep both in sync if either changes.
 */
const formatValidationDetails = (issues: z.core.$ZodIssue[] = []) => {
  return issues.map((issue) => ({
    message: issue.message.replace(/"/g, ''),
    path: issue.path.join('.'),
    type: issue.code,
  }));
};

/**
 * Validates an IPC payload against the same Zod schema groups
 * (`*.validation.ts`) the HTTP routes already use, throwing the identical
 * `createHttpError(400, 'Validation failed', ...)` validateRequest.ts throws
 * on failure — so a migrated route's validation error is byte-identical to
 * its pre-migration HTTP counterpart. Returns the parsed/coerced parts (same
 * as validateRequest writing back to req.body/req.params) for parts that had
 * a schema; parts without a schema pass through unchanged.
 */
export const validateIpcPayload = <T extends PayloadParts>(
  schemas: PayloadSchemas,
  parts: T
): T => {
  const result = { ...parts } as T;

  for (const [target, schema] of Object.entries(schemas) as [
    keyof PayloadSchemas,
    z.ZodType,
  ][]) {
    if (!schema) continue;

    // safeParse rather than parse: every issue is collected and reported at
    // once, matching validateRequest.ts's use of the same option.
    const parsed = schema.safeParse(parts[target]);

    if (!parsed.success) {
      throw createHttpError(StatusCodes.BAD_REQUEST, 'Validation failed', {
        name: 'ValidationError',
        error: 'Validation failed',
        details: formatValidationDetails(parsed.error.issues),
      });
    }

    if (parsed.data !== undefined) {
      result[target] = parsed.data;
    }
  }

  return result;
};
