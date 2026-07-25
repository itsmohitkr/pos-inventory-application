import Joi from 'joi';
export { Joi };
import { StatusCodes } from 'http-status-codes';
import type { NextFunction, Request, Response } from 'express';
import { createHttpError } from '../error/appError';

/** Which parts of the request to validate, and with which schema. */
type RequestSchemas = Partial<Record<'body' | 'query' | 'params', Joi.Schema>>;

const DEFAULT_OPTIONS = {
  abortEarly: false,
  allowUnknown: true,
  stripUnknown: true,
  convert: true,
};

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

  // Not defined anywhere: a plain assignment creates it.
  return true;
};

const formatValidationDetails = (details: Joi.ValidationErrorItem[] = []) => {
  return details.map((detail) => ({
    message: detail.message.replace(/\"/g, ''),
    path: detail.path.join('.'),
    type: detail.type,
  }));
};

export const validateRequest = (schemas: RequestSchemas = {}, options: Joi.ValidationOptions = {}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const [target, schema] of Object.entries(schemas) as [keyof RequestSchemas, Joi.Schema][]) {
      if (!schema) continue;

      const { error, value } = schema.validate(req[target], {
        ...DEFAULT_OPTIONS,
        ...options,
      });

      if (error) {
        return next(
          createHttpError(StatusCodes.BAD_REQUEST, 'Validation failed', {
            name: 'ValidationError',
            error: 'Validation failed',
            details: formatValidationDetails(error.details),
          })
        );
      }

      if (value !== undefined) {
        // Express 5 defines req.query as a getter with no setter, so this
        // assignment has always been a silent no-op for `query` — CommonJS
        // modules run in sloppy mode, where writing to a getter fails quietly.
        // TypeScript emits strict-mode modules, where the same write throws.
        //
        // Behaviour is preserved as-is: `body` and `params` are plain writable
        // properties and still receive Joi's coerced value; `query` is skipped,
        // exactly as before.
        //
        // NOTE: this means Joi's `convert: true` has never applied to query
        // parameters — controllers read raw strings and coerce themselves
        // (e.g. `Number(page)`). Making it apply would change what every
        // query-param handler receives, so it is left alone deliberately.
        if (isWritableProperty(req, target)) {
          req[target] = value;
        }
      }
    }

    return next();
  };
};

