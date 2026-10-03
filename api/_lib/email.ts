import { env } from './env.js';
import nodemailer from 'nodemailer';

export const transport = nodemailer.createTransport({
  host: env.smtp.host!,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user!,
    pass: env.smtp.pass!
  }
});

export function confirmationEmail(token: string): string {
  const url = `${env.siteUrl}/api/newsletter/confirm?token=${token}`;
  return `
    <h2>Confirm your subscription to Stack0</h2>
    <p>Click the link below to confirm this email address:</p>
    <p><a href="${url}">${url}</a></p>
    <p>If you didn't sign up, ignore this email.</p>
  `;
}