import { Hono } from 'hono'
import postRoutes from './modules/post/post.route.ts'

const app: any = new Hono()

app.route('/posts', postRoutes)

app.get('/', (c) => {
  return c.json({ message: 'Server is running' })
})


export default app;
