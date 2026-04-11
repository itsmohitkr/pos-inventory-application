const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const { sendErrorResponse } = require('../utils/helper/responseHelpers');

const methodNotAllowed = (req, res) => {
    return sendErrorResponse(
        res,
        StatusCodes.METHOD_NOT_ALLOWED,
        `Method ${req.method} not allowed for ${req.originalUrl}`,
        ReasonPhrases.METHOD_NOT_ALLOWED
    );
};

module.exports = methodNotAllowed;
