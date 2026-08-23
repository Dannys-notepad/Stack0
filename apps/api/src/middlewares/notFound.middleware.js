import logger from '#lib/logger.lib.js';

const notFound = (req, res, next) => {

    const err404 = `Route ${req.originalUrl} not found`;

    next({ statusCode: 404, message: err404 });
}

export default notFound;