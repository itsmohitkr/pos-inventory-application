import { StatusCodes } from 'http-status-codes';
import { createHttpError } from '../error/appError';

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: 'File is too large. Maximum allowed size is 10MB.',
  LIMIT_FILE_COUNT: 'Too many files uploaded.',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field in upload.',
};

/**
 * Wraps a multer middleware so its errors surface as 400s instead of 500s.
 * MulterError carries a `code` but no `statusCode`, so the global errorHandler
 * would otherwise treat an oversized upload as an unexpected server failure.
 */
const handleUploadErrors = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (!err) return next();

      if (err.name === 'MulterError') {
        const message = MULTER_MESSAGES[err.code] || 'File upload failed.';
        return next(createHttpError(StatusCodes.BAD_REQUEST, message, { error: message }));
      }

      return next(err);
    });
  };
};

export = handleUploadErrors;
