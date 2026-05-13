<?php

declare(strict_types=1);

namespace ChronoVault\Storage;

use ChronoVault\Domain\JournalEntry;
use ChronoVault\Domain\JournalEntryDraft;
use ChronoVault\Domain\Mood;
use PDO;
use PDOException;
use RuntimeException;

/**
 * SqliteJournalRepository — Raw SQLite persistence layer.
 *
 * ARCHITECTURAL REASONING:
 * ─────────────────────────────────────────────────────────────────────
 * This class is intentionally "dumb" about encryption. It stores and
 * retrieves data as-is. Its ONLY responsibilities are:
 *   - SQLite schema management (auto-migration on first run)
 *   - Mapping domain objects ↔ SQL rows
 *   - Executing efficient queries
 *
 * The body column stores a BLOB — it will receive binary ciphertext from
 * the EncryptedJournalRepository decorator. This class never inspects the
 * body content, keeping the Single Responsibility Principle intact.
 *
 * Metadata columns (date, mood, word_count, tags) are stored in plaintext
 * for fast SQLite queries — enabling streak and analytics queries without
 * needing to decrypt anything. The CipherEngine binds the body ciphertext
 * to this metadata via AEAD "associated data", making any tampering detectable.
 */
class SqliteJournalRepository implements JournalRepositoryInterface
{
    private PDO $pdo;

    public function __construct(string $dbPath)
    {
        try {
            $this->pdo = new PDO(
                dsn:      "sqlite:{$dbPath}",
                options:  [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
            $this->migrate();
        } catch (PDOException $e) {
            throw new RuntimeException("Cannot open vault database: {$e->getMessage()}");
        }
    }

    /**
     * Ensures the database schema exists. Idempotent — safe to run on every boot.
     */
    private function migrate(): void
    {
        $this->pdo->exec(<<<SQL
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS journal_entries (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                date       TEXT    NOT NULL,
                mood       TEXT    NOT NULL,
                body       BLOB    NOT NULL,
                word_count INTEGER NOT NULL DEFAULT 0,
                tags       TEXT    NOT NULL DEFAULT '[]',
                created_at TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_entries_date ON journal_entries (date);
            CREATE INDEX IF NOT EXISTS idx_entries_mood ON journal_entries (mood);
        SQL);
    }

    public function save(JournalEntryDraft $draft): JournalEntry
    {
        $stmt = $this->pdo->prepare(<<<SQL
            INSERT INTO journal_entries (date, mood, body, word_count, tags, created_at)
            VALUES (:date, :mood, :body, :word_count, :tags, :created_at)
        SQL);

        $now = date('Y-m-d\TH:i:s');

        $stmt->execute([
            ':date'       => $draft->date,
            ':mood'       => $draft->mood?->value ?? Mood::NEUTRAL->value,
            ':body'       => $draft->body,
            ':word_count' => $draft->wordCount(),
            ':tags'       => json_encode($draft->tags, JSON_UNESCAPED_UNICODE),
            ':created_at' => $now,
        ]);

        $id = (int) $this->pdo->lastInsertId();

        return new JournalEntry(
            id:        $id,
            date:      $draft->date,
            mood:      $draft->mood ?? Mood::NEUTRAL,
            body:      $draft->body,
            wordCount: $draft->wordCount(),
            tags:      $draft->tags,
            createdAt: $now,
        );
    }

    public function findById(int $id): ?JournalEntry
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM journal_entries WHERE id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        return $row ? $this->hydrate($row) : null;
    }

    public function findRecent(int $limit = 10): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM journal_entries ORDER BY date DESC, id DESC LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map($this->hydrate(...), $stmt->fetchAll());
    }

    public function findAll(): array
    {
        $stmt = $this->pdo->query(
            'SELECT * FROM journal_entries ORDER BY date ASC, id ASC'
        );
        return array_map($this->hydrate(...), $stmt->fetchAll());
    }

    public function findByDateRange(string $from, string $to): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM journal_entries WHERE date BETWEEN :from AND :to ORDER BY date ASC'
        );
        $stmt->execute([':from' => $from, ':to' => $to]);
        return array_map($this->hydrate(...), $stmt->fetchAll());
    }

    public function totalWordCount(): int
    {
        return (int) $this->pdo->query('SELECT COALESCE(SUM(word_count), 0) FROM journal_entries')
            ->fetchColumn();
    }

    public function count(): int
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM journal_entries')
            ->fetchColumn();
    }

    /**
     * Updates the body column for a specific entry.
     * Used by EncryptedJournalRepository for the two-phase encryption write:
     * Phase 1 → insert row to get the auto-increment ID.
     * Phase 2 → re-encrypt body with the correct ID-bound associated data.
     */
    public function updateBody(int $id, string $body): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE journal_entries SET body = :body WHERE id = :id'
        );
        $stmt->execute([':body' => $body, ':id' => $id]);
    }

    /**
     * Maps a raw database row array to a JournalEntry DTO.
     * The body is returned as-is (binary blob) — the EncryptedRepository
     * will intercept this and decrypt it before returning to callers.
     */
    private function hydrate(array $row): JournalEntry
    {
        $tags = json_decode($row['tags'] ?? '[]', true) ?? [];

        return new JournalEntry(
            id:        (int) $row['id'],
            date:      $row['date'],
            mood:      Mood::from($row['mood']),
            body:      $row['body'],         // May be binary ciphertext at this stage
            wordCount: (int) $row['word_count'],
            tags:      $tags,
            createdAt: $row['created_at'],
        );
    }
}
