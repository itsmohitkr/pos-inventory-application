const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const { createHttpError } = require('./appError');

const includesAny = (message, patterns = []) => {
  return patterns.some((pattern) => message.includes(pattern));
};

const toAppError = (error, options = {}) => {
  if (error?.statusCode) {
    return error;
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

module.exports = toAppError;
