const handleDuplicateKeyError = (err, res) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} - ${value}. Please use another value.`;
    res.status(409).json({
        status: 'fail',
        message: message
    });
};

module.exports = (err, req, res, next) => {
    if (err.code && err.code === 11000) {
        return handleDuplicateKeyError(err, res);
    }

    // Generic error handler
    console.error('ERROR 💥', err);
    res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
    });
};
