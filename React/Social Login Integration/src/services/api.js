/**
 * AuthMesh Frontend API Client & PKCE Suite
 */

// Helper: base64url encode Uint8Array
function base64UrlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates client-side PKCE code verifier and SHA-256 challenge
 */
export async function generatePKCEPair() {
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  const codeVerifier = base64UrlEncode(randomBytes.buffer);

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const codeChallenge = base64UrlEncode(digest);

  return { codeVerifier, codeChallenge };
}

const API_BASE = '/api/auth';

export const api = {
  async getMe() {
    const res = await fetch(`${API_BASE}/me`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch session');
    return res.json();
  },

  async authorizeOAuth({ provider, intent = 'login', code_challenge }) {
    const res = await fetch(`${API_BASE}/oauth/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider, intent, code_challenge })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Authorization failed');
    }
    return res.json();
  },

  async submitSimulatedConsent({ provider, state, codeChallenge, profile, simulateError }) {
    const res = await fetch(`${API_BASE}/oauth/simulate-consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider, state, codeChallenge, profile, simulateError })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to complete consent simulation');
    }
    return res.json();
  },

  async exchangeCallback({ code, state, code_verifier, provider }) {
    const res = await fetch(`${API_BASE}/oauth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code, state, code_verifier, provider })
    });
    const data = await res.json();
    if (!res.ok && data.status !== 'collision') {
      throw new Error(data.message || 'OAuth callback exchange failed');
    }
    return data;
  },

  async stepUpMerge({ mergeTicket, stepUpVerified }) {
    const res = await fetch(`${API_BASE}/oauth/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mergeTicket, stepUpVerified })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Account merge failed');
    }
    return data;
  },

  async unlinkProvider({ provider }) {
    const res = await fetch(`${API_BASE}/identities/unlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to unlink provider');
    }
    return data;
  },

  async emailLogin({ email, full_name }) {
    const res = await fetch(`${API_BASE}/email-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, full_name })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Email authentication failed');
    }
    return data;
  },

  async logout() {
    const res = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return res.json();
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit-logs`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch audit history');
    return res.json();
  },

  async resetDemo() {
    const res = await fetch(`${API_BASE}/reset-demo`, {
      method: 'POST',
      credentials: 'include'
    });
    return res.json();
  }
};
