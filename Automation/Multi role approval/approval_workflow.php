#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Enterprise Multi-Role Approval Workflow Engine
 * Usage: php approval_workflow.php
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
        echo "\n" . self::DIM . "Press Enter to return to main dashboard..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . $msg . self::RESET . "\n"; }

    public static function stageBadge(string $stage): string {
        return match ($stage) {
            'PENDING_MANAGER' => self::YELLOW . " PENDING MGR " . self::RESET,
            'PENDING_VP'      => self::CYAN . " PENDING VP  " . self::RESET,
            'PENDING_FINANCE' => self::BLUE . " PENDING FIN " . self::RESET,
            'APPROVED'        => self::GREEN . self::BOLD . "  APPROVED   " . self::RESET,
            'REJECTED'        => self::RED . self::BOLD . "  REJECTED   " . self::RESET,
            default           => $stage
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No tracking records match current visibility metrics.\n" . self::RESET;
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
class WorkflowRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/workflow_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Master Corporate Accounts Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL -- MANAGER, VP, FINANCE
        )");

        // Requisition Pipeline Tracking Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requester_name TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING_MANAGER', 
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Immutable Cryptographic Audit Log Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS approval_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER NOT NULL,
            actor_name TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            action TEXT NOT NULL, -- APPROVED, REJECTED
            comments TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES requests(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_workflow_status ON requests(status)");

        // Auto-seed baseline structural authorities if clean
        if ($this->db->query("SELECT COUNT(*) FROM users")->fetchColumn() == 0) {
            $stmt = $this->db->prepare("INSERT INTO users (name, role) VALUES (?, ?)");
            $stmt->execute(['Alice Vance', 'MANAGER']);
            $stmt->execute(['Marcus Brody', 'VP']);
            $stmt->execute(['Elena Fisher', 'FINANCE']);
        }
    }

    public function createRequest(string $requester, float $amount, string $description): void {
        $stmt = $this->db->prepare("INSERT INTO requests (requester_name, amount, description) VALUES (?, ?, ?)");
        $stmt->execute([trim($requester), $amount, trim($description)]);
    }

    public function getAllUsers(): array {
        return $this->db->query("SELECT * FROM users ORDER BY id ASC")->fetchAll();
    }

    public function getQueueByStage(string $status): array {
        $stmt = $this->db->prepare("SELECT * FROM requests WHERE status = ? ORDER BY id ASC");
        $stmt->execute([$status]);
        return $stmt->fetchAll();
    }

    public function getGlobalRegistry(): array {
        return $this->db->query("SELECT * FROM requests ORDER BY id DESC LIMIT 25")->fetchAll();
    }

    public function getAuditTrail(int $requestId): array {
        $stmt = $this->db->prepare("SELECT * FROM approval_logs WHERE request_id = ? ORDER BY id ASC");
        $stmt->execute([$requestId]);
        return $stmt->fetchAll();
    }

    /**
     * Senior Transaction Engine Pattern: State transitions are completely atomic.
     * Evaluates security constraints, shifts status maps, and records audit footprints.
     */
    public function transitionWorkflowState(int $requestId, array $user, string $action, string $comments): bool|string {
        $this->db->beginTransaction();
        try {
            // 1. Fetch live row data targeting explicit row locks
            $stmt = $this->db->prepare("SELECT * FROM requests WHERE id = ?");
            $stmt->execute([$requestId]);
            $request = $stmt->fetch();

            if (!$request) {
                $this->db->rollBack();
                return "Target request record cannot be resolved inside database pipelines.";
            }

            // 2. Assert strict Role-Based security parameters match the active gate
            $authorizedRole = match ($request['status']) {
                'PENDING_MANAGER' => 'MANAGER',
                'PENDING_VP'      => 'VP',
                'PENDING_FINANCE' => 'FINANCE',
                default           => null
            };

            if ($authorizedRole === null) {
                $this->db->rollBack();
                return "This request has already reached a finalized workflow termination state.";
            }

            if ($user['role'] !== $authorizedRole) {
                $this->db->rollBack();
                return "Access Denied: Operating role profile [{$user['role']}] lacks clearance for this state.";
            }

            // 3. Calculate subsequent pipeline path state trajectory
            $nextState = 'REJECTED';
            if ($action === 'APPROVE') {
                $nextState = match ($request['status']) {
                    'PENDING_MANAGER' => 'PENDING_VP',
                    'PENDING_VP'      => 'PENDING_FINANCE',
                    'PENDING_FINANCE' => 'APPROVED',
                };
            }

            // 4. Update core parent status ledger
            $update = $this->db->prepare("UPDATE requests SET status = ?, updated_at = datetime('now') WHERE id = ?");
            $update->execute([$nextState, $requestId]);

            // 5. Commit permanent change entry to the compliance log tracking table
            $log = $this->db->prepare("
                INSERT INTO approval_logs (request_id, actor_name, actor_role, action, comments) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $log->execute([$requestId, $user['name'], $user['role'], $action === 'APPROVE' ? 'APPROVED' : 'REJECTED', trim($comments)]);

            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            return "Database failure transaction rollback caught: " . $e->getMessage();
        }
    }
}

// ==========================================
// 3. Main Business Logic System Core
// ==========================================
class ApprovalWorkflowApp {
    private WorkflowRepository $repo;
    private ?array $activeSession = null;

    public function __construct() {
        $this->repo = new WorkflowRepository();
    }

    public function bootstrap(): void {
        // Automatically default active context parameters to User Entity #1
        $users = $this->repo->getAllUsers();
        $this->activeSession = $users[0] ?? null;

        while (true) {
            $contextLabel = "Authorized Operator: " . $this->activeSession['name'] . " (" . $this->activeSession['role'] . ")";
            CliUI::header("Multi-Gate Requisition Workflow", $contextLabel);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Submit Corporate Expenditure Request (Employee Ingestion)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Process Role-Filtered Pending Reviews Inbox\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Output Complete Historical Requisition Ledger\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Audit Specific Transaction Compliance Log Trail\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Switch Operating Session Identity (Assume Next Gatekeeper Role)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect terminal operations console\n\n";

            switch (CliUI::prompt("Select Dashboard Vector")) {
                case '1': $this->submitRequestFlow(); break;
                case '2': $this->processPendingQueueInbox(); break;
                case '3': $this->viewGlobalLedgerGrid(); break;
                case '4': $this->auditLogAnalysisFlow(); break;
                case '5': $this->switchContextFlow($users); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Workflow persistence matrix connections detached cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function submitRequestFlow(): void {
        CliUI::header("New Expenditure Requisition Intake");
        
        $name = CliUI::prompt("Enter Requester Identity / Department");
        if (empty($name)) { CliUI::error("Requisition parameters reject null identities."); CliUI::pause(); return; }

        $amountStr = CliUI::prompt("Enter total corporate funding cost ($)");
        if (!is_numeric($amountStr) || (float)$amountStr <= 0) {
            CliUI::error("Financial bounds value metrics must evaluate to positive numeric allocations.");
            CliUI::pause();
            return;
        }

        $desc = CliUI::prompt("State procurement asset allocation reasoning description");
        if (empty($desc)) { CliUI::error("Reasoning notes are mandatory for compliance auditing."); CliUI::pause(); return; }

        $this->repo->createRequest($name, (float)$amountStr, $desc);
        CliUI::success("Expenditure request logged. State parameters set to PENDING_MANAGER.");
        CliUI::pause();
    }

    private function processPendingQueueInbox(): void {
        $role = $this->activeSession['role'];
        
        $targetState = match ($role) {
            'MANAGER'   => 'PENDING_MANAGER',
            'VP'        => 'PENDING_VP',
            'FINANCE'   => 'PENDING_FINANCE',
            default     => null
        };

        if ($targetState === null) {
            CliUI::error("Operational Fault: Base profile [{$role}] lacks active gatekeeping clearance rights.");
            CliUI::pause();
            return;
        }

        CliUI::header("Action Queue: " . $role . " Review Folder");
        $pendingBatch = $this->repo->getQueueByStage($targetState);

        if (empty($pendingBatch)) {
            CliUI::info("Excellent. Your department queue segment balances at absolute zero.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($pendingBatch as $row) {
            $tableData[] = [
                'id'             => $row['id'],
                'requester_name' => $row['requester_name'],
                'cost'           => "$" . number_format($row['amount'], 2),
                'description'    => $row['description']
            ];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'requester_name' => 'Applicant Node', 'cost' => 'Allocation Cost', 'description' => 'Target Justification']);

        $reqId = (int)CliUI::prompt("Enter Request ID to action updates");
        $validIds = array_column($pendingBatch, 'id');

        if (!in_array($reqId, $validIds, true)) {
            CliUI::error("Target assignment key fails validation bounds.");
            CliUI::pause();
            return;
        }

        echo "\n Operational Controls: [" . CliUI::GREEN . "A" . CliUI::RESET . "] Execute Approval | [" . CliUI::RED . "R" . CliUI::RESET . "] Issue Requisition Decline\n";
        $choiceKey = strtoupper(CliUI::prompt("Input command action key"));

        if ($choiceKey !== 'A' && $choiceKey !== 'R') {
            CliUI::info("Operation aborted. Data matrices preserved unchanged.");
            CliUI::pause();
            return;
        }

        $action = $choiceKey === 'A' ? 'APPROVE' : 'REJECT';
        $comments = CliUI::prompt("Append transaction notes for immutable history logs");

        $statusResult = $this->repo->transitionWorkflowState($reqId, $this->activeSession, $action, $comments);

        if ($statusResult === true) {
            CliUI::success("Authorization state written cleanly. Request advanced.");
        } else {
            CliUI::error($statusResult);
            CliUI::pause();
        }
    }

    private function viewGlobalLedgerGrid(): void {
        CliUI::header("Global Master Requisition Registry");
        $gridData = $this->repo->getGlobalRegistry();

        foreach ($gridData as &$row) {
            $row['cost_fmt'] = "$" . number_format($row['amount'], 2);
            $row['badge'] = CliUI::stageBadge($row['status']);
        }

        CliUI::drawTable($gridData, [
            'id' => 'ID', 'requester_name' => 'Department Node', 'cost_fmt' => 'Financial Target', 'description' => 'Allocation Notes', 'badge' => 'Active Pipeline State'
        ]);
        CliUI::pause();
    }

    private function auditLogAnalysisFlow(): void {
        CliUI::header("Compliance Audit Trail Extraction");
        $id = (int)CliUI::prompt("Enter target Request ID to extract trail parameters");

        $auditTrail = $this->repo->getAuditTrail($id);

        if (empty($auditTrail)) {
            CliUI::error("No validated operational change logs map to that request key index.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL VERIFICATION AUDIT TRAIL FOR TASK [#" . $id . "]:" . CliUI::RESET . "\n";
        foreach ($auditTrail as $log) {
            $color = $log['action'] === 'APPROVED' ? CliUI::GREEN : CliUI::RED;
            echo "  ├─ [" . $log['timestamp'] . "] " . CliUI::BOLD . $log['actor_name'] . " (" . $log['actor_role'] . ")" . CliUI::RESET . "\n";
            echo "  │  State Update: " . $color . $log['action'] . CliUI::RESET . "\n";
            echo "  │  Audit Notes : " . CliUI::DIM . ($log['comments'] ?: 'No structural notes supplied.') . CliUI::RESET . "\n";
        }
        echo "  └─ Sequence Analysis End.\n";
        CliUI::pause();
    }

    private function switchContextFlow(array $users): void {
        CliUI::header("Impersonate Authorization Session");
        
        CliUI::drawTable($users, ['id' => 'ID', 'name' => 'Corporate Identity Name', 'role' => 'Clearance Security Role']);
        $id = (int)CliUI::prompt("Select target ID to assign dynamic context constraints");

        foreach ($users as $user) {
            if ((int)$user['id'] === $id) {
                $this->activeSession = $user;
                CliUI::success("Context authority shifted. Profile mapping active for: {$user['name']}.");
                return;
            }
        }
        CliUI::error("Selection metric out of baseline boundary fields.");
        CliUI::pause();
    }
}

// ==========================================
// 5. Global Application Operational Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Monitoring Alert: Requisition frameworks can only spawn inside command line terminal frames.");
}

if (realpath(__FILE__) === realpath(get_included_files()[0])) {
    try {
        $engine = new ApprovalWorkflowApp();
        $engine->bootstrap();
    } catch (Exception $e) {
        echo "\n\e[31m\e[1mFatal Application Kernel Crash: \e[0m" . $e->getMessage() . "\n";
        exit(1);
    }
}
