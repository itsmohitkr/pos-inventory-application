import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import type { NextFunction, Request, Response } from 'express';
import { sendErrorResponse } from '../utils/helper/responseHelpers';
import toAppError = require('./toAppError');
import logger = require('../utils/logger');
import type { AppError } from './appError';

/** Anything reaching the error pipeline: an AppError, a Prisma error, or a bare Error. */
type HandledError = Partial<AppError> & {
  status?: number;
  stack?: string;
  code?: string;
};

const errorHandler = (
  err: HandledError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  // Errors that already carry a status (AppError, or anything with `status`) pass
  // through untouched. Raw Prisma errors (P2002/P2003/P2025) have no status, so
  // toAppError maps them centrally — this is what lets services throw typed errors
  // and controllers stay free of per-domain error mapping.
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

  logger.error({ err, path: req.path, method: req.method }, 'Request error occurred');

  return sendErrorResponse(res, statusCode, message, errorLabel, {
    details: appError?.details ?? err?.details,
    meta: process.env.NODE_ENV === 'development' && err?.stack ? { stack: err.stack } : {},
  });
};

export = errorHandler;
