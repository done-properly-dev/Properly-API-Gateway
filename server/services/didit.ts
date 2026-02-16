import crypto from 'crypto';

const diditApiKey = process.env.DIDIT_API_KEY || '';
const diditWebhookSecret = process.env.DIDIT_CALLBACK_SECRET || '';
const diditWorkflowId = process.env.DIDIT_WORKFLOW_ID || '';
const diditBaseUrl = 'https://verification.didit.me/v3';

export interface VerificationSession {
  sessionId: string;
  sessionToken: string;
  verificationUrl: string;
  status: string;
}

export interface VerificationResult {
  sessionId: string;
  status: 'Not Started' | 'In Progress' | 'Approved' | 'Declined' | 'Expired';
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  documentType?: string;
  documentNumber?: string;
}

async function diditFetch(path: string, options: RequestInit = {}) {
  if (!diditApiKey) {
    throw new Error('DIDIT_API_KEY is not configured');
  }

  const response = await fetch(`${diditBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': diditApiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Didit API error (${response.status}): ${error}`);
  }

  return response.json();
}

export async function createVerificationSession(
  userId: string,
  callbackUrl: string,
  userDetails?: { email?: string; name?: string; phone?: string }
): Promise<VerificationSession> {
  const body: Record<string, any> = {
    callback: callbackUrl,
    vendor_data: userId,
  };

  if (diditWorkflowId) {
    body.workflow_id = diditWorkflowId;
  }

  if (userDetails?.email) {
    body.contact_details = {
      email: userDetails.email,
      send_notification_emails: true,
    };
  }

  if (userDetails?.name) {
    const parts = userDetails.name.split(' ');
    body.expected_details = {
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' ') || '',
    };
  }

  const data = await diditFetch('/session/', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return {
    sessionId: data.session_id,
    sessionToken: data.session_token,
    verificationUrl: data.verification_url,
    status: data.status || 'Not Started',
  };
}

export async function getVerificationStatus(sessionId: string): Promise<VerificationResult> {
  const data = await diditFetch(`/session/${sessionId}/decision/`);

  return {
    sessionId: data.session_id || sessionId,
    status: data.status || 'Not Started',
    firstName: data.decision?.ocr_data?.first_name,
    lastName: data.decision?.ocr_data?.last_name,
    dateOfBirth: data.decision?.ocr_data?.date_of_birth,
    documentType: data.decision?.ocr_data?.document_type,
    documentNumber: data.decision?.ocr_data?.document_number,
  };
}

export function verifyWebhookSignature(body: string, signature: string, timestamp: string): boolean {
  if (!diditWebhookSecret) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', diditWebhookSecret)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export function isConfigured(): boolean {
  return !!process.env.DIDIT_API_KEY;
}
