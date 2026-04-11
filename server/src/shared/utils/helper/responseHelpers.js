const ResponseBody = require('./responseBody');

const sendSuccessResponse = (res, status = 200, data, message = 'Success', options = {}) => {
    const { format = 'wrapped', meta = {} } = options;

    if (format === 'raw') {
        return res.status(status).json(data);
    }

    if (format === 'merge') {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            return res.status(status).json({
                success: true,
                message,
                ...data,
                ...meta
            });
        }

        if (data === undefined) {
            return res.status(status).json({
                success: true,
                message,
                ...meta
            });
        }

        return res.status(status).json({
            success: true,
            message,
            data,
            ...meta
        });
    }

    return res.status(status).json(ResponseBody.successResponse(message, data, meta));
};

const sendErrorResponse = (res, status = 500, message = 'Error', error, options = {}) => {
    const { details, meta = {} } = options;
    const normalizedError = error ?? (status >= 500 ? 'Internal Server Error' : message);

    return res.status(status).json(
        ResponseBody.errorResponse(message, normalizedError, details, meta)
    );
};

module.exports = {
    sendSuccessResponse,
    sendErrorResponse
};
