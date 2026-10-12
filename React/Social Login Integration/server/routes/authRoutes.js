import express from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { generateCodeVerifier, generateCodeChallenge, verifyCodeChallenge } from '../auth/pkce.js';
import { generateSignedState, verifySignedState } from '../auth/stateService.js';
import {
  signSessionToken,
  verifySessionToken,
  signMergeTicket,
  verifyMergeTicket,
  COOKIE_OPTIONS
} from '../auth/tokenService.js';
import {
  PROVIDERS,
  registerSimulatedCode,
  consumeSimulatedCode,
  SIMULATED_PERSONAS
} from '../auth/oauthProviders.js';

const router = express.Router();

// Session verification middleware
function requireAuth(req, res, next) {
  const token = req.cookies?.session_token;
  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  const decoded = verifySessionToken(token);
  if (!decoded) {
    res.clearCookie('session_token', COOKIE_OPTIONS);
    return res.status(401).json({ error: 'SESSION_EXPIRED', message: 'Session expired or invalid' });
  }

  const user = db.getUserById(decoded.sub);
  if (!user) {
    res.clearCookie('session_token', COOKIE_OPTIONS);
    return res.status(401).json({ error: 'USER_NOT_FOUND', message: 'User profile not found' });
  }

  req.user = user;
  next();
}

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile, linked identities, and system status
 */
router.get('/me', (req, res) => {
  const token = req.cookies?.session_token;
  if (!token) {
    return res.json({ authenticated: false, user: null, identities: [] });
  }

  const decoded = verifySessionToken(token);
  if (!decoded) {
    res.clearCookie('session_token', COOKIE_OPTIONS);
    return res.json({ authenticated: false, user: null, identities: [] });
  }

  const user = db.getUserById(decoded.sub);
  if (!user) {
    res.clearCookie('session_token', COOKIE_OPTIONS);
    return res.json({ authenticated: false, user: null, identities: [] });
  }

  const identities = db.getIdentitiesByUserId(user.id);
  res.json({
    authenticated: true,
    user,
    identities
  });
});

/**
 * POST /api/auth/oauth/authorize
 * Initiates OAuth flow, creates PKCE challenges, generates signed state
 */
router.post('/oauth/authorize', (req, res) => {
  const { provider, intent = 'login', code_challenge } = req.body;

  if (!PROVIDERS[provider]) {
    return res.status(400).json({ error: 'INVALID_PROVIDER', message: `Unsupported provider: ${provider}` });
  }

  // If user is currently logged in, attach their user ID for account linking
  let currentUserId = null;
  const token = req.cookies?.session_token;
  if (token) {
    const decoded = verifySessionToken(token);
    if (decoded) currentUserId = decoded.sub;
  }

  const state = generateSignedState({
    provider,
    intent: intent === 'link' && currentUserId ? 'link' : 'login',
    userId: currentUserId,
    returnUrl: req.body.returnUrl || '/dashboard'
  });

  // Check if live API credentials are configured in environment
  const envClientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];

  if (envClientId) {
    // Construct real OAuth authorization URL
    const config = PROVIDERS[provider];
    const params = new URLSearchParams({
      client_id: envClientId,
      response_type: 'code',
      redirect_uri: `${req.protocol}://${req.get('host')}/auth/callback`,
      scope: config.scopes.join(' '),
      state,
      code_challenge: code_challenge,
      code_challenge_method: 'S256'
    });

    return res.json({
      mode: 'redirect',
      provider,
      state,
      authorizationUrl: `${config.authUrl}?${params.toString()}`
    });
  }

  // Otherwise, return simulation mode with high-fidelity consent screen metadata
  const matchingPersonas = SIMULATED_PERSONAS.filter(p => p.provider === provider);
  res.json({
    mode: 'simulation',
    provider,
    providerConfig: PROVIDERS[provider],
    state,
    codeChallenge: code_challenge,
    personas: matchingPersonas,
    intent: intent === 'link' && currentUserId ? 'link' : 'login'
  });
});

/**
 * POST /api/auth/oauth/simulate-consent
 * Processes user authorization inside the Interactive Simulation Suite
 */
router.post('/oauth/simulate-consent', (req, res) => {
  const { provider, state, codeChallenge, profile, simulateError } = req.body;

  const stateCheck = verifySignedState(state);
  if (!stateCheck.valid) {
    return res.status(400).json({ error: 'INVALID_STATE', message: stateCheck.error });
  }

  // Handle simulated edge case errors
  if (simulateError) {
    return res.json({
      status: 'error_redirect',
      redirectUrl: `/auth/callback?error=${encodeURIComponent(simulateError)}&state=${encodeURIComponent(state)}&provider=${encodeURIComponent(provider)}`
    });
  }

  if (!profile || !profile.email) {
    return res.status(400).json({ error: 'MISSING_PROFILE', message: 'Profile email is required' });
  }

  // Generate OAuth authorization code
  const code = `sim_code_${crypto.randomBytes(18).toString('hex')}`;

  registerSimulatedCode({
    code,
    provider,
    profile,
    codeChallenge
  });

  res.json({
    status: 'success',
    code,
    state,
    provider,
    redirectUrl: `/auth/callback?code=${code}&state=${encodeURIComponent(state)}&provider=${provider}`
  });
});

/**
 * POST /api/auth/oauth/callback
 * Exchanges authorization code + PKCE verifier, executes deduplication and collision triage
 */
router.post('/oauth/callback', async (req, res) => {
  const { code, state, code_verifier, provider } = req.body;

  // 1. Verify cryptographic state parameter
  const stateCheck = verifySignedState(state);
  if (!stateCheck.valid) {
    return res.status(400).json({
      error: 'CSRF_STATE_TAMPERED',
      message: stateCheck.error || 'The authentication state is invalid or has expired.'
    });
  }

  const { intent, userId: stateUserId } = stateCheck.payload;

  // 2. Consume authorization code and verify PKCE challenge
  const simItem = consumeSimulatedCode(code);
  let profile = null;

  if (simItem) {
    if (simItem.provider !== provider) {
      return res.status(400).json({ error: 'PROVIDER_MISMATCH', message: 'Provider does not match authorization code.' });
    }

    // Verify PKCE code challenge if provided
    if (simItem.codeChallenge && code_verifier) {
      const isPkceValid = verifyCodeChallenge(code_verifier, simItem.codeChallenge);
      if (!isPkceValid) {
        return res.status(400).json({
          error: 'PKCE_VERIFICATION_FAILED',
          message: 'Code verifier does not match authorization code challenge.'
        });
      }
    }

    profile = simItem.profile;
  } else {
    // If real provider exchange is implemented
    return res.status(400).json({
      error: 'INVALID_CODE',
      message: 'Authorization code has expired, already been consumed, or is invalid.'
    });
  }

  // 3. Check for unverified email error
  if (!profile.email_verified) {
    return res.status(400).json({
      error: 'UNVERIFIED_EMAIL',
      message: `Your ${provider} account email (${profile.email}) is not verified. Please verify your email with ${provider} before signing in.`
    });
  }

  // Check if current user is logged in (Account Linking flow)
  let currentSessionUser = null;
  const token = req.cookies?.session_token;
  if (token) {
    const decoded = verifySessionToken(token);
    if (decoded) currentSessionUser = db.getUserById(decoded.sub);
  }

  // ============================================================================
  // Scenario 1: Account Linking (User is already authenticated and links provider)
  // ============================================================================
  if (currentSessionUser || intent === 'link') {
    const targetUserId = currentSessionUser?.id || stateUserId;
    if (!targetUserId) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required for account linking' });
    }

    try {
      const linkedIdentity = db.linkIdentity({
        userId: targetUserId,
        provider,
        providerUserId: profile.provider_user_id || `${provider}_uid_${Date.now()}`,
        identityData: profile
      });

      const updatedUser = db.getUserById(targetUserId);
      const allIdentities = db.getIdentitiesByUserId(targetUserId);

      return res.json({
        status: 'linked',
        message: `Successfully connected ${PROVIDERS[provider]?.name || provider}!`,
        user: updatedUser,
        identities: allIdentities
      });
    } catch (linkError) {
      return res.status(409).json({
        error: 'IDENTITY_CONFLICT',
        message: linkError.message
      });
    }
  }

  // ============================================================================
  // Scenario 2: Social Sign-In / Sign-Up
  // ============================================================================
  const providerUid = profile.provider_user_id || `${provider}_uid_${Date.now()}`;
  const existingIdentity = db.getIdentity(provider, providerUid);

  // Sub-case 2A: Identity already linked to a user -> Instant Login!
  if (existingIdentity) {
    const user = db.getUserById(existingIdentity.user_id);
    if (!user) {
      return res.status(500).json({ error: 'ORPHANED_IDENTITY', message: 'Identity record exists without matching user profile.' });
    }

    // Refresh last sign in timestamps
    db.updateUser(user.id, { last_sign_in_at: new Date().toISOString() });
    existingIdentity.last_sign_in_at = new Date().toISOString();
    db.persist();

    db.recordAuditLog({
      userId: user.id,
      eventType: 'oauth_handshake',
      provider,
      details: { email: user.email, providerUid }
    });

    const sessionToken = signSessionToken(user);
    res.cookie('session_token', sessionToken, COOKIE_OPTIONS);

    return res.json({
      status: 'authenticated',
      action: 'login',
      user,
      identities: db.getIdentitiesByUserId(user.id)
    });
  }

  // Sub-case 2B: Identity not found -> Check for Email Collision!
  const existingUserWithEmail = db.getUserByEmail(profile.email);

  if (existingUserWithEmail) {
    // Collision detected!
    const existingIdentities = db.getIdentitiesByUserId(existingUserWithEmail.id);
    const primaryProvider = existingIdentities[0]?.provider || 'google';

    const mergeTicket = signMergeTicket({
      inboundProvider: provider,
      inboundProviderUserId: providerUid,
      inboundProfile: profile,
      existingUserId: existingUserWithEmail.id,
      email: profile.email
    });

    db.recordAuditLog({
      userId: existingUserWithEmail.id,
      eventType: 'collision_detected',
      provider,
      details: {
        attemptedProvider: provider,
        existingPrimaryProvider: primaryProvider,
        email: profile.email
      }
    });

    return res.json({
      status: 'collision',
      message: 'An existing account was found with this email address.',
      conflict: {
        email: profile.email,
        inboundProvider: provider,
        inboundProfile: profile,
        existingUser: {
          id: existingUserWithEmail.id,
          email: existingUserWithEmail.email,
          full_name: existingUserWithEmail.full_name,
          avatar_url: existingUserWithEmail.avatar_url,
          primaryProvider
        },
        mergeTicket
      }
    });
  }

  // Sub-case 2C: Completely new user -> Zero-friction onboarding!
  const newUser = db.createUser({
    email: profile.email,
    full_name: profile.name,
    avatar_url: profile.avatar
  });

  const identity = db.linkIdentity({
    userId: newUser.id,
    provider,
    providerUserId: providerUid,
    identityData: profile
  });

  db.recordAuditLog({
    userId: newUser.id,
    eventType: 'account_created',
    provider,
    details: { email: newUser.email, provider }
  });

  const sessionToken = signSessionToken(newUser);
  res.cookie('session_token', sessionToken, COOKIE_OPTIONS);

  return res.json({
    status: 'authenticated',
    action: 'registered',
    user: newUser,
    identities: [identity]
  });
});

/**
 * POST /api/auth/oauth/merge
 * Executes step-up verification and links inbound identity to existing account
 */
router.post('/oauth/merge', (req, res) => {
  const { mergeTicket, stepUpVerified } = req.body;

  if (!mergeTicket) {
    return res.status(400).json({ error: 'MISSING_TICKET', message: 'Merge ticket token is required.' });
  }

  const payload = verifyMergeTicket(mergeTicket);
  if (!payload) {
    return res.status(400).json({
      error: 'EXPIRED_MERGE_TICKET',
      message: 'Account merge session has expired. Please initiate sign in again.'
    });
  }

  if (!stepUpVerified) {
    return res.status(403).json({
      error: 'STEPUP_REQUIRED',
      message: 'Step-up verification through primary credential is required.'
    });
  }

  try {
    const { targetUser, identity } = db.mergeIdentities({
      targetUserId: payload.existingUserId,
      provider: payload.inboundProvider,
      providerUserId: payload.inboundProviderUserId,
      identityData: payload.inboundProfile
    });

    const sessionToken = signSessionToken(targetUser);
    res.cookie('session_token', sessionToken, COOKIE_OPTIONS);

    return res.json({
      status: 'merged',
      message: `Successfully linked ${PROVIDERS[payload.inboundProvider]?.name || payload.inboundProvider} to your account!`,
      user: targetUser,
      identities: db.getIdentitiesByUserId(targetUser.id)
    });
  } catch (err) {
    return res.status(500).json({ error: 'MERGE_FAILED', message: err.message });
  }
});

/**
 * POST /api/auth/identities/unlink
 * Unlinks a provider identity, enforcing the safety guardrail that at least 1 method remains
 */
router.post('/identities/unlink', requireAuth, (req, res) => {
  const { provider } = req.body;

  if (!provider) {
    return res.status(400).json({ error: 'MISSING_PROVIDER', message: 'Provider parameter required.' });
  }

  try {
    db.unlinkIdentity({ userId: req.user.id, provider });
    const remaining = db.getIdentitiesByUserId(req.user.id);
    return res.json({
      status: 'unlinked',
      message: `Successfully disconnected ${PROVIDERS[provider]?.name || provider}.`,
      identities: remaining
    });
  } catch (err) {
    return res.status(400).json({
      error: 'GUARDRAIL_VIOLATION',
      message: err.message
    });
  }
});

/**
 * POST /api/auth/email-login
 * Direct email login simulation / magic link
 */
router.post('/email-login', (req, res) => {
  const { email, full_name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'MISSING_EMAIL', message: 'Email address is required.' });
  }

  let user = db.getUserByEmail(email);
  if (!user) {
    user = db.createUser({ email, full_name });
    db.linkIdentity({
      userId: user.id,
      provider: 'email',
      providerUserId: `email_${Date.now()}`,
      identityData: { email, verified_email: true }
    });
  }

  const sessionToken = signSessionToken(user);
  res.cookie('session_token', sessionToken, COOKIE_OPTIONS);

  res.json({
    status: 'authenticated',
    user,
    identities: db.getIdentitiesByUserId(user.id)
  });
});

/**
 * POST /api/auth/logout
 * Clears session cookie and records audit log
 */
router.post('/logout', (req, res) => {
  const token = req.cookies?.session_token;
  if (token) {
    const decoded = verifySessionToken(token);
    if (decoded) {
      db.recordAuditLog({
        userId: decoded.sub,
        eventType: 'logout',
        details: { email: decoded.email }
      });
    }
  }

  res.clearCookie('session_token', COOKIE_OPTIONS);
  res.json({ status: 'logged_out', message: 'Session terminated successfully.' });
});

/**
 * GET /api/auth/audit-logs
 * Security audit stream
 */
router.get('/audit-logs', (req, res) => {
  const token = req.cookies?.session_token;
  let userId = null;
  if (token) {
    const decoded = verifySessionToken(token);
    if (decoded) userId = decoded.sub;
  }
  const logs = db.getAuditLogs(userId, 30);
  res.json({ logs });
});

/**
 * POST /api/auth/reset-demo
 * Restores database to original seeded state for fresh tests
 */
router.post('/reset-demo', (req, res) => {
  db.resetDemo();
  res.clearCookie('session_token', COOKIE_OPTIONS);
  res.json({ status: 'reset', message: 'Database reset to demo state.' });
});

export default router;
