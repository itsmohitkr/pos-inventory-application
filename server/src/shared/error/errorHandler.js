const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const { sendErrorResponse } = require('../utils/helper/responseHelpers');

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = Number(err?.statusCode || err?.status || StatusCodes.INTERNAL_SERVER_ERROR);
    const message = err?.message || (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR ? ReasonPhrases.INTERNAL_SERVER_ERROR : 'Request failed');
    const errorLabel = err?.error || err?.name || (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR ? ReasonPhrases.INTERNAL_SERVER_ERROR : 'Request Failed');

    console.error('SERVER ERROR:', err);

    return sendErrorResponse(res, statusCode, message, errorLabel, {
        details: err?.details,
        meta: process.env.NODE_ENV === 'development' && err?.stack
            ? { stack: err.stack }
            : {}
    });
};

module.exports = errorHandler;
