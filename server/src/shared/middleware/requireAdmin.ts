import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createHttpError } from '../error/appError';
import { resolveToken } from '../../domains/auth/adminTokens';

/** Header carrying the elevation token minted by login / verify-admin. */
export const ADMIN_TOKEN_HEADER = 'x-admin-token';

/**
 * Rejects requests that do not carry a live admin elevation token.
 *
 * Applied only to the routes that grant durable privilege — creating,
 * modifying and deleting users. Everything else on this API remains
 * unauthenticated by design (the server is localhost-only); these three are
 * different because a write here survives logout, restart and reinstall.
 *
 * The resolved admin is attached to `res.locals` rather than `req.user`, which
 * would require augmenting Express's Request type globally for one field.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.get(ADMIN_TOKEN_HEADER);
  const entry = resolveToken(header ?? undefined);

  if (!entry) {
    // 401 rather than 403: the caller may simply need to re-verify, and the
    // client uses this to reopen the elevation prompt.
    return next(
      createHttpError(StatusCodes.UNAUTHORIZED, 'Admin verification required', {
        error: 'Admin verification required',
      })
    );
  }

  if (entry.role !== 'admin') {
    return next(
      createHttpError(StatusCodes.FORBIDDEN, 'Admin privileges required', {
        error: 'Admin privileges required',
      })
    );
  }

  res.locals.adminUser = entry;
  return next();
};
