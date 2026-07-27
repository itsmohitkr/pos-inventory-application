import { StatusCodes } from 'http-status-codes';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createHttpError } from '../error/appError';

const MULTER_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: 'File is too large. Maximum allowed size is 10MB.',
  LIMIT_FILE_COUNT: 'Too many files uploaded.',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field in upload.',
};

/** The subset of multer's error shape this wrapper reads. */
interface MulterError extends Error {
  code?: string;
}

/**
 * Express's NextFunction also accepts the strings 'route' and 'router', so the
 * callback is typed as unknown and narrowed here rather than claiming an Error.
 */
const isMulterError = (err: unknown): err is MulterError =>
  typeof err === 'object' &&
  err !== null &&
  (err as { name?: unknown }).name === 'MulterError';

/**
 * Wraps a multer middleware so its errors surface as 400s instead of 500s.
 * MulterError carries a `code` but no `statusCode`, so the global errorHandler
 * would otherwise treat an oversized upload as an unexpected server failure.
 */
const handleUploadErrors = (uploadMiddleware: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, (err?: unknown) => {
      if (!err) return next();

      if (isMulterError(err)) {
        const message = (err.code && MULTER_MESSAGES[err.code]) || 'File upload failed.';
        return next(createHttpError(StatusCodes.BAD_REQUEST, message, { error: message }));
      }

      return next(err);
    });
  };
};

export = handleUploadErrors;
