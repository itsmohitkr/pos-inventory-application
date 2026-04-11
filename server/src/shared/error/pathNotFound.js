const pathNotFound = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Path Not Found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
};

module.exports = pathNotFound;
