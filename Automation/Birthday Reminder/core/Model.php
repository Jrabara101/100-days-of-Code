<?php
// ============================================================
// Base Model — PDO query helpers
// ============================================================

abstract class Model
{
    protected PDO $db;
    protected string $table;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─────────────────────────────────────────────
    // Core Query Helpers
    // ─────────────────────────────────────────────

    protected function query(string $sql, array $params = []): PDOStatement
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    protected function fetchAll(string $sql, array $params = []): array
    {
        return $this->query($sql, $params)->fetchAll();
    }

    protected function fetchOne(string $sql, array $params = []): ?array
    {
        $result = $this->query($sql, $params)->fetch();
        return $result ?: null;
    }

    protected function fetchColumn(string $sql, array $params = []): mixed
    {
        return $this->query($sql, $params)->fetchColumn();
    }

    protected function execute(string $sql, array $params = []): bool
    {
        return $this->query($sql, $params)->rowCount() > 0;
    }

    protected function insert(string $sql, array $params = []): int
    {
        $this->query($sql, $params);
        return (int)$this->db->lastInsertId();
    }

    // ─────────────────────────────────────────────
    // Generic Finders
    // ─────────────────────────────────────────────

    public function findById(int $id): ?array
    {
        return $this->fetchOne(
            "SELECT * FROM {$this->table} WHERE id = ?",
            [$id]
        );
    }

    public function deleteById(int $id): bool
    {
        return $this->execute(
            "DELETE FROM {$this->table} WHERE id = ?",
            [$id]
        );
    }
}
