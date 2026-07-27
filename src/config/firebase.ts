import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import env from './env.ts'

// Initialize Firebase only once.
// This prevents duplicate app initialization when the module is imported more than once.
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

// Export the Firestore database instance so other modules can read and write data.
export const db = getFirestore()
