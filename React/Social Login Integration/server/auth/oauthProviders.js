/**
 * OAuth Provider Configurations and Verification Services
 * Supports both Live OAuth Handshakes and High-Fidelity Simulation Suite
 */

export const PROVIDERS = {
  google: {
    id: 'google',
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scopes: ['openid', 'profile', 'email'],
    brandColor: '#4285F4',
    scopeDescription: 'Reads your Google public profile (name, picture) and verified primary email address. Never modifies your Google account.',
  },
  github: {
    id: 'github',
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email'],
    brandColor: '#24292F',
    scopeDescription: 'Reads your public GitHub profile and verified primary email address. Never accesses your private repositories or organizations.',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me?fields=id,name,email,picture.width(250).height(250)',
    scopes: ['public_profile', 'email'],
    brandColor: '#1877F2',
    scopeDescription: 'Reads your Facebook public profile name, avatar, and confirmed email. Never posts to your feed or contacts your friends.',
  }
};

// In-memory simulation code-to-profile store with 5-minute TTL
const simulationCodes = new Map();

/**
 * Stores a simulated OAuth authorization code
 */
export function registerSimulatedCode({ code, provider, profile, codeChallenge }) {
  simulationCodes.set(code, {
    provider,
    profile,
    codeChallenge,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
}

/**
 * Retrieves and consumes a simulated OAuth authorization code
 */
export function consumeSimulatedCode(code) {
  const item = simulationCodes.get(code);
  if (!item) return null;
  simulationCodes.delete(code);
  if (Date.now() > item.expiresAt) return null;
  return item;
}

/**
 * Pre-configured interactive personas for instant test coverage
 */
export const SIMULATED_PERSONAS = [
  {
    id: 'collision-github',
    provider: 'github',
    title: 'Alex Chen (GitHub collision demo)',
    subtitle: 'Uses alex.chen@acme.corp (already registered under Google)',
    profile: {
      provider_user_id: 'gh_u_948201',
      email: 'alex.chen@acme.corp',
      name: 'Alex Chen',
      username: 'alexchen_dev',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      email_verified: true,
      bio: 'Full Stack Architect & Cloud Engineer'
    }
  },
  {
    id: 'primary-google',
    provider: 'google',
    title: 'Alex Chen (Google primary login)',
    subtitle: 'Primary account holder for alex.chen@acme.corp',
    profile: {
      provider_user_id: 'google-oauth2|10948291048201948',
      email: 'alex.chen@acme.corp',
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      email_verified: true
    }
  },
  {
    id: 'new-facebook',
    provider: 'facebook',
    title: 'David Vance (New user via Facebook)',
    subtitle: 'Simulates frictionless first-time Facebook onboarding',
    profile: {
      provider_user_id: 'fb_u_74829104',
      email: 'david.vance@meta-domain.com',
      name: 'David Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      email_verified: true
    }
  },
  {
    id: 'new-google',
    provider: 'google',
    title: 'Elena Rostova (New user via Google)',
    subtitle: 'Simulates pristine Google 1-click registration',
    profile: {
      provider_user_id: 'google-oauth2|8937102948192837',
      email: 'elena.rostova@nexus.ai',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      email_verified: true
    }
  }
];
