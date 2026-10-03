import { incrementView } from '../_lib/views.js';

export async function POST(req: Request): Promise<Response> {
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
