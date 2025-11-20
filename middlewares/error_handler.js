const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;

    res.status(statusCode).send({
        success: false,
        error: statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong',
        message: err.message || 'Internal Server Error'
    });
};

module.exports = errorHandler;