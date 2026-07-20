#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Resilient Employee Offboarding Checklist Engine
 * Usage:
 *   php offboard_system.php          (Interactive Operations Supervisor Dashboard)
 *   php offboard_system.php --cron   (Headless Background Automation Worker Node)
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Styling & TUI Layout Engine
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const DIM = "\e[2m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";
    const BLUE = "\e[34m";
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
        echo "\n" . self::DIM . "Press Enter to return to management console..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . $msg . self::RESET . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[OFFBOARD-WORKER] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'OFFBOARDED', 'COMPLETED' => self::GREEN . self::BOLD . " {$status}  " . self::RESET,
            'PENDING', 'RUNNING'      => self::YELLOW . "  {$status}  " . self::RESET,
            'STALLED', 'FAILED'       => self::RED . self::BOLD . "  {$status}  " . self::RESET,
            default                   => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No tracking parameters map to current workspace views.\n" . self::RESET;
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
// 2. Data Persistence Infrastructure (SQLite)
// ==========================================
class OffboardingRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/offboarding_pipeline.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Master Departure Directory
        $this->db->exec("CREATE TABLE IF NOT EXISTS exit_registry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            department TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING', -- PENDING, STALLED, OFFBOARDED
            exit_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Step Checklist Profile Ledger (Saga tracking maps)
        $this->db->exec("CREATE TABLE IF NOT EXISTS offboarding_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            step_name TEXT NOT NULL, -- REVOKE_ACCESS, RETRIEVE_ASSETS, TERMINATE_PAYROLL
            status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
            error_log TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES exit_registry(id),
            UNIQUE(employee_id, step_name)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_exit_status ON exit_registry(status)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_offboard_tasks ON offboarding_tasks(employee_id, status)");

        // Seed initial mock departure tokens if clean
        if ($this->db->query("SELECT COUNT(*) FROM exit_registry")->fetchColumn() == 0) {
            $this->registerDeparture('Tony Stark', 't.stark@starkintl.com', 'Executive Suite');
            $this->registerDeparture('Peter Parker', 'p.parker@dailybugle.net', 'Media Relations');
        }
    }

    public function registerDeparture(string $name, string $email, string $department): void {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("INSERT INTO exit_registry (name, email, department) VALUES (?, ?, ?)");
            $stmt->execute([trim($name), strtolower(trim($email)), trim($department)]);
            $employeeId = $this->db->lastInsertId();

            // Construct state checklist matrix allocations
            $steps = ['REVOKE_ACCESS', 'RETRIEVE_ASSETS', 'TERMINATE_PAYROLL'];
            $taskStmt = $this->db->prepare("INSERT INTO offboarding_tasks (employee_id, step_name) VALUES (?, ?)");
            foreach ($steps as $step) {
                $taskStmt->execute([$employeeId, $step]);
            }

            $this->db->commit();
        } catch (PDOException $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getOffboardingDirectory(): array {
        return $this->db->query("
            SELECT e.*, 
            COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_steps,
            COUNT(t.id) as total_steps
            FROM exit_registry e
            LEFT JOIN offboarding_tasks t ON e.id = t.employee_id
            GROUP BY e.id ORDER BY e.id DESC
        ")->fetchAll();
    }

    public function getSpecificChecklist(int $empId): array {
        $stmt = $this->db->prepare("SELECT * FROM offboarding_tasks WHERE employee_id = ? ORDER BY id ASC");
        $stmt->execute([$empId]);
        return $stmt->fetchAll();
    }

    public function getPendingRevocationTasks(): array {
        return $this->db->query("
            SELECT t.*, e.name, e.email, e.department, e.status as emp_status
            FROM offboarding_tasks t
            JOIN exit_registry e ON t.employee_id = e.id
            WHERE t.status != 'COMPLETED' AND e.status != 'OFFBOARDED'
            ORDER BY e.id ASC, t.id ASC
        ")->fetchAll();
    }

    public function updateTaskState(int $taskId, string $status, ?string $error = null): void {
        $stmt = $this->db->prepare("UPDATE offboarding_tasks SET status = ?, error_log = ?, updated_at = datetime('now') WHERE id = ?");
        $stmt->execute([$status, $error, $taskId]);
    }

    public function updateEmployeeState(int $empId, string $status): void {
        $stmt = $this->db->prepare("UPDATE exit_registry SET status = ? WHERE id = ?");
        $stmt->execute([$status, $empId]);
    }

    public function assessSagaCompletion(int $empId): void {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM offboarding_tasks WHERE employee_id = ? AND status != 'COMPLETED'");
        $stmt->execute([$empId]);
        $remaining = (int)$stmt->fetchColumn();

        $newStatus = ($remaining === 0) ? 'OFFBOARDED' : 'PENDING';
        $this->updateEmployeeState($empId, $newStatus);
    }
}

// ==========================================
// 3. Isolated Automated Step Infrastructure
// ==========================================
class SystemProvisioningService {
    public static function executeRevocation(string $stepName, array $employee): void {
        // Latency handling wrapper simulating secure external network API calls
        usleep(rand(100000, 250000));

        switch ($stepName) {
            case 'REVOKE_ACCESS':
                // Simulated API call terminating Active Directory, GitHub enterprise memberships, and corporate IAM lanes
                if ($employee['name'] === 'Peter Parker') {
                    throw new Exception("Revocation error: Access tokens locked due to an outstanding external agency security hold.");
                }
                break;

            case 'RETRIEVE_ASSETS':
                // Simulated logistics step tracking return courier receipt codes for corporate hardware assets
                break;

            case 'TERMINATE_PAYROLL':
                // Simulated secure transaction informing internal financial accounting ledger pipelines
                break;
        }
    }
}

// ==========================================
// 4. Core Framework Workflow Controller
// ==========================================
class OffboardingApp {
    private OffboardingRepository $repo;

    public function __construct() {
        $this->repo = new OffboardingRepository();
    }

    // --- INTERACTIVE TUI COMPONENT ---
    public function launchWorkspace(): void {
        while (true) {
            $directory = $this->repo->getOffboardingDirectory();
            CliUI::header("Secure Offboarding Operations Node", "Active Monitored Departures: " . count($directory));

            $tableData = [];
            foreach ($directory as $row) {
                $progress = $row['completed_steps'] . "/" . $row['total_steps'] . " Passed";
                $tableData[] = [
                    'id'         => $row['id'],
                    'name'       => $row['name'],
                    'dept'       => $row['department'],
                    'progress'   => $progress,
                    'status'     => CliUI::statusBadge($row['status'])
                ];
            }

            CliUI::drawTable($tableData, [
                'id' => 'ID', 'name' => 'Departing Identity Professional', 'dept' => 'Corporate Unit', 'progress' => 'Revocations', 'status' => 'Offboarding Status'
            ]);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Register New Employee Separation Directive (Initiate Saga Pipeline)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Inspect Employee Integrity Checklists\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Trigger Ad-Hoc Core Queue Router (Process Pipeline Steps)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Terminate terminal monitoring session\n\n";

            switch (CliUI::prompt("Select System Path Vector")) {
                case '1': $this->registerDepartureFlow(); break;
                case '2': $this->inspectChecklistFlow($directory); break;
                case '3': $this->processPendingChecklistSteps(false); CliUI::pause(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Security offboarding logs unmounted cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function registerDepartureFlow(): void {
        CliUI::header("Register Employee Separation Directive");
        $name = CliUI::prompt("Enter Employee Full Name");
        if (empty($name)) { CliUI::error("Identity fields cannot evaluate to null strings."); CliUI::pause(); return; }

        $email = CliUI::prompt("Enter Master Corporate Email");
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            CliUI::error("Malformed email syntax framework verification failure.");
            CliUI::pause();
            return;
        }

        $dept = CliUI::prompt("Enter Unit / Department Branch Location", "Cloud Operations");

        try {
            $this->repo->registerDeparture($name, $email, $dept);
            CliUI::success("Separation directive saved. Revocation tasks written to execution states.");
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                CliUI::error("A separation workflow context is already active for this email target.");
            } else {
                CliUI::error($e->getMessage());
            }
            CliUI::pause();
        }
    }

    private function inspectChecklistFlow(array $directory): void {
        CliUI::header("Inspect Employee Integrity Checklists");
        $id = (int)CliUI::prompt("Enter Target Employee ID");

        if (!in_array($id, array_column($directory, 'id'), true)) {
            CliUI::error("Target Employee identifier fails resolution validation matches.");
            CliUI::pause();
            return;
        }

        $tasks = $this->repo->getSpecificChecklist($id);
        $tableData = [];
        foreach ($tasks as $task) {
            $tableData[] = [
                'step'    => $task['step_name'],
                'status'  => CliUI::statusBadge($task['status']),
                'updated' => $task['updated_at'],
                'fault'   => $task['error_log'] ?: CliUI::DIM . "Clear - No Errors" . CliUI::RESET
            ];
        }

        CliUI::header("Compliance Checklist Tracking: Profile ID #{$id}", "Atomic State Progress");
        CliUI::drawTable($tableData, [
            'step' => 'Revocation Task Objective', 'status' => 'Current Status State', 'updated' => 'Timestamp (UTC)', 'fault' => 'Execution Error / Exception Footprint'
        ]);
        CliUI::pause();
    }

    // --- AUTOMATED HEADLESS PIPELINE WORKER ---
    public function processPendingChecklistSteps(bool $headlessMode = true): void {
        $prefix = $headlessMode ? "" : "Override Execution: ";
        if ($headlessMode) {
            CliUI::stepLog("Querying un-executed pipeline step indices across active separation profiles...");
        } else {
            echo "Executing automated isolation pipelines...\n";
        }

        $pendingBatch = $this->repo->getPendingRevocationTasks();
        $mutatedCount = 0;

        foreach ($pendingBatch as $task) {
            // Guard Matrix: If parent tracking row is stalled, protect task arrays from duplicate crash loops
            if ($task['emp_status'] === 'STALLED' && $task['status'] !== 'FAILED') {
                continue; 
            }

            try {
                // Trigger step task with strict Idempotency protections
                SystemProvisioningService::executeRevocation($task['step_name'], [
                    'name' => $task['name'],
                    'email' => $task['email'],
                    'department' => $task['department']
                ]);

                // Record successful transaction execution down to db states
                $this->repo->updateTaskState($task['id'], 'COMPLETED');
                $mutatedCount++;

                if ($headlessMode) {
                    CliUI::stepLog("Revocation pipeline step [{$task['step_name']}] parsed cleanly for Employee Reference #{$task['employee_id']}.");
                } else {
                    echo "  " . CliUI::GREEN . "✔" . CliUI::RESET . " Task [{$task['step_name']}] completed successfully for " . CliUI::BOLD . $task['name'] . CliUI::RESET . ".\n";
                }

            } catch (Exception $e) {
                // Isolation Pattern: Contain exceptions locally. Freeze profile without choking out queue processes.
                $this->repo->updateTaskState($task['id'], 'FAILED', $e->getMessage());
                $this->repo->updateEmployeeState($task['employee_id'], 'STALLED');

                $faultText = "Step [{$task['step_name']}] encountered execution exception on employee reference #{$task['employee_id']}. State set to STALLED. Reason: " . $e->getMessage();
                if ($headlessMode) {
                    CliUI::stepLog(CliUI::RED . "[COMPLIANCE ALERT] " . $faultText . CliUI::RESET);
                } else {
                    echo "  " . CliUI::RED . "✖ CRITICAL AUDIT FAULT: " . $faultText . CliUI::RESET . "\n";
                }
            }

            // Always recalculate if the employee's holistic saga has successfully completed
            $this->repo->assessSagaCompletion($task['employee_id']);

            usleep(50000); // 50ms throttling delay loop to preserve cloud provider bandwidth thresholds
        }

        $summaryText = "Queue iteration closed. Total revocation operations committed: {$mutatedCount}";
        if ($headlessMode) {
            CliUI::stepLog($summaryText);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $summaryText . CliUI::RESET . "\n";
        }
    }
}

// ==========================================
// 5. Global Runtime Engine Bootstrapper
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Monitoring Guard: Offboarding execution frameworks require standard console terminal processes.");
}

$app = new OffboardingApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--cron') {
    $app->processPendingChecklistSteps(true);
} else {
    $app->launchWorkspace();
}
