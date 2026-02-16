import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

let twilioClient: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not configured');
    }
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export interface SmsOptions {
  to: string;
  body: string;
}

export async function sendSms(options: SmsOptions) {
  const client = getClient();
  const message = await client.messages.create({
    body: options.body,
    from: fromNumber,
    to: options.to,
  });
  return message;
}

export async function sendWelcomeSms(to: string, name: string) {
  return sendSms({
    to,
    body: `G'day ${name}! Welcome to Properly. Your settlement journey starts now. Log in to track your progress: ${process.env.VITE_APP_URL || 'https://properly-app.com.au'}`,
  });
}

export async function sendMilestoneSms(to: string, name: string, milestone: string) {
  return sendSms({
    to,
    body: `Great news ${name}! Your settlement has reached "${milestone}". Check your dashboard for details: ${process.env.VITE_APP_URL || 'https://properly-app.com.au'}`,
  });
}

export async function sendTaskReminderSms(to: string, name: string, taskTitle: string) {
  return sendSms({
    to,
    body: `Heads up ${name} — you've got a task to complete: "${taskTitle}". Log in to view: ${process.env.VITE_APP_URL || 'https://properly-app.com.au'}`,
  });
}

export async function sendVerificationCode(to: string, code: string) {
  return sendSms({
    to,
    body: `Your Properly verification code is: ${code}. This code expires in 10 minutes.`,
  });
}

export interface ConversationMessage {
  matterId: string;
  senderId: string;
  senderName: string;
  body: string;
  timestamp: Date;
}

const chatRooms = new Map<string, ConversationMessage[]>();

export function addChatMessage(matterId: string, senderId: string, senderName: string, body: string): ConversationMessage {
  const message: ConversationMessage = {
    matterId,
    senderId,
    senderName,
    body,
    timestamp: new Date(),
  };

  if (!chatRooms.has(matterId)) {
    chatRooms.set(matterId, []);
  }
  chatRooms.get(matterId)!.push(message);
  return message;
}

export function getChatMessages(matterId: string): ConversationMessage[] {
  return chatRooms.get(matterId) || [];
}

export function isConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}
