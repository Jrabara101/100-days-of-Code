#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Timesheet Approval Automation Engine
 * 
 * Usage:
 *   php timesheet_approval.php           (Interactive Manager Workspace)
 *   php timesheet_approval.php --auto    (Headless Auto-Approval Batch Daemon)
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
        echo self::CYAN . self::BOLD;
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
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[TIMESHEET-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'SUBMITTED'         => self::DIM . "   SUBMITTED   " . self::RESET,
            'PENDING_APPROVAL'  => self::BLUE . "  PENDING_MGR  " . self::RESET,
            'OVERTIME_FLAGGED'  => self::YELLOW . self::BOLD . " OT_FLAGGED!! " . self::RESET,
            'APPROVED'          => self::GREEN . self::BOLD . "   APPROVED    " . self::RESET,
            'REJECTED'          => self::RED . self::BOLD . "   REJECTED    " . self::RESET,
            default             => $status
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
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
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
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', $content);
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
// 2. Data Persistence Layer (SQLite Vault)
// ==========================================
class TimesheetRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/timesheet_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Users Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emp_code TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            hourly_rate REAL NOT NULL,
            role TEXT DEFAULT 'EMPLOYEE'
        )");

        // Timesheets Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS timesheets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timesheet_code TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            week_ending_date DATE NOT NULL,
            regular_hours REAL DEFAULT 0.0,
            overtime_hours REAL DEFAULT 0.0,
            total_hours REAL DEFAULT 0.0,
            calculated_pay REAL DEFAULT 0.0,
            status TEXT DEFAULT 'SUBMITTED', -- SUBMITTED, PENDING_APPROVAL, OVERTIME_FLAGGED, APPROVED, REJECTED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )");

        // Audit Trail Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS timesheet_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timesheet_id INTEGER NOT NULL,
            actor TEXT NOT NULL,
            action_taken TEXT NOT NULL,
            previous_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            signature_hash TEXT NOT NULL,
            notes TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (timesheet_id) REFERENCES timesheets(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_timesheet_status ON timesheets(status)");

        if ($this->db->query("SELECT COUNT(*) FROM users")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        $uStmt = $this->db->prepare("INSERT INTO users (emp_code, full_name, hourly_rate, role) VALUES (?, ?, ?, ?)");
        $uStmt->execute(['EMP-201', 'Alice Vance', 45.00, 'EMPLOYEE']);
        $uStmt->execute(['EMP-202', 'Marcus Brody', 38.00, 'EMPLOYEE']);
        $uStmt->execute(['EMP-203', 'Elena Fisher', 52.00, 'EMPLOYEE']);
        $uStmt->execute(['MGR-101', 'Arthur Pendelton', 65.00, 'MANAGER']);

        $weekEnding = date('Y-m-d', strtotime('next Sunday'));

        // Seed Timesheet 1: Standard 40 Hours (Clean auto-approval candidate)
        $this->submitTimesheet(1, $weekEnding, [8, 8, 8, 8, 8, 0, 0]);

        // Seed Timesheet 2: Overtime Breach (48 Hours - 8 hrs OT)
        $this->submitTimesheet(2, $weekEnding, [10, 10, 10, 10, 8, 0, 0]);

        // Seed Timesheet 3: Severe Overtime Breach (55 Hours)
        $this->submitTimesheet(3, $weekEnding, [12, 11, 10, 11, 11, 0, 0]);
    }

    public function submitTimesheet(int $userId, string $weekEnding, array $dailyHours): string {
        $user = $this->getUserById($userId);
        if (!$user) {
            throw new InvalidArgumentException("User ID {$userId} not found.");
        }

        $regular = 0.0;
        $overtime = 0.0;

        foreach ($dailyHours as $hrs) {
            $dayHours = (float)$hrs;
            if ($dayHours > 8.0) {
                $regular += 8.0;
                $overtime += ($dayHours - 8.0);
            } else {
                $regular += $dayHours;
            }
        }

        $totalHours = $regular + $overtime;
        
        // Calculate Gross Pay (1.5x Overtime Rate)
        $rate = (float)$user['hourly_rate'];
        $grossPay = ($regular * $rate) + ($overtime * $rate * 1.5);

        // Initial Routing Classification
        $initialStatus = ($overtime > 0.0 || $totalHours > 40.0) ? 'OVERTIME_FLAGGED' : 'PENDING_APPROVAL';
        $code = "TS-" . date('Ym') . "-" . rand(1000, 9999);

        $stmt = $this->db->prepare("
            INSERT INTO timesheets 
            (timesheet_code, user_id, week_ending_date, regular_hours, overtime_hours, total_hours, calculated_pay, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$code, $userId, $weekEnding, $regular, $overtime, $totalHours, $grossPay, $initialStatus]);
        $tsId = (int)$this->db->lastInsertId();

        $this->logAudit($tsId, $user['full_name'], 'SUBMITTED', 'NONE', $initialStatus, "Timesheet submitted. Total: {$totalHours}h (OT: {$overtime}h).");

        return $code;
    }

    public function getUserById(int $userId): ?array {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch() ?: null;
    }

    public function getPendingTimesheets(): array {
        return $this->db->query("
            SELECT t.*, u.full_name, u.emp_code, u.hourly_rate
            FROM timesheets t
            JOIN users u ON t.user_id = u.id
            WHERE t.status IN ('PENDING_APPROVAL', 'OVERTIME_FLAGGED')
            ORDER BY t.overtime_hours DESC, t.id ASC
        ")->fetchAll();
    }

    public function getGlobalRegistry(): array {
        return $this->db->query("
            SELECT t.id, t.timesheet_code, u.full_name, t.week_ending_date, 
                   t.regular_hours, t.overtime_hours, t.total_hours, t.calculated_pay, t.status
            FROM timesheets t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.id DESC LIMIT 30
        ")->fetchAll();
    }

    public function logAudit(int $tsId, string $actor, string $action, string $prevStatus, string $newStatus, string $notes): void {
        $sigPayload = "{$tsId}|{$actor}|{$action}|{$prevStatus}|{$newStatus}|" . microtime();
        $signature = hash('sha256', $sigPayload);

        $stmt = $this->db->prepare("
            INSERT INTO timesheet_audit_logs (timesheet_id, actor, action_taken, previous_status, new_status, signature_hash, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$tsId, $actor, $action, $prevStatus, $newStatus, $signature, $notes]);
    }

    public function getAuditTrail(int $tsId): array {
        $stmt = $this->db->prepare("SELECT * FROM timesheet_audit_logs WHERE timesheet_id = ? ORDER BY id ASC");
        $stmt->execute([$tsId]);
        return $stmt->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Domain Approval Engine
// ==========================================
class TimesheetApprovalEngine {
    public function __construct(private TimesheetRepository $repo) {}

    /**
     * Executes atomic approval transition.
     */
    public function approveTimesheet(int $tsId, string $actor = 'MANAGER'): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("SELECT * FROM timesheets WHERE id = ?");
            $stmt->execute([$tsId]);
            $ts = $stmt->fetch();

            if (!$ts) {
                $db->rollBack();
                return ['success' => false, 'message' => "Timesheet ID #{$tsId} not found."];
            }

            $currentStatus = $ts['status'];
            if (in_array($currentStatus, ['APPROVED', 'REJECTED'], true)) {
                $db->rollBack();
                return ['success' => false, 'message' => "Timesheet is already in a final state ({$currentStatus})."];
            }

            // Atomic status update (Idempotent Concurrency Guard)
            $update = $db->prepare("
                UPDATE timesheets 
                SET status = 'APPROVED', updated_at = datetime('now') 
                WHERE id = ? AND status = ?
            ");
            $update->execute([$tsId, $currentStatus]);

            if ($update->rowCount() === 0) {
                $db->rollBack();
                return ['success' => false, 'message' => "Concurrency Conflict: Timesheet status mutated during review."];
            }

            $notes = $currentStatus === 'OVERTIME_FLAGGED' 
                ? "Manager override sign-off for {$ts['overtime_hours']}h overtime." 
                : "Standard hours approved.";

            $this->repo->logAudit($tsId, $actor, 'APPROVED', $currentStatus, 'APPROVED', $notes);

            $db->commit();
            return ['success' => true, 'code' => $ts['timesheet_code'], 'status' => 'APPROVED'];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Auto-Approves clean timesheets with zero overtime.
     */
    public function autoApproveCleanTimesheets(): array {
        $pending = $this->repo->getPendingTimesheets();
        $approvedCount = 0;

        foreach ($pending as $ts) {
            if ($ts['status'] === 'PENDING_APPROVAL' && (float)$ts['overtime_hours'] === 0.0) {
                $res = $this->approveTimesheet((int)$ts['id'], 'AUTO_APPROVAL_BOT');
                if ($res['success']) {
                    $approvedCount++;
                }
            }
        }

        return ['auto_approved' => $approvedCount];
    }
}

// ==========================================
// 4. Main Application Console Loop
// ==========================================
class TimesheetConsoleApp {
    private TimesheetRepository $repo;
    private TimesheetApprovalEngine $engine;

    public function __construct() {
        $this->repo = new TimesheetRepository();
        $this->engine = new TimesheetApprovalEngine($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $pending = $this->repo->getPendingTimesheets();
            CliUI::header("Workforce Timesheet Approval Gateway", "Pending Approvals Backlog: " . count($pending));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Review & Approve Pending Queue (Manager Interface)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Run Auto-Approval Engine (Clear Clean 40h Timesheets)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Submit New Employee Timesheet (Ingestion Wizard)\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Output Global Timesheets Registry\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Audit Compliance Trail & SHA-256 Hashes\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect console\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->processPendingQueue(); break;
                case '2': $this->runAutoApproval(false); CliUI::pause(); break;
                case '3': $this->submitWizard(); break;
                case '4': $this->viewRegistry(); break;
                case '5': $this->auditTrailFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Timesheet vault unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    continue 2;
            }
        }
    }

    private function processPendingQueue(): void {
        CliUI::header("Pending Timesheet Approval Queue");
        $pending = $this->repo->getPendingTimesheets();

        if (empty($pending)) {
            CliUI::info("No pending timesheets require manager sign-off.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($pending as $t) {
            $tableData[] = [
                'id'       => $t['id'],
                'code'     => $t['timesheet_code'],
                'employee' => $t['full_name'],
                'regular'  => $t['regular_hours'] . "h",
                'overtime' => $t['overtime_hours'] > 0 ? CliUI::RED . $t['overtime_hours'] . "h" . CliUI::RESET : "0h",
                'gross'    => "$" . number_format((float)$t['calculated_pay'], 2),
                'badge'    => CliUI::statusBadge($t['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'code' => 'TS Code', 'employee' => 'Employee', 'regular' => 'Reg Hours', 'overtime' => 'Overtime', 'gross' => 'Gross Pay', 'badge' => 'Compliance State'
        ]);

        $tsId = (int)CliUI::prompt("Enter Timesheet ID to approve");
        $validIds = array_column($pending, 'id');

        if (!in_array($tsId, $validIds, true)) {
            CliUI::error("Invalid Timesheet ID selection.");
            CliUI::pause();
            return;
        }

        $res = $this->engine->approveTimesheet($tsId, 'MANAGER_ARTHUR');

        if ($res['success']) {
            CliUI::success("Timesheet {$res['code']} APPROVED successfully!");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function submitWizard(): void {
        CliUI::header("Submit New Employee Timesheet");
        
        $userId = (int)CliUI::prompt("Enter Employee ID (1=Alice, 2=Marcus, 3=Elena)");
        $user = $this->repo->getUserById($userId);

        if (!$user) {
            CliUI::error("Employee ID not found.");
            CliUI::pause();
            return;
        }

        $weekEnding = date('Y-m-d', strtotime('next Sunday'));
        echo "\n Entering daily hours for week ending " . CliUI::YELLOW . $weekEnding . CliUI::RESET . ":\n";

        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $dailyHours = [];

        foreach ($days as $day) {
            $hrs = (float)CliUI::prompt("  • {$day} Hours", "8");
            $dailyHours[] = $hrs;
        }

        try {
            $code = $this->repo->submitTimesheet($userId, $weekEnding, $dailyHours);
            CliUI::success("Timesheet {$code} submitted successfully for {$user['full_name']}!");
        } catch (Exception $e) {
            CliUI::error("Submission failed: " . $e->getMessage());
        }

        CliUI::pause();
    }

    private function viewRegistry(): void {
        CliUI::header("Global Timesheets Registry");
        $registry = $this->repo->getGlobalRegistry();

        $tableData = [];
        foreach ($registry as $t) {
            $tableData[] = [
                'id'       => $t['id'],
                'code'     => $t['timesheet_code'],
                'employee' => $t['full_name'],
                'total'    => $t['total_hours'] . "h",
                'gross'    => "$" . number_format((float)$t['calculated_pay'], 2),
                'badge'    => CliUI::statusBadge($t['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'code' => 'TS Code', 'employee' => 'Employee', 'total' => 'Total Hours', 'gross' => 'Gross Pay', 'badge' => 'Status'
        ]);

        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Compliance Audit Trail Extraction");
        $tsId = (int)CliUI::prompt("Enter Timesheet ID to extract compliance audit trail");

        $logs = $this->repo->getAuditTrail($tsId);
        if (empty($logs)) {
            CliUI::error("No audit logs found for that Timesheet ID.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL COMPLIANCE AUDIT TRAIL FOR TIMESHEET #{$tsId}:" . CliUI::RESET . "\n";
        foreach ($logs as $l) {
            $color = match($l['new_status']) {
                'APPROVED' => CliUI::GREEN,
                'OVERTIME_FLAGGED' => CliUI::YELLOW,
                default => CliUI::CYAN
            };

            echo "  ├─ [" . $l['timestamp'] . "] Actor: " . CliUI::BOLD . $l['actor'] . CliUI::RESET . "\n";
            echo "  │  Action Taken : " . $color . $l['action_taken'] . CliUI::RESET . "\n";
            echo "  │  Transition   : " . CliUI::DIM . $l['previous_status'] . CliUI::RESET . " ──> " . $color . $l['new_status'] . CliUI::RESET . "\n";
            echo "  │  SHA-256 Sig  : " . CliUI::YELLOW . substr($l['signature_hash'], 0, 16) . "..." . CliUI::RESET . "\n";
            echo "  │  Notes        : " . ($l['notes'] ?: 'None') . "\n";
        }
        echo "  └─ End of Sequence Analysis.\n";

        CliUI::pause();
    }

    public function runAutoApproval(bool $daemonMode = true): void {
        if ($daemonMode) {
            CliUI::stepLog("Initiating auto-approval pass for clean standard timesheets...");
        } else {
            echo "Executing auto-approval engine...\n";
        }

        $res = $this->engine->autoApproveCleanTimesheets();
        $msg = "Auto-approval pass complete. Clean 40h timesheets approved: {$res['auto_approved']}";

        if ($daemonMode) {
            CliUI::stepLog($msg);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $msg . CliUI::RESET . "\n";
        }
    }
}

// ==========================================
// 5. Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Timesheet engines require standard console CLI environments.\n");
}

$app = new TimesheetConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--auto') {
    $app->runAutoApproval(true);
} else {
    $app->launchWorkspace();
}
