import type { NewsLetter } from './newsletter.model.ts'
import * as newsletterRepo from './newsletter.repository.ts'
import { AppError, fail, ok, type ApiResponse } from '../../lib/http.ts'

// A simple email validation pattern.
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Subscribe a new email address to the newsletter.
export const subscribeEmailAddress = async (email: string): Promise<ApiResponse<NewsLetter | null>> => {
  if (!email) {
    return fail('Email not provided in the url parameter', 400)
  }

  if (!emailRegex.test(email)) {
    return fail('The email provided is invalid', 400)
  }

  try {
    const emailExists = await newsletterRepo.findSubscriptionByEmail(email)
    if (emailExists && emailExists.status === 'subscribed') {
      return fail('This email is already subscribed', 409)
    }

    if(emailExists && emailExists.status === 'unsubscribed') {
      const now = new Date().toISOString()
      const data: Pick<NewsLetter, 'status' | 'updatedAt'> = {
        status: 'subscribed',
        updatedAt: now,
      }

      const resubscribe = await newsletterRepo.updateSubscriptionStatus(email, data)

      return ok('Email has been successfully resubscribed to the newsletter', resubscribe)
    }

    const now = new Date().toISOString()
    const data: NewsLetter = {
      email,
      status: 'subscribed',
      createdAt: now,
      updatedAt: now,
    }

    const subscribe = await newsletterRepo.createSubscription(data)

    return ok('Email has been successfully subscribed to the newsletter', subscribe, 201)
  } catch (error) {
    console.error('Error subscribing email', error)
    throw new AppError('Could not subscribe email', 500, error)
  }
}

// Unsubscribe an email address from the newsletter.
export const unsubscribeEmailAddress = async (email: string): Promise<ApiResponse<NewsLetter | null>> => {
  if (!email) {
    return fail('Email not provided in the url parameter', 400)
  }

  if (!emailRegex.test(email)) {
    return fail('The email provided is invalid', 400)
  }

  try {
    const emailExists = await newsletterRepo.findSubscriptionByEmail(email)
    if (!emailExists) {
      return fail('This email does not exist', 404)
    }

    if (emailExists.status === 'unsubscribed') {
      return fail('This email is already unsubscribed', 409)
    }

    const now = new Date().toISOString()
    const data: Pick<NewsLetter, 'status' | 'updatedAt'> = {
      status: 'unsubscribed',
      updatedAt: now,
    }

    const unsubscribe = await newsletterRepo.updateSubscriptionStatus(email, data)

    return ok('Email has been successfully unsubscribed from the newsletter', unsubscribe)
  } catch (error) {
    console.error('Error unsubscribing email', error)
    throw new AppError('Could not unsubscribe email', 500, error)
  }
}

