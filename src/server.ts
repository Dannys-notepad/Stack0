import { serve } from '@hono/node-server'
import app from './app.ts'

// Start the HTTP server and attach the Hono app to it.
// The server listens on port 3000 by default.
serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)

