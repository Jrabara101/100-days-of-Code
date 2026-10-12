import crypto from 'crypto';

const STATE_SECRET = process.env.STATE_SECRET || 'authmesh_cryptographic_state_secret_key_849204';
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Creates a signed, tamper-resistant OAuth state parameter
 */
export function generateSignedState({ provider, intent = 'login', userId = null, returnUrl = '/dashboard' }) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const payload = JSON.stringify({
    nonce,
    provider,
    intent, // 'login' or 'link'
    userId,
    returnUrl,
    timestamp
  });

  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', STATE_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Validates state token signature and expiration
 */
export function verifySignedState(stateToken) {
  if (!stateToken || typeof stateToken !== 'string') {
    return { valid: false, error: 'State parameter is missing.' };
  }

  const parts = stateToken.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed state parameter format.' };
  }

  const [payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', STATE_SECRET)
    .update(payloadB64)
    .digest('base64url');

  try {
    const isSigValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    );

    if (!isSigValid) {
      return { valid: false, error: 'Cryptographic state signature mismatch. State was tampered with.' };
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));

    if (Date.now() - payload.timestamp > STATE_TTL_MS) {
      return { valid: false, error: 'OAuth state has expired. Please initiate sign in again.' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: `Invalid state decoding: ${err.message}` };
  }
}
