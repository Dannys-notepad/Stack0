import type { NewsLetter } from './newsletter.model.ts'
import { db } from '../../config/firebase.ts'

// Create a new newsletter subscription record in Firestore.
export const createSubscription = async (data: NewsLetter): Promise<NewsLetter> => {
  try {
    await db.collection('newsletter').doc(data.email).set(data)
    return data
  } catch (error) {
    console.error('Error creating newsletter subscription', error)
    throw error
  }
}

// Update the subscription status for an existing newsletter record.
export const updateSubscriptionStatus = async (
  email: string,
  updates: Partial<NewsLetter>
): Promise<NewsLetter | null> => {
  try {
    const docRef = db.collection('newsletter').doc(email)
    await docRef.update({ ...updates })

    const updatedDoc = await docRef.get()
    return updatedDoc.exists ? (updatedDoc.data() as NewsLetter) : null
  } catch (error) {
    console.error('Error updating newsletter subscription status', error)
    throw error
  }
}

// Find one newsletter record by email address.
export const findSubscriptionByEmail = async (email: string): Promise<NewsLetter | null> => {
  try {
    const doc = await db.collection('newsletter').doc(email).get()

    if (!doc.exists) {
      return null
    }

    return doc.data() as NewsLetter
  } catch (error) {
    console.error('Error finding newsletter subscription', error)
    throw error
  }
}
