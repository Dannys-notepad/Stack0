import { Context } from 'hono'
import * as service from './newsletter.service.ts'

export const subscribeEmail = async (c: Context) => {
  const email = await c.req.param('email')
  try {
    const subscribe = await service.subscribeEmail(email)
    const { message, data, status } = subscribe
    return c.json({ message, data }, status)
  } catch (error) {
    console.error('Error subscribing reader', error)
    return c.json({ message:'Server Error' }, 500)
  }
}

export const unsubscribeEmail = async (c: Context) => {
  const email = await c.req.param('email')
  //onsole.log(email)
  try {
    const unsubscribe = await service.unsubscribeEmail(email)
    const { message, data, status } = unsubscribe
    return c.json({ message, data }, status)
  } catch (error) {
    console.error('Error subscribing reader', error)
    return c.json({ message:'Server Error' }, 500)
  }
}
