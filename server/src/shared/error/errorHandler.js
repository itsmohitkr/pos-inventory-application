const { sendErrorResponse } = require('../utils/helper/responseHelpers');

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = Number(err?.statusCode || err?.status || 500);
    const message = err?.message || (statusCode >= 500 ? 'Internal Server Error' : 'Request failed');
    const errorLabel = err?.error || err?.name || (statusCode >= 500 ? 'Internal Server Error' : 'Request Failed');

    console.error('SERVER ERROR:', err);

    return sendErrorResponse(res, statusCode, message, errorLabel, {
        details: err?.details,
        meta: process.env.NODE_ENV === 'development' && err?.stack
            ? { stack: err.stack }
            : {}
    });
};

module.exports = errorHandler;
