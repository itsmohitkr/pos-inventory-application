const { sendErrorResponse } = require('../utils/helper/responseHelpers');

const methodNotAllowed = (req, res) => {
    return sendErrorResponse(
        res,
        405,
        `Method ${req.method} not allowed for ${req.originalUrl}`,
        'Method Not Allowed'
    );
};

module.exports = methodNotAllowed;
