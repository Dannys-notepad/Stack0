import { subscribers } from '../_lib/firebase.js';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const token = String((body as any)?.token ?? '').trim();

  if (!token) {
    return Response.json({ error: 'Missing token' }, { status: 400 });
  }

  const snap = await subscribers.where('token', '==', token).limit(1).get();

  if (snap.empty) {
    return Response.json({ error: 'Invalid token' }, { status: 404 });
  }

  const doc = snap.docs[0];
  await doc.ref.update({
    status: 'unsubscribed',
    token: null,
    tokenExpiresAt: null
  });

  return Response.json({ message: 'Unsubscribed' });
}