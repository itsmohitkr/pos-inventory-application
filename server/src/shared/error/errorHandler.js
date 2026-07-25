const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const { sendErrorResponse } = require('../utils/helper/responseHelpers');
const toAppError = require('./toAppError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Errors that already carry a status (AppError, or anything with `status`) pass
  // through untouched. Raw Prisma errors (P2002/P2003/P2025) have no status, so
  // toAppError maps them centrally — this is what lets services throw typed errors
  // and controllers stay free of per-domain error mapping.
  const appError = err?.statusCode || err?.status ? err : toAppError(err);

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

module.exports = errorHandler;
