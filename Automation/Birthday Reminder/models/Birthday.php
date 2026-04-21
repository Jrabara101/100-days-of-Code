<?php
// ============================================================
// Birthday Model
// ============================================================

class Birthday extends Model
{
    protected string $table = 'birthdays';

    /**
     * List all active birthdays with optional search, month filter, and sort.
     */
    public function getAll(string $search = '', string $month = '', string $sort = 'upcoming'): array
    {
        $sql    = "SELECT * FROM birthdays WHERE is_active = 1";
        $params = [];

        if ($search !== '') {
            $like    = '%' . $search . '%';
            $sql    .= " AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)";
            $params  = array_merge($params, [$like, $like, $like]);
        }

        if ($month !== '') {
            $sql     .= " AND MONTH(date_of_birth) = ?";
            $params[] = (int)$month;
        }

        $sql .= match ($sort) {
            'name_asc'  => " ORDER BY full_name ASC",
            'name_desc' => " ORDER BY full_name DESC",
            'dob_asc'   => " ORDER BY MONTH(date_of_birth) ASC, DAY(date_of_birth) ASC",
            default     => $this->upcomingSortFragment(),
        };

        return $this->fetchAll($sql, $params);
    }

    /**
     * Get birthdays whose anniversary falls within the next $days days.
     */
    public function getUpcoming(int $days = 7): array
    {
        $sql = "SELECT *,
                    " . $this->daysLeftExpression() . " AS days_left
                FROM birthdays
                WHERE is_active = 1
                HAVING days_left BETWEEN 0 AND {$days}
                ORDER BY days_left ASC";

        return $this->fetchAll($sql);
    }

    /** Birthdays where month+day match today */
    public function getTodaysBirthdays(): array
    {
        return $this->fetchAll(
            "SELECT * FROM birthdays
             WHERE is_active = 1
               AND MONTH(date_of_birth) = MONTH(NOW())
               AND DAY(date_of_birth)   = DAY(NOW())"
        );
    }

    /** Next single upcoming birthday */
    public function getNextBirthday(): ?array
    {
        $rows = $this->fetchAll(
            "SELECT *, " . $this->daysLeftExpression() . " AS days_left
             FROM birthdays
             WHERE is_active = 1
             ORDER BY days_left ASC
             LIMIT 1"
        );
        return $rows[0] ?? null;
    }

    /** Birthday count per calendar month (for chart) */
    public function getMonthlyDistribution(): array
    {
        return $this->fetchAll(
            "SELECT MONTH(date_of_birth) AS month, COUNT(*) AS count
             FROM birthdays
             WHERE is_active = 1
             GROUP BY MONTH(date_of_birth)
             ORDER BY month ASC"
        );
    }

    // ─────────────────────────────────────────────
    // Counts
    // ─────────────────────────────────────────────

    public function countAll(): int
    {
        return (int)$this->fetchColumn("SELECT COUNT(*) FROM birthdays WHERE is_active = 1");
    }

    public function countToday(): int
    {
        return (int)$this->fetchColumn(
            "SELECT COUNT(*) FROM birthdays
             WHERE is_active = 1
               AND MONTH(date_of_birth) = MONTH(NOW())
               AND DAY(date_of_birth)   = DAY(NOW())"
        );
    }

    public function countUpcoming(int $days = 7): int
    {
        return count($this->getUpcoming($days));
    }

    // ─────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────

    public function create(array $data): int
    {
        return $this->insert(
            "INSERT INTO birthdays (full_name, date_of_birth, email, phone, custom_note)
             VALUES (?, ?, ?, ?, ?)",
            [
                $data['full_name'],
                $data['date_of_birth'],
                $data['email'],
                $data['phone']       ?: null,
                $data['custom_note'] ?: null,
            ]
        );
    }

    public function update(int $id, array $data): bool
    {
        return $this->execute(
            "UPDATE birthdays
             SET full_name=?, date_of_birth=?, email=?, phone=?, custom_note=?
             WHERE id = ?",
            [
                $data['full_name'],
                $data['date_of_birth'],
                $data['email'],
                $data['phone']       ?: null,
                $data['custom_note'] ?: null,
                $id,
            ]
        );
    }

    /** Soft-delete by setting is_active = 0 */
    public function softDelete(int $id): bool
    {
        return $this->execute("UPDATE birthdays SET is_active = 0 WHERE id = ?", [$id]);
    }

    /** All active birthdays for CSV export */
    public function getAllForExport(): array
    {
        return $this->fetchAll(
            "SELECT full_name, date_of_birth, email, phone, custom_note, created_at
             FROM birthdays WHERE is_active = 1 ORDER BY full_name ASC"
        );
    }

    // ─────────────────────────────────────────────
    // Internal SQL helpers
    // ─────────────────────────────────────────────

    private function daysLeftExpression(): string
    {
        return "CASE
            WHEN DAYOFYEAR(DATE(CONCAT(YEAR(NOW()),'-',LPAD(MONTH(date_of_birth),2,'0'),'-',LPAD(DAY(date_of_birth),2,'0')))) >= DAYOFYEAR(NOW())
            THEN DAYOFYEAR(DATE(CONCAT(YEAR(NOW()),'-',LPAD(MONTH(date_of_birth),2,'0'),'-',LPAD(DAY(date_of_birth),2,'0')))) - DAYOFYEAR(NOW())
            ELSE 365 - DAYOFYEAR(NOW()) + DAYOFYEAR(DATE(CONCAT(YEAR(NOW()),'-',LPAD(MONTH(date_of_birth),2,'0'),'-',LPAD(DAY(date_of_birth),2,'0'))))
        END";
    }

    private function upcomingSortFragment(): string
    {
        return " ORDER BY " . $this->daysLeftExpression() . " ASC";
    }
}
