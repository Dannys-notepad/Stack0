import { VercelRequest, VercelResponse } from '@vercel/node'
import { subscribers } from '../_lib/firebase.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const token = String(req.body?.token ?? '').trim()

    if (!token) {
        return res.status(400).json({ error: 'Missing token' })
    }

    const snap = await subscribers.where('toekn', '==', token).limit(1).get()

    if (snap.empty) {
        return res.status(404).json({ error: 'Invalid token' })
    }

    const doc = snap.docs[0]
    await doc.ref.update({
        status: 'unsubscribe',
        token: null,
        expiresAt: null
    })

    return res.status(200).json({ message: 'Unsubscribed' })
}