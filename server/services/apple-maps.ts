// @ts-ignore
import jwt from 'jsonwebtoken';

const teamId = process.env.APPLE_MAPS_TEAM_ID || '';
const keyId = process.env.APPLE_MAPS_KEY_ID || '';
const privateKey = process.env.APPLE_MAPS_PRIVATE_KEY || '';

export function generateMapToken(): string {
  if (!teamId || !keyId || !privateKey) {
    throw new Error('Apple Maps credentials are not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 3600,
  };

  const formattedKey = privateKey.includes('BEGIN') 
    ? privateKey 
    : `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;

  return jwt.sign(payload, formattedKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: keyId,
      typ: 'JWT',
    },
  });
}

export function isConfigured(): boolean {
  return !!(process.env.APPLE_MAPS_TEAM_ID && process.env.APPLE_MAPS_KEY_ID && process.env.APPLE_MAPS_PRIVATE_KEY);
}
