#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Resilient Employee Onboarding Automation Saga
 * * Usage:
 * php onboard_automation.php          (Interactive Supervisor Dashboard)
 * php onboard_automation.php --cron   (Headless Background Automation Worker Node)
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
        echo "\n" . self::DIM . "Press Enter to return to main tracking panel..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . $msg . self::RESET . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[SAGA-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'ACTIVE', 'COMPLETED' => self::GREEN . self::BOLD . "  {$status}  " . self::RESET,
            'PENDING', 'RUNNING'  => self::YELLOW . "  {$status}  " . self::RESET,
            'STALLED', 'FAILED'   => self::RED . self::BOLD . "  {$status}  " . self::RESET,
            default               => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No tracking records match current system queries.\n" . self::RESET;
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
class OnboardingRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/onboarding_saga.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Master Employees Directory Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            department TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING', -- PENDING, ACTIVE, STALLED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Stateful Steps Checklist (Saga task-state)
        $this->db->exec("CREATE TABLE IF NOT EXISTS onboarding_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            step_name TEXT NOT NULL, -- EMAIL_PROVISION, ASSET_ALLOCATION, ORIENTATION_SCHEDULE
            status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
            error_message TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            UNIQUE(employee_id, step_name)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_employee_status ON employees(status)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_task_lookup ON onboarding_tasks(employee_id, status)");

        // Auto-seed sandbox records on first runtime load
        if ($this->db->query("SELECT COUNT(*) FROM employees")->fetchColumn() == 0) {
            $this->enrollEmployee('Wade Wilson', 'w.wilson@weaponx.corp', 'R&D');
            $this->enrollEmployee('Logan Howlett', 'l.howlett@weaponx.corp', 'Field Operations');
        }
    }

    public function enrollEmployee(string $name, string $email, string $department): void {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("INSERT INTO employees (name, email, department) VALUES (?, ?, ?)");
            $stmt->execute([trim($name), strtolower(trim($email)), trim($department)]);
            $employeeId = $this->db->lastInsertId();

            // Auto-provision step matrix checklists for state-machine execution
            $steps = ['EMAIL_PROVISION', 'ASSET_ALLOCATION', 'ORIENTATION_SCHEDULE'];
            $taskStmt = $this->db->prepare("INSERT INTO onboarding_tasks (employee_id, step_name) VALUES (?, ?)");
            foreach ($steps as $step) {
                $taskStmt->execute([$employeeId, $step]);
            }

            $this->db->commit();
        } catch (PDOException $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getActiveOnboardingRegistry(): array {
        return $this->db->query("
            SELECT e.*, 
            COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_steps,
            COUNT(t.id) as total_steps
            FROM employees e
            LEFT JOIN onboarding_tasks t ON e.id = t.employee_id
            GROUP BY e.id ORDER BY e.id DESC
        ")->fetchAll();
    }

    public function getEmployeeTasks(int $empId): array {
        $stmt = $this->db->prepare("SELECT * FROM onboarding_tasks WHERE employee_id = ? ORDER BY id ASC");
        $stmt->execute([$empId]);
        return $stmt->fetchAll();
    }

    public function getPendingOnboardingTasks(): array {
        return $this->db->query("
            SELECT t.*, e.name, e.email, e.department, e.status as emp_status
            FROM onboarding_tasks t
            JOIN employees e ON t.employee_id = e.id
            WHERE t.status != 'COMPLETED' AND e.status != 'ACTIVE'
            ORDER BY e.id ASC, t.id ASC
        ")->fetchAll();
    }

    public function updateTaskStatus(int $taskId, string $status, ?string $error = null): void {
        $stmt = $this->db->prepare("UPDATE onboarding_tasks SET status = ?, error_message = ?, updated_at = datetime('now') WHERE id = ?");
        $stmt->execute([$status, $error, $taskId]);
    }

    public function updateEmployeeStatus(int $empId, string $status): void {
        $stmt = $this->db->prepare("UPDATE employees SET status = ? WHERE id = ?");
        $stmt->execute([$status, $empId]);
    }

    public function verifyEmployeeSagaCompletion(int $empId): void {
        // Audit check: Are all tasks for this employee completed?
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM onboarding_tasks WHERE employee_id = ? AND status != 'COMPLETED'");
        $stmt->execute([$empId]);
        $remaining = (int)$stmt->fetchColumn();

        $newStatus = ($remaining === 0) ? 'ACTIVE' : 'PENDING';
        $this->updateEmployeeStatus($empId, $newStatus);
    }
}

// ==========================================
// 3. Saga Steps Automated Business Logic Services
// ==========================================
class ProvisioningService {
    public static function executeStep(string $stepName, array $employee): void {
        // Simulate minor variable latency of network calls (TCP handshakes / SaaS invites)
        usleep(rand(100000, 300000));

        switch ($stepName) {
            case 'EMAIL_PROVISION':
                // Simulated API call to Google Workspace/Exchange Directory
                if ($employee['name'] === 'Logan Howlett') {
                    throw new Exception("Provisioning rejected: Identity background verification lookup failed at external WeaponX agency servers.");
                }
                break;

            case 'ASSET_ALLOCATION':
                // Simulated logistics API request allocating corporate laptop & hardware security keys
                break;

            case 'ORIENTATION_SCHEDULE':
                // Simulated calendar API scheduling the corporate legal & compliance briefing
                break;
        }
    }
}

// ==========================================
// 4. Core System Pipeline Controller
// ==========================================
class OnboardingAutomationApp {
    private OnboardingRepository $repo;

    public function __construct() {
        $this->repo = new OnboardingRepository();
    }

    // --- WORKSPACE EXECUTIVE TUI ---
    public function runWorkspace(): void {
        while (true) {
            $employees = $this->repo->getActiveOnboardingRegistry();
            CliUI::header("Enterprise Onboarding Saga Controller", "Current Monitored Talents: " . count($employees));

            $tableData = [];
            foreach ($employees as $row) {
                $progress = $row['completed_steps'] . "/" . $row['total_steps'] . " Steps";
                $tableData[] = [
                    'id'         => $row['id'],
                    'name'       => $row['name'],
                    'dept'       => $row['department'],
                    'progress'   => $progress,
                    'status'     => CliUI::statusBadge($row['status'])
                ];
            }

            CliUI::drawTable($tableData, [
                'id' => 'ID', 'name' => 'Talent / Professional', 'dept' => 'Assigned Unit', 'progress' => 'Milestones', 'status' => 'Saga Pipeline Status'
            ]);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Enroll New Employee (Initiate Saga Pipeline)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Inspect Employee Specific Onboarding Checklist\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Trigger Ad-Hoc Queue Runner (Saga Step Processor)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Severe workspace server connections\n\n";

            switch (CliUI::prompt("Select Action Route")) {
                case '1': $this->enrollEmployeeFlow(); break;
                case '2': $this->inspectEmployeeFlow($employees); break;
                case '3': $this->processPendingSagaTasks(false); CliUI::pause(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Operations tracking nodes closed cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function enrollEmployeeFlow(): void {
        CliUI::header("Enroll New Employee");
        $name = CliUI::prompt("Enter Employee Full Name");
        if (empty($name)) { CliUI::error("Employee identity cannot evaluate to blank parameter strings."); CliUI::pause(); return; }

        $email = CliUI::prompt("Enter Personal Email");
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            CliUI::error("Invalid corporate/personal email syntax structure.");
            CliUI::pause();
            return;
        }

        $dept = CliUI::prompt("Enter Department / Unit", "Engineering Operations");

        try {
            $this->repo->enrollEmployee($name, $email, $dept);
            CliUI::success("Employee profile initialized. Verification steps populated and locked to state-machine.");
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                CliUI::error("An identity account with that email address already exists.");
            } else {
                CliUI::error($e->getMessage());
            }
            CliUI::pause();
        }
    }

    private function inspectEmployeeFlow(array $employees): void {
        CliUI::header("Inspect Employee Onboarding Checklist");
        $id = (int)CliUI::prompt("Enter Employee ID");

        $validIds = array_column($employees, 'id');
        if (!in_array($id, $validIds, true)) {
            CliUI::error("Target Employee ID cannot be resolved.");
            CliUI::pause();
            return;
        }

        $tasks = $this->repo->getEmployeeTasks($id);
        $tableData = [];
        foreach ($tasks as $task) {
            $tableData[] = [
                'step'    => $task['step_name'],
                'status'  => CliUI::statusBadge($task['status']),
                'updated' => $task['updated_at'],
                'fault'   => $task['error_message'] ?: CliUI::DIM . "None" . CliUI::RESET
            ];
        }

        CliUI::header("Detailed Checklist: Employee #{$id}", "Chronological Task Allocation");
        CliUI::drawTable($tableData, [
            'step' => 'Onboarding Step', 'status' => 'Status State', 'updated' => 'Last Updated (UTC)', 'fault' => 'Execution Error Log'
        ]);
        CliUI::pause();
    }

    // --- HEADLESS PIPELINE CONTEXT WORKER ---
    public function processPendingSagaTasks(bool $headlessMode = true): void {
        $prefix = $headlessMode ? "" : "Manual Override: ";
        if ($headlessMode) {
            CliUI::stepLog("Querying outstanding onboarding steps across registered sagas...");
        } else {
            echo "Scanning tasks pipeline...\n";
        }

        $pendingTasks = $this->repo->getPendingOnboardingTasks();
        $processedCount = 0;

        foreach ($pendingTasks as $task) {
            // Self-Healing Status Check: If parent is stalled, let worker attempt to retry failures
            if ($task['emp_status'] === 'STALLED' && $task['status'] !== 'FAILED') {
                continue; // Wait until manual clearance or direct retry is triggered
            }

            try {
                // Execute Step with Idempotent safety wrapper
                ProvisioningService::executeStep($task['step_name'], [
                    'name' => $task['name'],
                    'email' => $task['email'],
                    'department' => $task['department']
                ]);

                // Update database progress on success
                $this->repo->updateTaskStatus($task['id'], 'COMPLETED');
                $processedCount++;

                if ($headlessMode) {
                    CliUI::stepLog("Saga step [{$task['step_name']}] completed successfully for Employee #{$task['employee_id']}.");
                } else {
                    echo "  " . CliUI::GREEN . "✔" . CliUI::RESET . " Step [{$task['step_name']}] parsed cleanly for " . CliUI::BOLD . $task['name'] . CliUI::RESET . ".\n";
                }

            } catch (Exception $e) {
                // Isolation Guard: Catch failure without throwing. Halt employee saga but keep other pipelines moving.
                $this->repo->updateTaskStatus($task['id'], 'FAILED', $e->getMessage());
                $this->repo->updateEmployeeStatus($task['employee_id'], 'STALLED');

                $errorText = "Saga step [{$task['step_name']}] failed for Employee #{$task['employee_id']}. State switched to STALLED. Fault: " . $e->getMessage();
                if ($headlessMode) {
                    CliUI::stepLog(CliUI::RED . "[ALERT] " . $errorText . CliUI::RESET);
                } else {
                    echo "  " . CliUI::RED . "✖ ALERT: " . $errorText . CliUI::RESET . "\n";
                }
            }

            // Always verify if current employee's entire lifecycle has fully concluded
            $this->repo->verifyEmployeeSagaCompletion($task['employee_id']);

            usleep(50000); // Small 50ms throttling delay to preserve API connection thresholds
        }

        $finalMsg = "Onboarding execution loop closed. Mutated milestones processed: {$processedCount}";
        if ($headlessMode) {
            CliUI::stepLog($finalMsg);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $finalMsg . CliUI::RESET . "\n";
        }
    }
}

// ==========================================
// 5. Global Application Operational Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System error: Onboarding automation services can only launch from dedicated shell command terminals.");
}

$app = new OnboardingAutomationApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--cron') {
    $app->processPendingSagaTasks(true);
} else {
    $app->runWorkspace();
}
