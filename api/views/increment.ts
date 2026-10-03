import type { VercelRequest, VercelResponse } from "@vercel/node";
import { incrementView } from "../_lib/views.ts";

export default async function handler (req: VercelRequest, res: VercelResponse) {
    if (req.method != 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const slug = String(req.body?.slug ?? '').trim()

    if (!slug || !/^[a-z0-1]+$/i.test(slug)) {
        return res.status(400).json({ error: 'Invalid slug' })
    }

    try {
        const count = await incrementView(slug)
        return res.status(200).json({ slug, count })
    } catch (error) {
        return res.status(500).json({ error: 'Failed to increment' })
    }
}
