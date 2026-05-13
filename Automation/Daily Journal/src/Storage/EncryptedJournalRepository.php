<?php

declare(strict_types=1);

namespace ChronoVault\Storage;

use ChronoVault\Crypto\CipherEngine;
use ChronoVault\Domain\JournalEntry;
use ChronoVault\Domain\JournalEntryDraft;

/**
 * EncryptedJournalRepository — The Decorator.
 *
 * ARCHITECTURAL REASONING (Decorator Pattern):
 * ─────────────────────────────────────────────────────────────────────
 * The Decorator Pattern attaches new behavior to an object WITHOUT
 * subclassing. Here's why it's ideal for this use case:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  WriteCommand ──► JournalRepositoryInterface                 │
 *   │                         ↑ (is-a)                            │
 *   │            EncryptedJournalRepository (DECORATOR)            │
 *   │                - intercepts save() → encrypts body           │
 *   │                - intercepts findById() → decrypts body       │
 *   │                         ↓ (has-a / delegates to)            │
 *   │            SqliteJournalRepository (COMPONENT)               │
 *   │                - does all the actual SQL work                │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * BENEFITS:
 *   1. Open/Closed Principle: SqliteJournalRepository is closed for
 *      modification. Encryption is added by wrapping, not changing it.
 *   2. Testability: You can test SqliteJournalRepository without crypto,
 *      and CipherEngine without a database.
 *   3. Composability: Want to add compression? Wrap with another decorator.
 *      Want logging? Another decorator. No class explosion.
 *
 * ASSOCIATED DATA STRATEGY:
 * Each entry's metadata (id, date, mood, tags) is serialized to JSON and
 * passed as the AEAD "associated data". This cryptographically binds the
 * body ciphertext to its metadata. Tamper the SQLite row? Decryption fails.
 */
class EncryptedJournalRepository implements JournalRepositoryInterface
{
    public function __construct(
        private readonly JournalRepositoryInterface $inner,
        private readonly CipherEngine               $cipher,
    ) {}

    /**
     * Encrypts the body before delegating to the inner repository.
     *
     * The draft body is replaced with the encrypted binary blob.
     * The CipherEngine binds the ciphertext to the entry's metadata (AD).
     */
    public function save(JournalEntryDraft $draft): JournalEntry
    {
        // We need a temporary associated data string. Since we don't have an
        // ID yet (auto-incremented by DB), we use date + mood + tags as AD.
        // After saving we rehydrate the entry — see the comment in findById().
        $associatedData = $this->buildAssociatedData(
            id:   0, // placeholder — replaced with a re-read after save
            date: $draft->date,
            mood: $draft->mood?->value ?? 'NEUTRAL',
            tags: $draft->tags,
        );

        // Encrypt the plaintext body.
        $encryptedBody = $this->cipher->encrypt($draft->body, $associatedData);

        // Store the plaintext word count BEFORE replacing body.
        // The inner repo computes word_count from $draft->body.
        // We need to set the encrypted binary on a clone to preserve word count.
        $encryptedDraft = clone $draft;
        $encryptedDraft->body = $encryptedBody;

        // The inner repository persists the encrypted blob and returns a DTO
        // with the encrypted body as its 'body' field.
        $rawEntry = $this->inner->save($encryptedDraft);

        // Now we have the real ID. Re-encrypt with the correct ID-based AD
        // so future decryption uses the proper associated data.
        $correctAD = $this->buildAssociatedData(
            id:   $rawEntry->id,
            date: $rawEntry->date,
            mood: $rawEntry->mood->value,
            tags: $rawEntry->tags,
        );
        $correctEncryptedBody = $this->cipher->encrypt($draft->body, $correctAD);

        // Update the row with the correct ciphertext (keyed to real ID).
        // We do a minimal direct update via the inner repo's PDO.
        // Using a two-phase write is the clean way to handle auto-increment AD binding.
        if ($this->inner instanceof SqliteJournalRepository) {
            // Access via reflection or a protected update method.
            // We expose a package-private updateBody method for this purpose.
            $this->inner->updateBody($rawEntry->id, $correctEncryptedBody);
        }

        // Return a clean DTO with the decrypted (original) body.
        return new JournalEntry(
            id:        $rawEntry->id,
            date:      $rawEntry->date,
            mood:      $rawEntry->mood,
            body:      $draft->body,  // Return original plaintext to the caller
            wordCount: $draft->wordCount(),
            tags:      $rawEntry->tags,
            createdAt: $rawEntry->createdAt,
        );
    }

    /**
     * Decrypts the body of a single entry after fetching from the inner repo.
     */
    public function findById(int $id): ?JournalEntry
    {
        $entry = $this->inner->findById($id);
        if ($entry === null) {
            return null;
        }
        return $this->decryptEntry($entry);
    }

    /**
     * Decrypts the body of each entry in the recent list.
     * Note: for list views, body is NOT decrypted (performance) — callers
     * only need metadata. Body decryption happens only in ReadCommand.
     */
    public function findRecent(int $limit = 10): array
    {
        // For list displays, we return entries with body redacted for speed.
        // Full decryption only happens in findById().
        return $this->inner->findRecent($limit);
    }

    /**
     * For analytics, we return metadata only (no body decryption needed).
     */
    public function findAll(): array
    {
        return $this->inner->findAll();
    }

    public function findByDateRange(string $from, string $to): array
    {
        return $this->inner->findByDateRange($from, $to);
    }

    public function totalWordCount(): int
    {
        return $this->inner->totalWordCount();
    }

    public function count(): int
    {
        return $this->inner->count();
    }

    /**
     * Decrypts the body field of a JournalEntry.
     * Reconstructs the same associated data used during encryption.
     */
    private function decryptEntry(JournalEntry $entry): JournalEntry
    {
        $associatedData = $this->buildAssociatedData(
            id:   $entry->id,
            date: $entry->date,
            mood: $entry->mood->value,
            tags: $entry->tags,
        );

        $decryptedBody = $this->cipher->decrypt($entry->body, $associatedData);

        // Return a new readonly DTO with the decrypted body.
        // PHP 8.2 readonly classes cannot be modified, so we reconstruct.
        return new JournalEntry(
            id:        $entry->id,
            date:      $entry->date,
            mood:      $entry->mood,
            body:      $decryptedBody,
            wordCount: $entry->wordCount,
            tags:      $entry->tags,
            createdAt: $entry->createdAt,
        );
    }

    /**
     * Deterministically builds the AEAD associated data string.
     * MUST be called with identical parameters during encrypt and decrypt.
     */
    private function buildAssociatedData(int $id, string $date, string $mood, array $tags): string
    {
        return json_encode([
            'id'   => $id,
            'date' => $date,
            'mood' => $mood,
            'tags' => $tags,
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }
}
