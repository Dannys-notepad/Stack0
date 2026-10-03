import { views } from '../_lib/views.js';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const snap = await views.get();
  const counts: Record<string, number> = {};
  snap.forEach((doc) => {
    counts[doc.id] = doc.data().count ?? 0;
  });

  return Response.json(counts, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });
}