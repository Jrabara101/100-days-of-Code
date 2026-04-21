<?php
// ============================================================
// AutomationLog Model
// ============================================================

class AutomationLog extends Model
{
    protected string $table = 'automation_logs';

    /** Persist a cron run summary */
    public function logRun(array $data): int
    {
        return $this->insert(
            "INSERT INTO automation_logs
                (birthdays_checked, reminders_generated, reminders_sent, errors, execution_ms)
             VALUES (?, ?, ?, ?, ?)",
            [
                (int)($data['birthdays_checked']   ?? 0),
                (int)($data['reminders_generated'] ?? 0),
                (int)($data['reminders_sent']      ?? 0),
                !empty($data['errors']) ? json_encode($data['errors']) : null,
                (int)($data['execution_ms']        ?? 0),
            ]
        );
    }

    /** Retrieve most recent logs */
    public function getAll(int $limit = 100): array
    {
        return $this->fetchAll(
            "SELECT * FROM automation_logs ORDER BY run_at DESC LIMIT ?",
            [$limit]
        );
    }

    /** Most recent single log entry */
    public function getLast(): ?array
    {
        return $this->fetchOne(
            "SELECT * FROM automation_logs ORDER BY run_at DESC LIMIT 1"
        );
    }

    /** Total number of cron executions */
    public function getTotalRuns(): int
    {
        return (int)$this->fetchColumn("SELECT COUNT(*) FROM automation_logs");
    }

    /** Aggregate totals across all runs */
    public function getTotals(): array
    {
        return $this->fetchOne(
            "SELECT
                SUM(birthdays_checked)   AS total_checked,
                SUM(reminders_generated) AS total_generated,
                SUM(reminders_sent)      AS total_sent,
                AVG(execution_ms)        AS avg_ms
             FROM automation_logs"
        ) ?? [];
    }
}
