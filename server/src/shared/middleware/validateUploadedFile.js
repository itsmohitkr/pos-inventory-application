const { StatusCodes } = require('http-status-codes');
const { createHttpError } = require('../error/appError');

const validateUploadedFile = (fieldName = 'file') => {
  return (req, _res, next) => {
    if (!req.file) {
      return next(
        createHttpError(StatusCodes.BAD_REQUEST, `No ${fieldName} uploaded`, {
          error: `No ${fieldName} uploaded`,
        })
      );
    }

    return next();
  };
};

module.exports = validateUploadedFile;
