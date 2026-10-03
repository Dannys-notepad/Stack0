import { VercelRequest, VercelReponse } from '@vercel/node'
import { subscribers } from '../_lib/firebase.ts'

export default async function handler(req: VercelRequest, res: VercelReponse) {
    const token = String(req.query.token ?? '').trim()

    if (!token) {
        return res.redirect(302, '/confirm-error')
    }

    // Find subscriber with this token
    const snap = await subscribers.where('token', '==', token).limit(1).get()

    if (snap.empty) {
        return res.redirect(302, '/confirm-error')
    }

    const doc = snap.docs[0]
    const data = doc.data()

    if (!data.expiresAt || data.expiresAt.toDate().getTime() < Date.now()) {
        return res.redirect(302, '/confirm-error')
    }

    // Mark verified. clear the token
    await doc.ref.update({
        status: 'verified',
        verifiedAt: new Date(),
        token: null,
        expiresAt: null
    })

    return res.redirect(302, '/confirmed')
}