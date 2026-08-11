#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Multi-Step Procurement Approval Engine
 * 
 * Usage:
 *   php procurement_system.php           (Interactive Manager Workspace)
 *   php procurement_system.php --process (Headless Batch Auto-Router)
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
        $input = trim(fgets(STDIN) ?: "");
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main workspace..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[PROCUREMENT-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'PENDING_DEPT_MGR'    => self::YELLOW . " WAITING_MGR  " . self::RESET,
            'PENDING_PROCUREMENT' => self::CYAN . " WAITING_PROC " . self::RESET,
            'PENDING_FINANCE'     => self::BLUE . " WAITING_FIN  " . self::RESET,
            'APPROVED'            => self::GREEN . self::BOLD . "  APPROVED   " . self::RESET,
            'REJECTED'            => self::RED . self::BOLD . "  REJECTED   " . self::RESET,
            default               => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No tracking records match current query parameters.\n" . self::RESET;
            return;
        }

        $widths = array_map(fn($h) => mb_strlen((string)$h, 'UTF-8'), $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
                $widths[$key] = max($widths[$key], mb_strlen($cleanString, 'UTF-8'));
            }
        }

        $drawSeparator = function($l, $m, $r, $lineChar) use ($widths) {
            $segments = array_map(fn($w) => str_repeat($lineChar, $w + 2), $widths);
            echo $l . implode($m, $segments) . $r . "\n";
        };

        $drawSeparator("┌", "┬", "┐", "─");
        echo "│ ";
        $i = 0;
        $numCols = count($headers);
        foreach ($headers as $key => $label) {
            $i++;
            $pad = str_repeat(" ", max(0, $widths[$key] - mb_strlen($label, 'UTF-8')));
            $sep = ($i === $numCols) ? " │" : " │ ";
            echo self::BOLD . self::CYAN . $label . $pad . self::RESET . $sep;
        }
        echo "\n";
        $drawSeparator("├", "┼", "┤", "─");

        foreach ($data as $row) {
            echo "│ ";
            $i = 0;
            foreach ($headers as $key => $label) {
                $i++;
                $content = (string)($row[$key] ?? '');
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', $content);
                $padding = str_repeat(" ", max(0, $widths[$key] - mb_strlen($cleanString, 'UTF-8')));
                $sep = ($i === $numCols) ? " │" : " │ ";
                echo $content . $padding . $sep;
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
class ProcurementRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/procurement_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Users Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL -- REQUESTER, DEPT_MANAGER, PROCUREMENT_OFFICER, FINANCE_DIRECTOR
        )");

        // Procurement Requisitions
        $this->db->exec("CREATE TABLE IF NOT EXISTS requisitions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            req_number TEXT UNIQUE NOT NULL,
            requester_id INTEGER NOT NULL,
            vendor_name TEXT NOT NULL,
            item_description TEXT NOT NULL,
            total_cost REAL NOT NULL,
            status TEXT DEFAULT 'PENDING_DEPT_MGR',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (requester_id) REFERENCES users(id)
        )");

        // Immutable Audit Trail
        $this->db->exec("CREATE TABLE IF NOT EXISTS approval_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requisition_id INTEGER NOT NULL,
            actor_name TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            action_taken TEXT NOT NULL, -- APPROVED, REJECTED
            previous_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            comments TEXT DEFAULT NULL,
            signature_hash TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (requisition_id) REFERENCES requisitions(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_req_status ON requisitions(status)");

        if ($this->db->query("SELECT COUNT(*) FROM users")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        $uStmt = $this->db->prepare("INSERT INTO users (name, role) VALUES (?, ?)");
        $uStmt->execute(['Alice Vance', 'DEPT_MANAGER']);
        $uStmt->execute(['Marcus Brody', 'PROCUREMENT_OFFICER']);
        $uStmt->execute(['Elena Fisher', 'FINANCE_DIRECTOR']);
        $uStmt->execute(['Arthur Pendelton', 'REQUESTER']);

        // Seed Sample Requisitions
        $this->createRequisition(4, 'Dell Global', '10x Developer Laptops', 18500.00); // High-value (requires Finance)
        $this->createRequisition(4, 'Paper & Co', 'Quarterly Office Stationery', 850.00);     // Low-value (no Finance required)
    }

    public function createRequisition(int $requesterId, string $vendor, string $item, float $cost): string {
        $reqNum = "REQ-" . date('Y') . "-" . rand(10000, 99999);
        $stmt = $this->db->prepare("
            INSERT INTO requisitions (req_number, requester_id, vendor_name, item_description, total_cost)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$reqNum, $requesterId, trim($vendor), trim($item), $cost]);
        return $reqNum;
    }

    public function getUsers(): array {
        return $this->db->query("SELECT * FROM users ORDER BY id ASC")->fetchAll();
    }

    public function getRequisitionsByStatus(string $status): array {
        $stmt = $this->db->prepare("
            SELECT r.*, u.name as requester_name 
            FROM requisitions r
            JOIN users u ON r.requester_id = u.id
            WHERE r.status = ?
            ORDER BY r.id ASC
        ");
        $stmt->execute([$status]);
        return $stmt->fetchAll();
    }

    public function getGlobalRegistry(): array {
        return $this->db->query("
            SELECT r.id, r.req_number, u.name as requester_name, r.vendor_name, r.total_cost, r.status, r.updated_at
            FROM requisitions r
            JOIN users u ON r.requester_id = u.id
            ORDER BY r.id DESC LIMIT 30
        ")->fetchAll();
    }

    public function getAuditTrail(int $reqId): array {
        $stmt = $this->db->prepare("SELECT * FROM approval_audit_logs WHERE requisition_id = ? ORDER BY id ASC");
        $stmt->execute([$reqId]);
        return $stmt->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Workflow Engine & Domain Service
// ==========================================
class ApprovalWorkflowEngine {
    private const HIGH_VALUE_THRESHOLD = 5000.00;

    public function __construct(private ProcurementRepository $repo) {}

    /**
     * Executes atomic state transition with RBAC and threshold-based routing.
     */
    public function transition(int $reqId, array $actor, string $action, string $comments): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            // Fetch live row for write-lock verification
            $stmt = $db->prepare("SELECT * FROM requisitions WHERE id = ?");
            $stmt->execute([$reqId]);
            $req = $stmt->fetch();

            if (!$req) {
                $db->rollBack();
                return ['success' => false, 'message' => "Requisition ID #{$reqId} not found."];
            }

            $currentStatus = $req['status'];
            $cost = (float)$req['total_cost'];

            // Assert RBAC Match
            $expectedRole = match ($currentStatus) {
                'PENDING_DEPT_MGR'    => 'DEPT_MANAGER',
                'PENDING_PROCUREMENT' => 'PROCUREMENT_OFFICER',
                'PENDING_FINANCE'     => 'FINANCE_DIRECTOR',
                default               => null
            };

            if ($expectedRole === null) {
                $db->rollBack();
                return ['success' => false, 'message' => "Requisition is already in a final state ({$currentStatus})."];
            }

            if ($actor['role'] !== $expectedRole) {
                $db->rollBack();
                return ['success' => false, 'message' => "Role Mismatch: Action requires [{$expectedRole}], active user is [{$actor['role']}]."];
            }

            // Calculate Target State
            $nextStatus = 'REJECTED';
            if ($action === 'APPROVE') {
                $nextStatus = match ($currentStatus) {
                    'PENDING_DEPT_MGR'    => 'PENDING_PROCUREMENT',
                    'PENDING_PROCUREMENT' => ($cost >= self::HIGH_VALUE_THRESHOLD) ? 'PENDING_FINANCE' : 'APPROVED',
                    'PENDING_FINANCE'     => 'APPROVED',
                };
            }

            // Atomic Conditional Update (Idempotency Guard)
            $update = $db->prepare("
                UPDATE requisitions 
                SET status = ?, updated_at = datetime('now') 
                WHERE id = ? AND status = ?
            ");
            $update->execute([$nextStatus, $reqId, $currentStatus]);

            if ($update->rowCount() === 0) {
                $db->rollBack();
                return ['success' => false, 'message' => "Concurrency Conflict: Requisition state was modified by another operator."];
            }

            // Generate SHA-256 Audit Signature
            $sigPayload = "{$reqId}|{$actor['name']}|{$action}|{$currentStatus}|{$nextStatus}|" . microtime();
            $signature = hash('sha256', $sigPayload);

            // Append Audit Log Entry
            $log = $db->prepare("
                INSERT INTO approval_audit_logs 
                (requisition_id, actor_name, actor_role, action_taken, previous_status, new_status, comments, signature_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $log->execute([$reqId, $actor['name'], $actor['role'], $action, $currentStatus, $nextStatus, trim($comments), $signature]);

            $db->commit();
            return ['success' => true, 'new_status' => $nextStatus];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
}

// ==========================================
// 4. Main Application Console Loop
// ==========================================
class ProcurementConsoleApp {
    private ProcurementRepository $repo;
    private ApprovalWorkflowEngine $engine;
    private ?array $activeUser = null;

    public function __construct() {
        $this->repo = new ProcurementRepository();
        $this->engine = new ApprovalWorkflowEngine($this->repo);
    }

    public function runBatchProcess(): void {
        CliUI::header("Headless Batch Auto-Router Engine");
        CliUI::stepLog("Initializing automated pipeline routing engine...");

        $users = $this->repo->getUsers();
        $userMap = [];
        foreach ($users as $u) {
            $userMap[$u['role']] = $u;
        }

        $stages = [
            'PENDING_DEPT_MGR'    => 'DEPT_MANAGER',
            'PENDING_PROCUREMENT' => 'PROCUREMENT_OFFICER',
            'PENDING_FINANCE'     => 'FINANCE_DIRECTOR'
        ];

        $processedCount = 0;
        foreach ($stages as $status => $role) {
            $actor = $userMap[$role] ?? null;
            if (!$actor) {
                CliUI::stepLog("No active user found for role {$role}, skipping stage.");
                continue;
            }

            $queue = $this->repo->getRequisitionsByStatus($status);
            foreach ($queue as $req) {
                CliUI::stepLog("Processing Requisition #{$req['id']} ({$req['req_number']}) - Cost: $" . number_format((float)$req['total_cost'], 2) . " via {$actor['name']} ({$role})");
                $res = $this->engine->transition(
                    (int)$req['id'],
                    $actor,
                    'APPROVE',
                    'Automated batch auto-routing sign-off.'
                );

                if ($res['success']) {
                    CliUI::stepLog("Transition committed! Status: {$status} ──> {$res['new_status']}");
                    $processedCount++;
                } else {
                    CliUI::stepLog("Transition failed: {$res['message']}");
                }
            }
        }

        CliUI::stepLog("Batch auto-router execution completed. Total transitions processed: {$processedCount}.");
    }

    public function launchWorkspace(): void {
        $users = $this->repo->getUsers();
        $this->activeUser = $users[0] ?? null; // Default to Alice Vance (Dept Mgr)

        while (true) {
            $roleLabel = "Active User: " . $this->activeUser['name'] . " (" . $this->activeUser['role'] . ")";
            CliUI::header("Enterprise Procurement Approval System", $roleLabel);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Create New Purchase Requisition\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Open Active Review Inbox (Role-Filtered Queue)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Output Global Procurement Registry\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Audit Compliance Log & SHA-256 Signature Trail\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Switch Active Authority Session (Impersonate User Profile)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect workspace console\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->createWizard(); break;
                case '2': $this->processInbox(); break;
                case '3': $this->viewRegistry(); break;
                case '4': $this->auditTrailFlow(); break;
                case '5': $this->switchUserFlow($users); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Procurement vault unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function createWizard(): void {
        CliUI::header("Create Purchase Requisition");

        $vendor = CliUI::prompt("Vendor Name");
        if (empty($vendor)) { CliUI::error("Vendor name is required."); CliUI::pause(); return; }

        $item = CliUI::prompt("Item / Service Description");
        $costStr = CliUI::prompt("Total Cost ($ USD)");

        if (!is_numeric($costStr) || (float)$costStr <= 0) {
            CliUI::error("Cost must be a positive numeric value.");
            CliUI::pause();
            return;
        }

        $reqNum = $this->repo->createRequisition((int)$this->activeUser['id'], $vendor, $item, (float)$costStr);
        CliUI::success("Requisition {$reqNum} created! Status set to PENDING_DEPT_MGR.");
        CliUI::pause();
    }

    private function processInbox(): void {
        $role = $this->activeUser['role'];
        $targetStatus = match ($role) {
            'DEPT_MANAGER'        => 'PENDING_DEPT_MGR',
            'PROCUREMENT_OFFICER' => 'PENDING_PROCUREMENT',
            'FINANCE_DIRECTOR'    => 'PENDING_FINANCE',
            default               => null
        };

        if ($targetStatus === null) {
            CliUI::error("Role [{$role}] has no active review inbox permissions.");
            CliUI::pause();
            return;
        }

        CliUI::header("Action Queue: " . $role . " Review Folder");
        $queue = $this->repo->getRequisitionsByStatus($targetStatus);

        if (empty($queue)) {
            CliUI::info("No requisitions currently awaiting your approval stage.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($queue as $r) {
            $tableData[] = [
                'id'         => $r['id'],
                'number'     => $r['req_number'],
                'requester'  => $r['requester_name'],
                'vendor'     => $r['vendor_name'],
                'cost'       => "$" . number_format((float)$r['total_cost'], 2)
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'number' => 'Req Ref', 'requester' => 'Applicant', 'vendor' => 'Vendor Target', 'cost' => 'Amount'
        ]);

        $reqId = (int)CliUI::prompt("Enter Requisition ID to authorize or reject");
        $validIds = array_column($queue, 'id');

        if (!in_array($reqId, $validIds, true)) {
            CliUI::error("ID does not match active inbox items.");
            CliUI::pause();
            return;
        }

        echo "\n Decision Action: [" . CliUI::GREEN . "A" . CliUI::RESET . "] Approve | [" . CliUI::RED . "R" . CliUI::RESET . "] Reject\n";
        $choice = strtoupper(CliUI::prompt("Input action key"));

        if ($choice !== 'A' && $choice !== 'R') {
            CliUI::info("Operation aborted.");
            CliUI::pause();
            return;
        }

        $action = ($choice === 'A') ? 'APPROVE' : 'REJECT';
        $comments = CliUI::prompt("Enter transaction remarks for audit log");

        $res = $this->engine->transition($reqId, $this->activeUser, $action, $comments);

        if ($res['success']) {
            CliUI::success("Transition committed! New State: " . $res['new_status']);
        } else {
            CliUI::error($res['message']);
            CliUI::pause();
        }
    }

    private function viewRegistry(): void {
        CliUI::header("Global Procurement Registry");
        $registry = $this->repo->getGlobalRegistry();

        $tableData = [];
        foreach ($registry as $r) {
            $tableData[] = [
                'id'        => $r['id'],
                'number'    => $r['req_number'],
                'requester' => $r['requester_name'],
                'vendor'    => $r['vendor_name'],
                'cost'      => "$" . number_format((float)$r['total_cost'], 2),
                'badge'     => CliUI::statusBadge($r['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'number' => 'Req Ref', 'requester' => 'Requester', 'vendor' => 'Vendor', 'cost' => 'Total Amount', 'badge' => 'Pipeline Status'
        ]);

        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Compliance Audit Trail Extraction");
        $reqId = (int)CliUI::prompt("Enter Requisition ID to extract audit trail");

        $logs = $this->repo->getAuditTrail($reqId);
        if (empty($logs)) {
            CliUI::error("No audit logs found for that Requisition ID.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL AUDIT TRAIL FOR REQUISITION #{$reqId}:" . CliUI::RESET . "\n";
        foreach ($logs as $l) {
            $color = ($l['action_taken'] === 'APPROVED') ? CliUI::GREEN : CliUI::RED;
            echo "  ├─ [" . $l['timestamp'] . "] " . CliUI::BOLD . $l['actor_name'] . " (" . $l['actor_role'] . ")" . CliUI::RESET . "\n";
            echo "  │  Action Taken : " . $color . $l['action_taken'] . CliUI::RESET . "\n";
            echo "  │  Transition   : " . CliUI::DIM . $l['previous_status'] . CliUI::RESET . " ──> " . CliUI::CYAN . $l['new_status'] . CliUI::RESET . "\n";
            echo "  │  SHA-256 Sig  : " . CliUI::YELLOW . substr($l['signature_hash'], 0, 16) . "..." . CliUI::RESET . "\n";
            echo "  │  Remarks      : " . ($l['comments'] ?: 'None') . "\n";
        }
        echo "  └─ End of Sequence Analysis.\n";

        CliUI::pause();
    }

    private function switchUserFlow(array $users): void {
        CliUI::header("Impersonate Authority Session");

        $tableData = [];
        foreach ($users as $u) {
            $tableData[] = ['id' => $u['id'], 'name' => $u['name'], 'role' => $u['role']];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'name' => 'User Name', 'role' => 'Assigned Role']);

        $id = (int)CliUI::prompt("Select User ID");
        foreach ($users as $u) {
            if ((int)$u['id'] === $id) {
                $this->activeUser = $u;
                CliUI::success("Session context switched to {$u['name']} ({$u['role']}).");
                return;
            }
        }
        CliUI::error("Invalid user selection.");
        CliUI::pause();
    }
}

// ==========================================
// 5. Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Procurement engines require standard console CLI environments.\n");
}

$app = new ProcurementConsoleApp();

if (isset($argv) && in_array('--process', $argv, true)) {
    $app->runBatchProcess();
} else {
    $app->launchWorkspace();
}
