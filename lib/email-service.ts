import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy');

export const sendEmail = async (options: {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}) => {
  if (process.env.RESEND_API_KEY === 'dummy') {
    console.log("--- MOCK EMAIL DISPATCH ---");
    console.log("To:", options.to);
    console.log("CC:", options.cc);
    console.log("Subject:", options.subject);
    console.log("Attachments:", options.attachments?.map(a => a.filename).join(', '));
    console.log("---------------------------");
    return { id: 'mock_id_' + Date.now() };
  }

  const response = await resend.emails.send({
    from: 'claims@getflightforce.com',
    to: options.to,
    cc: options.cc,
    subject: options.subject,
    text: options.text || '',
    html: options.html,
    attachments: options.attachments
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data;
};
