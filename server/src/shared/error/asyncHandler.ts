import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** An Express handler that may return a promise. */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => unknown | Promise<unknown>;

/**
 * Forwards a rejected promise to Express's error pipeline.
 *
 * Controllers rely on this instead of try/catch: a thrown AppError reaches the
 * global errorHandler, which owns every status-code decision.
 */
const asyncHandler = (handler: AsyncRequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

// `export =` (not `export default`) so `require('./asyncHandler')` returns the
// function itself. With `export default`, callers would receive
// `{ default: fn }` and Express would be handed a non-function — a boot-time
// crash rather than a compile error.
export = asyncHandler;
