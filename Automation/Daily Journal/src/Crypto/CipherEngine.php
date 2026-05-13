<?php

declare(strict_types=1);

namespace ChronoVault\Crypto;

use RuntimeException;

/**
 * CipherEngine — XChaCha20-Poly1305 AEAD Encryption/Decryption via Libsodium.
 *
 * ARCHITECTURAL REASONING:
 * ─────────────────────────────────────────────────────────────────────
 * XChaCha20-Poly1305 is an Authenticated Encryption with Associated Data
 * (AEAD) cipher. The term "AEAD" means this algorithm simultaneously:
 *
 *   1. ENCRYPTS  the plaintext (XChaCha20 stream cipher)
 *   2. AUTHENTICATES the ciphertext + associated data (Poly1305 MAC)
 *
 * The "associated data" (AD) is crucial here. We pass the entry's metadata
 * (id, date, mood, tags) as AD. This data is NOT encrypted — it lives in
 * SQLite in plaintext for fast querying — but it IS cryptographically bound
 * to the ciphertext. If an attacker modifies any AD (e.g., changes the mood
 * score in the DB), decryption will FAIL with an authentication error.
 * This makes the system tamper-evident without encrypting the metadata.
 *
 * WHY XChaCha20 over AES-GCM?
 *   - The "X" prefix means "extended nonce" — 192 bits instead of 96 bits.
 *   - With a 192-bit nonce, we can safely use random nonces for every
 *     encryption without worrying about nonce collision (2^96 vs 2^192).
 *   - AES-GCM requires hardware AES-NI acceleration to be safe from timing
 *     attacks. ChaCha20 is constant-time in pure software, making it
 *     safer on arbitrary server hardware.
 *
 * WIRE FORMAT (what gets stored in the database ciphertext column):
 * ┌─────────────────────┬─────────────────────────────────────────┐
 * │  NONCE (24 bytes)   │   CIPHERTEXT + AUTH TAG (variable len)  │
 * └─────────────────────┴─────────────────────────────────────────┘
 */
class CipherEngine
{
    /** Nonce length for XChaCha20-Poly1305 = 24 bytes */
    private const NONCE_BYTES = SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES;

    public function __construct(private readonly string $key)
    {
        if (strlen($key) !== SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_KEYBYTES) {
            throw new RuntimeException('Invalid key length. Key must be 32 bytes.');
        }
    }

    /**
     * Encrypts plaintext using XChaCha20-Poly1305 AEAD.
     *
     * @param string $plaintext      The journal body to encrypt.
     * @param string $associatedData Metadata JSON (authenticated but not encrypted).
     * @return string                Binary blob: nonce(24) + ciphertext + auth_tag.
     */
    public function encrypt(string $plaintext, string $associatedData = ''): string
    {
        // Generate a unique cryptographically random nonce for each encryption.
        // With 192-bit nonces, random generation is safe — the birthday bound
        // is 2^96, meaning you'd need to encrypt ~79 octillion entries before
        // a collision becomes probable. A journal entry per day for eternity is safe.
        $nonce = random_bytes(self::NONCE_BYTES);

        $ciphertext = sodium_crypto_aead_xchacha20poly1305_ietf_encrypt(
            message:        $plaintext,
            additional_data: $associatedData,
            nonce:          $nonce,
            key:            $this->key,
        );

        // Prepend nonce to ciphertext for storage. Nonce is not secret.
        return $nonce . $ciphertext;
    }

    /**
     * Decrypts a ciphertext blob produced by encrypt().
     *
     * @param string $blob           Binary nonce + ciphertext + auth_tag.
     * @param string $associatedData Must EXACTLY match the AD used during encryption.
     * @return string                The original plaintext.
     *
     * @throws RuntimeException      If authentication fails (tampered data/wrong key).
     */
    public function decrypt(string $blob, string $associatedData = ''): string
    {
        if (strlen($blob) <= self::NONCE_BYTES) {
            throw new RuntimeException('Ciphertext blob is too short — data may be corrupted.');
        }

        // Split the stored blob back into nonce and ciphertext.
        $nonce      = substr($blob, 0, self::NONCE_BYTES);
        $ciphertext = substr($blob, self::NONCE_BYTES);

        $plaintext = sodium_crypto_aead_xchacha20poly1305_ietf_decrypt(
            ciphertext:      $ciphertext,
            additional_data: $associatedData,
            nonce:           $nonce,
            key:             $this->key,
        );

        // Libsodium returns false on authentication failure (wrong key, tampered data).
        // We never expose the reason — a generic error prevents oracle attacks.
        if ($plaintext === false) {
            throw new RuntimeException(
                '🔐 Decryption failed. Wrong passphrase or the entry has been tampered with.'
            );
        }

        return $plaintext;
    }

    /**
     * Note on memory hygiene: sodium_memzero() requires a mutable reference
     * and cannot be called on a readonly property. PHP's GC will free the key
     * from memory when this object goes out of scope. For highest sensitivity,
     * instantiate CipherEngine in the narrowest possible scope so the key is
     * released as early as possible.
     */
    // __destruct intentionally omitted — readonly $key cannot be sodium_memzero'd.
}
