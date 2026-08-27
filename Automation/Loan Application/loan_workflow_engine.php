#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Enterprise Loan Origination & Underwriting Engine
 * 
 * Usage:
 *   php loan_workflow_engine.php           (Interactive Underwriter Workspace)
 *   php loan_workflow_engine.php --process (Headless Batch Auto-Underwriting Daemon)
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Presentation & TUI Layout Engine
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
        echo "\n" . self::DIM . "Press Enter to return to main workspace..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[UNDERWRITING] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'SUBMITTED'      => self::DIM . "  SUBMITTED  " . self::RESET,
            'UNDERWRITING'   => self::CYAN . " UNDERWRITING" . self::RESET,
            'AUTO_APPROVED'  => self::GREEN . self::BOLD . " AUTO_APPROVE" . self::RESET,
            'MANUAL_REVIEW'  => self::YELLOW . self::BOLD . " MANUAL_REV  " . self::RESET,
            'OFFER_ACCEPTED' => self::BLUE . " ACCEPTED_OFF" . self::RESET,
            'DISBURSED'      => self::GREEN . self::BOLD . "  DISBURSED  " . self::RESET,
            'DECLINED'       => self::RED . self::BOLD . "   DECLINED  " . self::RESET,
            default          => $status
        };
    }

    public static function creditBadge(int $score): string {
        if ($score >= 750) {
            return self::GREEN . self::BOLD . " PRIME (" . $score . ") " . self::RESET;
        }
        if ($score >= 650) {
            return self::YELLOW . " GOOD (" . $score . ") " . self::RESET;
        }
        return self::RED . self::BOLD . " SUBPRIME (" . $score . ") " . self::RESET;
    }

    public static function renderDtiBar(float $dtiRatio, int $width = 10): string {
        $ratio = min(1.0, max(0.0, $dtiRatio / 60.0)); // 60% max representation
        $filled = (int)round($ratio * $width);
        $empty = max(0, $width - $filled);
        $dtiFormatted = number_format($dtiRatio, 1) . "%";

        $color = ($dtiRatio > 45.0) ? self::RED : (($dtiRatio > 35.0) ? self::YELLOW : self::GREEN);
        return $color . "[" . str_repeat("■", $filled) . str_repeat(" ", $empty) . "] " . str_pad($dtiFormatted, 6, " ", STR_PAD_LEFT) . self::RESET;
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
// 2. Data Persistence Layer (SQLite Isolation)
// ==========================================
class LoanRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/loan_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Bank Capital Reserves Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS treasury_reserves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pool_name TEXT UNIQUE NOT NULL,
            available_capital REAL NOT NULL,
            total_disbursed REAL DEFAULT 0.00
        )");

        // Borrowers Master Registry
        $this->db->exec("CREATE TABLE IF NOT EXISTS borrowers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            annual_income REAL NOT NULL,
            existing_monthly_debt REAL NOT NULL,
            credit_score INTEGER NOT NULL
        )");

        // Loan Applications
        $this->db->exec("CREATE TABLE IF NOT EXISTS loan_applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_number TEXT UNIQUE NOT NULL,
            borrower_id INTEGER NOT NULL,
            loan_purpose TEXT NOT NULL,
            principal_amount REAL NOT NULL,
            term_months INTEGER NOT NULL,
            approved_apr REAL DEFAULT 0.00,
            monthly_payment REAL DEFAULT 0.00,
            dti_ratio REAL DEFAULT 0.00,
            status TEXT DEFAULT 'SUBMITTED',
            underwriter_notes TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (borrower_id) REFERENCES borrowers(id)
        )");

        // Full Amortization Schedules Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS amortization_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            loan_id INTEGER NOT NULL,
            month_number INTEGER NOT NULL,
            payment_amount REAL NOT NULL,
            principal_portion REAL NOT NULL,
            interest_portion REAL NOT NULL,
            remaining_balance REAL NOT NULL,
            FOREIGN KEY (loan_id) REFERENCES loan_applications(id),
            UNIQUE(loan_id, month_number)
        )");

        // Cryptographic Audit Trail Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS loan_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            loan_id INTEGER NOT NULL,
            actor TEXT NOT NULL,
            action_taken TEXT NOT NULL,
            previous_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            signature_hash TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (loan_id) REFERENCES loan_applications(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_loan_status ON loan_applications(status)");

        if ($this->db->query("SELECT COUNT(*) FROM treasury_reserves")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        // 1. Initialize Treasury Reserve ($5,000,000 capital pool)
        $tStmt = $this->db->prepare("INSERT INTO treasury_reserves (pool_name, available_capital, total_disbursed) VALUES (?, ?, ?)");
        $tStmt->execute(['Primary Lending Liquidity Vault', 5000000.00, 0.00]);

        // 2. Seed Baseline Borrowers
        $bStmt = $this->db->prepare("
            INSERT INTO borrowers (full_name, email, annual_income, existing_monthly_debt, credit_score)
            VALUES (?, ?, ?, ?, ?)
        ");
        $bStmt->execute(['Alice Vance', 'a.vance@techcorp.io', 145000.00, 1200.00, 785]); // Prime (Auto-Approve)
        $bStmt->execute(['Marcus Brody', 'm.brody@museum.org', 68000.00, 1450.00, 670]);   // Borderline (Manual Review)
        $bStmt->execute(['Elena Fisher', 'e.fisher@journal.net', 42000.00, 2100.00, 580]);  // High-DTI Subprime (Decline)

        // 3. Seed Initial Loan Applications
        $this->createApplication(1, 'Commercial Property Expansion', 65000.00, 36);
        $this->createApplication(2, 'Equipment Refurbishment', 25000.00, 48);
        $this->createApplication(3, 'Unsecured Personal Line', 30000.00, 36);
    }

    public function createApplication(int $borrowerId, string $purpose, float $principal, int $termMonths): string {
        $appNum = "LN-" . date('Y') . "-" . rand(10000, 99999);
        $stmt = $this->db->prepare("
            INSERT INTO loan_applications (app_number, borrower_id, loan_purpose, principal_amount, term_months, status)
            VALUES (?, ?, ?, ?, ?, 'SUBMITTED')
        ");
        $stmt->execute([$appNum, $borrowerId, trim($purpose), $principal, $termMonths]);
        $loanId = (int)$this->db->lastInsertId();

        $this->logAudit($loanId, 'INTAKE_GATE', 'SUBMITTED', 'NONE', 'SUBMITTED');
        return $appNum;
    }

    public function getBorrowers(): array {
        return $this->db->query("SELECT * FROM borrowers ORDER BY id ASC")->fetchAll();
    }

    public function getBorrowerById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM borrowers WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function getApplications(): array {
        return $this->db->query("
            SELECT l.*, b.full_name, b.email, b.annual_income, b.existing_monthly_debt, b.credit_score
            FROM loan_applications l
            JOIN borrowers b ON l.borrower_id = b.id
            ORDER BY l.id DESC
        ")->fetchAll();
    }

    public function getApplicationById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT l.*, b.full_name, b.email, b.annual_income, b.existing_monthly_debt, b.credit_score
            FROM loan_applications l
            JOIN borrowers b ON l.borrower_id = b.id
            WHERE l.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function getApplicationsByStatus(array $statuses): array {
        $placeholders = implode(',', array_fill(0, count($statuses), '?'));
        $stmt = $this->db->prepare("
            SELECT l.*, b.full_name, b.email, b.annual_income, b.existing_monthly_debt, b.credit_score
            FROM loan_applications l
            JOIN borrowers b ON l.borrower_id = b.id
            WHERE l.status IN ({$placeholders})
            ORDER BY l.id ASC
        ");
        $stmt->execute($statuses);
        return $stmt->fetchAll();
    }

    public function updateUnderwritingDecision(int $loanId, float $apr, float $payment, float $dti, string $status, ?string $notes): void {
        $stmt = $this->db->prepare("
            UPDATE loan_applications
            SET approved_apr = ?, monthly_payment = ?, dti_ratio = ?, status = ?, underwriter_notes = ?, updated_at = datetime('now')
            WHERE id = ?
        ");
        $stmt->execute([$apr, $payment, $dti, $status, $notes, $loanId]);
    }

    public function saveAmortizationSchedule(int $loanId, array $schedule): void {
        $stmt = $this->db->prepare("
            INSERT INTO amortization_schedules 
            (loan_id, month_number, payment_amount, principal_portion, interest_portion, remaining_balance)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        foreach ($schedule as $row) {
            $stmt->execute([
                $loanId,
                $row['month'],
                $row['payment'],
                $row['principal'],
                $row['interest'],
                $row['balance']
            ]);
        }
    }

    public function getAmortizationSchedule(int $loanId): array {
        $stmt = $this->db->prepare("SELECT * FROM amortization_schedules WHERE loan_id = ? ORDER BY month_number ASC");
        $stmt->execute([$loanId]);
        return $stmt->fetchAll();
    }

    public function lockAndDeductTreasuryCapital(float $amount): bool {
        $stmt = $this->db->prepare("
            UPDATE treasury_reserves
            SET available_capital = available_capital - ?, total_disbursed = total_disbursed + ?
            WHERE id = 1 AND available_capital >= ?
        ");
        $stmt->execute([$amount, $amount, $amount]);
        return $stmt->rowCount() > 0;
    }

    public function getTreasuryMetrics(): array {
        return $this->db->query("SELECT * FROM treasury_reserves WHERE id = 1")->fetch();
    }

    public function logAudit(int $loanId, string $actor, string $action, string $prevStatus, string $newStatus): void {
        $sigPayload = "{$loanId}|{$actor}|{$action}|{$prevStatus}|{$newStatus}|" . microtime();
        $signature = hash('sha256', $sigPayload);

        $stmt = $this->db->prepare("
            INSERT INTO loan_audit_logs (loan_id, actor, action_taken, previous_status, new_status, signature_hash)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$loanId, $actor, $action, $prevStatus, $newStatus, $signature]);
    }

    public function getAuditTrail(int $loanId): array {
        $stmt = $this->db->prepare("SELECT * FROM loan_audit_logs WHERE loan_id = ? ORDER BY id ASC");
        $stmt->execute([$loanId]);
        return $stmt->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Actuarial & Underwriting Domain Engine
// ==========================================
class LoanUnderwritingEngine {
    public function __construct(private LoanRepository $repo) {}

    /**
     * Calculates monthly payment using the standard loan amortization formula.
     */
    public static function calculateMonthlyPayment(float $principal, float $apr, int $termMonths): float {
        if ($apr <= 0.0) {
            return round($principal / $termMonths, 2);
        }
        $r = ($apr / 100.0) / 12.0; // Monthly interest rate
        $numerator = $r * pow(1.0 + $r, $termMonths);
        $denominator = pow(1.0 + $r, $termMonths) - 1.0;
        return round($principal * ($numerator / $denominator), 2);
    }

    /**
     * Generates a full month-by-month amortization schedule breakdown.
     */
    public static function generateAmortizationSchedule(float $principal, float $apr, int $termMonths, float $monthlyPayment): array {
        $r = ($apr / 100.0) / 12.0;
        $balance = $principal;
        $schedule = [];

        for ($m = 1; $m <= $termMonths; $m++) {
            $interest = round($balance * $r, 2);
            $principalPortion = round($monthlyPayment - $interest, 2);
            
            // Handle last month balance rounding adjustment
            if ($m === $termMonths || ($balance - $principalPortion) < 0.0) {
                $principalPortion = $balance;
                $monthlyPayment = $principalPortion + $interest;
                $balance = 0.00;
            } else {
                $balance = round($balance - $principalPortion, 2);
            }

            $schedule[] = [
                'month'     => $m,
                'payment'   => $monthlyPayment,
                'principal' => $principalPortion,
                'interest'  => $interest,
                'balance'   => max(0.00, $balance)
            ];

            if ($balance <= 0.00) break;
        }

        return $schedule;
    }

    /**
     * Executes automatic credit underwriting, DTI analysis, and pricing rules.
     */
    public function evaluateApplication(int $loanId, string $actor = 'ACTUARIAL_RISK_DAEMON'): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $loan = $this->repo->getApplicationById($loanId);
            if (!$loan || !in_array($loan['status'], ['SUBMITTED', 'UNDERWRITING'], true)) {
                $db->rollBack();
                return ['success' => false, 'message' => "Application #{$loanId} is not in a valid state for underwriting."];
            }

            $principal = (float)$loan['principal_amount'];
            $terms = (int)$loan['term_months'];
            $creditScore = (int)$loan['credit_score'];
            $annualIncome = (float)$loan['annual_income'];
            $existingDebt = (float)$loan['existing_monthly_debt'];
            $monthlyIncome = max(1.0, $annualIncome / 12.0);

            // 1. Dynamic APR Tier Pricing
            $apr = match (true) {
                $creditScore >= 750 => 6.75,
                $creditScore >= 700 => 8.95,
                $creditScore >= 640 => 12.50,
                default             => 18.00
            };

            // 2. Actuarial Monthly Payment & DTI Calculation
            $monthlyPayment = self::calculateMonthlyPayment($principal, $apr, $terms);
            $totalMonthlyDebt = $existingDebt + $monthlyPayment;
            $dtiRatio = round(($totalMonthlyDebt / $monthlyIncome) * 100.0, 2);

            // 3. Rule-Based Underwriting Decision Matrix
            $decision = 'DECLINED';
            $notes = '';

            if ($creditScore < 600) {
                $decision = 'DECLINED';
                $notes = "Hard Credit Rejection: FICO score [{$creditScore}] is below institutional floor (600).";
            } elseif ($dtiRatio > 45.0) {
                $decision = 'DECLINED';
                $notes = "Excessive Leverage: Total Debt-to-Income ratio [{$dtiRatio}%] breaches maximum regulatory cap (45.0%).";
            } elseif ($dtiRatio <= 35.0 && $creditScore >= 720) {
                $decision = 'AUTO_APPROVED';
                $notes = "Prime Underwriting: High credit score [{$creditScore}] and optimal DTI [{$dtiRatio}%]. Qualified for automated approval.";
            } else {
                $decision = 'MANUAL_REVIEW';
                $notes = "Borderline Risk Profile: DTI [{$dtiRatio}%] or FICO [{$creditScore}] requires Credit Committee manual review.";
            }

            $this->repo->updateUnderwritingDecision($loanId, $apr, $monthlyPayment, $dtiRatio, $decision, $notes);

            // 4. Pre-generate amortization schedule if approved
            if ($decision === 'AUTO_APPROVED') {
                $schedule = self::generateAmortizationSchedule($principal, $apr, $terms, $monthlyPayment);
                $this->repo->saveAmortizationSchedule($loanId, $schedule);
            }

            $this->repo->logAudit($loanId, $actor, 'UNDERWRITE_EVALUATED', $loan['status'], $decision);

            $db->commit();
            return [
                'success'         => true,
                'decision'        => $decision,
                'approved_apr'    => $apr,
                'monthly_payment' => $monthlyPayment,
                'dti_ratio'       => $dtiRatio,
                'notes'           => $notes
            ];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Executes manual review decision by a designated Credit Committee Officer.
     */
    public function reviewManualOfficer(int $loanId, string $action, string $officerNotes, string $officerName): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $loan = $this->repo->getApplicationById($loanId);
            if (!$loan || $loan['status'] !== 'MANUAL_REVIEW') {
                $db->rollBack();
                return ['success' => false, 'message' => "Application is not in MANUAL_REVIEW state."];
            }

            $nextStatus = ($action === 'APPROVE') ? 'OFFER_ACCEPTED' : 'DECLINED';
            
            if ($action === 'APPROVE') {
                // Generate and save Amortization Schedule upon manual sign-off
                $schedule = self::generateAmortizationSchedule(
                    (float)$loan['principal_amount'],
                    (float)$loan['approved_apr'],
                    (int)$loan['term_months'],
                    (float)$loan['monthly_payment']
                );
                $this->repo->saveAmortizationSchedule($loanId, $schedule);
            }

            $this->repo->updateUnderwritingDecision(
                $loanId,
                (float)$loan['approved_apr'],
                (float)$loan['monthly_payment'],
                (float)$loan['dti_ratio'],
                $nextStatus,
                $officerNotes
            );

            $this->repo->logAudit($loanId, $officerName, $action, 'MANUAL_REVIEW', $nextStatus);

            $db->commit();
            return ['success' => true, 'new_status' => $nextStatus];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Executes capital reserve lock and issues loan disbursement.
     */
    public function disburseLoanFunds(int $loanId, string $treasuryOfficer): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $loan = $this->repo->getApplicationById($loanId);
            if (!$loan || !in_array($loan['status'], ['AUTO_APPROVED', 'OFFER_ACCEPTED'], true)) {
                $db->rollBack();
                return ['success' => false, 'message' => "Application is not in an approved/accepted state for disbursement."];
            }

            $principal = (float)$loan['principal_amount'];

            // Atomic Liquidity Reserve Lock & Deduction
            $deducted = $this->repo->lockAndDeductTreasuryCapital($principal);
            if (!$deducted) {
                $db->rollBack();
                return [
                    'success' => false,
                    'message' => "Capital Reserve Depletion: Treasury vault lacks sufficient liquidity to disburse $" . number_format($principal, 2) . "."
                ];
            }

            $this->repo->updateUnderwritingDecision(
                $loanId,
                (float)$loan['approved_apr'],
                (float)$loan['monthly_payment'],
                (float)$loan['dti_ratio'],
                'DISBURSED',
                $loan['underwriter_notes']
            );

            $this->repo->logAudit($loanId, $treasuryOfficer, 'FUNDS_DISBURSED', $loan['status'], 'DISBURSED');

            $db->commit();
            return ['success' => true, 'disbursed_amount' => $principal, 'app_number' => $loan['app_number']];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
}

// ==========================================
// 4. Main Application Console Loop
// ==========================================
class LoanConsoleApp {
    private LoanRepository $repo;
    private LoanUnderwritingEngine $engine;

    public function __construct() {
        $this->repo = new LoanRepository();
        $this->engine = new LoanUnderwritingEngine($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $treasury = $this->repo->getTreasuryMetrics();
            $pending = $this->repo->getApplicationsByStatus(['SUBMITTED', 'UNDERWRITING', 'MANUAL_REVIEW']);
            
            $sub = "Treasury Reserve: $" . number_format((float)$treasury['available_capital'], 2) . " | Pending Queue: " . count($pending);
            CliUI::header("Loan Origination & Underwriting Engine", $sub);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Ingest New Loan Application (Borrower Application Wizard)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Run Automated Underwriting & Actuarial DTI Engine\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Credit Committee Manual Review Desk\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Disburse Approved Loan Funds (Treasury Capital Lock)\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Inspect Loan Disclosure & Amortization Schedule\n";
            echo "  " . CliUI::CYAN . "6." . CliUI::RESET . " View Master Loan Applications & DTI Gauges\n";
            echo "  " . CliUI::CYAN . "7." . CliUI::RESET . " Audit Cryptographic SHA-256 Decision Trail\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect Lending Platform\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->intakeWizard(); break;
                case '2': $this->underwritingWizard(); break;
                case '3': $this->manualReviewWizard(); break;
                case '4': $this->disbursementWizard(); break;
                case '5': $this->amortizationWizard(); break;
                case '6': $this->viewApplicationsGrid(); break;
                case '7': $this->auditTrailFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Lending system unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function intakeWizard(): void {
        CliUI::header("Ingest New Loan Application");
        $borrowers = $this->repo->getBorrowers();

        echo " Registered Borrowers:\n";
        foreach ($borrowers as $b) {
            echo "  [{$b['id']}] {$b['full_name']} (Income: $" . number_format((float)$b['annual_income'], 2) . " | FICO: " . CliUI::creditBadge((int)$b['credit_score']) . ")\n";
        }
        echo "\n";

        $bId = (int)CliUI::prompt("Select Borrower ID");
        $borrower = $this->repo->getBorrowerById($bId);

        if (!$borrower) { CliUI::error("Borrower not found."); CliUI::pause(); return; }

        $purpose = CliUI::prompt("Loan Purpose / Collateral", "Commercial Inventory Purchase");
        $amount = (float)CliUI::prompt("Requested Principal Amount ($ USD)", "35000.00");
        $term = (int)CliUI::prompt("Tenure (Months: 12, 24, 36, 48, 60)", "36");

        if ($amount <= 0.0 || $term <= 0) { CliUI::error("Invalid financial parameters."); CliUI::pause(); return; }

        $appNum = $this->repo->createApplication($bId, $purpose, $amount, $term);
        CliUI::success("Application {$appNum} ingested for {$borrower['full_name']}! State: SUBMITTED.");
        CliUI::pause();
    }

    private function underwritingWizard(): void {
        CliUI::header("Automated Credit Underwriting & DTI Engine");
        $submitted = $this->repo->getApplicationsByStatus(['SUBMITTED', 'UNDERWRITING']);

        if (empty($submitted)) {
            CliUI::info("No un-evaluated applications in queue.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($submitted as $s) {
            $tableData[] = [
                'id'        => $s['id'],
                'app'       => $s['app_number'],
                'borrower'  => $s['full_name'],
                'principal' => "$" . number_format((float)$s['principal_amount'], 2),
                'term'      => $s['term_months'] . " mos",
                'fico'      => CliUI::creditBadge((int)$s['credit_score'])
            ];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'app' => 'Application', 'borrower' => 'Borrower', 'principal' => 'Requested Loan', 'term' => 'Tenure', 'fico' => 'Credit Score']);

        $loanId = (int)CliUI::prompt("Enter Application ID to underwrite");
        $res = $this->engine->evaluateApplication($loanId, 'ACTUARIAL_RISK_DAEMON');

        if ($res['success']) {
            CliUI::success("Underwriting complete! Decision: " . CliUI::statusBadge($res['decision']));
            echo "  • Approved APR       : " . CliUI::CYAN . $res['approved_apr'] . "%" . CliUI::RESET . "\n";
            echo "  • Monthly Payment    : " . CliUI::GREEN . "$" . number_format($res['monthly_payment'], 2) . " /mo" . CliUI::RESET . "\n";
            echo "  • Debt-to-Income DTI : " . CliUI::renderDtiBar($res['dti_ratio']) . "\n";
            echo "  • Underwriting Notes : " . CliUI::DIM . $res['notes'] . CliUI::RESET . "\n";
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function manualReviewWizard(): void {
        CliUI::header("Credit Committee Manual Review Desk");
        $pending = $this->repo->getApplicationsByStatus(['MANUAL_REVIEW']);

        if (empty($pending)) {
            CliUI::info("No applications currently require manual underwriter review.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($pending as $p) {
            $tableData[] = [
                'id'        => $p['id'],
                'app'       => $p['app_number'],
                'borrower'  => $p['full_name'],
                'principal' => "$" . number_format((float)$p['principal_amount'], 2),
                'payment'   => "$" . number_format((float)$p['monthly_payment'], 2) . "/mo",
                'dti'       => CliUI::renderDtiBar((float)$p['dti_ratio']),
                'fico'      => CliUI::creditBadge((int)$p['credit_score'])
            ];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'app' => 'Application', 'borrower' => 'Borrower', 'principal' => 'Principal', 'payment' => 'Est Payment', 'dti' => 'DTI Ratio', 'fico' => 'FICO']);

        $loanId = (int)CliUI::prompt("Enter Application ID to review");
        $loan = $this->repo->getApplicationById($loanId);

        if (!$loan) { CliUI::error("Application not found."); CliUI::pause(); return; }

        echo "\n Decision: [" . CliUI::GREEN . "A" . CliUI::RESET . "] Approve & Accept Offer | [" . CliUI::RED . "D" . CliUI::RESET . "] Decline Application\n";
        $choice = strtoupper(CliUI::prompt("Decision"));

        if ($choice !== 'A' && $choice !== 'D') { CliUI::info("Aborted."); CliUI::pause(); return; }

        $action = ($choice === 'A') ? 'APPROVE' : 'DECLINE';
        $notes = CliUI::prompt("Credit Committee Assessment Notes", "Manual exception approved based on verified assets.");
        $officer = CliUI::prompt("Underwriter Name", "Marcus Brody, Senior Underwriter");

        $res = $this->engine->reviewManualOfficer($loanId, $action, $notes, $officer);

        if ($res['success']) {
            CliUI::success("Application advanced to " . CliUI::statusBadge($res['new_status']));
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function disbursementWizard(): void {
        CliUI::header("Disburse Approved Loan Funds (Treasury Pool)");
        $approved = $this->repo->getApplicationsByStatus(['AUTO_APPROVED', 'OFFER_ACCEPTED']);

        if (empty($approved)) {
            CliUI::info("No loans in approved/accepted state awaiting capital disbursement.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($approved as $a) {
            $tableData[] = [
                'id'        => $a['id'],
                'app'       => $a['app_number'],
                'borrower'  => $a['full_name'],
                'amount'    => "$" . number_format((float)$a['principal_amount'], 2),
                'apr'       => $a['approved_apr'] . "%",
                'status'    => CliUI::statusBadge($a['status'])
            ];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'app' => 'App Ref', 'borrower' => 'Borrower', 'amount' => 'Disbursement Amount', 'apr' => 'APR', 'status' => 'Status']);

        $loanId = (int)CliUI::prompt("Enter Application ID to disburse");
        $res = $this->engine->disburseLoanFunds($loanId, 'TREASURY_DISBURSEMENT_GATEWAY');

        if ($res['success']) {
            CliUI::success("Capital of $" . number_format($res['disbursed_amount'], 2) . " locked & disbursed for Loan {$res['app_number']}! State: DISBURSED.");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function amortizationWizard(): void {
        CliUI::header("Inspect Loan Disclosure & Amortization Schedule");
        $loanId = (int)CliUI::prompt("Enter Loan Application ID");
        $loan = $this->repo->getApplicationById($loanId);

        if (!$loan) { CliUI::error("Loan not found."); CliUI::pause(); return; }

        $schedule = $this->repo->getAmortizationSchedule($loanId);
        if (empty($schedule)) {
            CliUI::info("Amortization schedule not generated yet. Loan must be approved or reviewed.");
            CliUI::pause();
            return;
        }

        echo " " . CliUI::BOLD . "LOAN DISCLOSURE DETAILS (" . $loan['app_number'] . "):" . CliUI::RESET . "\n";
        echo "  • Borrower      : " . $loan['full_name'] . " (" . $loan['email'] . ")\n";
        echo "  • Principal     : $" . number_format((float)$loan['principal_amount'], 2) . " at " . CliUI::CYAN . $loan['approved_apr'] . "% APR" . CliUI::RESET . "\n";
        echo "  • Term Length   : " . $loan['term_months'] . " Months\n";
        echo "  • Installment   : " . CliUI::GREEN . "$" . number_format((float)$loan['monthly_payment'], 2) . " /month" . CliUI::RESET . "\n\n";

        $tableData = [];
        foreach (array_slice($schedule, 0, 12) as $row) {
            $tableData[] = [
                'month'     => "Month " . $row['month_number'],
                'payment'   => "$" . number_format((float)$row['payment_amount'], 2),
                'principal' => "$" . number_format((float)$row['principal_portion'], 2),
                'interest'  => "$" . number_format((float)$row['interest_portion'], 2),
                'balance'   => "$" . number_format((float)$row['remaining_balance'], 2)
            ];
        }

        CliUI::drawTable($tableData, [
            'month' => 'Period', 'payment' => 'Total Payment', 'principal' => 'Principal Paid', 'interest' => 'Interest Paid', 'balance' => 'Remaining Balance'
        ]);

        if (count($schedule) > 12) {
            echo " " . CliUI::DIM . "... " . (count($schedule) - 12) . " remaining periods truncated for console display." . CliUI::RESET . "\n";
        }

        CliUI::pause();
    }

    private function viewApplicationsGrid(): void {
        CliUI::header("Master Loan Applications Registry");
        $apps = $this->repo->getApplications();

        $tableData = [];
        foreach ($apps as $a) {
            $tableData[] = [
                'id'        => $a['id'],
                'app'       => $a['app_number'],
                'borrower'  => $a['full_name'],
                'principal' => "$" . number_format((float)$a['principal_amount'], 2),
                'apr'       => $a['approved_apr'] > 0 ? $a['approved_apr'] . "%" : CliUI::DIM . "TBD" . CliUI::RESET,
                'dti'       => $a['dti_ratio'] > 0 ? CliUI::renderDtiBar((float)$a['dti_ratio']) : CliUI::DIM . "PENDING" . CliUI::RESET,
                'status'    => CliUI::statusBadge($a['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'app' => 'App Ref', 'borrower' => 'Borrower', 'principal' => 'Requested Principal', 'apr' => 'APR', 'dti' => 'DTI Ratio Gauge', 'status' => 'Status'
        ]);

        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Cryptographic SHA-256 Decision Trail");
        $loanId = (int)CliUI::prompt("Enter Loan Application ID");

        $logs = $this->repo->getAuditTrail($loanId);
        if (empty($logs)) {
            CliUI::error("No audit records found for that Application ID.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL AUDIT LEDGER FOR LOAN #{$loanId}:" . CliUI::RESET . "\n";
        foreach ($logs as $l) {
            echo "  ├─ [" . $l['timestamp'] . "] Actor: " . CliUI::BOLD . $l['actor'] . CliUI::RESET . "\n";
            echo "  │  Action Taken : " . CliUI::CYAN . $l['action_taken'] . CliUI::RESET . " (" . CliUI::DIM . $l['previous_status'] . CliUI::RESET . " ──► " . CliUI::statusBadge($l['new_status']) . ")\n";
            echo "  │  SHA-256 Seal : " . CliUI::YELLOW . substr($l['signature_hash'], 0, 18) . "..." . CliUI::RESET . "\n";
        }
        echo "  └─ Sequence Analysis End.\n";

        CliUI::pause();
    }

    public function runBatchProcessing(): void {
        CliUI::stepLog("Starting automated loan underwriting batch sweep...");
        $submitted = $this->repo->getApplicationsByStatus(['SUBMITTED', 'UNDERWRITING']);

        if (empty($submitted)) {
            CliUI::stepLog("No un-evaluated applications in queue.");
            return;
        }

        $processed = 0;
        foreach ($submitted as $s) {
            $res = $this->engine->evaluateApplication((int)$s['id'], 'BATCH_UNDERWRITING_DAEMON');
            if ($res['success']) {
                CliUI::stepLog("App {$s['app_number']} evaluated. Decision: " . $res['decision'] . " (DTI: {$res['dti_ratio']}%)");
                $processed++;
            }
        }
        CliUI::stepLog("Batch underwriting sweep concluded. Total processed: {$processed}");
    }
}

// ==========================================
// 5. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Loan workflow engine requires a standard console CLI environment.\n");
}

$app = new LoanConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--process') {
    $app->runBatchProcessing();
} else {
    $app->launchWorkspace();
}
