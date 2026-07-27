import type { Context } from 'hono'
import * as service from './newsletter.service.ts'
import { AppError } from '../../lib/http.ts'

// A small helper to return consistent JSON responses from the controller.
const sendJson = (c: Context, body: unknown, status: number) => {
  const httpStatus = status as 200 | 201 | 400 | 404 | 409 | 500
  return c.json(body, httpStatus)
}

// Read the email from the URL and pass it to the service layer.
export const handleSubscribeEmailAddress = async (c: Context) => {
  const email = c.req.param('email') ?? ''

  try {
    const subscribe = await service.subscribeEmailAddress(email)
    const { message, data, status } = subscribe
    return sendJson(c, { message, data }, status)
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Server error', 500, error)
    return sendJson(c, { error: appError.message }, appError.status)
  }
}

// Read the email from the URL and pass it to the service layer for unsubscription.
export const handleUnsubscribeEmailAddress = async (c: Context) => {
  const email = c.req.param('email') ?? ''

  try {
    const unsubscribe = await service.unsubscribeEmailAddress(email)
    const { message, data, status } = unsubscribe
    return sendJson(c, { message, data }, status)
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Server error', 500, error)
    return sendJson(c, { error: appError.message }, appError.status)
  }
}
