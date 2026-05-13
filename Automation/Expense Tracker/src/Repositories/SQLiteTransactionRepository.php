<?php

declare(strict_types=1);

namespace VaultCLI\Repositories;

use PDO;
use PDOException;
use VaultCLI\DTOs\TransactionDTO;
use VaultCLI\Enums\TransactionType;

/**
 * SQLiteTransactionRepository – concrete PDO/SQLite implementation.
 *
 * ════════════════════════════════════════════════════════════════════
 *  SECURITY: Prepared Statements
 * ════════════════════════════════════════════════════════════════════
 * Every query that accepts external input uses PDO::prepare() +
 * execute([$param]).  The SQL skeleton is compiled once by SQLite's
 * query planner; the bound parameters are NEVER interpolated into the
 * SQL string, eliminating SQL-injection surface entirely.
 *
 * Even in a local SQLite context this matters: if the DB file is ever
 * shared, backed up, or the tool is extended to accept network input,
 * the attack surface remains zero.
 *
 * ════════════════════════════════════════════════════════════════════
 *  PRECISION: Integer Cents Storage
 * ════════════════════════════════════════════════════════════════════
 * `amount_cents` is stored as INTEGER (int64 in SQLite).
 * SQLite's SUM(), MAX() etc. on INTEGER columns perform exact 64-bit
 * arithmetic – no IEEE-754 drift possible at the storage layer.
 * The only decimal conversion happens in the View/Render phase.
 */
class SQLiteTransactionRepository implements TransactionRepositoryInterface
{
    private PDO $pdo;

    public function __construct(string $dbPath)
    {
        $this->pdo = new PDO("sqlite:{$dbPath}", options: [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);

        $this->migrate();
    }

    // ─── Schema Migration ──────────────────────────────────────────────────────

    private function migrate(): void
    {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS transactions (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                type         TEXT    NOT NULL CHECK(type IN ('income','expense')),
                category     TEXT    NOT NULL,
                description  TEXT    NOT NULL,
                amount_cents INTEGER NOT NULL,
                date         TEXT    NOT NULL,
                tags         TEXT,
                created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions(date);
            CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
        ");
    }

    // ─── Write Operations ──────────────────────────────────────────────────────

    public function save(TransactionDTO $dto): int
    {
        if ($dto->id !== null) {
            // UPDATE path
            $stmt = $this->pdo->prepare("
                UPDATE transactions
                   SET type         = :type,
                       category     = :category,
                       description  = :description,
                       amount_cents = :amount_cents,
                       date         = :date,
                       tags         = :tags
                 WHERE id = :id
            ");
            $stmt->execute([
                ':type'         => $dto->type->value,
                ':category'     => $dto->category,
                ':description'  => $dto->description,
                ':amount_cents' => $dto->amountCents,
                ':date'         => $dto->date,
                ':tags'         => $dto->tags,
                ':id'           => $dto->id,
            ]);
            return $dto->id;
        }

        // INSERT path
        $stmt = $this->pdo->prepare("
            INSERT INTO transactions (type, category, description, amount_cents, date, tags)
            VALUES (:type, :category, :description, :amount_cents, :date, :tags)
        ");
        $stmt->execute([
            ':type'         => $dto->type->value,
            ':category'     => $dto->category,
            ':description'  => $dto->description,
            ':amount_cents' => $dto->amountCents,
            ':date'         => $dto->date,
            ':tags'         => $dto->tags,
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare("DELETE FROM transactions WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    // ─── Read Operations ───────────────────────────────────────────────────────

    public function findById(int $id): ?TransactionDTO
    {
        $stmt = $this->pdo->prepare("SELECT * FROM transactions WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ? $this->hydrate($row) : null;
    }

    public function findAll(int $limit = 20, int $offset = 0): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM transactions ORDER BY date DESC, id DESC LIMIT :limit OFFSET :offset"
        );
        // PDO::PARAM_INT required for LIMIT/OFFSET – bindValue is explicit here
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return array_map($this->hydrate(...), $stmt->fetchAll());
    }

    public function findByMonth(int $year, int $month): array
    {
        $prefix = sprintf('%04d-%02d', $year, $month);
        $stmt = $this->pdo->prepare(
            "SELECT * FROM transactions WHERE date LIKE :prefix ORDER BY date DESC"
        );
        $stmt->execute([':prefix' => $prefix . '%']);
        return array_map($this->hydrate(...), $stmt->fetchAll());
    }

    public function findByCategory(string $category): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM transactions WHERE category = :cat ORDER BY date DESC"
        );
        $stmt->execute([':cat' => $category]);
        return array_map($this->hydrate(...), $stmt->fetchAll());
    }

    // ─── Aggregations ─────────────────────────────────────────────────────────

    public function sumByCategory(int $year, int $month): array
    {
        $prefix = sprintf('%04d-%02d', $year, $month);
        $stmt = $this->pdo->prepare("
            SELECT   category,
                     SUM(amount_cents) AS total
            FROM     transactions
            WHERE    date LIKE :prefix
              AND    type = 'expense'
            GROUP BY category
            ORDER BY total DESC
        ");
        $stmt->execute([':prefix' => $prefix . '%']);
        return $stmt->fetchAll();
    }

    public function totalIncomeCents(int $year, int $month): int
    {
        $prefix = sprintf('%04d-%02d', $year, $month);
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(SUM(amount_cents), 0) AS total
            FROM   transactions
            WHERE  date LIKE :prefix AND type = 'income'
        ");
        $stmt->execute([':prefix' => $prefix . '%']);
        return (int) $stmt->fetchColumn();
    }

    public function totalExpenseCents(int $year, int $month): int
    {
        $prefix = sprintf('%04d-%02d', $year, $month);
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(SUM(amount_cents), 0) AS total
            FROM   transactions
            WHERE  date LIKE :prefix AND type = 'expense'
        ");
        $stmt->execute([':prefix' => $prefix . '%']);
        return (int) $stmt->fetchColumn();
    }

    // ─── Hydration ─────────────────────────────────────────────────────────────

    private function hydrate(array $row): TransactionDTO
    {
        return new TransactionDTO(
            amountCents:  (int) $row['amount_cents'],
            category:     $row['category'],
            description:  $row['description'],
            type:         TransactionType::from($row['type']),
            date:         $row['date'],
            tags:         $row['tags'] ?? null,
            id:           (int) $row['id'],
        );
    }
}
