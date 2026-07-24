#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Atomic Appointment Booking & Reminder Engine
 * 
 * Usage:
 *   php appointment_system.php          (Interactive Manager Console)
 *   php appointment_system.php --cron   (Headless Background Reminder Dispatcher)
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Styling & TUI Layout Engine
// ==========================================
class CliUI {
    const RESET   = "\e[0m";
    const BOLD    = "\e[1m";
    const DIM     = "\e[2m";
    const GREEN   = "\e[32m";
    const RED     = "\e[31m";
    const CYAN    = "\e[36m";
    const YELLOW  = "\e[33m";
    const BLUE    = "\e[34m";
    const MAGENTA = "\e[35m";

    public static function clearScreen(): void { echo "\033[2J\033[;H"; }

    public static function header(string $title, string $subtitle = ""): void {
        self::clearScreen();
        echo self::MAGENTA . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        if ($subtitle) {
            echo "║ " . str_pad($subtitle, 71, " ", STR_PAD_BOTH) . " ║\n";
        }
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function prompt(string $message, string $default = ""): string {
        $defLabel = $default ? self::DIM . " [{$default}]" . self::RESET : "";
        echo self::BOLD . $message . $defLabel . self::RESET . ": ";
        $input = trim(fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main workspace..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[REMINDER-WORKER] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'SCHEDULED', 'SENT'   => self::GREEN . self::BOLD . " {$status} " . self::RESET,
            'PENDING', 'PROCESSING' => self::YELLOW . " {$status} " . self::RESET,
            'CANCELLED', 'FAILED' => self::RED . self::BOLD . " {$status} " . self::RESET,
            'COMPLETED'           => self::CYAN . " {$status} " . self::RESET,
            default               => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No tracking records match current query parameters.\n" . self::RESET;
            return;
        }

        $widths = array_map('strlen', $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $cleanString = preg_replace('#\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
                $widths[$key] = max($widths[$key], strlen($cleanString));
            }
        }

        $drawSeparator = function($l, $m, $r, $lineChar) use ($widths) {
            $segments = array_map(fn($w) => str_repeat($lineChar, $w + 2), $widths);
            echo $l . implode($m, $segments) . $r . "\n";
        };

        $drawSeparator("┌", "┬", "┐", "─");
        echo "│ ";
        foreach ($headers as $key => $label) {
            echo self::BOLD . self::CYAN . str_pad($label, $widths[$key]) . self::RESET . " │ ";
        }
        echo "\n";
        $drawSeparator("├", "┼", "┤", "─");

        foreach ($data as $row) {
            echo "│ ";
            foreach ($headers as $key => $label) {
                $content = (string)($row[$key] ?? '');
                $cleanString = preg_replace('#\x1b[[][^A-Za-z]*[A-Za-z]#', '', $content);
                $padding = str_repeat(" ", max(0, $widths[$key] - strlen($cleanString)));
                echo $content . $padding . " │ ";
            }
            echo "\n";
        }
        $drawSeparator("└", "┴", "┘", "─");
        echo "\n";
    }
}

// ==========================================
// 2. Data Persistence Layer (SQLite Isolation)
// ==========================================
class AppointmentRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/appointments_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Providers / Specialists Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialty TEXT NOT NULL
        )");

        // Appointments Master Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_id INTEGER NOT NULL,
            client_name TEXT NOT NULL,
            client_email TEXT NOT NULL,
            client_phone TEXT NOT NULL,
            appointment_time DATETIME NOT NULL, -- UTC ISO format
            status TEXT DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (provider_id) REFERENCES providers(id)
        )");

        // Atomic Double-Booking Protection: Unique partial constraint on active bookings
        $this->db->exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_time 
            ON appointments(provider_id, appointment_time) 
            WHERE status != 'CANCELLED'");

        // Reminders Task Queue
        $this->db->exec("CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appointment_id INTEGER NOT NULL,
            reminder_type TEXT NOT NULL, -- 24H, 1H
            scheduled_for DATETIME NOT NULL,
            status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSING, SENT, FAILED
            sent_at DATETIME DEFAULT NULL,
            error_log TEXT DEFAULT NULL,
            FOREIGN KEY (appointment_id) REFERENCES appointments(id),
            UNIQUE(appointment_id, reminder_type)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_due_reminders ON reminders(status, scheduled_for)");

        // Seed initial providers & sample appointments if database is empty
        if ($this->db->query("SELECT COUNT(*) FROM providers")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        $pStmt = $this->db->prepare("INSERT INTO providers (name, specialty) VALUES (?, ?)");
        $pStmt->execute(['Dr. Sarah Connor', 'Cardiology']);
        $pStmt->execute(['Dr. Miles Dyson', 'Neurology']);

        // Seed an appointment 30 minutes from now (triggers 1H reminder worker test)
        $time1 = date('Y-m-d H:i:s', strtotime('+30 minutes'));
        $this->bookAppointment(1, 'John Connor', 'j.connor@sky.net', '+1-555-0199', $time1);

        // Seed an appointment 48 hours from now
        $time2 = date('Y-m-d H:i:s', strtotime('+48 hours'));
        $this->bookAppointment(2, 'Marcus Wright', 'm.wright@cyberdyne.io', '+1-555-0142', $time2);
    }

    /**
     * Atomically books an appointment and builds reminder pipeline entries inside a single transaction.
     */
    public function bookAppointment(int $providerId, string $name, string $email, string $phone, string $utcTime): int {
        $this->db->beginTransaction();
        try {
            // 1. Insert appointment (Atomic constraint check against double-booking)
            $stmt = $this->db->prepare("
                INSERT INTO appointments (provider_id, client_name, client_email, client_phone, appointment_time) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$providerId, trim($name), strtolower(trim($email)), trim($phone), $utcTime]);
            $appId = (int)$this->db->lastInsertId();

            // 2. Schedule 24H and 1H reminders automatically
            $timeTs = strtotime($utcTime);
            $r24 = date('Y-m-d H:i:s', $timeTs - (24 * 3600));
            $r1  = date('Y-m-d H:i:s', $timeTs - (1 * 3600));

            $rStmt = $this->db->prepare("
                INSERT INTO reminders (appointment_id, reminder_type, scheduled_for) 
                VALUES (?, ?, ?)
            ");
            $rStmt->execute([$appId, '24H', $r24]);
            $rStmt->execute([$appId, '1H', $r1]);

            $this->db->commit();
            return $appId;

        } catch (PDOException $e) {
            $this->db->rollBack();
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                throw new DomainException("Slot Overbooking Blocked: Provider is already booked at {$utcTime} UTC.");
            }
            throw $e;
        }
    }

    public function getProviders(): array {
        return $this->db->query("SELECT * FROM providers ORDER BY id ASC")->fetchAll();
    }

    public function getUpcomingAppointments(): array {
        return $this->db->query("
            SELECT a.id, a.client_name, a.client_phone, a.appointment_time, a.status,
                   p.name as provider_name, p.specialty
            FROM appointments a
            JOIN providers p ON a.provider_id = p.id
            ORDER BY a.appointment_time ASC LIMIT 30
        ")->fetchAll();
    }

    public function getDueReminders(): array {
        return $this->db->query("
            SELECT r.id as reminder_id, r.reminder_type, r.scheduled_for,
                   a.id as appointment_id, a.client_name, a.client_email, a.client_phone, a.appointment_time,
                   p.name as provider_name
            FROM reminders r
            JOIN appointments a ON r.appointment_id = a.id
            JOIN providers p ON a.provider_id = p.id
            WHERE r.status = 'PENDING' 
              AND r.scheduled_for <= datetime('now')
              AND a.status = 'SCHEDULED'
            ORDER BY r.scheduled_for ASC
        ")->fetchAll();
    }

    public function markReminderStatus(int $reminderId, string $status, ?string $error = null): void {
        $stmt = $this->db->prepare("
            UPDATE reminders 
            SET status = ?, sent_at = CASE WHEN ? = 'SENT' THEN datetime('now') ELSE sent_at END, error_log = ? 
            WHERE id = ?
        ");
        $stmt->execute([$status, $status, $error, $reminderId]);
    }

    public function getRemindersLedger(): array {
        return $this->db->query("
            SELECT r.id, r.reminder_type, r.scheduled_for, r.status, r.sent_at,
                   a.client_name, p.name as provider_name
            FROM reminders r
            JOIN appointments a ON r.appointment_id = a.id
            JOIN providers p ON a.provider_id = p.id
            ORDER BY r.id DESC LIMIT 30
        ")->fetchAll();
    }

    public function cancelAppointment(int $appId): void {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("UPDATE appointments SET status = 'CANCELLED' WHERE id = ?");
            $stmt->execute([$appId]);

            // Cancel any pending reminders
            $rStmt = $this->db->prepare("UPDATE reminders SET status = 'FAILED', error_log = 'Appointment Cancelled' WHERE appointment_id = ? AND status = 'PENDING'");
            $rStmt->execute([$appId]);

            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}

// ==========================================
// 3. Notification Service Mock (SMS/Email Dispatcher)
// ==========================================
class ReminderDispatcherService {
    public static function dispatch(array $reminder): bool {
        // Simulate external SMS/Email gateway latency (100ms)
        usleep(100000);

        // Simulation edge-case: Fail if phone number ends with 0000
        if (str_ends_with($reminder['client_phone'], '0000')) {
            throw new RuntimeException("Carrier Gateway Rejected: Invalid SMS destination number.");
        }

        return true;
    }
}

// ==========================================
// 4. Main Application Controller Loop
// ==========================================
class AppointmentConsoleApp {
    private AppointmentRepository $repo;

    public function __construct() {
        $this->repo = new AppointmentRepository();
    }

    public function launchWorkspace(): void {
        while (true) {
            $appointments = $this->repo->getUpcomingAppointments();
            CliUI::header("Appointment Management & Reminder System", "Active Schedules Index: " . count($appointments));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Book New Appointment (Interactive Wizard)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " View Upcoming Appointments Schedule\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Run Reminder Dispatcher Pass (Trigger Queue Worker)\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Inspect Reminders Audit Ledger\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Cancel Existing Appointment\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect application session\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->bookWizard(); break;
                case '2': $this->viewAppointments(); break;
                case '3': $this->processReminders(false); CliUI::pause(); break;
                case '4': $this->viewRemindersLedger(); break;
                case '5': $this->cancelWizard(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Appointment engine disconnected safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    continue 2;
            }
        }
    }

    private function bookWizard(): void {
        CliUI::header("Book New Appointment Wizard");
        $providers = $this->repo->getProviders();

        echo " Available Specialists:\n";
        foreach ($providers as $p) {
            echo "  [{$p['id']}] {$p['name']} (" . CliUI::CYAN . $p['specialty'] . CliUI::RESET . ")\n";
        }
        echo "\n";

        $pId = (int)CliUI::prompt("Select Specialist ID");
        $validPids = array_column($providers, 'id');
        if (!in_array($pId, $validPids, true)) {
            CliUI::error("Invalid Specialist selection.");
            CliUI::pause();
            return;
        }

        $clientName = CliUI::prompt("Client Full Name");
        if (empty($clientName)) { CliUI::error("Client name is required."); CliUI::pause(); return; }

        $clientEmail = CliUI::prompt("Client Email Address");
        $clientPhone = CliUI::prompt("Client Phone Number (SMS)");

        echo "\n Date/Time Format Example: " . CliUI::YELLOW . "+2 hours" . CliUI::RESET . " or " . CliUI::YELLOW . "2026-08-10 14:00" . CliUI::RESET . "\n";
        $timeInput = CliUI::prompt("Appointment Time (UTC)");

        $parsedTs = strtotime($timeInput);
        if ($parsedTs === false || $parsedTs < time()) {
            CliUI::error("Invalid or past date time provided.");
            CliUI::pause();
            return;
        }

        $utcFormatted = date('Y-m-d H:i:s', $parsedTs);

        try {
            $appId = $this->repo->bookAppointment($pId, $clientName, $clientEmail, $clientPhone, $utcFormatted);
            CliUI::success("Appointment #{$appId} booked & reminders scheduled for {$utcFormatted} UTC!");
        } catch (DomainException $e) {
            CliUI::error($e->getMessage());
        } catch (Exception $e) {
            CliUI::error("Database Error: " . $e->getMessage());
        }

        CliUI::pause();
    }

    private function viewAppointments(): void {
        CliUI::header("Upcoming Appointments Schedule");
        $appointments = $this->repo->getUpcomingAppointments();

        $tableData = [];
        foreach ($appointments as $a) {
            $tableData[] = [
                'id'        => $a['id'],
                'client'    => $a['client_name'] . " (" . $a['client_phone'] . ")",
                'provider'  => $a['provider_name'],
                'time_utc'  => $a['appointment_time'] . " UTC",
                'status'    => CliUI::statusBadge($a['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'client' => 'Client Contact', 'provider' => 'Specialist', 'time_utc' => 'Scheduled Time', 'status' => 'Status'
        ]);

        CliUI::pause();
    }

    public function processReminders(bool $headlessMode = true): void {
        if ($headlessMode) {
            CliUI::stepLog("Querying due reminder queue tasks...");
        } else {
            echo "Executing reminder dispatch pass...\n";
        }

        $due = $this->repo->getDueReminders();
        if (empty($due)) {
            if ($headlessMode) {
                CliUI::stepLog("No due reminders to dispatch.");
            } else {
                CliUI::info("No reminders are currently due for dispatch.");
            }
            return;
        }

        $dispatched = 0;
        foreach ($due as $reminder) {
            try {
                // Mark as processing
                $this->repo->markReminderStatus((int)$reminder['reminder_id'], 'PROCESSING');

                // Send via external service
                ReminderDispatcherService::dispatch($reminder);

                // Update status to SENT
                $this->repo->markReminderStatus((int)$reminder['reminder_id'], 'SENT');
                $dispatched++;

                $msg = "Reminder [{$reminder['reminder_type']}] sent to {$reminder['client_name']} ({$reminder['client_phone']}) for appt with {$reminder['provider_name']}.";
                if ($headlessMode) {
                    CliUI::stepLog($msg);
                } else {
                    echo "  " . CliUI::GREEN . "✔" . CliUI::RESET . " " . $msg . "\n";
                }

            } catch (Exception $e) {
                $this->repo->markReminderStatus((int)$reminder['reminder_id'], 'FAILED', $e->getMessage());
                $errMsg = "Reminder #{$reminder['reminder_id']} failed: " . $e->getMessage();
                if ($headlessMode) {
                    CliUI::stepLog(CliUI::RED . $errMsg . CliUI::RESET);
                } else {
                    echo "  " . CliUI::RED . "✖ " . $errMsg . CliUI::RESET . "\n";
                }
            }

            usleep(50000); // 50ms pause between messages
        }

        $summary = "Reminder processing complete. Dispatched: {$dispatched} / " . count($due);
        if ($headlessMode) {
            CliUI::stepLog($summary);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $summary . CliUI::RESET . "\n";
        }
    }

    private function viewRemindersLedger(): void {
        CliUI::header("Reminders Queue & Audit Ledger");
        $ledger = $this->repo->getRemindersLedger();

        $tableData = [];
        foreach ($ledger as $r) {
            $tableData[] = [
                'id'        => $r['id'],
                'type'      => $r['reminder_type'],
                'client'    => $r['client_name'],
                'scheduled' => $r['scheduled_for'],
                'sent_at'   => $r['sent_at'] ?: CliUI::DIM . "Pending" . CliUI::RESET,
                'status'    => CliUI::statusBadge($r['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'type' => 'Type', 'client' => 'Client', 'scheduled' => 'Scheduled For (UTC)', 'sent_at' => 'Dispatched At', 'status' => 'Status'
        ]);

        CliUI::pause();
    }

    private function cancelWizard(): void {
        CliUI::header("Cancel Appointment");
        $appId = (int)CliUI::prompt("Enter Appointment ID to cancel");

        try {
            $this->repo->cancelAppointment($appId);
            CliUI::success("Appointment #{$appId} has been cancelled and pending reminders purged.");
        } catch (Exception $e) {
            CliUI::error("Failed to cancel: " . $e->getMessage());
        }

        CliUI::pause();
    }
}

// ==========================================
// 5. Execution Routing Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Error: This system must be run from a command-line terminal.\n");
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === realpath(__FILE__)) {
    $app = new AppointmentConsoleApp();
    $mode = $argv[1] ?? 'dashboard';

    if ($mode === '--cron') {
        $app->processReminders(true);
    } else {
        $app->launchWorkspace();
    }
}
