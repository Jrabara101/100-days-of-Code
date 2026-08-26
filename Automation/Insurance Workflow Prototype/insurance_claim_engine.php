#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Enterprise Insurance Claim Workflow & Adjudication Engine
 * 
 * Usage:
 *   php insurance_claim_engine.php           (Interactive Claims Adjuster Console)
 *   php insurance_claim_engine.php --process (Headless Auto-Adjudication Batch Daemon)
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
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[CLAIMS-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'FILED'            => self::DIM . "    FILED    " . self::RESET,
            'ADJUDICATED'      => self::BLUE . " ADJUDICATED " . self::RESET,
            'FLAGGED_SIU'      => self::RED . self::BOLD . " FLAGGED_SIU " . self::RESET,
            'PENDING_ADJUSTER' => self::YELLOW . " ADJ_REVIEW  " . self::RESET,
            'APPROVED'         => self::GREEN . "  APPROVED   " . self::RESET,
            'SETTLED_PAID'     => self::GREEN . self::BOLD . " SETTLED_PAID" . self::RESET,
            'REJECTED'         => self::RED . self::BOLD . "  REJECTED   " . self::RESET,
            default            => $status
        };
    }

    public static function riskBadge(int $score): string {
        if ($score >= 50) {
            return self::RED . self::BOLD . " HIGH RISK ({$score} pts) " . self::RESET;
        }
        if ($score >= 25) {
            return self::YELLOW . " MED RISK ({$score} pts) " . self::RESET;
        }
        return self::GREEN . " LOW RISK ({$score} pts) " . self::RESET;
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
class InsuranceRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/insurance_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Insurance Policies Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policy_number TEXT UNIQUE NOT NULL,
            policyholder_name TEXT NOT NULL,
            policy_type TEXT NOT NULL, -- AUTO, PROPERTY, COMMERCIAL
            coverage_limit REAL NOT NULL,
            deductible REAL NOT NULL,
            effective_date DATE NOT NULL,
            status TEXT DEFAULT 'ACTIVE'
        )");

        // Insurance Claims Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_number TEXT UNIQUE NOT NULL,
            policy_id INTEGER NOT NULL,
            incident_type TEXT NOT NULL,
            claimed_amount REAL NOT NULL,
            approved_payout REAL DEFAULT 0.00,
            fraud_score INTEGER DEFAULT 0,
            status TEXT DEFAULT 'FILED', 
            adjuster_notes TEXT DEFAULT NULL,
            filed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (policy_id) REFERENCES policies(id)
        )");

        // Immutable Cryptographic Audit Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS claim_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_id INTEGER NOT NULL,
            actor_name TEXT NOT NULL,
            action_taken TEXT NOT NULL,
            previous_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            payout_amount REAL NOT NULL,
            signature_hash TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (claim_id) REFERENCES claims(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_claim_status ON claims(status)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_claim_policy ON claims(policy_id)");

        if ($this->db->query("SELECT COUNT(*) FROM policies")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        // Policies
        $pStmt = $this->db->prepare("
            INSERT INTO policies (policy_number, policyholder_name, policy_type, coverage_limit, deductible, effective_date) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $pStmt->execute(['POL-AUTO-1001', 'Alice Vance', 'AUTO', 50000.00, 500.00, '2024-01-15']);
        $pStmt->execute(['POL-PROP-2002', 'Marcus Brody', 'PROPERTY', 350000.00, 2500.00, '2025-06-01']);
        $pStmt->execute(['POL-AUTO-3003', 'Elena Fisher', 'AUTO', 25000.00, 1000.00, date('Y-m-d', strtotime('-10 days'))]); // Zero-day policy

        // Seed Claims
        $cStmt = $this->db->prepare("
            INSERT INTO claims (claim_number, policy_id, incident_type, claimed_amount, status) 
            VALUES (?, ?, ?, ?, 'FILED')
        ");
        // Standard Auto Collision
        $cStmt->execute(['CLM-2026-001', 1, 'Collision Damage', 4800.00]);
        // Zero-Day Fraud Risk (Elena's brand new policy filed high-value claim)
        $cStmt->execute(['CLM-2026-002', 3, 'Comprehensive Theft', 22000.00]);
        // Property Structural Repair
        $cStmt->execute(['CLM-2026-003', 2, 'Storm Roof Damage', 18500.00]);

        $this->logAudit(1, 'SYSTEM', 'INTAKE', 'NONE', 'FILED', 0.00);
        $this->logAudit(2, 'SYSTEM', 'INTAKE', 'NONE', 'FILED', 0.00);
        $this->logAudit(3, 'SYSTEM', 'INTAKE', 'NONE', 'FILED', 0.00);
    }

    public function createClaim(int $policyId, string $incidentType, float $amount): string {
        $claimNum = "CLM-" . date('Y') . "-" . rand(1000, 9999);
        $stmt = $this->db->prepare("
            INSERT INTO claims (claim_number, policy_id, incident_type, claimed_amount, status) 
            VALUES (?, ?, ?, ?, 'FILED')
        ");
        $stmt->execute([$claimNum, $policyId, trim($incidentType), $amount]);
        $claimId = (int)$this->db->lastInsertId();

        $this->logAudit($claimId, 'INTAKE_PORTAL', 'SUBMITTED', 'NONE', 'FILED', 0.00);
        return $claimNum;
    }

    public function getPolicies(): array {
        return $this->db->query("SELECT * FROM policies ORDER BY id ASC")->fetchAll();
    }

    public function getPolicyById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM policies WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function getClaimById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT c.*, p.policy_number, p.policyholder_name, p.coverage_limit, p.deductible, p.effective_date, p.policy_type
            FROM claims c
            JOIN policies p ON c.policy_id = p.id
            WHERE c.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function getClaimsByStatus(array $statuses): array {
        $in = implode(',', array_fill(0, count($statuses), '?'));
        $stmt = $this->db->prepare("
            SELECT c.*, p.policy_number, p.policyholder_name, p.deductible, p.coverage_limit
            FROM claims c
            JOIN policies p ON c.policy_id = p.id
            WHERE c.status IN ({$in})
            ORDER BY c.fraud_score DESC, c.id ASC
        ");
        $stmt->execute($statuses);
        return $stmt->fetchAll();
    }

    public function getHistoricalClaimsCountForPolicy(int $policyId): int {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM claims WHERE policy_id = ? AND status != 'REJECTED'");
        $stmt->execute([$policyId]);
        return (int)$stmt->fetchColumn();
    }

    public function getSettledPayoutsForPolicy(int $policyId): float {
        $stmt = $this->db->prepare("SELECT COALESCE(SUM(approved_payout), 0.00) FROM claims WHERE policy_id = ? AND status = 'SETTLED_PAID'");
        $stmt->execute([$policyId]);
        return (float)$stmt->fetchColumn();
    }

    public function updateClaimAdjudication(int $claimId, float $payout, int $fraudScore, string $nextStatus): void {
        $stmt = $this->db->prepare("
            UPDATE claims 
            SET approved_payout = ?, fraud_score = ?, status = ?, updated_at = datetime('now')
            WHERE id = ?
        ");
        $stmt->execute([$payout, $fraudScore, $nextStatus, $claimId]);
    }

    public function updateClaimStatus(int $claimId, string $status, ?string $notes = null): void {
        $stmt = $this->db->prepare("
            UPDATE claims 
            SET status = ?, adjuster_notes = COALESCE(?, adjuster_notes), updated_at = datetime('now')
            WHERE id = ?
        ");
        $stmt->execute([$status, $notes, $claimId]);
    }

    public function logAudit(int $claimId, string $actor, string $action, string $prevStatus, string $newStatus, float $payout): void {
        $sigPayload = "{$claimId}|{$actor}|{$action}|{$prevStatus}|{$newStatus}|{$payout}|" . microtime();
        $signature = hash('sha256', $sigPayload);

        $stmt = $this->db->prepare("
            INSERT INTO claim_audit_logs (claim_id, actor_name, action_taken, previous_status, new_status, payout_amount, signature_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$claimId, $actor, $action, $prevStatus, $newStatus, $payout, $signature]);
    }

    public function getGlobalRegistry(): array {
        return $this->db->query("
            SELECT c.id, c.claim_number, p.policyholder_name, p.policy_number, 
                   c.claimed_amount, c.approved_payout, c.fraud_score, c.status, c.updated_at
            FROM claims c
            JOIN policies p ON c.policy_id = p.id
            ORDER BY c.id DESC LIMIT 30
        ")->fetchAll();
    }

    public function getAuditTrail(int $claimId): array {
        $stmt = $this->db->prepare("SELECT * FROM claim_audit_logs WHERE claim_id = ? ORDER BY id ASC");
        $stmt->execute([$claimId]);
        return $stmt->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Adjudication & Fraud Workflow Engine
// ==========================================
class ClaimWorkflowEngine {
    private const SIU_FRAUD_THRESHOLD = 50;

    public function __construct(private InsuranceRepository $repo) {}

    /**
     * Executes automatic actuarial calculation and heuristic fraud scoring.
     */
    public function adjudicateClaim(int $claimId, string $actor = 'AUTO_ADJUDICATOR'): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $claim = $this->repo->getClaimById($claimId);
            if (!$claim || $claim['status'] !== 'FILED') {
                $db->rollBack();
                return ['success' => false, 'message' => "Claim #{$claimId} is not in FILED state or does not exist."];
            }

            // 1. Actuarial Math: Calculate Payout with Deductible & Coverage Limit Caps
            $claimed = (float)$claim['claimed_amount'];
            $deductible = (float)$claim['deductible'];
            $limit = (float)$claim['coverage_limit'];
            
            $priorSettled = $this->repo->getSettledPayoutsForPolicy((int)$claim['policy_id']);
            $remainingLimit = max(0.00, $limit - $priorSettled);
            
            // Net Payable = min(Claimed - Deductible, Remaining Coverage Limit)
            $netPayable = max(0.00, min($claimed - $deductible, $remainingLimit));

            // 2. Fraud Heuristic Scoring Matrix
            $fraudScore = 0;
            $fraudTriggers = [];

            // Trigger A: Early loss inception (< 30 days of policy start)
            $effectiveDate = new DateTimeImmutable($claim['effective_date']);
            $filedDate = new DateTimeImmutable($claim['filed_at']);
            $policyAgeDays = (int)$effectiveDate->diff($filedDate)->format('%r%a');

            if ($policyAgeDays <= 30) {
                $fraudScore += 35;
                $fraudTriggers[] = "Early Inception Loss (Policy Age: {$policyAgeDays}d)";
            }

            // Trigger B: High claimed ratio (> 75% of max policy coverage)
            if ($claimed >= ($limit * 0.75)) {
                $fraudScore += 30;
                $fraudTriggers[] = "Disproportionate Loss (Claimed >75% of limit)";
            }

            // Trigger C: Frequent historical claim velocity
            $priorClaimsCount = $this->repo->getHistoricalClaimsCountForPolicy((int)$claim['policy_id']);
            if ($priorClaimsCount >= 2) {
                $fraudScore += 25;
                $fraudTriggers[] = "Velocity Alert: {$priorClaimsCount} prior claims filed";
            }

            // 3. Routing Determination
            $nextStatus = ($fraudScore >= self::SIU_FRAUD_THRESHOLD) ? 'FLAGGED_SIU' : 'PENDING_ADJUSTER';

            $this->repo->updateClaimAdjudication($claimId, $netPayable, $fraudScore, $nextStatus);
            $this->repo->logAudit($claimId, $actor, 'ADJUDICATED', 'FILED', $nextStatus, $netPayable);

            $db->commit();
            return [
                'success'        => true,
                'claim_number'   => $claim['claim_number'],
                'approved_payout'=> $netPayable,
                'fraud_score'    => $fraudScore,
                'triggers'       => $fraudTriggers,
                'next_status'    => $nextStatus
            ];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Senior Adjuster Review Gate (Approves or Rejects claim).
     */
    public function reviewAdjusterGate(int $claimId, string $action, string $notes, string $adjusterName): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $claim = $this->repo->getClaimById($claimId);
            if (!$claim || !in_array($claim['status'], ['PENDING_ADJUSTER', 'FLAGGED_SIU'], true)) {
                $db->rollBack();
                return ['success' => false, 'message' => "Claim is not in a valid state for adjuster review."];
            }

            $prevStatus = $claim['status'];
            $nextStatus = ($action === 'APPROVE') ? 'APPROVED' : 'REJECTED';
            $payout = ($action === 'APPROVE') ? (float)$claim['approved_payout'] : 0.00;

            $this->repo->updateClaimStatus($claimId, $nextStatus, $notes);
            $this->repo->logAudit($claimId, $adjusterName, $action, $prevStatus, $nextStatus, $payout);

            $db->commit();
            return ['success' => true, 'new_status' => $nextStatus];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Disburses payment settlement to policyholder.
     */
    public function disburseSettlement(int $claimId, string $treasuryActor): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $claim = $this->repo->getClaimById($claimId);
            if (!$claim || $claim['status'] !== 'APPROVED') {
                $db->rollBack();
                return ['success' => false, 'message' => "Claim must be in APPROVED state to disburse funds."];
            }

            $payout = (float)$claim['approved_payout'];
            $this->repo->updateClaimStatus($claimId, 'SETTLED_PAID');
            $this->repo->logAudit($claimId, $treasuryActor, 'SETTLEMENT_DISBURSED', 'APPROVED', 'SETTLED_PAID', $payout);

            $db->commit();
            return ['success' => true, 'claim_number' => $claim['claim_number'], 'payout' => $payout];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
}

// ==========================================
// 4. Main Application Console Loop
// ==========================================
class InsuranceConsoleApp {
    private InsuranceRepository $repo;
    private ClaimWorkflowEngine $engine;

    public function __construct() {
        $this->repo = new InsuranceRepository();
        $this->engine = new ClaimWorkflowEngine($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $pending = $this->repo->getClaimsByStatus(['FILED', 'PENDING_ADJUSTER', 'FLAGGED_SIU']);
            CliUI::header("Insurance Claim Workflow & Adjudication Platform", "Pending Operations Queue: " . count($pending));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " File New Insurance Claim (Claimant Ingestion Wizard)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Run Auto-Adjudication Engine (Actuarial & Fraud Matrix)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Adjuster & SIU Review Desk (Manual Authorization Gate)\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Disburse Settlement Payment (Treasury Outbound)\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " View Global Claims Master Registry\n";
            echo "  " . CliUI::CYAN . "6." . CliUI::RESET . " Audit Cryptographic SHA-256 Claim Chain-of-Custody\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect Insurance Platform\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->fileClaimWizard(); break;
                case '2': $this->adjudicateWizard(); break;
                case '3': $this->adjusterReviewWizard(); break;
                case '4': $this->disburseWizard(); break;
                case '5': $this->viewRegistry(); break;
                case '6': $this->auditTrailFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Insurance platform unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function fileClaimWizard(): void {
        CliUI::header("File New Insurance Claim");
        $policies = $this->repo->getPolicies();

        echo " Registered Policies:\n";
        foreach ($policies as $p) {
            echo "  [{$p['id']}] {$p['policy_number']} - {$p['policyholder_name']} (" . CliUI::CYAN . $p['policy_type'] . CliUI::RESET . " | Limit: $" . number_format((float)$p['coverage_limit'], 2) . ")\n";
        }
        echo "\n";

        $pId = (int)CliUI::prompt("Select Policy ID");
        $policy = $this->repo->getPolicyById($pId);

        if (!$policy) { CliUI::error("Invalid Policy ID."); CliUI::pause(); return; }

        $incident = CliUI::prompt("Incident / Loss Description", "Windshield Impact Damage");
        $amount = (float)CliUI::prompt("Claimed Amount ($ USD)", "3200.00");

        if ($amount <= 0) { CliUI::error("Claim amount must be greater than zero."); CliUI::pause(); return; }

        $claimNum = $this->repo->createClaim($pId, $incident, $amount);
        CliUI::success("Claim {$claimNum} filed successfully for {$policy['policyholder_name']}! Status: FILED.");
        CliUI::pause();
    }

    private function adjudicateWizard(): void {
        CliUI::header("Auto-Adjudication & Fraud Evaluation Engine");
        $filed = $this->repo->getClaimsByStatus(['FILED']);

        if (empty($filed)) {
            CliUI::info("No unadjudicated claims in FILED state.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($filed as $c) {
            $tableData[] = [
                'id'       => $c['id'],
                'claim'    => $c['claim_number'],
                'holder'   => $c['policyholder_name'],
                'incident' => $c['incident_type'],
                'amount'   => "$" . number_format((float)$c['claimed_amount'], 2)
            ];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'claim' => 'Claim Ref', 'holder' => 'Policyholder', 'incident' => 'Incident', 'amount' => 'Claimed Amount']);

        $claimId = (int)CliUI::prompt("Enter Claim ID to adjudicate");
        $res = $this->engine->adjudicateClaim($claimId, 'SENIOR_ACTUARIAL_BOT');

        if ($res['success']) {
            CliUI::success("Claim {$res['claim_number']} adjudicated!");
            echo "  • Payable Indemnity : " . CliUI::GREEN . "$" . number_format((float)$res['approved_payout'], 2) . CliUI::RESET . "\n";
            echo "  • Fraud Risk Score  : " . CliUI::riskBadge($res['fraud_score']) . "\n";
            echo "  • Advanced State    : " . CliUI::statusBadge($res['next_status']) . "\n";

            if (!empty($res['triggers'])) {
                echo "  • " . CliUI::RED . "SIU Risk Triggers   : " . implode(', ', $res['triggers']) . CliUI::RESET . "\n";
            }
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function adjusterReviewWizard(): void {
        CliUI::header("Adjuster & SIU Review Desk");
        $pending = $this->repo->getClaimsByStatus(['PENDING_ADJUSTER', 'FLAGGED_SIU']);

        if (empty($pending)) {
            CliUI::info("No claims currently awaiting adjuster or SIU review.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($pending as $c) {
            $tableData[] = [
                'id'      => $c['id'],
                'claim'   => $c['claim_number'],
                'holder'  => $c['policyholder_name'],
                'payout'  => "$" . number_format((float)$c['approved_payout'], 2),
                'risk'    => CliUI::riskBadge((int)$c['fraud_score']),
                'status'  => CliUI::statusBadge($c['status'])
            ];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'claim' => 'Claim Ref', 'holder' => 'Policyholder', 'payout' => 'Calc Payout', 'risk' => 'Fraud Score', 'status' => 'Review Queue']);

        $claimId = (int)CliUI::prompt("Enter Claim ID to review");
        $claim = $this->repo->getClaimById($claimId);

        if (!$claim) { CliUI::error("Claim not found."); CliUI::pause(); return; }

        echo "\n Decisions: [" . CliUI::GREEN . "A" . CliUI::RESET . "] Approve Indemnity | [" . CliUI::RED . "R" . CliUI::RESET . "] Reject Claim\n";
        $choice = strtoupper(CliUI::prompt("Action"));

        if ($choice !== 'A' && $choice !== 'R') { CliUI::info("Aborted."); CliUI::pause(); return; }

        $action = ($choice === 'A') ? 'APPROVE' : 'REJECT';
        $notes = CliUI::prompt("Adjuster Verification Notes", "Inspection completed. Damage verified against repair estimates.");
        $adjuster = CliUI::prompt("Adjuster Name", "Marcus Brody, Claims Adjuster");

        $res = $this->engine->reviewAdjusterGate($claimId, $action, $notes, $adjuster);

        if ($res['success']) {
            CliUI::success("Claim status advanced to " . CliUI::statusBadge($res['new_status']));
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function disburseWizard(): void {
        CliUI::header("Disburse Settlement Payout");
        $approved = $this->repo->getClaimsByStatus(['APPROVED']);

        if (empty($approved)) {
            CliUI::info("No claims in APPROVED state awaiting treasury release.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($approved as $c) {
            $tableData[] = [
                'id'     => $c['id'],
                'claim'  => $c['claim_number'],
                'holder' => $c['policyholder_name'],
                'payout' => "$" . number_format((float)$c['approved_payout'], 2),
                'status' => CliUI::statusBadge($c['status'])
            ];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'claim' => 'Claim Ref', 'holder' => 'Policyholder', 'payout' => 'Settlement Amount', 'status' => 'Status']);

        $claimId = (int)CliUI::prompt("Enter Claim ID to disburse funds");
        $res = $this->engine->disburseSettlement($claimId, 'TREASURY_SETTLEMENT_SYSTEM');

        if ($res['success']) {
            CliUI::success("Settlement of $" . number_format($res['payout'], 2) . " released for Claim {$res['claim_number']}! State: SETTLED_PAID.");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function viewRegistry(): void {
        CliUI::header("Global Claims Master Registry");
        $registry = $this->repo->getGlobalRegistry();

        $tableData = [];
        foreach ($registry as $r) {
            $tableData[] = [
                'id'      => $r['id'],
                'claim'   => $r['claim_number'],
                'policy'  => $r['policy_number'],
                'holder'  => $r['policyholder_name'],
                'claimed' => "$" . number_format((float)$r['claimed_amount'], 2),
                'payout'  => "$" . number_format((float)$r['approved_payout'], 2),
                'risk'    => CliUI::riskBadge((int)$r['fraud_score']),
                'status'  => CliUI::statusBadge($r['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'claim' => 'Claim Code', 'policy' => 'Policy Ref', 'holder' => 'Policyholder', 'claimed' => 'Claimed', 'payout' => 'Payout', 'risk' => 'Fraud Score', 'status' => 'Workflow State'
        ]);

        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Cryptographic Claim Chain-of-Custody Audit");
        $claimId = (int)CliUI::prompt("Enter Claim ID to inspect audit trail");

        $logs = $this->repo->getAuditTrail($claimId);
        if (empty($logs)) {
            CliUI::error("No audit logs found for that Claim ID.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL AUDIT LEDGER FOR CLAIM #{$claimId}:" . CliUI::RESET . "\n";
        foreach ($logs as $l) {
            echo "  ├─ [" . $l['timestamp'] . "] Actor: " . CliUI::BOLD . $l['actor_name'] . CliUI::RESET . "\n";
            echo "  │  Action Taken : " . CliUI::CYAN . $l['action_taken'] . CliUI::RESET . " (" . CliUI::DIM . $l['previous_status'] . CliUI::RESET . " ──► " . CliUI::statusBadge($l['new_status']) . ")\n";
            echo "  │  Payout Snap  : $" . number_format((float)$l['payout_amount'], 2) . "\n";
            echo "  │  SHA-256 Seal : " . CliUI::YELLOW . substr($l['signature_hash'], 0, 16) . "..." . CliUI::RESET . "\n";
        }
        echo "  └─ Sequence Analysis End.\n";

        CliUI::pause();
    }

    public function runBatchProcessing(): void {
        CliUI::stepLog("Starting automated claims auto-adjudication sweep...");
        $filed = $this->repo->getClaimsByStatus(['FILED']);

        if (empty($filed)) {
            CliUI::stepLog("No pending claims in FILED state.");
            return;
        }

        $processed = 0;
        foreach ($filed as $c) {
            $res = $this->engine->adjudicateClaim((int)$c['id'], 'BATCH_DAEMON');
            if ($res['success']) {
                CliUI::stepLog("Claim {$res['claim_number']} adjudicated. Indemnity: $" . number_format($res['approved_payout'], 2) . " ──► " . $res['next_status']);
                $processed++;
            }
        }
        CliUI::stepLog("Batch adjudication complete. Total claims processed: {$processed}");
    }
}

// ==========================================
// 5. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Insurance workflow engine requires a standard console CLI environment.\n");
}

$app = new InsuranceConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--process') {
    $app->runBatchProcessing();
} else {
    $app->launchWorkspace();
}
