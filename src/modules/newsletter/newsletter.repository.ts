import type { NewsLetter } from './newsletter.model.ts'
import { db } from '../../config/firebase.ts'

export const subscribe = async (data: any) => {
  try {
    
    /*const doc = await db
    .collection('newsletter')
    .doc(data.email)
    .get()
    
    if(doc.exists){
      return null
    }*/
    
    const subscribe = await db.collection('newsletter').doc(data.email).set(data)
    
    return subscribe
  } catch (error) {
    console.error('Error subscribing email')
    throw error
  }
}


export const unsubscribe = async (email: string, updates: Partial<NewsLetter>) => {
  try {
    
    const docRef = db
    .collection('newsletter')
    .doc(email)
    
    await docRef.update({
      ...updates
    })
    
    const updatedDoc = await docRef.get()
    
    return updatedDoc.data() as NewsLetter
    
  } catch (error) {
    console.error('Error subscribing email')
    throw error
  }
}

export const findOne = async (email) => {
  try {
    const doc = await db
    .collection('newsletter')
    .doc(email)
    .get()
                        
    if(!doc.exists){
      return null
    }
    
    return doc.data()
  } catch (error) {
    console.error('Error finding email')
    throw error
  }
}
