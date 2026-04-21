<?php
// ============================================================
// Reminder Model
// ============================================================

class Reminder extends Model
{
    protected string $table = 'reminders';

    /**
     * All reminders with birthday info, supporting optional filters.
     *
     * @param array $filters  Keys: status, delivery_type, month
     */
    public function getAll(array $filters = []): array
    {
        $sql    = "SELECT r.*, b.full_name, b.date_of_birth, b.email
                   FROM reminders r
                   JOIN birthdays b ON b.id = r.birthday_id
                   WHERE 1=1";
        $params = [];

        if (!empty($filters['status'])) {
            $sql     .= " AND r.status = ?";
            $params[] = $filters['status'];
        }

        if (!empty($filters['delivery_type'])) {
            $sql     .= " AND r.delivery_type = ?";
            $params[] = $filters['delivery_type'];
        }

        if (!empty($filters['month'])) {
            $sql     .= " AND MONTH(b.date_of_birth) = ?";
            $params[] = (int)$filters['month'];
        }

        $sql .= " ORDER BY r.reminder_date DESC, r.created_at DESC";

        return $this->fetchAll($sql, $params);
    }

    /** Count reminders with a given status */
    public function countByStatus(string $status): int
    {
        return (int)$this->fetchColumn(
            "SELECT COUNT(*) FROM reminders WHERE status = ?",
            [$status]
        );
    }

    /** Most recent reminders for the dashboard activity widget */
    public function getRecent(int $limit = 10): array
    {
        return $this->fetchAll(
            "SELECT r.*, b.full_name, b.date_of_birth
             FROM reminders r
             JOIN birthdays b ON b.id = r.birthday_id
             ORDER BY r.created_at DESC
             LIMIT ?",
            [$limit]
        );
    }

    /**
     * Duplicate-prevention check used by cron script.
     * Returns true if a reminder already exists for this exact combination.
     */
    public function existsForBirthdayRuleDate(
        int    $birthdayId,
        int    $ruleId,
        string $reminderDate
    ): bool {
        $count = $this->fetchColumn(
            "SELECT COUNT(*) FROM reminders
             WHERE birthday_id = ? AND rule_id = ? AND reminder_date = ?",
            [$birthdayId, $ruleId, $reminderDate]
        );
        return (int)$count > 0;
    }

    /** Insert a new reminder record */
    public function create(array $data): int
    {
        return $this->insert(
            "INSERT INTO reminders
                (birthday_id, rule_id, reminder_date, status, delivery_type, message)
             VALUES (?, ?, ?, ?, ?, ?)",
            [
                (int)$data['birthday_id'],
                (int)$data['rule_id'],
                $data['reminder_date'],
                $data['status']        ?? 'pending',
                $data['delivery_type'],
                $data['message']       ?? null,
            ]
        );
    }

    /** Update reminder status, optionally recording sent timestamp */
    public function updateStatus(int $id, string $status, ?string $sentAt = null): bool
    {
        if ($sentAt !== null) {
            return $this->execute(
                "UPDATE reminders SET status = ?, sent_at = ? WHERE id = ?",
                [$status, $sentAt, $id]
            );
        }
        return $this->execute(
            "UPDATE reminders SET status = ? WHERE id = ?",
            [$status, $id]
        );
    }
}
