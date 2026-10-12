import crypto from 'crypto';

/**
 * Base64URL encoding without padding characters
 */
function base64UrlEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates a high-entropy cryptographic code verifier (RFC 7636)
 */
export function generateCodeVerifier(length = 64) {
  const randomBytes = crypto.randomBytes(length);
  return base64UrlEncode(randomBytes).substring(0, length);
}

/**
 * Generates a SHA-256 code challenge from a verifier
 */
export function generateCodeChallenge(verifier) {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
}

/**
 * Validates a code verifier against a code challenge using timing-safe comparison
 */
export function verifyCodeChallenge(verifier, challenge) {
  if (!verifier || !challenge) return false;
  const computed = generateCodeChallenge(verifier);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(challenge));
}
