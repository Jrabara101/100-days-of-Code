#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Enterprise Multi-Role Approval Workflow Engine
 * * Usage: php approval_workflow.php
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Presentation & TUI Layout Engine
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

    public static function clearScreen(): void { echo "\033[2J\033[;H"; }

    public static function header(string $title, string $subtitle = ""): void {
        self::clearScreen();
        echo self::BLUE . self::BOLD;
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
        echo "\n" . self::DIM . "Press Enter to return to workflow panel..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . $msg . self::RESET . "\n"; }

    public static function stageBadge(string $stage): string {
        return match ($stage) {
            'MANAGER_REVIEW'   => self::YELLOW . " WAITING_MGR " . self::RESET,
            'DEPT_HEAD_REVIEW' => self::CYAN . " WAITING_HOD " . self::RESET,
            'FINANCE_REVIEW'   => self::BLUE . " WAITING_FIN " . self::RESET,
            'APPROVED'         => self::GREEN . self::BOLD . "  APPROVED   " . self::RESET,
            'REJECTED'         => self::RED . self::BOLD . "  REJECTED   " . self::RESET,
            default            => $stage
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No tracking parameters found matching current visibility lanes.\n" . self::RESET;
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
// 2. Data Persistence Repository Layer (SQLite)
// ==========================================
class WorkflowRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/approvals_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Corporate Users Master Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL -- MANAGER, DEPT_HEAD, FINANCE, EMPLOYEE
        )");

        // Procurement / Budget Requests Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            creator_name TEXT NOT NULL,
            amount REAL NOT NULL,
            purpose TEXT NOT NULL,
            current_stage TEXT DEFAULT 'MANAGER_REVIEW', -- MANAGER_REVIEW, DEPT_HEAD_REVIEW, FINANCE_REVIEW, APPROVED, REJECTED
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Immutable Transaction History Audit Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS approval_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER NOT NULL,
            actioned_by_name TEXT NOT NULL,
            action_role TEXT NOT NULL,
            action_taken TEXT NOT NULL, -- APPROVED, REJECTED
            notes TEXT,
            actioned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES requests(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_workflow_stage ON requests(current_stage)");

        // Seed default corporate authorities if clean
        if ($this->db->query("SELECT COUNT(*) FROM users")->fetchColumn() == 0) {
            $stmt = $this->db->prepare("INSERT INTO users (name, role) VALUES (?, ?)");
            $stmt->execute(['Alice Vance', 'MANAGER']);
            $stmt->execute(['Marcus Brody', 'DEPT_HEAD']);
            $stmt->execute(['Elena Fisher', 'FINANCE']);
        }
    }

    public function createRequest(string $creator, float $amount, string $purpose): void {
        $stmt = $this->db->prepare("INSERT INTO requests (creator_name, amount, purpose) VALUES (?, ?, ?)");
        $stmt->execute([trim($creator), $amount, trim($purpose)]);
    }

    public function getAllUsers(): array {
        return $this->db->query("SELECT * FROM users ORDER BY id ASC")->fetchAll();
    }

    public function getRequestsFilteredByStage(string $stage): array {
        $stmt = $this->db->prepare("SELECT * FROM requests WHERE current_stage = ? ORDER BY id ASC");
        $stmt->execute([$stage]);
        return $stmt->fetchAll();
    }

    public function getGlobalLedger(): array {
        return $this->db->query("SELECT * FROM requests ORDER BY id DESC LIMIT 30")->fetchAll();
    }

    public function getAuditTrail(int $requestId): array {
        $stmt = $this->db->prepare("SELECT actioned_by_name, action_role, action_taken, notes, actioned_at FROM approval_logs WHERE request_id = ? ORDER BY id ASC");
        $stmt->execute([$requestId]);
        return $stmt->fetchAll();
    }

    /**
     * Senior Transaction Mapping Engine: Atomic step transitions.
     * Evaluates constraints, shifts pipeline stage, and commits audit rows cleanly.
     */
    public function processWorkflowTransition(int $reqId, array $actor, string $action, string $notes): bool|string {
        $this->db->beginTransaction();
        try {
            // 1. Fetch live row state with lock criteria intent
            $stmt = $this->db->prepare("SELECT * FROM requests WHERE id = ?");
            $stmt->execute([$reqId]);
            $request = $stmt->fetch();

            if (!$request) {
                $this->db->rollBack();
                return "Workflow request tracking ID could not be found.";
            }

            // 2. Validate strict access matrix state gates
            $expectedRole = match ($request['current_stage']) {
                'MANAGER_REVIEW'   => 'MANAGER',
                'DEPT_HEAD_REVIEW' => 'DEPT_HEAD',
                'FINANCE_REVIEW'   => 'FINANCE',
                default            => null
            };

            if ($expectedRole === null) {
                $this->db->rollBack();
                return "Workflow timeline processing has already concluded for this record.";
            }

            if ($actor['role'] !== $expectedRole) {
                $this->db->rollBack();
                return "Authorization Denied: Your assigned role [{$actor['role']}] cannot execute actions at this phase.";
            }

            // 3. Compute next state trajectory path
            $nextStage = 'REJECTED';
            if ($action === 'APPROVE') {
                $nextStage = match ($request['current_stage']) {
                    'MANAGER_REVIEW'   => 'DEPT_HEAD_REVIEW',
                    'DEPT_HEAD_REVIEW' => 'FINANCE_REVIEW',
                    'FINANCE_REVIEW'   => 'APPROVED',
                };
            }

            // 4. Mutate parent status
            $update = $this->db->prepare("UPDATE requests SET current_stage = ?, updated_at = datetime('now') WHERE id = ?");
            $update->execute([$nextStage, $reqId]);

            // 5. Append immutable entry to chronological audit log ledger
            $log = $this->db->prepare("
                INSERT INTO approval_logs (request_id, actioned_by_name, action_role, action_taken, notes) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $log->execute([$reqId, $actor['name'], $actor['role'], $action === 'APPROVE' ? 'APPROVED' : 'REJECTED', $notes]);

            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            return "Critical Database Rollback Initiated: " . $e->getMessage();
        }
    }
}

// ==========================================
// 3. Application Workflow Controller Loop
// ==========================================
class ApprovalWorkflowApp {
    private WorkflowRepository $repo;
    private ?array $currentSessionUser = null;

    public function __construct() {
        $this->repo = new WorkflowRepository();
    }

    public function run(): void {
        // Automatically set active operator context to User Index #1 on initialization
        $users = $this->repo->getAllUsers();
        $this->currentSessionUser = $users[0] ?? null;

        while (true) {
            $subtitle = "Active User: " . $this->currentSessionUser['name'] . " (" . $this->currentSessionUser['role'] . ")";
            CliUI::header("Multi-Role Budget Approval Pipeline", $subtitle);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Raise New Funds Requisition (Employee Entry Point)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Open Active Approval Action Inbox (Role-Filtered Queue)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Output Master Workflow Tracking Grid\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Audit Specific Request Transaction Ledger Trail\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Switch Active Authority Session (Impersonate Next Gatekeeper)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Sever database framework connections\n\n";

            switch (CliUI::prompt("Route Action Selection")) {
                case '1': $this->submitRequisitionFlow(); break;
                case '2': $this->processApprovalInboxQueue(); break;
                case '3': $this->viewGlobalHistoryGrid(); break;
                case '4': $this->auditTrailFlow(); break;
                case '5': $this->switchSessionUserFlow($users); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Workflow persistence pipelines disconnected cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function submitRequisitionFlow(): void {
        CliUI::header("Raise Budget Requisition");
        $creator = CliUI::prompt("Enter your name");
        if (empty($creator)) { CliUI::error("Identity tracking rows require a name."); CliUI::pause(); return; }

        $amountStr = CliUI::prompt("Enter total required funding amount ($)");
        if (!is_numeric($amountStr) || (float)$amountStr <= 0) {
            CliUI::error("Financial balance arguments must evaluate to positive numeric strings.");
            CliUI::pause();
            return;
        }

        $purpose = CliUI::prompt("State allocation business case reasoning statement");
        if (empty($purpose)) { CliUI::error("Reason statements are mandatory for governance trails."); CliUI::pause(); return; }

        $this->repo->createRequest($creator, (float)$amountStr, $purpose);
        CliUI::success("Requisition written to cluster ledger. Stage state defaulted to MANAGER_REVIEW.");
        CliUI::pause();
    }

    private function processApprovalInboxQueue(): void {
        $role = $this->currentSessionUser['role'];
        
        // Map actor role variables to expected database stage parameters strictly
        $targetStage = match ($role) {
            'MANAGER'   => 'MANAGER_REVIEW',
            'DEPT_HEAD' => 'DEPT_HEAD_REVIEW',
            'FINANCE'   => 'FINANCE_REVIEW',
            default     => null
        };

        if ($targetStage === null) {
            CliUI::error("Your current role profile [{$role}] holds zero authorization bounds on pending review pools.");
            CliUI::pause();
            return;
        }

        CliUI::header("Review Inbox: {$role} Action Queue");
        $queue = $this->repo->getRequestsFilteredByStage($targetStage);

        if (empty($queue)) {
            CliUI::info("Clear skies. Your pipeline segment is caught up.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($queue as $row) {
            $tableData[] = [
                'id'           => $row['id'],
                'creator_name' => $row['creator_name'],
                'amount_fmt'   => "$" . number_format($row['amount'], 2),
                'purpose'      => $row['purpose']
            ];
        }
        CliUI::drawTable($tableData, ['id' => 'Req ID', 'creator_name' => 'Applicant', 'amount_fmt' => 'Budget Cost', 'purpose' => 'Reason Case']);

        $reqId = (int)CliUI::prompt("Select Request ID to authorize/reject parameters");
        $validIds = array_column($queue, 'id');

        if (!in_array($reqId, $validIds, true)) {
            CliUI::error("ID input doesn't align with active inbox entities.");
            CliUI::pause();
            return;
        }

        echo "\n Transaction Operations: [" . CliUI::GREEN . "A" . CliUI::RESET . "] Approve Step | [" . CliUI::RED . "R" . CliUI::RESET . "] Reject / Kill Request\n";
        $actionKey = strtoupper(CliUI::prompt("Input code action key"));
        
        if ($actionKey !== 'A' && $actionKey !== 'R') {
            CliUI::info("Action discarded. Record mappings preserved unchanged.");
            CliUI::pause();
            return;
        }

        $action = $actionKey === 'A' ? 'APPROVE' : 'REJECT';
        $notes = CliUI::prompt("Provide transaction remarks for immutable audit tracking logs");

        $result = $this->repo->processWorkflowTransition($reqId, $this->currentSessionUser, $action, $notes);
        
        if ($result === true) {
            CliUI::success("Transaction authorized successfully. State transitioned.");
        } else {
            CliUI::error($result);
            CliUI::pause();
        }
    }

    private function viewGlobalHistoryGrid(): void {
        CliUI::header("Master Workflow Tracking Grid");
        $history = $this->repo->getGlobalLedger();

        foreach ($history as &$row) {
            $row['amount_fmt'] = "$" . number_format($row['amount'], 2);
            $row['badge'] = CliUI::stageBadge($row['current_stage']);
        }

        CliUI::drawTable($history, [
            'id' => 'ID', 'creator_name' => 'Applicant', 'amount_fmt' => 'Funding Cost', 'purpose' => 'Reason', 'badge' => 'Current Lifecycle Stage'
        ]);
        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Audit Transaction Ledger Trail");
        $id = (int)CliUI::prompt("Enter target Request ID to parse history lines");

        $logs = $this->repo->getAuditTrail($id);
        
        if (empty($logs)) {
            CliUI::error("No authorization log artifacts found bound to that request index.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL AUDIT LEDGER FOR REQUEST #{$id}:" . CliUI::RESET . "\n";
        foreach ($logs as $log) {
            $color = $log['action_taken'] === 'APPROVED' ? CliUI::GREEN : CliUI::RED;
            echo " ├─ [" . $log['actioned_at'] . "] " . CliUI::BOLD . $log['actioned_by_name'] . " (" . $log['action_role'] . ")" . CliUI::RESET . "\n";
            echo " │  Action  : " . $color . $log['action_taken'] . CliUI::RESET . "\n";
            echo " │  Remarks : " . CliUI::DIM . ($log['notes'] ?: 'No annotations supplied.') . CliUI::RESET . "\n";
        }
        echo " └─ End of Ledger Sequence.\n";
        CliUI::pause();
    }

    private function switchSessionUserFlow(array $users): void {
        CliUI::header("Impersonate Authority Session");
        
        CliUI::drawTable($users, ['id' => 'ID', 'name' => 'Authority Profile Full Name', 'role' => 'Assigned Gatekeeper Role']);
        $id = (int)CliUI::prompt("Select user ID to assume tracking context");

        foreach ($users as $u) {
            if ((int)$u['id'] === $id) {
                $this->currentSessionUser = $u;
                CliUI::success("Session authority shifted. Active context: {$u['name']}.");
                return;
            }
        }
        CliUI::error("Selection index out of structural boundaries.");
        CliUI::pause();
    }
}

// ==========================================
// 4. Runtime Environment Guard Bootstrapper
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System error: Multi-role approval matrices require native shell execution terminals.");
}

try {
    $workflow = new ApprovalWorkflowApp();
    $workflow->run();
} catch (Exception $e) {
    echo "\n\e[31m\e[1mFatal Pipeline Runtime Exception: \e[0m" . $e->getMessage() . "\n";
    exit(1);
}
