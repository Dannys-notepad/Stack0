import { Hono } from 'hono'
import postRoutes from './modules/post/post.route.ts'
import newsletterRoutes from './modules/newsletter/newsletter.route.ts'

// Create the main Hono app instance.
// This is the central place where all route groups are registered.
const app = new Hono()

// Mount the post-related endpoints under /api/posts.
app.route('/api/posts', postRoutes)

// Mount the newsletter-related endpoints under /api/newsletter.
app.route('/api/newsletter', newsletterRoutes)

// A simple health-check endpoint for local development.
app.get('/', (c) => {
  return c.json({ message: 'Server is running' })
})

export default app;
