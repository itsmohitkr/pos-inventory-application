import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import toAppError = require('./toAppError');
import type { AppError } from './appError';

/** Anything reaching the error pipeline: an AppError, a Prisma error, or a bare Error. */
export type HandledError = Partial<AppError> & {
  status?: number;
  stack?: string;
  code?: string;
};

export interface ResolvedAppError {
  statusCode: number;
  message: string;
  errorLabel: string;
  details: unknown;
}

/**
 * Pure derivation of (statusCode, message, errorLabel, details) from a caught
 * error — extracted from errorHandler.ts so IPC handlers can resolve an error
 * the exact same way the Express error pipeline does, without needing a
 * Request/Response. errorHandler.ts calls this too; behavior is unchanged.
 */
export const resolveAppError = (err: HandledError): ResolvedAppError => {
  // Errors that already carry a status (AppError, or anything with `status`) pass
  // through untouched. Raw Prisma errors (P2002/P2003/P2025) have no status, so
  // toAppError maps them centrally — this is what lets services throw typed errors
  // and controllers/IPC handlers stay free of per-domain error mapping.
  const appError: HandledError = err?.statusCode || err?.status ? err : toAppError(err);

  const statusCode = Number(
    appError?.statusCode || appError?.status || StatusCodes.INTERNAL_SERVER_ERROR
  );
  const message =
    appError?.message ||
    (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR
      ? ReasonPhrases.INTERNAL_SERVER_ERROR
      : 'Request failed');
  const errorLabel =
    appError?.error ||
    appError?.name ||
    (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR
      ? ReasonPhrases.INTERNAL_SERVER_ERROR
      : 'Request Failed');

  return {
    statusCode,
    message,
    errorLabel,
    details: appError?.details ?? err?.details,
  };
};
