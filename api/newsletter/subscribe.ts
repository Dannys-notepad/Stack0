import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';
import { subscribers } from '../_lib/firebase.ts';
import { transport, confirmationEmailTemplate } from '../_lib/email.ts';
import { truncate } from 'node:fs';

const TOKEN_TTL_MS = 7*24*60*60*1000; // 7 days

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const email = String(req.body?.email).trim().toLowerCase();


    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    const ref = subscribers.doc(email);
    const existing = await ref.get();
    const now = Date.now();

    // Already verified
    if (existing.exists && existing.data()?.verified) {
        return res.status(200).json({ message: 'Already subscribed' });
    }

    // Generate a confirmation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = now + TOKEN_TTL_MS;

    // Save the subscriber with the confirmation token
    await ref.set({
        email,
        status: 'pending',
        subscribedAt: existing.exists ? existing.data()!.subscribedAt : new Date(now),
        verifiedAt: null,
        token,
        expiresAt
    }, { merge: true});

    // Send confirmation email
    try {
        await transport.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Confirm your Stack0 newsletter subscription',
            html: confirmationEmailTemplate(token)
        });
    } catch (error) {
        console.error('Failed to send confirmation', error)
        return res.status(500).json({ error: 'Failed to send confirmation email' })
    }

    return res.status(200).json({ message: 'Subscription requested, check your inbox' });
}