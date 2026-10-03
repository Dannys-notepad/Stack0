import { db } from './firebase.ts'

export const views = db.collection('views')

export async function incrementView (slug: string): Promise<numner> {
    const ref = views.doc(slug)
    const snap = await ref.get()

    if (!snap.exists) {
        await ref.set({ count: 1, updatedAt: new Date() })
        return 1
    }

    await ref.update({
        count: (snap.data()!.count ?? 0) + 1,
        updatedAt: new Date()
    })

    return (snap.data()!.count ?? 0) + 1
}