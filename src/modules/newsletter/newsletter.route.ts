import { Hono } from 'hono'
import * as controller from './newsletter.controller.ts'

const app = new Hono()

app.post('/:email/subscribe', controller.subscribeEmail)
app.patch('/:email/unsubscribe', controller.unsubscribeEmail)

export default app
