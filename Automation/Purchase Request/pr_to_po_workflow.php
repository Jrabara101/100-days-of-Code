#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Purchase Request (PR) to Purchase Order (PO) Workflow Engine
 * 
 * Usage:
 *   php pr_to_po_workflow.php           (Interactive Manager Workspace)
 *   php pr_to_po_workflow.php --convert (Headless Batch Auto-Conversion Runner)
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
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[PR-PO-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'PR_SUBMITTED' => self::YELLOW . " PR_SUBMITTED " . self::RESET,
            'PR_APPROVED'  => self::CYAN . " PR_APPROVED  " . self::RESET,
            'PR_CONVERTED' => self::BLUE . " PR_CONVERTED " . self::RESET,
            'PO_ISSUED'    => self::GREEN . self::BOLD . "  PO_ISSUED   " . self::RESET,
            'PO_FULFILLED' => self::GREEN . " PO_FULFILLED " . self::RESET,
            'REJECTED'     => self::RED . self::BOLD . "   REJECTED   " . self::RESET,
            default        => $status
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
class ProcurementRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/purchasing_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Departments & Budget Caps Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            annual_budget_cap REAL NOT NULL
        )");

        // Certified Vendors Registry
        $this->db->exec("CREATE TABLE IF NOT EXISTS vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            tax_id TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'ACTIVE' -- ACTIVE, SUSPENDED
        )");

        // Purchase Requests (Internal Ingestion)
        $this->db->exec("CREATE TABLE IF NOT EXISTS purchase_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pr_number TEXT UNIQUE NOT NULL,
            department_id INTEGER NOT NULL,
            requester_name TEXT NOT NULL,
            item_description TEXT NOT NULL,
            estimated_cost REAL NOT NULL,
            status TEXT DEFAULT 'PR_SUBMITTED', -- PR_SUBMITTED, PR_APPROVED, PR_CONVERTED, REJECTED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(id)
        )");

        // Purchase Orders (Binding External Contracts)
        $this->db->exec("CREATE TABLE IF NOT EXISTS purchase_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            po_number TEXT UNIQUE NOT NULL,
            pr_id INTEGER UNIQUE NOT NULL,
            vendor_id INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'PO_ISSUED', -- PO_ISSUED, PO_FULFILLED, CANCELLED
            issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pr_id) REFERENCES purchase_requests(id),
            FOREIGN KEY (vendor_id) REFERENCES vendors(id)
        )");

        // Immutable Audit Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS purchasing_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL, -- PR or PO
            entity_id INTEGER NOT NULL,
            actor_name TEXT NOT NULL,
            action_taken TEXT NOT NULL,
            previous_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            notes TEXT,
            signature_hash TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_pr_status ON purchase_requests(status)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status)");

        if ($this->db->query("SELECT COUNT(*) FROM departments")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        // Departments
        $dStmt = $this->db->prepare("INSERT INTO departments (name, annual_budget_cap) VALUES (?, ?)");
        $dStmt->execute(['Engineering Operations', 100000.00]);
        $dStmt->execute(['Corporate Marketing', 25000.00]);

        // Vendors
        $vStmt = $this->db->prepare("INSERT INTO vendors (name, tax_id) VALUES (?, ?)");
        $vStmt->execute(['AWS Cloud Services', 'US-99820141']);
        $vStmt->execute(['Dell Enterprise Direct', 'US-10293847']);
        $vStmt->execute(['Global Media Agency', 'US-44321098']);

        // Seed Sample Purchase Requests
        $prStmt = $this->db->prepare("
            INSERT INTO purchase_requests (pr_number, department_id, requester_name, item_description, estimated_cost, status) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        // PR 1: Approved & Ready for PO Conversion
        $prStmt->execute(['PR-2026-001', 1, 'Alice Vance', 'Annual GPU Compute Node Reserved Instances', 38000.00, 'PR_APPROVED']);
        
        // PR 2: Approved, ready for conversion
        $prStmt->execute(['PR-2026-002', 2, 'Marcus Brody', 'Q3 Metro Billboard Campaign Placement', 12500.00, 'PR_APPROVED']);
        
        // PR 3: Still in Draft/Submitted stage
        $prStmt->execute(['PR-2026-003', 1, 'Elena Fisher', '10x Developer Monitor Upgrades', 4500.00, 'PR_SUBMITTED']);

        $this->logAudit('PR', 1, 'SYSTEM', 'SEEDED', 'NONE', 'PR_APPROVED', 'Pre-seeded baseline PR approved by budget manager.');
        $this->logAudit('PR', 2, 'SYSTEM', 'SEEDED', 'NONE', 'PR_APPROVED', 'Pre-seeded baseline PR approved by department manager.');
        $this->logAudit('PR', 3, 'SYSTEM', 'SEEDED', 'NONE', 'PR_SUBMITTED', 'Submitted for manager review.');
    }

    public function createPurchaseRequest(int $deptId, string $requester, string $description, float $cost): string {
        $prNum = "PR-2026-" . rand(1000, 9999);
        $stmt = $this->db->prepare("
            INSERT INTO purchase_requests (pr_number, department_id, requester_name, item_description, estimated_cost) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$prNum, $deptId, trim($requester), trim($description), $cost]);
        $prId = (int)$this->db->lastInsertId();

        $this->logAudit('PR', $prId, $requester, 'SUBMITTED', 'NONE', 'PR_SUBMITTED', 'Requisition created and queued.');
        return $prNum;
    }

    public function approvePurchaseRequest(int $prId, string $approver): bool {
        $stmt = $this->db->prepare("UPDATE purchase_requests SET status = 'PR_APPROVED' WHERE id = ? AND status = 'PR_SUBMITTED'");
        $stmt->execute([$prId]);
        if ($stmt->rowCount() > 0) {
            $this->logAudit('PR', $prId, $approver, 'APPROVED', 'PR_SUBMITTED', 'PR_APPROVED', 'PR approved by department authority.');
            return true;
        }
        return false;
    }

    public function getDepartments(): array {
        return $this->db->query("SELECT * FROM departments ORDER BY id ASC")->fetchAll();
    }

    public function getVendors(): array {
        return $this->db->query("SELECT * FROM vendors WHERE status = 'ACTIVE' ORDER BY name ASC")->fetchAll();
    }

    public function getApprovedPRsReadyForConversion(): array {
        return $this->db->query("
            SELECT pr.*, d.name as department_name, d.annual_budget_cap
            FROM purchase_requests pr
            JOIN departments d ON pr.department_id = d.id
            WHERE pr.status = 'PR_APPROVED'
            ORDER BY pr.id ASC
        ")->fetchAll();
    }

    public function getGlobalPRRegistry(): array {
        return $this->db->query("
            SELECT pr.id, pr.pr_number, d.name as department_name, pr.requester_name, 
                   pr.item_description, pr.estimated_cost, pr.status
            FROM purchase_requests pr
            JOIN departments d ON pr.department_id = d.id
            ORDER BY pr.id DESC LIMIT 25
        ")->fetchAll();
    }

    public function getGlobalPORegistry(): array {
        return $this->db->query("
            SELECT po.id, po.po_number, pr.pr_number, v.name as vendor_name, 
                   po.total_amount, po.status, po.issued_at
            FROM purchase_orders po
            JOIN purchase_requests pr ON po.pr_id = pr.id
            JOIN vendors v ON po.vendor_id = v.id
            ORDER BY po.id DESC LIMIT 25
        ")->fetchAll();
    }

    public function getDepartmentCommittedSpend(int $deptId): float {
        $stmt = $this->db->prepare("
            SELECT COALESCE(SUM(po.total_amount), 0.00) as total_issued
            FROM purchase_orders po
            JOIN purchase_requests pr ON po.pr_id = pr.id
            WHERE pr.department_id = ? AND po.status != 'CANCELLED'
        ");
        $stmt->execute([$deptId]);
        return (float)$stmt->fetchColumn();
    }

    public function logAudit(string $entityType, int $entityId, string $actor, string $action, string $prevStatus, string $newStatus, string $notes): void {
        $sigPayload = "{$entityType}|{$entityId}|{$actor}|{$action}|{$newStatus}|" . microtime();
        $signature = hash('sha256', $sigPayload);

        $stmt = $this->db->prepare("
            INSERT INTO purchasing_audit_logs (entity_type, entity_id, actor_name, action_taken, previous_status, new_status, notes, signature_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$entityType, $entityId, $actor, $action, $prevStatus, $newStatus, $notes, $signature]);
    }

    public function getAuditTrail(int $prId): array {
        $stmt = $this->db->prepare("SELECT * FROM purchasing_audit_logs WHERE entity_type = 'PR' AND entity_id = ? ORDER BY id ASC");
        $stmt->execute([$prId]);
        return $stmt->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. PR-to-PO Conversion Workflow Engine
// ==========================================
class PrToPoWorkflowEngine {
    public function __construct(private ProcurementRepository $repo) {}

    /**
     * Executes the atomic PR-to-PO conversion pipeline within a database isolation boundary.
     */
    public function convertPrToPo(int $prId, int $vendorId, string $actor = 'PROCUREMENT_OFFICER'): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            // 1. Fetch PR row with explicit lock verification
            $stmt = $db->prepare("
                SELECT pr.*, d.annual_budget_cap 
                FROM purchase_requests pr
                JOIN departments d ON pr.department_id = d.id
                WHERE pr.id = ? AND pr.status = 'PR_APPROVED'
            ");
            $stmt->execute([$prId]);
            $pr = $stmt->fetch();

            if (!$pr) {
                $db->rollBack();
                return ['success' => false, 'message' => "PR #{$prId} is either not found or not in 'PR_APPROVED' status."];
            }

            // 2. Validate Active Vendor Selection
            $vStmt = $db->prepare("SELECT * FROM vendors WHERE id = ? AND status = 'ACTIVE'");
            $vStmt->execute([$vendorId]);
            $vendor = $vStmt->fetch();

            if (!$vendor) {
                $db->rollBack();
                return ['success' => false, 'message' => "Vendor ID #{$vendorId} is invalid or suspended."];
            }

            // 3. Budget Cap Check (Encumbered Spend Calculation)
            $deptId = (int)$pr['department_id'];
            $committed = $this->repo->getDepartmentCommittedSpend($deptId);
            $prCost = (float)$pr['estimated_cost'];
            $budgetCap = (float)$pr['annual_budget_cap'];

            if (($committed + $prCost) > $budgetCap) {
                $db->rollBack();
                $overage = ($committed + $prCost) - $budgetCap;
                return [
                    'success' => false, 
                    'message' => "Budget Cap Exceeded: Conversion rejected. Department committed spend (\$" . number_format($committed + $prCost, 2) . ") exceeds cap (\$" . number_format($budgetCap, 2) . ") by \$" . number_format($overage, 2) . "."
                ];
            }

            // 4. Generate Official PO Tracking Reference
            $poNum = "PO-2026-" . rand(1000, 9999);

            // 5. Create Purchase Order
            $poStmt = $db->prepare("
                INSERT INTO purchase_orders (po_number, pr_id, vendor_id, total_amount) 
                VALUES (?, ?, ?, ?)
            ");
            $poStmt->execute([$poNum, $prId, $vendorId, $prCost]);
            $poId = (int)$db->lastInsertId();

            // 6. Mutate Purchase Request Status
            $updatePr = $db->prepare("UPDATE purchase_requests SET status = 'PR_CONVERTED' WHERE id = ?");
            $updatePr->execute([$prId]);

            // 7. Commit Audit Trail Entries
            $this->repo->logAudit('PR', $prId, $actor, 'CONVERTED', 'PR_APPROVED', 'PR_CONVERTED', "PR converted to official PO reference {$poNum}.");
            $this->repo->logAudit('PO', $poId, $actor, 'ISSUED', 'NONE', 'PO_ISSUED', "PO {$poNum} issued to vendor {$vendor['name']}.");

            $db->commit();

            return [
                'success' => true,
                'po_number' => $poNum,
                'vendor_name' => $vendor['name'],
                'amount' => $prCost
            ];

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
    private PrToPoWorkflowEngine $engine;

    public function __construct() {
        $this->repo = new ProcurementRepository();
        $this->engine = new PrToPoWorkflowEngine($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $readyPRs = $this->repo->getApprovedPRsReadyForConversion();
            CliUI::header("PR to PO Procurement Workflow Gateway", "Approved PRs Awaiting Conversion: " . count($readyPRs));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Convert Approved PR to Purchase Order (PO Conversion Wizard)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Create New Purchase Request (PR Intake)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Approve Submitted Purchase Requests (Manager Gate)\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Output Master Purchase Requests Registry\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Output Master Purchase Orders Registry\n";
            echo "  " . CliUI::CYAN . "6." . CliUI::RESET . " Audit Compliance Log & SHA-256 Signature Trail\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect procurement workspace\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->convertWizard(); break;
                case '2': $this->createPrWizard(); break;
                case '3': $this->approvePrWizard(); break;
                case '4': $this->viewPrRegistry(); break;
                case '5': $this->viewPoRegistry(); break;
                case '6': $this->auditTrailFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Procurement workflow unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function convertWizard(): void {
        CliUI::header("PR to PO Conversion Wizard");
        $readyPRs = $this->repo->getApprovedPRsReadyForConversion();

        if (empty($readyPRs)) {
            CliUI::info("No approved Purchase Requests are currently awaiting conversion.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($readyPRs as $pr) {
            $committed = $this->repo->getDepartmentCommittedSpend((int)$pr['department_id']);
            $remaining = (float)$pr['annual_budget_cap'] - $committed;

            $tableData[] = [
                'id'         => $pr['id'],
                'number'     => $pr['pr_number'],
                'dept'       => $pr['department_name'],
                'item'       => strlen($pr['item_description']) > 28 ? substr($pr['item_description'], 0, 25) . "..." : $pr['item_description'],
                'cost'       => "$" . number_format((float)$pr['estimated_cost'], 2),
                'avail_budget' => "$" . number_format($remaining, 2)
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'number' => 'PR Ref', 'dept' => 'Department', 'item' => 'Item Description', 'cost' => 'Est Cost', 'avail_budget' => 'Dept Budget Left'
        ]);

        $prId = (int)CliUI::prompt("Enter PR ID to convert into Purchase Order");
        $validIds = array_column($readyPRs, 'id');

        if (!in_array($prId, $validIds, true)) {
            CliUI::error("Invalid PR ID selection.");
            CliUI::pause();
            return;
        }

        $vendors = $this->repo->getVendors();
        echo "\n Select Certified Vendor for PO Issuance:\n";
        foreach ($vendors as $v) {
            echo "  [{$v['id']}] {$v['name']} (Tax ID: {$v['tax_id']})\n";
        }
        echo "\n";

        $vendorId = (int)CliUI::prompt("Select Vendor ID");
        $validVendorIds = array_column($vendors, 'id');

        if (!in_array($vendorId, $validVendorIds, true)) {
            CliUI::error("Invalid Vendor selection.");
            CliUI::pause();
            return;
        }

        $res = $this->engine->convertPrToPo($prId, $vendorId, 'PROCUREMENT_OFFICER');

        if ($res['success']) {
            CliUI::success("Purchase Order {$res['po_number']} issued to {$res['vendor_name']} for $" . number_format($res['amount'], 2) . "!");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function createPrWizard(): void {
        CliUI::header("Create Purchase Request (PR Intake)");
        $depts = $this->repo->getDepartments();

        echo " Select Department:\n";
        foreach ($depts as $d) {
            echo "  [{$d['id']}] {$d['name']} (Budget Cap: $" . number_format((float)$d['annual_budget_cap'], 2) . ")\n";
        }
        echo "\n";

        $deptId = (int)CliUI::prompt("Select Department ID");
        $validDeptIds = array_column($depts, 'id');

        if (!in_array($deptId, $validDeptIds, true)) {
            CliUI::error("Invalid Department selection.");
            CliUI::pause();
            return;
        }

        $requester = CliUI::prompt("Requester Full Name");
        if (empty($requester)) { CliUI::error("Requester name is required."); CliUI::pause(); return; }

        $item = CliUI::prompt("Item / Service Description");
        $costStr = CliUI::prompt("Estimated Total Cost ($ USD)");

        if (!is_numeric($costStr) || (float)$costStr <= 0) {
            CliUI::error("Cost must be a positive numeric value.");
            CliUI::pause();
            return;
        }

        $prNum = $this->repo->createPurchaseRequest($deptId, $requester, $item, (float)$costStr);
        CliUI::success("Purchase Request {$prNum} submitted! Status set to PR_SUBMITTED.");
        CliUI::pause();
    }

    private function approvePrWizard(): void {
        CliUI::header("Approve Pending Purchase Requests");
        $prs = $this->repo->getGlobalPRRegistry();
        $submittedPRs = array_filter($prs, fn($p) => $p['status'] === 'PR_SUBMITTED');

        if (empty($submittedPRs)) {
            CliUI::info("No pending Purchase Requests require approval.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($submittedPRs as $p) {
            $tableData[] = [
                'id'        => $p['id'],
                'number'    => $p['pr_number'],
                'dept'      => $p['department_name'],
                'requester' => $p['requester_name'],
                'cost'      => "$" . number_format((float)$p['estimated_cost'], 2)
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'number' => 'PR Ref', 'dept' => 'Department', 'requester' => 'Requester', 'cost' => 'Est Cost'
        ]);

        $prId = (int)CliUI::prompt("Enter PR ID to approve");
        $approver = CliUI::prompt("Approver Name", "Department Manager");

        if ($this->repo->approvePurchaseRequest($prId, $approver)) {
            CliUI::success("PR #{$prId} approved! Status advanced to PR_APPROVED.");
        } else {
            CliUI::error("Approval failed. PR may not be in 'PR_SUBMITTED' state.");
        }

        CliUI::pause();
    }

    private function viewPrRegistry(): void {
        CliUI::header("Global Purchase Requests Registry");
        $registry = $this->repo->getGlobalPRRegistry();

        $tableData = [];
        foreach ($registry as $r) {
            $tableData[] = [
                'id'        => $r['id'],
                'number'    => $r['pr_number'],
                'dept'      => $r['department_name'],
                'requester' => $r['requester_name'],
                'cost'      => "$" . number_format((float)$r['estimated_cost'], 2),
                'badge'     => CliUI::statusBadge($r['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'number' => 'PR Ref', 'dept' => 'Department', 'requester' => 'Requester', 'cost' => 'Est Cost', 'badge' => 'Status'
        ]);

        CliUI::pause();
    }

    private function viewPoRegistry(): void {
        CliUI::header("Global Issued Purchase Orders Registry");
        $registry = $this->repo->getGlobalPORegistry();

        $tableData = [];
        foreach ($registry as $r) {
            $tableData[] = [
                'id'        => $r['id'],
                'po_num'    => $r['po_number'],
                'pr_num'    => $r['pr_number'],
                'vendor'    => $r['vendor_name'],
                'amount'    => "$" . number_format((float)$r['total_amount'], 2),
                'badge'     => CliUI::statusBadge($r['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'po_num' => 'PO Ref', 'pr_num' => 'Origin PR', 'vendor' => 'Vendor', 'amount' => 'PO Amount', 'badge' => 'Status'
        ]);

        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Compliance Audit Trail Extraction");
        $prId = (int)CliUI::prompt("Enter Purchase Request ID to extract audit trail");

        $logs = $this->repo->getAuditTrail($prId);
        if (empty($logs)) {
            CliUI::error("No audit logs found for that Purchase Request ID.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL AUDIT TRAIL FOR PURCHASE REQUEST #{$prId}:" . CliUI::RESET . "\n";
        foreach ($logs as $l) {
            $color = match($l['new_status']) {
                'PR_APPROVED', 'PO_ISSUED' => CliUI::GREEN,
                'PR_CONVERTED' => CliUI::BLUE,
                default => CliUI::CYAN
            };

            echo "  ├─ [" . $l['timestamp'] . "] Entity: " . CliUI::BOLD . $l['entity_type'] . " #" . $l['entity_id'] . CliUI::RESET . " | Actor: " . $l['actor_name'] . "\n";
            echo "  │  Action Taken : " . $color . $l['action_taken'] . CliUI::RESET . "\n";
            echo "  │  Transition   : " . CliUI::DIM . $l['previous_status'] . CliUI::RESET . " ──> " . $color . $l['new_status'] . CliUI::RESET . "\n";
            echo "  │  SHA-256 Sig  : " . CliUI::YELLOW . substr($l['signature_hash'], 0, 16) . "..." . CliUI::RESET . "\n";
            echo "  │  Remarks      : " . ($l['notes'] ?: 'None') . "\n";
        }
        echo "  └─ End of Sequence Analysis.\n";

        CliUI::pause();
    }

    public function runBatchAutoConversion(bool $headlessMode = true): void {
        if ($headlessMode) {
            CliUI::stepLog("Querying approved PRs ready for batch conversion...");
        } else {
            echo "Executing automated PR to PO batch conversion...\n";
        }

        $readyPRs = $this->repo->getApprovedPRsReadyForConversion();
        if (empty($readyPRs)) {
            if ($headlessMode) {
                CliUI::stepLog("No approved PRs currently awaiting conversion.");
            } else {
                CliUI::info("No approved PRs awaiting conversion.");
            }
            return;
        }

        $vendors = $this->repo->getVendors();
        $defaultVendor = $vendors[0] ?? null;

        if (!$defaultVendor) {
            CliUI::error("No active vendors available for conversion.");
            return;
        }

        $converted = 0;
        foreach ($readyPRs as $pr) {
            $res = $this->engine->convertPrToPo((int)$pr['id'], (int)$defaultVendor['id'], 'AUTO_CONVERSION_DAEMON');
            
            if ($res['success']) {
                $msg = "PR {$pr['pr_number']} (\$" . number_format((float)$pr['estimated_cost'], 2) . ") converted to {$res['po_number']} [Vendor: {$res['vendor_name']}].";
                if ($headlessMode) {
                    CliUI::stepLog($msg);
                } else {
                    echo "  " . CliUI::GREEN . "✔" . CliUI::RESET . " " . $msg . "\n";
                }
                $converted++;
            } else {
                $errMsg = "Conversion failed for PR {$pr['pr_number']}: " . $res['message'];
                if ($headlessMode) {
                    CliUI::stepLog(CliUI::RED . $errMsg . CliUI::RESET);
                } else {
                    echo "  " . CliUI::RED . "✖ " . $errMsg . CliUI::RESET . "\n";
                }
            }

            usleep(50000); // 50ms pause
        }

        $summary = "Batch conversion complete. Total POs issued: {$converted}";
        if ($headlessMode) {
            CliUI::stepLog($summary);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $summary . CliUI::RESET . "\n";
        }
    }
}

// ==========================================
// 5. Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Purchasing workflow engines require standard console CLI environments.\n");
}

$app = new ProcurementConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--convert') {
    $app->runBatchAutoConversion(true);
} else {
    $app->launchWorkspace();
}
