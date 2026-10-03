import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { env } from './env.js'

const app = getApps().length === 0
    ? initializeApp({
        credential: cert({
            projectId: env.firebase.projectId!,
            clientEmail: env.firebase.clientEmail!,
            privateKey: env.firebase.privateKey!
        })
    })
    : getApps()[0]

export const db = getFirestore(app)
export const subscribers = db.collection('subscribers')