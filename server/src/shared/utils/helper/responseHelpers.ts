import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import type { Response } from 'express';
import ResponseBody = require('./responseBody');

/** How the payload is shaped on the wire. */
export type ResponseFormat = 'wrapped' | 'merge' | 'raw';

export interface SuccessOptions {
  format?: ResponseFormat;
  meta?: Record<string, unknown>;
}

export interface ErrorOptions {
  details?: unknown;
  meta?: Record<string, unknown>;
}

export const sendSuccessResponse = (
  res: Response,
  status: number = StatusCodes.OK,
  data?: unknown,
  message: string = ReasonPhrases.OK,
  options: SuccessOptions = {}
) => {
  const { format = 'wrapped', meta = {} } = options;

  if (status === StatusCodes.NO_CONTENT) {
    return res.status(status).send();
  }

  if (format === 'raw') {
    return res.status(status).json(data);
  }

  if (format === 'merge') {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return res.status(status).json({
        success: true,
        message,
        ...data,
        ...meta,
      });
    }

    if (data === undefined) {
      return res.status(status).json({
        success: true,
        message,
        ...meta,
      });
    }

    return res.status(status).json({
      success: true,
      message,
      data,
      ...meta,
    });
  }

  return res.status(status).json(ResponseBody.successResponse(message, data, meta));
};

export const sendErrorResponse = (
  res: Response,
  status: number = StatusCodes.INTERNAL_SERVER_ERROR,
  message: string = ReasonPhrases.INTERNAL_SERVER_ERROR,
  error?: unknown,
  options: ErrorOptions = {}
) => {
  const { details, meta = {} } = options;
  const normalizedError =
    error ??
    (status >= StatusCodes.INTERNAL_SERVER_ERROR ? ReasonPhrases.INTERNAL_SERVER_ERROR : message);

  return res
    .status(status)
    .json(ResponseBody.errorResponse(message, normalizedError, details, meta));
};

