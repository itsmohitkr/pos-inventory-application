const { StatusCodes } = require('http-status-codes');
const { sendErrorResponse } = require('../utils/helper/responseHelpers');

const pathNotFound = (req, res) => {
  return sendErrorResponse(
    res,
    StatusCodes.NOT_FOUND,
    `Cannot ${req.method} ${req.originalUrl}`,
    'Path Not Found'
  );
};

module.exports = pathNotFound;
