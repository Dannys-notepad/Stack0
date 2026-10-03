import { incrementView } from '../_lib/views.js';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const slug = String((body as any)?.slug ?? '').trim();

  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return Response.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    const count = await incrementView(slug);
    return Response.json({ slug, count });
  } catch (err) {
    console.error('Increment failed', err);
    return Response.json({ error: 'Failed to increment' }, { status: 500 });
  }
}
