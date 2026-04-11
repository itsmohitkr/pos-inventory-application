const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const ResponseBody = require('./responseBody');

const sendSuccessResponse = (
  res,
  status = StatusCodes.OK,
  data,
  message = ReasonPhrases.OK,
  options = {}
) => {
  const { format = 'wrapped', meta = {} } = options;

  if (status === StatusCodes.NO_CONTENT) {
    return res.status(status).send();
  }

  if (format === 'raw') {
    return res.status(status).json(data);
  }

  if (format === 'merge') {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return res.status(status).json({
        success: true,
        message,
        ...data,
        ...meta,
      });
    }

    if (data === undefined) {
      return res.status(status).json({
        success: true,
        message,
        ...meta,
      });
    }

    return res.status(status).json({
      success: true,
      message,
      data,
      ...meta,
    });
  }

  return res.status(status).json(ResponseBody.successResponse(message, data, meta));
};

const sendErrorResponse = (
  res,
  status = StatusCodes.INTERNAL_SERVER_ERROR,
  message = ReasonPhrases.INTERNAL_SERVER_ERROR,
  error,
  options = {}
) => {
  const { details, meta = {} } = options;
  const normalizedError =
    error ??
    (status >= StatusCodes.INTERNAL_SERVER_ERROR ? ReasonPhrases.INTERNAL_SERVER_ERROR : message);

  return res
    .status(status)
    .json(ResponseBody.errorResponse(message, normalizedError, details, meta));
};

module.exports = {
  sendSuccessResponse,
  sendErrorResponse,
};
