import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'store.json');

// Default initial state for frictionless local exploration
const DEFAULT_SEED_DATA = {
  users: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'alex.chen@acme.corp',
      full_name: 'Alex Chen',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      last_sign_in_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      email: 'sarah.connor@cyberdyne.io',
      full_name: 'Sarah Connor',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
      created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
      last_sign_in_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    }
  ],
  identities: [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      user_id: 'a0000000-0000-0000-0000-000000000001',
      provider: 'google',
      provider_user_id: 'google-oauth2|10948291048201948',
      identity_data: {
        email: 'alex.chen@acme.corp',
        name: 'Alex Chen',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        verified_email: true,
        hd: 'acme.corp'
      },
      last_sign_in_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      user_id: 'a0000000-0000-0000-0000-000000000002',
      provider: 'github',
      provider_user_id: 'gh_u_948271',
      identity_data: {
        email: 'sarah.connor@cyberdyne.io',
        username: 'sconnor',
        name: 'Sarah Connor',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
        verified_email: true
      },
      last_sign_in_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    }
  ],
  audit_logs: [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      user_id: 'a0000000-0000-0000-0000-000000000001',
      event_type: 'account_created',
      provider: 'google',
      details: { email: 'alex.chen@acme.corp', method: 'google_oauth_pkce' },
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      user_id: 'a0000000-0000-0000-0000-000000000001',
      event_type: 'oauth_handshake',
      provider: 'google',
      details: { email: 'alex.chen@acme.corp', ip: '192.168.1.10' },
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    }
  ]
};

class Database {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not read existing store, creating default dataset:', err.message);
    }
    const initial = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
    this.persist(initial);
    return initial;
  }

  persist(dataToSave = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err.message);
    }
  }

  resetDemo() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
    this.persist();
    return true;
  }

  // User queries
  getUserById(id) {
    return this.data.users.find(u => u.id === id) || null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  createUser({ email, full_name, avatar_url }) {
    const newUser = {
      id: uuidv4(),
      email: email.toLowerCase(),
      full_name: full_name || email.split('@')[0],
      avatar_url: avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      created_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  updateUser(id, updates) {
    const user = this.getUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    this.persist();
    return user;
  }

  // Identities queries
  getIdentitiesByUserId(userId) {
    return this.data.identities.filter(i => i.user_id === userId);
  }

  getIdentity(provider, providerUserId) {
    return this.data.identities.find(
      i => i.provider === provider && i.provider_user_id === providerUserId
    ) || null;
  }

  getIdentityByEmailAndProvider(email, provider) {
    if (!email) return null;
    return this.data.identities.find(
      i => i.provider === provider && i.identity_data?.email?.toLowerCase() === email.toLowerCase()
    ) || null;
  }

  linkIdentity({ userId, provider, providerUserId, identityData }) {
    const existing = this.getIdentity(provider, providerUserId);
    if (existing) {
      if (existing.user_id !== userId) {
        throw new Error(`This ${provider} account is already linked to another user profile.`);
      }
      // Update existing identity
      existing.identity_data = { ...existing.identity_data, ...identityData };
      existing.last_sign_in_at = new Date().toISOString();
      this.persist();
      return existing;
    }

    const newIdentity = {
      id: uuidv4(),
      user_id: userId,
      provider,
      provider_user_id: providerUserId,
      identity_data: identityData,
      created_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
    };

    this.data.identities.push(newIdentity);

    // Update user's last_sign_in_at
    const user = this.getUserById(userId);
    if (user) {
      user.last_sign_in_at = new Date().toISOString();
      if (!user.avatar_url && identityData.avatar) {
        user.avatar_url = identityData.avatar;
      }
    }

    this.recordAuditLog({
      userId,
      eventType: 'account_linked',
      provider,
      details: { providerUserId, email: identityData.email }
    });

    this.persist();
    return newIdentity;
  }

  unlinkIdentity({ userId, provider }) {
    const userIdentities = this.getIdentitiesByUserId(userId);
    if (userIdentities.length <= 1) {
      throw new Error('Safety Guardrail: You cannot disconnect your only active sign-in provider.');
    }

    const targetIdx = this.data.identities.findIndex(
      i => i.user_id === userId && i.provider === provider
    );

    if (targetIdx === -1) {
      throw new Error(`No linked ${provider} identity found for this account.`);
    }

    const removed = this.data.identities.splice(targetIdx, 1)[0];

    this.recordAuditLog({
      userId,
      eventType: 'account_unlinked',
      provider,
      details: { providerUserId: removed.provider_user_id }
    });

    this.persist();
    return true;
  }

  mergeIdentities({ targetUserId, provider, providerUserId, identityData }) {
    const targetUser = this.getUserById(targetUserId);
    if (!targetUser) throw new Error('Target user account not found.');

    const identity = this.linkIdentity({
      userId: targetUserId,
      provider,
      providerUserId,
      identityData
    });

    this.recordAuditLog({
      userId: targetUserId,
      eventType: 'stepup_merge_verified',
      provider,
      details: {
        mergedEmail: identityData.email,
        primaryUserEmail: targetUser.email,
        provider
      }
    });

    return { targetUser, identity };
  }

  // Audit logs
  recordAuditLog({ userId, eventType, provider, details = {}, ip = '127.0.0.1' }) {
    const log = {
      id: uuidv4(),
      user_id: userId || null,
      event_type: eventType,
      provider: provider || null,
      details,
      ip_address: ip,
      created_at: new Date().toISOString()
    };
    this.data.audit_logs.unshift(log);
    // Keep max 100 recent logs
    if (this.data.audit_logs.length > 100) {
      this.data.audit_logs.pop();
    }
    this.persist();
    return log;
  }

  getAuditLogs(userId = null, limit = 20) {
    if (userId) {
      return this.data.audit_logs
        .filter(l => l.user_id === userId)
        .slice(0, limit);
    }
    return this.data.audit_logs.slice(0, limit);
  }
}

export const db = new Database();
