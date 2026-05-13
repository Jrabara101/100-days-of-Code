<?php

declare(strict_types=1);

namespace VaultCLI\Repositories;

use PDO;
use VaultCLI\DTOs\BudgetDTO;

/**
 * SQLiteBudgetRepository – concrete PDO/SQLite implementation for budgets.
 */
class SQLiteBudgetRepository implements BudgetRepositoryInterface
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

    private function migrate(): void
    {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS budgets (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                category     TEXT    NOT NULL UNIQUE,
                limit_cents  INTEGER NOT NULL,
                created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        ");
    }

    public function save(BudgetDTO $dto): int
    {
        // UPSERT: update on duplicate category
        $stmt = $this->pdo->prepare("
            INSERT INTO budgets (category, limit_cents)
            VALUES (:category, :limit_cents)
            ON CONFLICT(category) DO UPDATE SET limit_cents = excluded.limit_cents
        ");
        $stmt->execute([
            ':category'    => $dto->category,
            ':limit_cents' => $dto->limitCents,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function findByCategory(string $category): ?BudgetDTO
    {
        $stmt = $this->pdo->prepare("SELECT * FROM budgets WHERE category = :cat");
        $stmt->execute([':cat' => $category]);
        $row = $stmt->fetch();
        return $row ? new BudgetDTO(
            category:   $row['category'],
            limitCents: (int) $row['limit_cents'],
            id:         (int) $row['id'],
        ) : null;
    }

    public function findAll(): array
    {
        $rows = $this->pdo->query("SELECT * FROM budgets ORDER BY category ASC")->fetchAll();
        return array_map(fn($r) => new BudgetDTO(
            category:   $r['category'],
            limitCents: (int) $r['limit_cents'],
            id:         (int) $r['id'],
        ), $rows);
    }

    public function delete(string $category): bool
    {
        $stmt = $this->pdo->prepare("DELETE FROM budgets WHERE category = :cat");
        $stmt->execute([':cat' => $category]);
        return $stmt->rowCount() > 0;
    }
}
