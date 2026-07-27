import type { NewsLetter } from './newsletter.model.ts'
import * as repo from './newsletter.repository.ts'

export const subscribeEmail = async (email) => {
  
  if(!email) {
    return {
      message: 'email not provided in the url parameter',
      data: null,
      status: 400
    }
  }
  
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
      return {
        message: 'the email provided is invalid',
        data: null,
        status: 400
      }
    }
    
    const emailExists = await repo.findOne(email)
    if(emailExists){
      return {
        message: 'this email is already subscribed',
        data: null,
        status: 409
      }
    }
    
    const now = new Date().toISOString()
    const data: NewsLetter = {
      email,
      status: 'subscribed',
      createdAt: now,
      updatedAt: now
    }
      
    const subscribe = await repo.subscribe(data)
      
    return {
      message: 'Email has been successfully subscribed to the newsletter',
      data: subscribe,
      status: 201  
    }
    
  } catch (error) {
    console.error('Error subscribing email')
    throw error
  }
}

export const unsubscribeEmail = async (email) => {
  
  if(!email) {
    return {
      message: 'email not provided in the url parameter',
      data: null,
      status: 400
    }
  }
  
  try {
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
        return {
          message: 'the email provided is invalid',
          data: null,
          status: 400
      }
    }
      
    const emailExists = await repo.findOne(email)
    if(!emailExists){
      return {
        message: 'this email does not exist',
        data: null,
        status: 404
      }
    }
    
    if(emailExists.status === 'unsubscribed'){
      return {
        message: 'this email is already unsubscribed',
        data: null,
        status: 409
      }
    }
      
    const now = new Date().toISOString()
    const data: NewsLetter = {
      status: 'unsubscribed',
      updatedAt: now
    }
      
    const unsubscribe = await repo.unsubscribe(email, data)
    //console.log(unsubscribe)
    
    
    return {
      message: 'Email has been successfully unsubscribed from the newsletter',
      data: unsubscribe,
      status: 200
    }
    
  } catch (error) {
    console.error('Error unsubscribing email')
    throw error
  }
}

