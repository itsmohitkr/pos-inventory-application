const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = Number(err?.statusCode || err?.status || 500);
    const fallbackError = statusCode >= 500 ? 'Internal Server Error' : 'Request Failed';

    console.error('SERVER ERROR:', err);

    res.status(statusCode).json({
        success: false,
        error: err?.name || fallbackError,
        message: err?.message || 'Unexpected server error',
        ...(process.env.NODE_ENV === 'development' && err?.stack
            ? { stack: err.stack }
            : {})
    });
};

module.exports = errorHandler;
