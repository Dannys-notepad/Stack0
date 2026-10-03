import { views } from '../_lib/views.js';

export async function GET(req: Request): Promise<Response> {
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