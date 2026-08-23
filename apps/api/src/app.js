import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

// custom imports
import errorhandler from '#middlewares/error.middleware.js';
import err404 from '#middlewares/notFound.middleware.js';
import reqLogger from '#middlewares/requestLogger.middleware.js';

// custom imports
import postRoute from '#modules/posts/post.route.js';

const app = express()

app.use(reqLogger)

app.use(express.json())
app.use(express.urlencoded({ extended:false }))
app.use(helmet())
app.use(cors())

// Custom routes
app.use('/api/posts', postRoute)

// Handle 404 errors
app.use(err404)

// custom error handler
app.use(errorhandler)

export default app