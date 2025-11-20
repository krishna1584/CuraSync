const logger = (req, res, next) => {
    const timestamp = new Date().toLocaleString();
    //tLocal string is for more readable format
    console.log(`${timestamp} ${req.method} ${req.url}`);
    // const timestamp = new Date().toISOString();
    // console.log(${timestamp} ${req.method} ${req.url});
    next();
};

module.exports = logger;