import { Hono } from 'hono'
import postRoutes from './modules/post/post.route.ts'
import newsletterRoutes from './modules/newsletter/newsletter.route.ts'

const app = new Hono()

app.route('/api/posts', postRoutes)
app.route('/api/newsletter', newsletterRoutes)

app.get('/', (c) => {
  return c.json({ message: 'Server is running' })
})


export default app;
