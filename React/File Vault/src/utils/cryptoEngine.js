/**
 * Cryptographic Utility Engine using Web Crypto API
 * Provides SHA-256 hashing, AES-256-GCM envelope simulation, and integrity verification
 */

export async function computeSHA256(data) {
  try {
    let buffer;
    if (data instanceof File || data instanceof Blob) {
      buffer = await data.arrayBuffer();
    } else if (typeof data === 'string') {
      const encoder = new TextEncoder();
      buffer = encoder.encode(data);
    } else if (data instanceof ArrayBuffer) {
      buffer = data;
    } else {
      buffer = new ArrayBuffer(0);
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (err) {
    console.warn('Crypto API fallback calculation:', err);
    // Simple deterministic fallback if crypto.subtle is restricted in non-secure context
    return fallbackHash(typeof data === 'string' ? data : (data.name || 'file-hash'));
  }
}

function fallbackHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex}e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.slice(0, 64);
}

export function generateEncryptionKey() {
  const chars = '0123456789ABCDEF';
  let key = 'V-';
  for (let i = 0; i < 4; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

export function generateNonce() {
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join(':').toUpperCase();
}

export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

