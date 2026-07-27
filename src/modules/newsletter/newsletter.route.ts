import { Hono } from 'hono'
import * as controller from './newsletter.controller.ts'

// This router handles newsletter subscription actions.
const app = new Hono()

// Subscribe a new email address.
app.post('/:email/subscribe', controller.handleSubscribeEmailAddress)

// Unsubscribe an existing email address.
app.patch('/:email/unsubscribe', controller.handleUnsubscribeEmailAddress)

export default app
