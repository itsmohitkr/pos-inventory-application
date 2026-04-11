class AppError extends Error {
    constructor(statusCode, message, options = {}) {
        super(message);
        this.name = options.name || 'AppError';
        this.statusCode = statusCode;
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
