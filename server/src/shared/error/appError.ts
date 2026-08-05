import { StatusCodes, ReasonPhrases } from 'http-status-codes';

export interface AppErrorOptions {
  /** Overrides the error name; defaults to 'AppError'. */
  name?: string;
  /** Short label sent as the response's `error` field; defaults to the message. */
  error?: string;
  /** Structured detail, e.g. Joi validation issues. */
  details?: unknown;
}

export class AppError extends Error {
  statusCode: number;
  error: string;
  details?: unknown;

  constructor(
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    message: string = ReasonPhrases.INTERNAL_SERVER_ERROR,
    options: AppErrorOptions = {}
  ) {
    super(message);
    this.name = options.name || 'AppError';
    this.statusCode = Number(statusCode) || StatusCodes.INTERNAL_SERVER_ERROR;
    this.error = options.error ?? message;

    if (options.details !== undefined) {
      this.details = options.details;
    }

    Error.captureStackTrace?.(this, AppError);
  }
}

export const createHttpError = (
  statusCode: number,
  message: string,
  options: AppErrorOptions = {}
): AppError => {
  return new AppError(statusCode, message, options);
};
