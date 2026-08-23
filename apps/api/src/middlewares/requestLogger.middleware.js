const reqLogger = (req, res, next) => {
    const start = Date.now();
    const { method, url, ip } = req;
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[Request] ${ip} ${method} ${url} - Status: ${res.statusCode} - ${duration}ms`);
    });
    
    next();
};

export default reqLogger;