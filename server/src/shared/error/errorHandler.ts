import type { NextFunction, Request, Response } from 'express';
import { sendErrorResponse } from '../utils/helper/responseHelpers';
import { resolveAppError, type HandledError } from './resolveAppError';
import logger = require('../utils/logger');

const errorHandler = (
  err: HandledError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  const { statusCode, message, errorLabel, details } = resolveAppError(err);

  logger.error({ err, path: req.path, method: req.method }, 'Request error occurred');

  return sendErrorResponse(res, statusCode, message, errorLabel, {
    details,
    meta: process.env.NODE_ENV === 'development' && err?.stack ? { stack: err.stack } : {},
  });
};

export = errorHandler;
