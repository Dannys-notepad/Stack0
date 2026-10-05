import { randomBytes } from 'node:crypto';
import { env } from '../_lib/env.js';
import { subscribers } from '../_lib/firebase.js';
import { transport, confirmationEmail } from '../_lib/email.js';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const email = String((body as any)?.email ?? '').trim().toLowerCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: 'Invalid email' }, { status: 400 });
  }

  const ref = subscribers.doc(email);
  const existing = await ref.get();
  const now = Date.now();

  if (existing.exists && existing.data()?.status === 'verified') {
    return Response.json({ message: 'Check your inbox' });
  }

  const token = randomBytes(32).toString('hex');
  await ref.set({
    status: 'pending',
    subscribedAt: existing.exists ? existing.data()!.subscribedAt : new Date(now),
    verifiedAt: null,
    token,
    tokenExpiresAt: new Date(now + TOKEN_TTL_MS)
  }, { merge: true });

  try {
    await transport.sendMail({
      from: env.smtp.from!,
      to: email,
      subject: 'Confirm your Stack0 subscription',
      html: confirmationEmail(token)
    });
  } catch (err) {
    console.error('Failed to send confirmation', err);
    return Response.json({ error: 'Failed to send confirmation email' }, { status: 500 });
  }

  return Response.json({ message: 'Check your inbox' });
}