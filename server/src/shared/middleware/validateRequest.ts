import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import type { NextFunction, Request, Response } from 'express';
import { createHttpError } from '../error/appError';

export { z };

/** Which parts of the request to validate, and with which schema. */
type RequestSchemas = Partial<Record<'body' | 'query' | 'params', z.ZodType>>;

/**
 * Whether `key` can be assigned on `obj`.
 *
 * The property may be defined anywhere on the prototype chain — Express
 * declares `query` on its request prototype, not on the instance — so the
 * whole chain is walked rather than just the first level.
 */
const isWritableProperty = (obj: object, key: string): boolean => {
  let current: object | null = obj;

  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) {
      return descriptor.writable === true || typeof descriptor.set === 'function';
    }
    current = Object.getPrototypeOf(current);
  }

  return true;
};

/**
 * Shapes Zod issues into the `details` array the API has always returned.
 *
 * The envelope is unchanged from the Joi implementation: `{ message, path,
 * type }` per issue. Joi stripped double quotes from its messages, so the same
 * is done here for consistency. `type` carries Zod's issue code in place of
 * Joi's — nothing in the client reads it.
 */
const formatValidationDetails = (issues: z.core.$ZodIssue[] = []) => {
  return issues.map((issue) => ({
    message: issue.message.replace(/"/g, ''),
    path: issue.path.join('.'),
    type: issue.code,
  }));
};

const validateRequest = (schemas: RequestSchemas = {}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const [target, schema] of Object.entries(schemas) as [
      keyof RequestSchemas,
      z.ZodType,
    ][]) {
      if (!schema) continue;

      // safeParse rather than parse: every issue is collected and reported at
      // once, matching Joi's abortEarly: false.
      const result = schema.safeParse(req[target]);

      if (!result.success) {
        return next(
          createHttpError(StatusCodes.BAD_REQUEST, 'Validation failed', {
            name: 'ValidationError',
            error: 'Validation failed',
            details: formatValidationDetails(result.error.issues),
          })
        );
      }

      // Express 5 defines req.query as a getter with no setter, so the parsed
      // value cannot be written back for `query` — controllers read the raw
      // strings and coerce themselves. This matched Joi's behaviour too: the
      // assignment silently failed there because CommonJS ran in sloppy mode.
      //
      // `body` and `params` are plain writable properties and do receive the
      // parsed (and coerced) value.
      if (result.data !== undefined && isWritableProperty(req, target)) {
        req[target] = result.data;
      }
    }

    return next();
  };
};

export { validateRequest };
