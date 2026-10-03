// ============================================
// send-newsletter.js
// Local-only script. Never deployed.
//
// Usage:
//   node scripts/send-newsletter.js              send to all verified
//   node scripts/send-newsletter.js --dry-run    print without sending
//   node scripts/send-newsletter.js --to me@x.com  send only to one email
//
// Reads credentials from .env at project root.
// ============================================

import { env } from '../api/_lib/env.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ---------- CLI flags ----------
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const singleTo = (() => {
  const i = args.indexOf('--to');
  return i >= 0 ? args[i + 1] : null;
})();

// ---------- Paths ----------
const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(__dirname, '..', 'emails', 'newsletter.html');

// ---------- Firebase ----------
const firebaseApp = initializeApp({
  credential: cert({
    projectId: env.firebase.projectId,
    clientEmail: env.firebase.clientEmail,
    privateKey: env.firebase.privateKey
  })
});
const db = getFirestore(firebaseApp);
const subscribers = db.collection('subscribers');

// ---------- SMTP ----------
const transport = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass
  }
});

// ---------- Template rendering ----------
function renderTemplate(html, vars) {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (vars[key] === undefined) {
      console.warn(`Template variable {{${key}}} has no value — leaving as-is.`);
      return `{{${key}}}`;
    }
    return vars[key];
  });
}

// ---------- Generate a fresh unsubscribe token ----------
function newToken() {
  return randomBytes(32).toString('hex');
}

// ---------- Recipients ----------
async function getRecipients() {
  if (singleTo) return [singleTo];

  const snap = await subscribers.where('status', '==', 'verified').get();
  return snap.docs.map((d) => d.id); // doc id is the email
}

// ---------- Send to one recipient ----------
async function sendTo(email, html) {
  await transport.sendMail({
    from: env.smtp.from,
    to: email,
    subject: 'Stack0 — What shipped this month',
    html
  });
}

// ---------- Main ----------
async function main() {
  const template = readFileSync(templatePath, 'utf8');
  const recipients = await getRecipients();

  if (recipients.length === 0) {
    console.log('No verified subscribers. Nothing to send.');
    return;
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}Sending to ${recipients.length} recipient(s).`);

  for (const email of recipients) {
    // Generate a fresh unsubscribe token for this recipient.
    const token = newToken();

    // If this is a dry run, don't write the token back.
    if (!dryRun) {
      await subscribers.doc(email).update({
        token,
        tokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      });
    }

    const unsubscribeUrl = `${env.siteUrl}/unsubscribe?token=${token}`;

    const html = renderTemplate(template, {
      unsubscribe_url: unsubscribeUrl,
      preferences_url: `${env.siteUrl}/unsubscribe?token=${token}`,
      email: email
    });

    if (dryRun) {
      console.log(`  → would send to ${email}`);
      continue;
    }

    try {
      await sendTo(email, html);
      console.log(`  ✓ ${email}`);
    } catch (err) {
      console.error(`  ✗ ${email}: ${err.message}`);
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});