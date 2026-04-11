const { sendErrorResponse } = require('../utils/helper/responseHelpers');

const pathNotFound = (req, res) => {
    return sendErrorResponse(
        res,
        404,
        `Cannot ${req.method} ${req.originalUrl}`,
        'Path Not Found'
    );
};

module.exports = pathNotFound;
