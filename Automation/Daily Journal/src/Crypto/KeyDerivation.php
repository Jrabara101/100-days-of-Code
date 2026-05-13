<?php

declare(strict_types=1);

namespace ChronoVault\Crypto;

use RuntimeException;

/**
 * KeyDerivation — Argon2id password-to-key derivation using Libsodium.
 *
 * ARCHITECTURAL REASONING:
 * ─────────────────────────────────────────────────────────────────────
 * Raw passwords cannot be used as encryption keys because:
 *   1. They have low entropy (humans choose weak passwords)
 *   2. They vary in length (AES/XChaCha20 require exact key sizes)
 *   3. Without a salt, identical passwords produce identical keys (rainbow tables)
 *
 * Argon2id is the winner of the Password Hashing Competition (2015) and
 * is specifically designed to be memory-hard, making GPU/ASIC brute-force
 * attacks prohibitively expensive. The 'id' variant combines Argon2i
 * (side-channel resistant) and Argon2d (GPU-resistant) for maximum security.
 *
 * The 16-byte salt is random per-vault (generated once at init). It is
 * stored in plaintext alongside the vault database because:
 *   - It is NOT a secret; it just ensures unique keys per vault
 *   - Without it, you cannot derive the key to decrypt anything
 *
 * The #[\SensitiveParameter] attribute (PHP 8.2) marks $passphrase so that
 * if an exception is thrown inside this method, the PHP runtime REDACTS the
 * passphrase value from any generated stack traces — preventing accidental
 * credential leakage in logs or error outputs.
 */
class KeyDerivation
{
    /** Argon2id produces exactly 32 bytes — the required key length for XChaCha20. */
    private const KEY_BYTES = SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_KEYBYTES; // 32

    /** Salt length required by sodium_crypto_pwhash. */
    private const SALT_BYTES = SODIUM_CRYPTO_PWHASH_SALTBYTES; // 16

    private readonly string $saltFilePath;

    public function __construct(private readonly string $vaultDir)
    {
        $this->saltFilePath = $this->vaultDir . DIRECTORY_SEPARATOR . '.vault.salt';
    }

    /**
     * Derives a 32-byte encryption key from the user's passphrase using Argon2id.
     *
     * @param string $passphrase The master password — REDACTED from stack traces.
     * @return string            32-byte binary key.
     *
     * @throws RuntimeException  If sodium extension is missing or derivation fails.
     */
    public function deriveKey(#[\SensitiveParameter] string $passphrase): string
    {
        if (!extension_loaded('sodium')) {
            throw new RuntimeException(
                'ext-sodium is required. Install it with: apt install php8.2-sodium'
            );
        }

        $salt = $this->loadOrCreateSalt();

        // sodium_crypto_pwhash() is a C extension — named arguments are not supported.
        // Parameter order: length, passwd, salt, opslimit, memlimit [, alg]
        $key = sodium_crypto_pwhash(
            self::KEY_BYTES,
            $passphrase,
            $salt,
            SODIUM_CRYPTO_PWHASH_OPSLIMIT_INTERACTIVE,
            SODIUM_CRYPTO_PWHASH_MEMLIMIT_INTERACTIVE,
            SODIUM_CRYPTO_PWHASH_ALG_ARGON2ID13,
        );

        // Immediately wipe the passphrase from memory after derivation.
        sodium_memzero($passphrase);

        return $key;
    }

    /**
     * Generates and persists the vault salt on first run.
     * On subsequent runs, reads the existing salt.
     * The salt directory must be writable.
     */
    private function loadOrCreateSalt(): string
    {
        if (file_exists($this->saltFilePath)) {
            $salt = file_get_contents($this->saltFilePath);
            if ($salt === false || strlen($salt) !== self::SALT_BYTES) {
                throw new RuntimeException('Vault salt is corrupted. Cannot unlock vault.');
            }
            return $salt;
        }

        // First-time initialization: generate and persist a cryptographically
        // secure random salt using the OS's CSPRNG via Libsodium.
        $salt = random_bytes(self::SALT_BYTES);

        if (file_put_contents($this->saltFilePath, $salt) === false) {
            throw new RuntimeException("Cannot write salt file: {$this->saltFilePath}");
        }

        // Lock down file permissions on Unix systems (not writable/readable by others).
        if (PHP_OS_FAMILY !== 'Windows') {
            chmod($this->saltFilePath, 0600);
        }

        return $salt;
    }

    /**
     * Returns true if this vault has been initialized (salt exists).
     */
    public function isInitialized(): bool
    {
        return file_exists($this->saltFilePath);
    }
}
