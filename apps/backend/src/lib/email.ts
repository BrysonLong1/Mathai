import * as sgMail from '@sendgrid/mail';
import { ENV } from '../env.js';

sgMail.setApiKey(ENV.SENDGRID_API_KEY);

export async function sendVerifyEmail(to: string, code: string) {
  await sgMail.send({
    to,
    from: ENV.FROM_EMAIL,  // must be a verified sender
    subject: 'Verify your MathArena account',
    text: `Your verification code is ${code}`,
    html: `<p>Your verification code is <b>${code}</b></p>`,
  });
}