import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import { createHttpError, type AppError } from './appError';

/** Per-domain hints for mapping an untyped error onto an HTTP status. */
interface ToAppErrorOptions {
  defaultMessage?: string;
  defaultStatus?: number;
  conflictMessage?: string;
  foreignKeyMessage?: string;
  notFoundMessage?: string;
  notFoundMessages?: string[];
  badRequestMessages?: string[];
}

/** Shape of the errors this maps from: Prisma errors and plain Errors. */
type UnknownError = {
  message?: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
};

const includesAny = (message: string, patterns: string[] = []): boolean => {
  return patterns.some((pattern) => message.includes(pattern));
};

const toAppError = (error: UnknownError, options: ToAppErrorOptions = {}): AppError => {
  if (error?.statusCode) {
    return error as AppError;
  }

  const message = error?.message || options.defaultMessage || ReasonPhrases.INTERNAL_SERVER_ERROR;

  if (error?.code === 'P2002') {
    const conflictMessage = options.conflictMessage || message;
    return createHttpError(StatusCodes.CONFLICT, conflictMessage, {
      error: conflictMessage,
    });
  }

  if (error?.code === 'P2003' || /foreign key/i.test(message)) {
    const conflictMessage = options.foreignKeyMessage || message;
    return createHttpError(StatusCodes.CONFLICT, conflictMessage, {
      error: conflictMessage,
    });
  }

  if (error?.code === 'P2025' || includesAny(message, options.notFoundMessages)) {
    const notFoundMessage = options.notFoundMessage || message;
    return createHttpError(StatusCodes.NOT_FOUND, notFoundMessage, {
      error: notFoundMessage,
    });
  }

  if (includesAny(message, options.badRequestMessages)) {
    return createHttpError(StatusCodes.BAD_REQUEST, message, {
      error: message,
    });
  }

  const statusCode = options.defaultStatus || StatusCodes.INTERNAL_SERVER_ERROR;

  return createHttpError(statusCode, message, {
    error: message,
    details: error?.details,
  });
};

export = toAppError;
