import nodemailer from 'nodemailer';
import env from '../config/env.ts';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.SMTP_USERNAME,
    pass: env.SMTP_PASSWORD // must be app password (not normal Gmail password)
  }
});

const mail = async (recipient) => {
  try {
    if(!recipient?.email || (Array.isArray(recipient.email) && recipient.email.length === 0)){
      throw new Error('Recipient email is required');
    }

    const info = await transporter.sendMail({
      from: `"Stack0" <${env.SMTP_USERNAME}>`,
      to: env.SMTP_USERNAME,
      bcc: Array.isArray(recipient.email) ? recipient.email.join(',') : recipient.email,
      subject: recipient.subject || 'No subject',
      text: recipient.text || ''
    })

    console.log('Email sent', info.messageId);
    return info;
  } catch (error) {
    console.error(`Email failed:`, recipient?.email, error.message);
    return
  }
}

export default mail;
