const { StatusCodes, ReasonPhrases } = require('http-status-codes');

class AppError extends Error {
    constructor(statusCode = StatusCodes.INTERNAL_SERVER_ERROR, message = ReasonPhrases.INTERNAL_SERVER_ERROR, options = {}) {
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

const createHttpError = (statusCode, message, options = {}) => {
    return new AppError(statusCode, message, options);
};

module.exports = {
    AppError,
    createHttpError
};
