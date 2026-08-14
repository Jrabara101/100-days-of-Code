#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Enterprise Payroll Processing Pipeline
 * 
 * Usage:
 *   php payroll_pipeline.php           (Interactive Operations Console)
 *   php payroll_pipeline.php --process (Headless Batch Calculation & Dispatcher)
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
        echo self::GREEN . self::BOLD;
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
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[PAYROLL-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'DRAFT'             => self::DIM . "    DRAFT    " . self::RESET,
            'CALCULATED'        => self::CYAN . " CALCULATED  " . self::RESET,
            'AUDITED_APPROVED'  => self::YELLOW . self::BOLD . "  APPROVED   " . self::RESET,
            'DISPATCHED_PAID'   => self::GREEN . self::BOLD . "   PAID/OK   " . self::RESET,
            'STALLED', 'FAILED' => self::RED . self::BOLD . "   FAILED    " . self::RESET,
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
class PayrollRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/payroll_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Employees Master Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emp_code TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            department TEXT NOT NULL,
            annual_salary REAL NOT NULL,
            tax_rate_pct REAL NOT NULL,
            monthly_benefits REAL NOT NULL,
            status TEXT DEFAULT 'ACTIVE'
        )");

        // Payroll Runs Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS payroll_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_code TEXT UNIQUE NOT NULL,
            pay_period TEXT NOT NULL,
            total_gross REAL DEFAULT 0.00,
            total_deductions REAL DEFAULT 0.00,
            total_net REAL DEFAULT 0.00,
            status TEXT DEFAULT 'DRAFT', -- DRAFT, CALCULATED, AUDITED_APPROVED, DISPATCHED_PAID
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Paystubs Table (Atomic & Idempotent per Employee per Run)
        $this->db->exec("CREATE TABLE IF NOT EXISTS paystubs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payroll_run_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            gross_pay REAL NOT NULL,
            tax_deduction REAL NOT NULL,
            benefits_deduction REAL NOT NULL,
            net_pay REAL NOT NULL,
            status TEXT DEFAULT 'CALCULATED', -- CALCULATED, PAID
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            UNIQUE(payroll_run_id, employee_id)
        )");

        // Audit Trail Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS payroll_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payroll_run_id INTEGER NOT NULL,
            actor TEXT NOT NULL,
            action_taken TEXT NOT NULL,
            previous_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            signature_hash TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_run_status ON payroll_runs(status)");

        if ($this->db->query("SELECT COUNT(*) FROM employees")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        $eStmt = $this->db->prepare("
            INSERT INTO employees (emp_code, full_name, email, department, annual_salary, tax_rate_pct, monthly_benefits) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $eStmt->execute(['EMP-1001', 'Alice Vance', 'a.vance@enterprise.io', 'Engineering', 144000.00, 22.0, 400.00]);
        $eStmt->execute(['EMP-1002', 'Marcus Brody', 'm.brody@enterprise.io', 'Research & Legal', 96000.00, 18.0, 300.00]);
        $eStmt->execute(['EMP-1003', 'Elena Fisher', 'e.fisher@enterprise.io', 'Media & Field Ops', 108000.00, 20.0, 350.00]);
        $eStmt->execute(['EMP-1004', 'Arthur Pendelton', 'a.pendelton@enterprise.io', 'Finance', 120000.00, 21.0, 380.00]);

        // Create an initial draft payroll run for current pay period
        $payPeriod = date('Y-m') . "-15";
        $runCode = "PAY-" . date('Ym') . "-1";
        
        $rStmt = $this->db->prepare("INSERT INTO payroll_runs (run_code, pay_period, status) VALUES (?, ?, 'DRAFT')");
        $rStmt->execute([$runCode, $payPeriod]);
    }

    public function getActiveEmployees(): array {
        return $this->db->query("SELECT * FROM employees WHERE status = 'ACTIVE' ORDER BY id ASC")->fetchAll();
    }

    public function getPayrollRuns(): array {
        return $this->db->query("SELECT * FROM payroll_runs ORDER BY id DESC LIMIT 20")->fetchAll();
    }

    public function getPayrollRunByCode(string $code): ?array {
        $stmt = $this->db->prepare("SELECT * FROM payroll_runs WHERE run_code = ?");
        $stmt->execute([trim($code)]);
        return $stmt->fetch() ?: null;
    }

    public function getPaystubsForRun(int $runId): array {
        $stmt = $this->db->prepare("
            SELECT p.*, e.emp_code, e.full_name, e.department, e.email
            FROM paystubs p
            JOIN employees e ON p.employee_id = e.id
            WHERE p.payroll_run_id = ?
            ORDER BY e.emp_code ASC
        ");
        $stmt->execute([$runId]);
        return $stmt->fetchAll();
    }

    public function logAudit(int $runId, string $actor, string $action, string $prevStatus, string $newStatus, float $netTotal): void {
        $sigPayload = "{$runId}|{$actor}|{$action}|{$prevStatus}|{$newStatus}|{$netTotal}|" . microtime();
        $signature = hash('sha256', $sigPayload);

        $stmt = $this->db->prepare("
            INSERT INTO payroll_audit_logs (payroll_run_id, actor, action_taken, previous_status, new_status, signature_hash)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$runId, $actor, $action, $prevStatus, $newStatus, $signature]);
    }

    public function getAuditTrail(int $runId): array {
        $stmt = $this->db->prepare("SELECT * FROM payroll_audit_logs WHERE payroll_run_id = ? ORDER BY id ASC");
        $stmt->execute([$runId]);
        return $stmt->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Calculation & Pipeline Execution Engine
// ==========================================
class PayrollCalculationEngine {
    public function __construct(private PayrollRepository $repo) {}

    /**
     * Calculates semi-monthly paystubs for all active employees for a target run.
     */
    public function calculatePayrollRun(int $runId, string $actor = 'SYSTEM_ENGINE'): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("SELECT * FROM payroll_runs WHERE id = ? AND status = 'DRAFT'");
            $stmt->execute([$runId]);
            $run = $stmt->fetch();

            if (!$run) {
                $db->rollBack();
                return ['success' => false, 'message' => "Payroll run #{$runId} is not in DRAFT state or does not exist."];
            }

            $employees = $this->repo->getActiveEmployees();
            if (empty($employees)) {
                $db->rollBack();
                return ['success' => false, 'message' => "No active employees found to compute payroll."];
            }

            $runGross = 0.00;
            $runDeductions = 0.00;
            $runNet = 0.00;

            $stubStmt = $db->prepare("
                INSERT INTO paystubs (payroll_run_id, employee_id, gross_pay, tax_deduction, benefits_deduction, net_pay)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            foreach ($employees as $emp) {
                // Semi-monthly gross pay (24 pay periods/year)
                $gross = round((float)$emp['annual_salary'] / 24.0, 2);
                
                // Statutory tax calculation
                $tax = round($gross * ((float)$emp['tax_rate_pct'] / 100.0), 2);
                
                // Semi-monthly benefits deduction
                $benefits = round((float)$emp['monthly_benefits'] / 2.0, 2);
                
                $net = $gross - $tax - $benefits;

                $stubStmt->execute([$runId, $emp['id'], $gross, $tax, $benefits, $net]);

                $runGross += $gross;
                $runDeductions += ($tax + $benefits);
                $runNet += $net;
            }

            // Update Payroll Run Totals and Status
            $updateRun = $db->prepare("
                UPDATE payroll_runs 
                SET total_gross = ?, total_deductions = ?, total_net = ?, status = 'CALCULATED', updated_at = datetime('now')
                WHERE id = ?
            ");
            $updateRun->execute([$runGross, $runDeductions, $runNet, $runId]);

            $this->repo->logAudit($runId, $actor, 'CALCULATED', 'DRAFT', 'CALCULATED', $runNet);

            $db->commit();
            return [
                'success' => true,
                'run_code' => $run['run_code'],
                'employees_processed' => count($employees),
                'total_net' => $runNet
            ];

        } catch (PDOException $e) {
            $db->rollBack();
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                return ['success' => false, 'message' => "Idempotency Violation: Paystubs already exist for run #{$runId}."];
            }
            throw $e;
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Audits and Approves a Calculated Payroll Run.
     */
    public function approvePayrollRun(int $runId, string $actor = 'FINANCE_AUDITOR'): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("SELECT * FROM payroll_runs WHERE id = ? AND status = 'CALCULATED'");
            $stmt->execute([$runId]);
            $run = $stmt->fetch();

            if (!$run) {
                $db->rollBack();
                return ['success' => false, 'message' => "Payroll run #{$runId} is not in CALCULATED state."];
            }

            $update = $db->prepare("UPDATE payroll_runs SET status = 'AUDITED_APPROVED', updated_at = datetime('now') WHERE id = ?");
            $update->execute([$runId]);

            $this->repo->logAudit($runId, $actor, 'AUDITED_APPROVED', 'CALCULATED', 'AUDITED_APPROVED', (float)$run['total_net']);

            $db->commit();
            return ['success' => true, 'run_code' => $run['run_code']];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Dispatches Direct Deposit Payments and Marks Payroll as DISPATCHED_PAID.
     */
    public function dispatchPayments(int $runId, string $actor = 'TREASURY_DISPATCHER'): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("SELECT * FROM payroll_runs WHERE id = ? AND status = 'AUDITED_APPROVED'");
            $stmt->execute([$runId]);
            $run = $stmt->fetch();

            if (!$run) {
                $db->rollBack();
                return ['success' => false, 'message' => "Payroll run #{$runId} is not in AUDITED_APPROVED state."];
            }

            // Mark paystubs as PAID
            $stubStmt = $db->prepare("UPDATE paystubs SET status = 'PAID' WHERE payroll_run_id = ?");
            $stubStmt->execute([$runId]);

            // Update Payroll Run status
            $updateRun = $db->prepare("UPDATE payroll_runs SET status = 'DISPATCHED_PAID', updated_at = datetime('now') WHERE id = ?");
            $updateRun->execute([$runId]);

            $this->repo->logAudit($runId, $actor, 'DISPATCHED_PAID', 'AUDITED_APPROVED', 'DISPATCHED_PAID', (float)$run['total_net']);

            $db->commit();
            return ['success' => true, 'run_code' => $run['run_code'], 'total_dispatched' => (float)$run['total_net']];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
}

// ==========================================
// 4. Main Application Console Loop
// ==========================================
class PayrollConsoleApp {
    private PayrollRepository $repo;
    private PayrollCalculationEngine $engine;

    public function __construct() {
        $this->repo = new PayrollRepository();
        $this->engine = new PayrollCalculationEngine($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $runs = $this->repo->getPayrollRuns();
            CliUI::header("Enterprise Payroll Processing Pipeline", "Active Payroll Runs Registry: " . count($runs));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Calculate Paystubs for Draft Payroll Run\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Approve & Audit Calculated Payroll Run\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Dispatch Direct Deposit Disbursements\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " View Global Payroll Runs Registry\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Inspect Individual Employee Paystubs\n";
            echo "  " . CliUI::CYAN . "6." . CliUI::RESET . " Audit Compliance Trail & SHA-256 Hashes\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect payroll console\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->calculateWizard(); break;
                case '2': $this->approveWizard(); break;
                case '3': $this->dispatchWizard(); break;
                case '4': $this->viewRunsRegistry(); break;
                case '5': $this->viewPaystubsWizard(); break;
                case '6': $this->auditTrailFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Payroll vault unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    continue 2;
            }
        }
    }

    private function calculateWizard(): void {
        CliUI::header("Calculate Paystubs Wizard");
        $runs = $this->repo->getPayrollRuns();
        $drafts = array_filter($runs, fn($r) => $r['status'] === 'DRAFT');

        if (empty($drafts)) {
            CliUI::info("No DRAFT payroll runs available to calculate.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($drafts as $d) {
            $tableData[] = ['id' => $d['id'], 'code' => $d['run_code'], 'period' => $d['pay_period'], 'status' => CliUI::statusBadge($d['status'])];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'code' => 'Run Code', 'period' => 'Pay Period', 'status' => 'Status']);

        $runId = (int)CliUI::prompt("Enter Payroll Run ID to calculate");
        $res = $this->engine->calculatePayrollRun($runId, 'HR_OPERATOR');

        if ($res['success']) {
            CliUI::success("Payroll Run {$res['run_code']} calculated! Processed {$res['employees_processed']} employees. Total Net: $" . number_format($res['total_net'], 2));
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function approveWizard(): void {
        CliUI::header("Approve & Audit Payroll Run");
        $runs = $this->repo->getPayrollRuns();
        $calculated = array_filter($runs, fn($r) => $r['status'] === 'CALCULATED');

        if (empty($calculated)) {
            CliUI::info("No CALCULATED payroll runs awaiting approval.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($calculated as $c) {
            $tableData[] = [
                'id'         => $c['id'],
                'code'       => $c['run_code'],
                'gross'      => "$" . number_format((float)$c['total_gross'], 2),
                'deductions' => "$" . number_format((float)$c['total_deductions'], 2),
                'net'        => "$" . number_format((float)$c['total_net'], 2)
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'code' => 'Run Code', 'gross' => 'Total Gross', 'deductions' => 'Total Deductions', 'net' => 'Total Net'
        ]);

        $runId = (int)CliUI::prompt("Enter Payroll Run ID to approve");
        $res = $this->engine->approvePayrollRun($runId, 'COMPLIANCE_AUDITOR');

        if ($res['success']) {
            CliUI::success("Payroll Run {$res['run_code']} approved and locked for disbursement!");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function dispatchWizard(): void {
        CliUI::header("Dispatch Direct Deposit Disbursements");
        $runs = $this->repo->getPayrollRuns();
        $approved = array_filter($runs, fn($r) => $r['status'] === 'AUDITED_APPROVED');

        if (empty($approved)) {
            CliUI::info("No AUDITED_APPROVED payroll runs ready for disbursement.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($approved as $a) {
            $tableData[] = [
                'id'    => $a['id'],
                'code'  => $a['run_code'],
                'net'   => "$" . number_format((float)$a['total_net'], 2),
                'status' => CliUI::statusBadge($a['status'])
            ];
        }

        CliUI::drawTable($tableData, ['id' => 'ID', 'code' => 'Run Code', 'net' => 'Total Net Funds', 'status' => 'Status']);

        $runId = (int)CliUI::prompt("Enter Payroll Run ID to dispatch funds");
        $res = $this->engine->dispatchPayments($runId, 'TREASURY_DISPATCHER');

        if ($res['success']) {
            CliUI::success("Payroll Run {$res['run_code']} disbursed successfully! Total Dispatched: $" . number_format($res['total_dispatched'], 2));
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function viewRunsRegistry(): void {
        CliUI::header("Global Payroll Runs Registry");
        $runs = $this->repo->getPayrollRuns();

        $tableData = [];
        foreach ($runs as $r) {
            $tableData[] = [
                'id'         => $r['id'],
                'code'       => $r['run_code'],
                'period'     => $r['pay_period'],
                'gross'      => "$" . number_format((float)$r['total_gross'], 2),
                'net'        => "$" . number_format((float)$r['total_net'], 2),
                'status'     => CliUI::statusBadge($r['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'code' => 'Run Code', 'period' => 'Period', 'gross' => 'Total Gross', 'net' => 'Total Net', 'status' => 'Status'
        ]);

        CliUI::pause();
    }

    private function viewPaystubsWizard(): void {
        CliUI::header("Inspect Individual Employee Paystubs");
        $runCode = CliUI::prompt("Enter Payroll Run Code (e.g. " . date('Ym') . "-1)", "PAY-" . date('Ym') . "-1");
        
        $run = $this->repo->getPayrollRunByCode($runCode);
        if (!$run) {
            CliUI::error("Payroll Run Code [{$runCode}] not found.");
            CliUI::pause();
            return;
        }

        $stubs = $this->repo->getPaystubsForRun((int)$run['id']);
        if (empty($stubs)) {
            CliUI::info("No paystubs generated for this run yet.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($stubs as $s) {
            $tableData[] = [
                'emp'      => $s['emp_code'] . " (" . $s['full_name'] . ")",
                'dept'     => $s['department'],
                'gross'    => "$" . number_format((float)$s['gross_pay'], 2),
                'tax'      => "$" . number_format((float)$s['tax_deduction'], 2),
                'benefits' => "$" . number_format((float)$s['benefits_deduction'], 2),
                'net'      => "$" . number_format((float)$s['net_pay'], 2),
                'status'   => CliUI::statusBadge($s['status'])
            ];
        }

        CliUI::header("Paystubs Details for Run: {$runCode}", "Total Net: $" . number_format((float)$run['total_net'], 2));
        CliUI::drawTable($tableData, [
            'emp' => 'Employee', 'dept' => 'Department', 'gross' => 'Gross Pay', 'tax' => 'Tax', 'benefits' => 'Benefits', 'net' => 'Net Pay', 'status' => 'Status'
        ]);

        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Compliance Audit Trail Extraction");
        $runId = (int)CliUI::prompt("Enter Payroll Run ID to extract audit trail");

        $logs = $this->repo->getAuditTrail($runId);
        if (empty($logs)) {
            CliUI::error("No audit logs found for that Payroll Run ID.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL AUDIT TRAIL FOR PAYROLL RUN #{$runId}:" . CliUI::RESET . "\n";
        foreach ($logs as $l) {
            $color = match($l['new_status']) {
                'CALCULATED' => CliUI::CYAN,
                'AUDITED_APPROVED' => CliUI::YELLOW,
                'DISPATCHED_PAID' => CliUI::GREEN,
                default => CliUI::RESET
            };

            echo "  ├─ [" . $l['timestamp'] . "] Actor: " . CliUI::BOLD . $l['actor'] . CliUI::RESET . "\n";
            echo "  │  Action Taken : " . $color . $l['action_taken'] . CliUI::RESET . "\n";
            echo "  │  Transition   : " . CliUI::DIM . $l['previous_status'] . CliUI::RESET . " ──> " . $color . $l['new_status'] . CliUI::RESET . "\n";
            echo "  │  SHA-256 Sig  : " . CliUI::YELLOW . substr($l['signature_hash'], 0, 16) . "..." . CliUI::RESET . "\n";
        }
        echo "  └─ End of Sequence Analysis.\n";

        CliUI::pause();
    }

    public function runBatchProcessing(bool $headlessMode = true): void {
        if ($headlessMode) {
            CliUI::stepLog("Querying active payroll runs for automated execution...");
        } else {
            echo "Executing automated payroll processing pass...\n";
        }

        $runs = $this->repo->getPayrollRuns();
        $drafts = array_filter($runs, fn($r) => $r['status'] === 'DRAFT');

        if (empty($drafts)) {
            if ($headlessMode) {
                CliUI::stepLog("No DRAFT payroll runs requiring calculation.");
            } else {
                CliUI::info("No DRAFT payroll runs requiring calculation.");
            }
            return;
        }

        foreach ($drafts as $run) {
            $runId = (int)$run['id'];
            
            // 1. Calculate
            $cRes = $this->engine->calculatePayrollRun($runId, 'DAEMON_PROCESSOR');
            if ($cRes['success']) {
                $logMsg = "Payroll Run {$cRes['run_code']} CALCULATED. Net: $" . number_format($cRes['total_net'], 2);
                if ($headlessMode) {
                    CliUI::stepLog($logMsg);
                } else {
                    echo "  ✔ " . $logMsg . "\n";
                }
                
                // 2. Auto-Approve
                $aRes = $this->engine->approvePayrollRun($runId, 'DAEMON_AUDITOR');
                if ($aRes['success']) {
                    $logMsg2 = "Payroll Run {$aRes['run_code']} APPROVED.";
                    if ($headlessMode) {
                        CliUI::stepLog($logMsg2);
                    } else {
                        echo "  ✔ " . $logMsg2 . "\n";
                    }

                    // 3. Auto-Dispatch
                    $dRes = $this->engine->dispatchPayments($runId, 'DAEMON_TREASURY');
                    if ($dRes['success']) {
                        $logMsg3 = "Payroll Run {$dRes['run_code']} DISPATCHED_PAID ($" . number_format($dRes['total_dispatched'], 2) . ").";
                        if ($headlessMode) {
                            CliUI::stepLog($logMsg3);
                        } else {
                            echo "  ✔ " . $logMsg3 . "\n";
                        }
                    }
                }
            } else {
                $errMsg = "Payroll Run #{$runId} failed calculation: " . $cRes['message'];
                if ($headlessMode) {
                    CliUI::stepLog(CliUI::RED . $errMsg . CliUI::RESET);
                } else {
                    CliUI::error($errMsg);
                }
            }
        }
    }
}

// ==========================================
// 5. Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Payroll processing pipeline requires standard console CLI environment.\n");
}

$app = new PayrollConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--process') {
    $app->runBatchProcessing(true);
} else {
    $app->launchWorkspace();
}
