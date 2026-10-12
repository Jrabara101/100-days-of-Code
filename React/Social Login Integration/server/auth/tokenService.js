import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'authmesh_jwt_production_secret_key_983719284';
const MERGE_TICKET_SECRET = process.env.MERGE_TICKET_SECRET || 'authmesh_merge_ticket_secret_384719';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Signs access JWT containing user ID and identity context
 */
export function signSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.full_name,
      avatar: user.avatar_url
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verifies access JWT
 */
export function verifySessionToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Signs a short-lived merge ticket when an email collision occurs
 */
export function signMergeTicket(conflictDetails) {
  return jwt.sign(
    {
      inboundProvider: conflictDetails.inboundProvider,
      inboundProviderUserId: conflictDetails.inboundProviderUserId,
      inboundProfile: conflictDetails.inboundProfile,
      existingUserId: conflictDetails.existingUserId,
      email: conflictDetails.email,
    },
    MERGE_TICKET_SECRET,
    { expiresIn: '10m' }
  );
}

/**
 * Verifies a merge ticket
 */
export function verifyMergeTicket(ticket) {
  try {
    return jwt.verify(ticket, MERGE_TICKET_SECRET);
  } catch (err) {
    return null;
  }
}
