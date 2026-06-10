#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Leave Request Workflow Engine
 * * Usage: php leave_workflow.php
 */

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
        echo "\n" . self::DIM . "Press Enter to return to main menu..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo "\n" . self::GREEN . "✔ " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo "\n" . self::RED . "✖ " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . $msg . self::RESET . "\n"; }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No active workflow items found.\n" . self::RESET;
            return;
        }

        $widths = array_map('strlen', $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $widths[$key] = max($widths[$key], strlen((string)($row[$key] ?? '')));
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
                
                // Visual coloring injection for status fields
                if ($key === 'status') {
                    $content = match($content) {
                        'PENDING'  => self::YELLOW . $content . self::RESET,
                        'APPROVED' => self::GREEN . $content . self::RESET,
                        'REJECTED' => self::RED . $content . self::RESET,
                        default    => $content
                    };
                    // Standardize structural padding math around invisible ANSI chars
                    $rawContent = (string)($row[$key] ?? '');
                    echo str_pad($content, $widths[$key] + (strlen($content) - strlen($rawContent))) . " │ ";
                } else {
                    echo str_pad($content, $widths[$key]) . " │ ";
                }
            }
            echo "\n";
        }
        $drawSeparator("└", "┴", "┘", "─");
        echo "\n";
    }
}

// ==========================================
// 2. Database Workflow Repository Layer
// ==========================================
class LeaveRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/leave_workflow.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Employees master ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            vacation_balance INTEGER NOT NULL DEFAULT 15
        )");

        // Leave application workflow data table
        $this->db->exec("CREATE TABLE IF NOT EXISTS leave_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            days_requested INTEGER NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        )");

        // Auto-seed mock entities if base is clear
        if ($this->db->query("SELECT COUNT(*) FROM employees")->fetchColumn() == 0) {
            $stmt = $this->db->prepare("INSERT INTO employees (name, role, vacation_balance) VALUES (?, ?, ?)");
            $stmt->execute(['Sarah Jenkins', 'Developer', 14]);
            $stmt->execute(['David Miller', 'UI Designer', 4]);
        }
    }

    public function getAllEmployees(): array {
        return $this->db->query("SELECT * FROM employees")->fetchAll();
    }

    public function createRequest(int $empId, int $days, string $reason): void {
        $stmt = $this->db->prepare("INSERT INTO leave_requests (employee_id, days_requested, reason, status) VALUES (?, ?, ?, 'PENDING')");
        $stmt->execute([$empId, $days, $reason]);
    }

    public function getPendingQueue(): array {
        return $this->db->query("
            SELECT r.id, e.name, e.role, r.days_requested, r.reason, r.status 
            FROM leave_requests r
            JOIN employees e ON r.employee_id = e.id
            WHERE r.status = 'PENDING'
            ORDER BY r.created_at ASC
        ")->fetchAll();
    }

    public function getAllRequests(): array {
        return $this->db->query("
            SELECT r.id, e.name, r.days_requested, r.reason, r.status 
            FROM leave_requests r
            JOIN employees e ON r.employee_id = e.id
            ORDER BY r.id DESC
        ")->fetchAll();
    }

    /**
     * Executes atomic updates to modify workflow states safely
     */
    public function updateWorkflowStatus(int $requestId, string $newStatus): bool|string {
        $this->db->beginTransaction();
        try {
            // 1. Fetch structural baseline metrics with isolation
            $stmt = $this->db->prepare("SELECT * FROM leave_requests WHERE id = ?");
            $stmt->execute([$requestId]);
            $request = $stmt->fetch();

            if (!$request) {
                $this->db->rollBack();
                return "Workflow tracking context ID unresolved.";
            }

            if ($request['status'] !== 'PENDING') {
                $this->db->rollBack();
                return "Cannot alter a concluded workflow item (Current State: {$request['status']}).";
            }

            $empId = $request['employee_id'];
            $days = (int)$request['days_requested'];

            // 2. Evaluate bounds if transitioning to approved states
            if ($newStatus === 'APPROVED') {
                $empStmt = $this->db->prepare("SELECT vacation_balance FROM employees WHERE id = ?");
                $empStmt->execute([$empId]);
                $balance = (int)$empStmt->fetchColumn();

                if ($balance < $days) {
                    $this->db->rollBack();
                    return "Insufficient vacation balance limits. (Has: {$balance} days, Requested: {$days} days).";
                }

                // Deduct limits natively inside the active transaction boundary
                $updateBal = $this->db->prepare("UPDATE employees SET vacation_balance = vacation_balance - ? WHERE id = ?");
                $updateBal->execute([$days, $empId]);
            }

            // 3. Finalize state change mutation
            $updateStatus = $this->db->prepare("UPDATE leave_requests SET status = ? WHERE id = ?");
            $updateStatus->execute([$newStatus, $requestId]);

            $this->db->commit();
            return true;

        } catch (PDOException $e) {
            $this->db->rollBack();
            return "Critical Engine Fault: " . $e->getMessage();
        }
    }
}

// ==========================================
// 3. Main Workflow Orchestration Core
// ==========================================
class LeaveWorkflowApp {
    private LeaveRepository $repo;

    public function __construct() {
        $this->repo = new LeaveRepository();
    }

    public function run(): void {
        while (true) {
            CliUI::header("Leave Tracking & Approval Gateway", "Corporate Operations Hub");
            echo "  " . CliUI::MAGENTA . "1." . CliUI::RESET . " Submit New Leave Request\n";
            echo "  " . CliUI::MAGENTA . "2." . CliUI::RESET . " Open Manager Review Queue (Pending)\n";
            echo "  " . CliUI::MAGENTA . "3." . CliUI::RESET . " Output Global History Log\n";
            echo "  " . CliUI::MAGENTA . "0." . CliUI::RESET . " Terminate session framework\n\n";

            switch (CliUI::prompt("Select Dashboard Track")) {
                case '1': $this->submitRequest(); break;
                case '2': $this->processManagerQueue(); break;
                case '3': $this->viewGlobalHistory(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::MAGENTA . "Workflow runtime disconnected cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    CliUI::error("Route path selection unresolved.");
            }
        }
    }

    private function submitRequest(): void {
        CliUI::header("Submit New Leave Request");
        $employees = $this->repo->getAllEmployees();
        
        CliUI::drawTable($employees, [
            'id' => 'ID', 
            'name' => 'Employee Name', 
            'role' => 'Role', 
            'vacation_balance' => 'Available Balance (Days)'
        ]);

        $empId = (int)CliUI::prompt("Enter Employee ID initiating request");
        $validIds = array_column($employees, 'id');
        
        if (!in_array($empId, $validIds)) {
            CliUI::error("Invalid employee reference bound.");
            CliUI::pause();
            return;
        }

        $days = (int)CliUI::prompt("Enter number of required vacation days");
        if ($days <= 0) {
            CliUI::error("Requested timeline scale must be greater than zero.");
            CliUI::pause();
            return;
        }

        $reason = CliUI::prompt("State request reasoning context");
        if (empty($reason)) {
            CliUI::error("Workflow processing parameters require an audit reason description.");
            CliUI::pause();
            return;
        }

        $this->repo->createRequest($empId, $days, $reason);
        CliUI::success("Leave request injected into pending verification queues.");
    }

    private function processManagerQueue(): void {
        CliUI::header("Manager Review Queue");
        $queue = $this->repo->getPendingQueue();

        if (empty($queue)) {
            CliUI::info("Excellent. The approval queue is empty.");
            CliUI::pause();
            return;
        }

        CliUI::drawTable($queue, [
            'id' => 'Req ID',
            'name' => 'Applicant',
            'days_requested' => 'Days',
            'reason' => 'Reason Statement',
            'status' => 'Current Status'
        ]);

        $reqId = (int)CliUI::prompt("Select Request ID to process actions");
        $validReqIds = array_column($queue, 'id');

        if (!in_array($reqId, $validReqIds)) {
            CliUI::error("Target request ID does not exist in this context lane.");
            CliUI::pause();
            return;
        }

        echo "\n Actions to execute: [" . CliUI::GREEN . "A" . CliUI::RESET . "] Approve | [" . CliUI::RED . "R" . CliUI::RESET . "] Reject | [" . CliUI::YELLOW . "C" . CliUI::RESET . "] Cancel\n";
        $action = strtoupper(CliUI::prompt("Input decision code"));

        $newStatus = match($action) {
            'A' => 'APPROVED',
            'R' => 'REJECTED',
            default => null
        };

        if ($newStatus === null) {
            CliUI::info("Operation aborted. State maps preserved.");
            CliUI::pause();
            return;
        }

        $executionResult = $this->repo->updateWorkflowStatus($reqId, $newStatus);
        if ($executionResult === true) {
            CliUI::success("Request state updated to {$newStatus} successfully.");
        } else {
            CliUI::error($executionResult);
            CliUI::pause();
        }
    }

    private function viewGlobalHistory(): void {
        CliUI::header("Global Audit History Logs");
        $history = $this->repo->getAllRequests();
        
        CliUI::drawTable($history, [
            'id' => 'Req ID',
            'name' => 'Employee',
            'days_requested' => 'Days',
            'reason' => 'Reason',
            'status' => 'Workflow Status'
        ]);
        CliUI::pause();
    }
}

// ==========================================
// 4. System Initialization Bootstrapper
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Fatal: Structural console systems can only execute via native terminal prompts.");
}

if (realpath(get_included_files()[0]) === realpath(__FILE__)) {
    try {
        $engine = new LeaveWorkflowApp();
        $engine->run();
    } catch (Exception $e) {
        echo "\n\e[31m\e[1mFatal Core Framework Exception: \e[0m" . $e->getMessage() . "\n";
        exit(1);
    }
}
