/**
 * Zero-Knowledge Cryptographic Engine
 * Built on native Web Crypto API (SubtleCrypto)
 * - ECDH (P-256) for asymmetric key agreement
 * - HKDF-SHA256 for key derivation
 * - AES-256-GCM with unique 96-bit IVs for authenticated symmetric encryption
 * - SHA-256 iterated safety fingerprint generation (60 digits / 12 groups of 5)
 */

// Helper to convert ArrayBuffer to Base64
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to convert ArrayBuffer to Hex
export function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Memory zeroing security utility
export function zeroMemory(typedArray) {
  if (typedArray && typedArray.fill) {
    typedArray.fill(0);
  }
}

/**
 * Generate a new ECDH P-256 Identity Keypair
 */
export async function generateIdentityKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true, // extractable for local encrypted vault storage
    ["deriveKey", "deriveBits"]
  );

  const exportedPublic = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
  const exportedPrivate = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

  const publicKeyB64 = bufferToBase64(exportedPublic);
  const publicKeyHex = bufferToHex(exportedPublic);

  return {
    keyPair,
    publicKeyB64,
    publicKeyHex,
    exportedPrivateJwk: exportedPrivate,
  };
}

/**
 * Import a raw public key string (Base64) to a CryptoKey
 */
export async function importPublicKey(publicKeyB64) {
  const buffer = base64ToBuffer(publicKeyB64);
  return await window.crypto.subtle.importKey(
    "raw",
    buffer,
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    []
  );
}

/**
 * Import a private key JWK to a CryptoKey
 */
export async function importPrivateKey(privateKeyJwk) {
  return await window.crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

/**
 * Derive an AES-256-GCM symmetric session key from local Private Key and remote Public Key
 * using ECDH + HKDF (SHA-256)
 */
export async function deriveSessionKey(localPrivateKey, remotePublicKey) {
  // Derive raw shared secret bits
  const sharedBits = await window.crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: remotePublicKey
    },
    localPrivateKey,
    256
  );

  // Import shared bits into HKDF master key
  const hkdfKey = await window.crypto.subtle.importKey(
    "raw",
    sharedBits,
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  // Derive AES-GCM 256-bit key
  const salt = new TextEncoder().encode("SANCTUARY_V1_HKDF_SALT");
  const info = new TextEncoder().encode("SANCTUARY_AES_GCM_ENVELOPE");

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: info
    },
    hkdfKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );

  // Zero out the raw shared bits in memory immediately
  zeroMemory(new Uint8Array(sharedBits));

  return aesKey;
}

/**
 * Encrypt a message payload using AES-256-GCM with a fresh random 96-bit IV
 */
export async function encryptPayload(sessionKey, payloadObject) {
  const jsonStr = JSON.stringify(payloadObject);
  const encodedData = new TextEncoder().encode(jsonStr);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128
    },
    sessionKey,
    encodedData
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    timestamp: Date.now()
  };
}

/**
 * Decrypt an AES-256-GCM payload envelope
 */
export async function decryptPayload(sessionKey, envelope) {
  const ciphertextBuffer = base64ToBuffer(envelope.ciphertext);
  const ivBuffer = base64ToBuffer(envelope.iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
      tagLength: 128
    },
    sessionKey,
    ciphertextBuffer
  );

  const decodedStr = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decodedStr);
}

/**
 * Compute Interactive Safety Fingerprint (60-digit numerical chunks / 12 groups of 5)
 * Lexicographically sorts both public keys to guarantee symmetrical results on both ends
 */
export async function computeSafetyFingerprint(pubKeyA_B64, pubKeyB_B64) {
  const sorted = [pubKeyA_B64, pubKeyB_B64].sort();
  const combined = sorted[0] + ":" + sorted[1];
  const encoder = new TextEncoder();
  
  // Iterated hashing (5 rounds of SHA-256 for cryptographic separation)
  let currentHash = await window.crypto.subtle.digest("SHA-256", encoder.encode(combined));
  for (let i = 0; i < 4; i++) {
    currentHash = await window.crypto.subtle.digest("SHA-256", currentHash);
  }

  const hashBytes = new Uint8Array(currentHash);

  // Produce 60 numeric digits by deriving 12 large 5-digit chunks
  let numericString = "";
  for (let i = 0; i < 12; i++) {
    // Combine 2 bytes and normalize to 5 digits (00000 - 65535, modulo formatted)
    const val = (hashBytes[(i * 2) % hashBytes.length] << 8) | hashBytes[(i * 2 + 1) % hashBytes.length];
    const chunk = (val % 100000).toString().padStart(5, '0');
    numericString += chunk;
  }

  // Format into 12 chunks of 5 digits separated by spaces
  const chunks = [];
  for (let i = 0; i < 60; i += 5) {
    chunks.push(numericString.slice(i, i + 5));
  }

  return {
    rawNumeric: numericString,
    formatted: chunks.join(" "),
    chunks: chunks,
  };
}

/**
 * Generate a procedural cybernetic identicon SVG data URI from a public key string
 */
export function generateIdenticon(publicKeyStr, size = 64) {
  let hash = 0;
  for (let i = 0; i < publicKeyStr.length; i++) {
    hash = (hash << 5) - hash + publicKeyStr.charCodeAt(i);
    hash |= 0;
  }

  // Colors based on hash
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 137) % 360;
  const color1 = `hsl(${hue1}, 80%, 45%)`;
  const color2 = `hsl(${hue2}, 90%, 55%)`;

  // 4x4 symmetrical grid
  const cells = [];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 2; x++) {
      const bit = (Math.abs(hash) >> (y * 2 + x)) & 1;
      if (bit === 1) {
        cells.push([x, y]);
        cells.push([3 - x, y]); // symmetrical mirror
      }
    }
  }

  const rects = cells.map(([x, y]) => 
    `<rect x="${x * 14 + 4}" y="${y * 14 + 4}" width="12" height="12" rx="2" fill="${color2}" fill-opacity="0.9" />`
  ).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="12" fill="#0E1015" stroke="#1D222D" stroke-width="2"/>
    <circle cx="32" cy="32" r="26" fill="${color1}" fill-opacity="0.15" />
    ${rects}
    <circle cx="32" cy="32" r="3" fill="#10B981" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
