import type { RequestHandler } from 'express';

/**
 * Defers loading a router module until its first request.
 *
 * The require() is intentional and stays dynamic: routers are resolved on
 * first request rather than at module load, which is what lets index.ts
 * open the port before the whole domain layer is pulled in. Only the types
 * are tightened here — the router was previously `any`, so a non-router
 * export would have failed at request time rather than at compile time.
 */
export const lazyLoad =
  (routerPath: string): RequestHandler =>
  (req, res, next) => {
    const resolvedRouter = require(routerPath) as RequestHandler;
    return resolvedRouter(req, res, next);
  };
