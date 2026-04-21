<?php
// ============================================================
// ReminderRule Model
// ============================================================

class ReminderRule extends Model
{
    protected string $table = 'reminder_rules';

    /** All rules attached to a given birthday */
    public function getByBirthdayId(int $birthdayId): array
    {
        return $this->fetchAll(
            "SELECT * FROM reminder_rules
             WHERE birthday_id = ?
             ORDER BY days_before ASC",
            [$birthdayId]
        );
    }

    /**
     * All active rules with their corresponding birthday data.
     * Used by the cron automation script.
     */
    public function getAllActiveWithBirthdays(): array
    {
        return $this->fetchAll(
            "SELECT
                rr.id            AS rule_id,
                rr.birthday_id,
                rr.days_before,
                rr.delivery_type,
                rr.is_recurring,
                rr.is_active,
                b.full_name,
                b.date_of_birth,
                b.email,
                b.phone,
                b.custom_note
             FROM reminder_rules rr
             JOIN birthdays b ON b.id = rr.birthday_id
             WHERE rr.is_active = 1
               AND b.is_active  = 1
             ORDER BY b.full_name ASC, rr.days_before ASC"
        );
    }

    /** Create a new rule */
    public function create(array $data): int
    {
        return $this->insert(
            "INSERT INTO reminder_rules (birthday_id, days_before, delivery_type, is_recurring)
             VALUES (?, ?, ?, ?)",
            [
                (int)$data['birthday_id'],
                (int)$data['days_before'],
                $data['delivery_type'],
                (int)$data['is_recurring'],
            ]
        );
    }

    /** Remove all rules associated with a birthday (call before re-creating on edit) */
    public function deleteByBirthdayId(int $birthdayId): void
    {
        $this->execute(
            "DELETE FROM reminder_rules WHERE birthday_id = ?",
            [$birthdayId]
        );
    }
}
