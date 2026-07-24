import { Hono } from 'hono'
import postRoutes from './modules/post/post.route.ts'

const app = new Hono()

app.route('/posts', postRoutes)


export default app;