import type { VercelRequest, VercelResponse } from "@vercel/node";
import { views } from "../_lib/views";

export default async function handler (req: VercelRequest, res: VercelResponse) {
    if (req.method != 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const snap = await views.get()
        const counts: Record<string, number> = {}

        snap.forEach((doc) => {
            counts[doc.id] = doc.data().count ?? 0
        })

        // Cache for 5 min as views do not need to be counted in real time
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
        return res.status(200).json(counts)
    } catch (error) {
        console.error('Fetch failed', error)
        return res.status(500).json({ error: 'Failed to fetch counts'})
    }
}