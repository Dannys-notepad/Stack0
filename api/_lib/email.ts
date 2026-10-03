import nodemailer from 'nodemailer'

export const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export function confirmationEmailTemplate(token: string): string {
    const url = `&{process.env.SITE_URL}/api/newsletter/confirm?token=${token}`
    return `
        <h2> Confirm your subscription to Stack0 </h2>
        <p> Click the link below to confirm this email address:</p>
        <p> <a href="${url}">${url}</a></p>
        <p> If you didn't signup, ignore this email.</p>
    `
}