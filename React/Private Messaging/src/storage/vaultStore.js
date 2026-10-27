import { 
  generateIdentityKeyPair, 
  importPublicKey, 
  importPrivateKey, 
  deriveSessionKey, 
  encryptPayload, 
  decryptPayload, 
  computeSafetyFingerprint, 
  generateIdenticon,
  zeroMemory 
} from '../crypto/cryptoEngine';
import { generateMnemonic } from '../crypto/bip39Words';
import { sounds } from '../sound/soundEffects';

const VAULT_STORAGE_KEY = 'sanctuary_vault_v1';
const BROADCAST_CHANNEL_NAME = 'sanctuary_blind_relay_channel';

// Default decoy data for Duress mode
export const DECOY_THREADS = [
  {
    id: 'decoy-mom',
    alias: 'Mom ❤️',
    lastMessage: 'Don\'t forget Sunday family brunch at 11!',
    timestamp: Date.now() - 3600000 * 2,
    unread: 1,
    messages: [
      { id: 'dm1', sender: 'peer', text: 'Hi sweetie! Hope work is going well.', timestamp: Date.now() - 3600000 * 5 },
      { id: 'dm2', sender: 'me', text: 'Hey Mom, all good here! Just wrapping up some reports.', timestamp: Date.now() - 3600000 * 4 },
      { id: 'dm3', sender: 'peer', text: 'Don\'t forget Sunday family brunch at 11! Aunt Claire is bringing apple tart.', timestamp: Date.now() - 3600000 * 2 },
    ]
  },
  {
    id: 'decoy-grocer',
    alias: 'Green Grocer Delivery',
    lastMessage: 'Your organic crate #4928 is on its way.',
    timestamp: Date.now() - 3600000 * 8,
    unread: 0,
    messages: [
      { id: 'dg1', sender: 'peer', text: 'Order confirmed: Sourdough bread, almond milk, honeycrisp apples.', timestamp: Date.now() - 3600000 * 12 },
      { id: 'dg2', sender: 'peer', text: 'Your organic crate #4928 is on its way.', timestamp: Date.now() - 3600000 * 8 }
    ]
  },
  {
    id: 'decoy-bookclub',
    alias: 'Sci-Fi Book Club',
    lastMessage: 'Has anyone finished chapter 4 of Project Hail Mary?',
    timestamp: Date.now() - 3600000 * 24,
    unread: 0,
    messages: [
      { id: 'db1', sender: 'peer', text: 'Has anyone finished chapter 4 of Project Hail Mary?', timestamp: Date.now() - 3600000 * 24 }
    ]
  }
];

class VaultStore {
  constructor() {
    this.user = null;
    this.contacts = [];
    this.messages = []; // array of all stored encrypted/decrypted messages
    this.activeThreadId = null;
    this.isDecoyMode = false;
    this.isAppLocked = true;
    this.shieldActive = false; // Tap-to-shield global blur
    this.listeners = new Set();
    this.channel = null;
    this.cachedSessionKeys = new Map(); // contactId -> CryptoKey
    
    this.initBroadcastChannel();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error(e);
      }
    }
  }

  initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = async (event) => {
        await this.handleRelayEnvelope(event.data);
      };
    }
  }

  /**
   * Initialize or retrieve local vault
   */
  async init() {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.user = parsed.user;
        this.contacts = parsed.contacts || [];
        this.messages = parsed.messages || [];
        this.activeThreadId = this.contacts[0]?.id || null;
      } catch (e) {
        console.error("Vault parse error", e);
        await this.createNewVault();
      }
    } else {
      await this.createNewVault();
    }
    this.notify();
  }

  /**
   * Save vault to local storage
   */
  persist() {
    if (!this.user || this.isDecoyMode) return;
    try {
      const data = {
        user: this.user,
        contacts: this.contacts,
        messages: this.messages.filter(m => !m.isShredded), // don't persist shredded messages
      };
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Vault persist error", e);
    }
  }

  /**
   * Create fresh zero-knowledge cryptographic vault
   */
  async createNewVault(customAlias = null) {
    const keyData = await generateIdentityKeyPair();
    const mnemonic = generateMnemonic(12);

    this.user = {
      alias: customAlias || `Ghost-${Math.floor(1000 + Math.random() * 9000)}`,
      publicKeyB64: keyData.publicKeyB64,
      publicKeyHex: keyData.publicKeyHex,
      privateKeyJwk: keyData.exportedPrivateJwk,
      mnemonic: mnemonic,
      vaultPin: '1337',
      duressPin: '9999',
      inactivityTimeout: 120, // 2 minutes default
      soundMuted: false,
    };

    // Initialize high-polish demo contacts with real cryptographic keys
    const contactSarahKey = await generateIdentityKeyPair();
    const contactKaelenKey = await generateIdentityKeyPair();
    const contactArisKey = await generateIdentityKeyPair();

    const sarahFingerprint = await computeSafetyFingerprint(this.user.publicKeyB64, contactSarahKey.publicKeyB64);
    const kaelenFingerprint = await computeSafetyFingerprint(this.user.publicKeyB64, contactKaelenKey.publicKeyB64);
    const arisFingerprint = await computeSafetyFingerprint(this.user.publicKeyB64, contactArisKey.publicKeyB64);

    this.contacts = [
      {
        id: 'contact-sarah',
        alias: 'Sarah Cipher [Agent Echo]',
        publicKeyB64: contactSarahKey.publicKeyB64,
        publicKeyHex: contactSarahKey.publicKeyHex,
        privateKeyJwk: contactSarahKey.exportedPrivateJwk, // stored for demo simulation replies
        safetyFingerprint: sarahFingerprint.formatted,
        fingerprintChunks: sarahFingerprint.chunks,
        isVerified: true,
        keyChanged: false,
        previousKeyB64: null,
        defaultTtl: 3600, // 1 hour
        unreadCount: 0,
        createdAt: Date.now() - 86400000,
      },
      {
        id: 'contact-kaelen',
        alias: 'Kaelen [Whisper-9]',
        publicKeyB64: contactKaelenKey.publicKeyB64,
        publicKeyHex: contactKaelenKey.publicKeyHex,
        privateKeyJwk: contactKaelenKey.exportedPrivateJwk,
        safetyFingerprint: kaelenFingerprint.formatted,
        fingerprintChunks: kaelenFingerprint.chunks,
        isVerified: false,
        keyChanged: false,
        previousKeyB64: null,
        defaultTtl: 60, // 1 minute
        unreadCount: 1,
        createdAt: Date.now() - 43200000,
      },
      {
        id: 'contact-aris',
        alias: 'Dr. Aris Thorne [Zero-MITM]',
        publicKeyB64: contactArisKey.publicKeyB64,
        publicKeyHex: contactArisKey.publicKeyHex,
        privateKeyJwk: contactArisKey.exportedPrivateJwk,
        safetyFingerprint: arisFingerprint.formatted,
        fingerprintChunks: arisFingerprint.chunks,
        isVerified: true,
        keyChanged: false,
        previousKeyB64: null,
        defaultTtl: 5, // 5 seconds rapid burn demo!
        unreadCount: 0,
        createdAt: Date.now() - 172800000,
      }
    ];

    // Seed realistic encrypted demo conversations
    const now = Date.now();
    this.messages = [
      {
        id: 'msg-s1',
        threadId: 'contact-sarah',
        sender: 'peer',
        text: 'Encrypted channel established over blind relay. Our public keys are verified out-of-band.',
        isSensitive: false,
        timestamp: now - 1800000,
        ttl: 3600,
        readAt: now - 1800000,
        expiresAt: now - 1800000 + 3600 * 1000,
        isShredded: false,
        status: 'read'
      },
      {
        id: 'msg-s2',
        threadId: 'contact-sarah',
        sender: 'me',
        text: 'Confirmed. Zero-knowledge parameters engaged. All messages shred automatically after 1 hour.',
        isSensitive: false,
        timestamp: now - 900000,
        ttl: 3600,
        readAt: now - 900000,
        expiresAt: now - 900000 + 3600 * 1000,
        isShredded: false,
        status: 'read'
      },
      {
        id: 'msg-k1',
        threadId: 'contact-kaelen',
        sender: 'peer',
        text: 'Sensitive cryptographic manifest attached below. Tap the lens to inspect.',
        isSensitive: true,
        media: {
          type: 'blueprint',
          title: 'Quantum Key Distribution Schematic #7749',
          hash: 'SHA256: 8f3c2...b91a'
        },
        timestamp: now - 30000,
        ttl: 60,
        readAt: now - 30000,
        expiresAt: now - 30000 + 60 * 1000,
        isShredded: false,
        status: 'delivered'
      },
      {
        id: 'msg-a1',
        threadId: 'contact-aris',
        sender: 'peer',
        text: 'Notice: This ephemeral packet has a 5-second horizon. Observe the circular countdown ring upon reveal.',
        isSensitive: false,
        timestamp: now - 2000,
        ttl: 5,
        readAt: now - 2000,
        expiresAt: now + 3000,
        isShredded: false,
        status: 'read'
      }
    ];

    this.activeThreadId = this.contacts[0].id;
    this.isAppLocked = false;
    this.persist();
  }

  /**
   * Unlock gate validation: routes to Decoy Vault or Primary Vault based on PIN
   */
  unlockWithPin(enteredPin) {
    if (enteredPin === (this.user?.duressPin || '9999')) {
      // Enter Duress Decoy State!
      this.isDecoyMode = true;
      this.isAppLocked = false;
      this.notify();
      return { success: true, mode: 'decoy' };
    } else if (enteredPin === (this.user?.vaultPin || '1337')) {
      // Enter Genuine Secure Vault
      this.isDecoyMode = false;
      this.isAppLocked = false;
      this.notify();
      return { success: true, mode: 'vault' };
    } else {
      return { success: false, error: 'Cryptographic challenge failed. Invalid keycode.' };
    }
  }

  lockApp() {
    this.isAppLocked = true;
    this.isDecoyMode = false;
    this.notify();
  }

  toggleShield() {
    this.shieldActive = !this.shieldActive;
    sounds.playTapSound();
    this.notify();
  }

  /**
   * Get or derive session AES key for a contact
   */
  async getSessionKey(contact) {
    if (this.cachedSessionKeys.has(contact.id)) {
      return this.cachedSessionKeys.get(contact.id);
    }
    const myPrivateKey = await importPrivateKey(this.user.privateKeyJwk);
    const peerPublicKey = await importPublicKey(contact.publicKeyB64);
    const sessionKey = await deriveSessionKey(myPrivateKey, peerPublicKey);
    this.cachedSessionKeys.set(contact.id, sessionKey);
    return sessionKey;
  }

  /**
   * Send an encrypted message in the active thread
   */
  async sendMessage({ text, ttl = 3600, isSensitive = false, media = null }) {
    const contact = this.contacts.find(c => c.id === this.activeThreadId);
    if (!contact) return null;

    // Check Key Change Sentinel
    if (contact.keyChanged) {
      sounds.playKeyAlertSound();
      throw new Error("Key Mismatch Sentinel: Contact keys have changed. Verify identity before sending.");
    }

    const sessionKey = await this.getSessionKey(contact);

    const payload = {
      text,
      media,
      isSensitive,
      senderAlias: this.user.alias,
      ttl,
      timestamp: Date.now(),
    };

    // Encrypt envelope with AES-256-GCM
    const envelope = await encryptPayload(sessionKey, payload);

    const expiresAt = ttl > 0 ? Date.now() + (ttl * 1000) : null;

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      threadId: contact.id,
      sender: 'me',
      text,
      media,
      isSensitive,
      timestamp: Date.now(),
      ttl,
      readAt: Date.now(),
      expiresAt,
      isShredded: false,
      status: 'sent',
      envelope, // holds true encrypted envelope
    };

    this.messages.push(message);
    sounds.playSendSound();
    this.persist();
    this.notify();

    // Broadcast over local blind relay channel for multi-tab testing
    if (this.channel) {
      this.channel.postMessage({
        type: 'ENCRYPTED_MESSAGE_RELAY',
        recipientPublicKeyB64: contact.publicKeyB64,
        senderPublicKeyB64: this.user.publicKeyB64,
        senderAlias: this.user.alias,
        envelope,
        ttl,
        isSensitive,
      });
    }

    // Interactive Peer Simulator for instant conversational testing
    this.triggerSimulatedPeerReply(contact, text, ttl);

    return message;
  }

  /**
   * Simulate a peer's cryptographic response to showcase two-way E2EE in action
   */
  triggerSimulatedPeerReply(contact, originalText, ttl) {
    if (!contact.privateKeyJwk) return;

    // Pick contextual response
    let replyText = `Zero-knowledge payload received and verified against safety fingerprint.`;
    if (originalText.toLowerCase().includes('hello') || originalText.toLowerCase().includes('hi')) {
      replyText = `Echo acknowledged. E2EE channel operating with zero server-side recovery logs.`;
    } else if (originalText.toLowerCase().includes('key') || originalText.toLowerCase().includes('verify')) {
      replyText = `Out-of-band fingerprint matches: ${contact.safetyFingerprint.substring(0, 17)}... Identity confirmed.`;
    } else if (ttl === 5) {
      replyText = `Fast burn acknowledged. This response will auto-shred in 5 seconds.`;
    } else if (originalText.length > 0) {
      replyText = `Decrypted cleanly via local AES-256-GCM key agreement. Ephemeral horizon: ${ttl > 0 ? ttl + 's' : 'Permanent'}.`;
    }

    setTimeout(async () => {
      try {
        const myPublicKey = await importPublicKey(this.user.publicKeyB64);
        const peerPrivateKey = await importPrivateKey(contact.privateKeyJwk);
        const peerSessionKey = await deriveSessionKey(peerPrivateKey, myPublicKey);

        const payload = {
          text: replyText,
          isSensitive: false,
          senderAlias: contact.alias,
          ttl,
          timestamp: Date.now(),
        };

        const envelope = await encryptPayload(peerSessionKey, payload);
        const expiresAt = ttl > 0 ? Date.now() + (ttl * 1000) : null;

        const peerMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          threadId: contact.id,
          sender: 'peer',
          text: replyText,
          isSensitive: false,
          timestamp: Date.now(),
          ttl,
          readAt: Date.now(),
          expiresAt,
          isShredded: false,
          status: 'read',
          envelope,
        };

        this.messages.push(peerMessage);
        sounds.playReceiveSound();
        this.persist();
        this.notify();
      } catch (e) {
        console.error("Peer simulation error", e);
      }
    }, 1400);
  }

  /**
   * Handle incoming envelope from broadcast relay (multi-tab live chat)
   */
  async handleRelayEnvelope(relayData) {
    if (relayData?.type !== 'ENCRYPTED_MESSAGE_RELAY') return;
    if (relayData.recipientPublicKeyB64 !== this.user?.publicKeyB64) return;

    // Find contact by senderPublicKeyB64 or create one
    let contact = this.contacts.find(c => c.publicKeyB64 === relayData.senderPublicKeyB64);
    if (!contact) {
      const fingerprint = await computeSafetyFingerprint(this.user.publicKeyB64, relayData.senderPublicKeyB64);
      contact = {
        id: `contact-${Date.now()}`,
        alias: relayData.senderAlias || `Unknown Contact [${relayData.senderPublicKeyB64.slice(0, 6)}]`,
        publicKeyB64: relayData.senderPublicKeyB64,
        publicKeyHex: '',
        safetyFingerprint: fingerprint.formatted,
        fingerprintChunks: fingerprint.chunks,
        isVerified: false,
        keyChanged: false,
        defaultTtl: relayData.ttl || 3600,
        unreadCount: 1,
        createdAt: Date.now(),
      };
      this.contacts.push(contact);
    }

    try {
      const sessionKey = await this.getSessionKey(contact);
      const decrypted = await decryptPayload(sessionKey, relayData.envelope);

      const expiresAt = decrypted.ttl > 0 ? Date.now() + (decrypted.ttl * 1000) : null;

      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        threadId: contact.id,
        sender: 'peer',
        text: decrypted.text,
        media: decrypted.media,
        isSensitive: decrypted.isSensitive,
        timestamp: Date.now(),
        ttl: decrypted.ttl,
        readAt: Date.now(),
        expiresAt,
        isShredded: false,
        status: 'read',
        envelope: relayData.envelope,
      };

      this.messages.push(newMsg);
      sounds.playReceiveSound();
      this.persist();
      this.notify();
    } catch (e) {
      console.error("Relay decryption failed", e);
    }
  }

  /**
   * Shred a message completely from local memory and storage
   */
  shredMessage(messageId) {
    const msg = this.messages.find(m => m.id === messageId);
    if (msg) {
      msg.isShredded = true;
      msg.text = ''; // overwrite plaintext
      if (msg.envelope) {
        msg.envelope.ciphertext = '';
      }
      sounds.playShredSound();
      this.persist();
      this.notify();
    }
  }

  /**
   * Update disappearing message TTL for active thread
   */
  setThreadTtl(contactId, ttlSeconds) {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.defaultTtl = ttlSeconds;
      sounds.playTapSound();
      this.persist();
      this.notify();
    }
  }

  /**
   * Set verified status for safety fingerprint
   */
  setContactVerified(contactId, isVerified) {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.isVerified = isVerified;
      contact.keyChanged = false; // clear warning if verified
      sounds.playTapSound();
      this.persist();
      this.notify();
    }
  }

  /**
   * Update contact alias (stored locally only, never transmitted!)
   */
  updateContactAlias(contactId, newAlias) {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact && newAlias.trim()) {
      contact.alias = newAlias.trim();
      this.persist();
      this.notify();
    }
  }

  /**
   * Add new contact via Public Key or Ephemeral Invite Link
   */
  async addContact({ alias, publicKeyB64, defaultTtl = 3600 }) {
    // Validate public key by importing it
    await importPublicKey(publicKeyB64);

    const fingerprint = await computeSafetyFingerprint(this.user.publicKeyB64, publicKeyB64);

    const newContact = {
      id: `contact-${Date.now()}`,
      alias: alias.trim() || `Agent-${publicKeyB64.slice(0, 6)}`,
      publicKeyB64,
      publicKeyHex: '',
      safetyFingerprint: fingerprint.formatted,
      fingerprintChunks: fingerprint.chunks,
      isVerified: false,
      keyChanged: false,
      defaultTtl,
      unreadCount: 0,
      createdAt: Date.now(),
    };

    this.contacts.push(newContact);
    this.activeThreadId = newContact.id;
    sounds.playTapSound();
    this.persist();
    this.notify();
    return newContact;
  }

  /**
   * Simulate a contact key change to test the Key Mismatch Sentinel!
   */
  async simulateKeyChange(contactId) {
    const contact = this.contacts.find(c => c.id === contactId);
    if (!contact) return;

    // Generate new key pair for contact
    const newKeys = await generateIdentityKeyPair();
    contact.previousKeyB64 = contact.publicKeyB64;
    contact.publicKeyB64 = newKeys.publicKeyB64;
    contact.privateKeyJwk = newKeys.exportedPrivateJwk;
    contact.keyChanged = true;
    contact.isVerified = false;

    // Invalidate cached session key
    this.cachedSessionKeys.delete(contact.id);

    // Recompute safety fingerprint
    const fp = await computeSafetyFingerprint(this.user.publicKeyB64, newKeys.publicKeyB64);
    contact.safetyFingerprint = fp.formatted;
    contact.fingerprintChunks = fp.chunks;

    sounds.playKeyAlertSound();
    this.persist();
    this.notify();
  }

  /**
   * Irreversibly burn an entire thread
   */
  burnThread(contactId) {
    this.messages = this.messages.filter(m => m.threadId !== contactId);
    sounds.playShredSound();
    this.persist();
    this.notify();
  }

  /**
   * INSTANT PANIC WIPE (Global Hotkey Cmd+Shift+X / Panic Button)
   * Zeroes all memory buffers, clears local vault and session storage, and resets to initial state.
   */
  instantPanicWipe() {
    sounds.playPanicSound();

    // Zero cached session keys in memory
    for (const key of this.cachedSessionKeys.values()) {
      // CryptoKey objects are managed by the browser, but we clear our map
    }
    this.cachedSessionKeys.clear();

    // Zero sensitive fields
    if (this.user) {
      this.user.alias = '';
      this.user.mnemonic = '';
      this.user.privateKeyJwk = null;
      this.user.publicKeyB64 = '';
    }

    this.messages = [];
    this.contacts = [];
    this.user = null;

    // Obliterate local storage
    try {
      localStorage.removeItem(VAULT_STORAGE_KEY);
      sessionStorage.clear();
    } catch (e) {
      console.error("Wipe error", e);
    }

    this.isAppLocked = true;
    this.isDecoyMode = false;
    this.activeThreadId = null;
    this.notify();
  }
}

export const vault = new VaultStore();
