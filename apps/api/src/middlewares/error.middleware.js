import response from '#lib/response.lib.js'
import logger from '#lib/logger.lib.js'

const errorhandler = (err, req, res, next) => {

    const statusCode = err.statusCode || 500
    const message = statusCode === 500 ? 'Internal Server Error' :  err.message || 'Internal Server Error'
    const logLevel = statusCode === 404 ? 'warn' : 'error'

    logger()[logLevel](message, { error: err, path: req.path, method: req.method });

    return response.error(res, message, statusCode)
}

export default errorhandler