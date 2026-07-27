import { StatusCodes } from 'http-status-codes';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createHttpError } from '../error/appError';

const validateUploadedFile = (fieldName = 'file'): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(
        createHttpError(StatusCodes.BAD_REQUEST, `No ${fieldName} uploaded`, {
          error: `No ${fieldName} uploaded`,
        })
      );
    }

    return next();
  };
};

export = validateUploadedFile;
