import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Properly <onboarding@resend.dev>';

let resend: Resend | null = null;

function getClient(): Resend {
  if (!resend) {
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(resendApiKey);
  }
  return resend;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  const client = getClient();
  const { data, error } = await client.emails.send({
    from: fromEmail,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    console.error('Resend email error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: "Welcome to Properly — let's get you settled!",
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; color: #425b58; font-size: 28px; margin: 0;">Properly</h1>
        </div>
        <h2 style="color: #1a1a1a; font-size: 22px;">G'day ${name}!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Welcome to Properly — your one-stop shop for keeping track of your property settlement. 
          We're here to make this as smooth as possible for you.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Here's what you can do right now:
        </p>
        <ul style="color: #666; font-size: 16px; line-height: 2;">
          <li>Complete your profile and verify your identity</li>
          <li>Check out The Playbook for guides on the settlement process</li>
          <li>Track your settlement progress with our 5-pillar tracker</li>
        </ul>
        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.VITE_APP_URL || 'https://properly-app.com.au'}/client/dashboard" 
             style="background-color: #425b58; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Go to Your Dashboard
          </a>
        </div>
        <p style="color: #999; font-size: 13px; margin-top: 40px; text-align: center;">
          © 2026 Properly. All rights reserved.
        </p>
      </div>
    `,
    text: `G'day ${name}! Welcome to Properly. Log in to your dashboard to get started with your property settlement journey.`,
  });
}

export async function sendMilestoneEmail(to: string, name: string, milestone: string, matterId: string) {
  return sendEmail({
    to,
    subject: `Settlement Update: ${milestone} reached!`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; color: #425b58; font-size: 28px; margin: 0;">Properly</h1>
        </div>
        <h2 style="color: #1a1a1a; font-size: 22px;">Great news, ${name}!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Your settlement has reached a new milestone: <strong style="color: #425b58;">${milestone}</strong>
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Log in to your dashboard to see the full details and what's coming up next.
        </p>
        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.VITE_APP_URL || 'https://properly-app.com.au'}/client/dashboard" 
             style="background-color: #425b58; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            View Progress
          </a>
        </div>
        <p style="color: #999; font-size: 13px; margin-top: 40px; text-align: center;">
          © 2026 Properly. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendTaskNotificationEmail(to: string, name: string, taskTitle: string) {
  return sendEmail({
    to,
    subject: `Action needed: ${taskTitle}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; color: #425b58; font-size: 28px; margin: 0;">Properly</h1>
        </div>
        <h2 style="color: #1a1a1a; font-size: 22px;">Heads up, ${name}!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          You've got a new task that needs your attention: <strong>"${taskTitle}"</strong>
        </p>
        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.VITE_APP_URL || 'https://properly-app.com.au'}/client/dashboard" 
             style="background-color: #425b58; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            View Task
          </a>
        </div>
        <p style="color: #999; font-size: 13px; margin-top: 40px; text-align: center;">
          © 2026 Properly. All rights reserved.
        </p>
      </div>
    `,
  });
}

export function isConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
