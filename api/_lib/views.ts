import { db } from './firebase.js'

export const views = db.collection('views')

export async function incrementView (slug: string): Promise<number> {
    const ref = views.doc(slug)
    return db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref)
        const count = (snap.data()?.count ?? 0) + 1
        transaction.set(ref, {
            count,
            updatedAt: new Date()
        })
        return count
    })
}