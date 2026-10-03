import { subscribers } from '../_lib/firebase.js';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get('token')?.trim() ?? '';

  if (!token) {
    return Response.redirect(new URL('/confirm-error', url.origin), 302);
  }

  const snap = await subscribers.where('token', '==', token).limit(1).get();

  if (snap.empty) {
    return Response.redirect(new URL('/confirm-error', url.origin), 302);
  }

  const doc = snap.docs[0];
  const data = doc.data();

  if (!data.tokenExpiresAt || data.tokenExpiresAt.toDate().getTime() < Date.now()) {
    return Response.redirect(new URL('/confirm-error', url.origin), 302);
  }

  await doc.ref.update({
    status: 'verified',
    verifiedAt: new Date(),
    token: null,
    tokenExpiresAt: null
  });

  return Response.redirect(new URL('/confirmed', url.origin), 302);
}