const diditApiKey = process.env.DIDIT_API_KEY || '';
const diditBaseUrl = process.env.DIDIT_BASE_URL || 'https://apx.didit.me/v2';

export interface VerificationSession {
  sessionId: string;
  url: string;
  status: string;
}

export interface VerificationResult {
  sessionId: string;
  status: 'pending' | 'approved' | 'declined' | 'expired';
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
      'Authorization': `Bearer ${diditApiKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Didit API error (${response.status}): ${error}`);
  }

  return response.json();
}

export async function createVerificationSession(userId: string, callbackUrl: string): Promise<VerificationSession> {
  const data = await diditFetch('/verification/sessions', {
    method: 'POST',
    body: JSON.stringify({
      vendor_data: userId,
      callback: callbackUrl,
      features: ['ocr', 'face-match'],
    }),
  });

  return {
    sessionId: data.session_id || data.id,
    url: data.url || data.verification_url,
    status: data.status || 'created',
  };
}

export async function getVerificationStatus(sessionId: string): Promise<VerificationResult> {
  const data = await diditFetch(`/verification/sessions/${sessionId}`);

  return {
    sessionId: data.session_id || data.id,
    status: data.status || 'pending',
    firstName: data.first_name,
    lastName: data.last_name,
    dateOfBirth: data.date_of_birth,
    documentType: data.document_type,
    documentNumber: data.document_number,
  };
}

export function isConfigured(): boolean {
  return !!process.env.DIDIT_API_KEY;
}
