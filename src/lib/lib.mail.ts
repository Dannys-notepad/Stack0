import nodemailer from 'nodemailer'
import env from '../config/env.ts'

// Shape of the data required to send a mail.
type MailRecipient = {
  email: string[] | string
  subject?: string
  text?: string
}

// Create the email transporter once.
// This uses Gmail SMTP credentials from the environment variables.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.SMTP_USERNAME,
    pass: env.SMTP_PASSWORD,
  },
})

// Send an email to one or more recipients.
// This function is reused by the post service when a new post is created.
const mail = async (recipient: MailRecipient) => {
  try {
    // Make sure there is at least one recipient email.
    if (!recipient?.email || (Array.isArray(recipient.email) && recipient.email.length === 0)) {
      throw new Error('Recipient email is required')
    }

    const info = await transporter.sendMail({
      from: `"Stack0" <${env.SMTP_USERNAME}>`,
      to: env.SMTP_USERNAME,
      bcc: Array.isArray(recipient.email) ? recipient.email.join(',') : recipient.email,
      subject: recipient.subject || 'No subject',
      text: recipient.text || '',
    })

    console.log('Email sent', info.messageId)
    return info
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown mail error'
    console.error('Email failed:', recipient?.email, message)
    return null
  }
}

export default mail
