const methodNotAllowed = (req, res) => {
    res.status(405).json({
        success: false,
        error: 'Method Not Allowed',
        message: `Method ${req.method} not allowed for ${req.originalUrl}`
    });
};

module.exports = methodNotAllowed;
