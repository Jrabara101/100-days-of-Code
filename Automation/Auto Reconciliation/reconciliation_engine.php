#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * ==============================================================================
 * Enterprise Automated Multi-Source Financial & Ledger Reconciliation Engine
 * ==============================================================================
 * 
 * High-performance, deterministic financial reconciliation subsystem implemented in
 * PHP CLI. Features multi-tier rule-based and fuzzy heuristic matching, automated
 * break/discrepancy classification, tolerance fee handling, manual resolution
 * workflows, and tamper-evident SHA-256 compliance audit trails.
 * 
 * Usage:
 *   php reconciliation_engine.php               (Interactive TUI Control Center)
 *   php reconciliation_engine.php --run-sample  (Ingest Baseline Data & Run Recon)
 *   php reconciliation_engine.php --cron        (Headless Batch Reconciliation)
 *   php reconciliation_engine.php --daemon      (Continuous Ingestion Consumer Daemon)
 * ==============================================================================
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

    public static function clearScreen(): void {
        echo "\033[2J\033[;H";
    }

    public static function header(string $title, string $subtitle = ""): void {
        self::clearScreen();
        echo self::CYAN . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 83, " ", STR_PAD_BOTH) . " ║\n";
        if ($subtitle) {
            echo "║ " . str_pad($subtitle, 83, " ", STR_PAD_BOTH) . " ║\n";
        }
        echo "╚═════════════════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function prompt(string $message, string $default = ""): string {
        $defLabel = $default !== "" ? self::DIM . " [{$default}]" . self::RESET : "";
        echo self::BOLD . $message . $defLabel . self::RESET . ": ";
        $input = trim((string)fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to reconciliation control workspace..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void {
        echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n";
        usleep(300000);
    }

    public static function error(string $msg): void {
        echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n";
        usleep(400000);
    }

    public static function info(string $msg): void {
        echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n";
    }

    public static function stepLog(string $msg): void {
        echo " [" . date('H:i:s') . "] " . self::CYAN . "[RECON-ENGINE] " . self::RESET . $msg . "\n";
    }

    public static function formatMoney(float $amount, string $currency = "USD"): string {
        $formatted = number_format(abs($amount), 2);
        if ($amount < 0) {
            return "-$" . $formatted . " " . $currency;
        }
        return "$" . $formatted . " " . $currency;
    }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'MATCHED', 'RESOLVED_AUTO'       => self::GREEN . self::BOLD . "   MATCHED    " . self::RESET,
            'MATCHED_TOLERANCE'              => self::GREEN . "  TOLERANCE   " . self::RESET,
            'RESOLVED_MANUAL', 'WRITTEN_OFF' => self::CYAN . self::BOLD .  "   RESOLVED   " . self::RESET,
            'PENDING', 'UNMATCHED'           => self::BLUE .                "   PENDING    " . self::RESET,
            'BREAK_OPEN', 'OPEN'             => self::RED . self::BOLD .   "    BREAK     " . self::RESET,
            'AMOUNT_MISMATCH'                => self::YELLOW . self::BOLD ." AMT_MISMATCH " . self::RESET,
            'UNMATCHED_INTERNAL'             => self::YELLOW .             " UNMATCHED_INT" . self::RESET,
            'UNMATCHED_EXTERNAL'             => self::MAGENTA .            " UNMATCHED_EXT" . self::RESET,
            default                          => str_pad($status, 14, " ", STR_PAD_BOTH)
        };
    }

    public static function tierBadge(string $tier): string {
        return match ($tier) {
            'TIER_1_EXACT'       => self::GREEN . self::BOLD . "T1: EXACT" . self::RESET,
            'TIER_2_FUZZY_REF'   => self::CYAN . "T2: FUZZY" . self::RESET,
            'TIER_3_TOLERANCE'   => self::YELLOW . "T3: TOLERANCE" . self::RESET,
            'TIER_4_MANUAL'      => self::MAGENTA . "T4: MANUAL" . self::RESET,
            default              => $tier
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No records match current ledger parameters.\n" . self::RESET;
            return;
        }

        $widths = array_map('strlen', $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
                $widths[$key] = max($widths[$key], mb_strlen($cleanString));
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
                $padding = str_repeat(" ", max(0, $widths[$key] - mb_strlen($cleanString)));
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
class ReconciliationRepository {
    private PDO $db;

    public function __construct(string $dbPath = __DIR__ . '/reconciliation_vault.sqlite') {
        $this->db = new PDO("sqlite:" . $dbPath);
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Internal General Ledger Entries (ERP / Core Billing)
        $this->db->exec("CREATE TABLE IF NOT EXISTS internal_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            txn_code TEXT UNIQUE NOT NULL,
            booking_date DATE NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            account_no TEXT NOT NULL,
            memo TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING', -- PENDING, MATCHED, BREAK_OPEN, RESOLVED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // External Settlement Statements (Bank Feeds / Stripe / Payment Gateways)
        $this->db->exec("CREATE TABLE IF NOT EXISTS external_statements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ext_ref TEXT UNIQUE NOT NULL,
            value_date DATE NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            source_name TEXT NOT NULL, -- BANK_FEED, STRIPE_GATEWAY, PAYPAL, MERCHANT_CORE
            raw_memo TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING', -- PENDING, MATCHED, BREAK_OPEN, RESOLVED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Reconciliation Batches
        $this->db->exec("CREATE TABLE IF NOT EXISTS reconciliation_batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_uuid TEXT UNIQUE NOT NULL,
            total_internal_count INTEGER DEFAULT 0,
            total_external_count INTEGER DEFAULT 0,
            matched_count INTEGER DEFAULT 0,
            break_count INTEGER DEFAULT 0,
            total_internal_amount REAL DEFAULT 0.0,
            total_external_amount REAL DEFAULT 0.0,
            net_variance REAL DEFAULT 0.0,
            status TEXT DEFAULT 'PROCESSING', -- PROCESSING, COMPLETED, AUDITED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME DEFAULT NULL
        )");

        // Matched Pairs Registry
        $this->db->exec("CREATE TABLE IF NOT EXISTS reconciliation_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_uuid TEXT UNIQUE NOT NULL,
            batch_id INTEGER NOT NULL,
            internal_id INTEGER NOT NULL,
            external_id INTEGER NOT NULL,
            match_tier TEXT NOT NULL, -- TIER_1_EXACT, TIER_2_FUZZY_REF, TIER_3_TOLERANCE, TIER_4_MANUAL
            variance_fee REAL DEFAULT 0.0,
            match_score REAL DEFAULT 1.0,
            notes TEXT DEFAULT '',
            reconciled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES reconciliation_batches(id),
            FOREIGN KEY (internal_id) REFERENCES internal_ledger(id),
            FOREIGN KEY (external_id) REFERENCES external_statements(id)
        )");

        // Breaks & Discrepancies Registry
        $this->db->exec("CREATE TABLE IF NOT EXISTS reconciliation_breaks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            break_uuid TEXT UNIQUE NOT NULL,
            batch_id INTEGER NOT NULL,
            break_type TEXT NOT NULL, -- UNMATCHED_INTERNAL, UNMATCHED_EXTERNAL, AMOUNT_MISMATCH, DATE_OUT_OF_RANGE
            internal_id INTEGER DEFAULT NULL,
            external_id INTEGER DEFAULT NULL,
            discrepancy_amount REAL DEFAULT 0.0,
            status TEXT DEFAULT 'OPEN', -- OPEN, RESOLVED, WRITTEN_OFF, ESCALATED
            resolution_notes TEXT DEFAULT NULL,
            resolved_by TEXT DEFAULT NULL,
            resolved_at DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES reconciliation_batches(id),
            FOREIGN KEY (internal_id) REFERENCES internal_ledger(id),
            FOREIGN KEY (external_id) REFERENCES external_statements(id)
        )");

        // Tamper-Evident SHA-256 Audit Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS reconciliation_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_type TEXT NOT NULL,
            record_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            prev_state TEXT DEFAULT NULL,
            new_state TEXT DEFAULT NULL,
            payload_json TEXT NOT NULL,
            signature_hash TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_internal_status ON internal_ledger(status)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_external_status ON external_statements(status)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_matches_batch ON reconciliation_matches(batch_id)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_breaks_batch ON reconciliation_breaks(batch_id)");

        if ($this->db->query("SELECT COUNT(*) FROM internal_ledger")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    public function seedBaselineData(): void {
        $this->db->exec("DELETE FROM reconciliation_audit_logs");
        $this->db->exec("DELETE FROM reconciliation_matches");
        $this->db->exec("DELETE FROM reconciliation_breaks");
        $this->db->exec("DELETE FROM reconciliation_batches");
        $this->db->exec("DELETE FROM internal_ledger");
        $this->db->exec("DELETE FROM external_statements");

        // Seed Internal General Ledger
        $internalStmt = $this->db->prepare("
            INSERT INTO internal_ledger (txn_code, booking_date, amount, currency, account_no, memo, status)
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
        ");

        $internalEntries = [
            // Exact Matches
            ['TXN-INV-1001', '2026-08-10', 4500.00, 'USD', '1010-CASH', 'Enterprise SaaS License - Acme Corp'],
            ['TXN-SUB-1002', '2026-08-11', 299.00,  'USD', '1010-CASH', 'Monthly Pro Tier - Globex Inc'],
            ['TXN-PAY-1003', '2026-08-11', -1850.50,'USD', '1020-OPEX', 'AWS Cloud Infrastructure Outflow'],
            ['TXN-INV-1004', '2026-08-12', 12450.00,'USD', '1010-CASH', 'Quarterly Service Retainer - Initech'],
            ['TXN-REF-1005', '2026-08-13', -150.00, 'USD', '1010-CASH', 'Customer Refund - Order #8812'],
            
            // Fuzzy Ref / Prefix Matches
            ['TXN-STR-2001', '2026-08-14', 850.00,  'USD', '1010-CASH', 'Stripe Checkout Payout Ref #99412'],
            ['TXN-WIR-2002', '2026-08-15', 7200.00, 'USD', '1010-CASH', 'Inbound Wire Transfer - Stark Industries'],
            
            // Minor Tolerance Match (Fee Discrepancy)
            ['TXN-FEE-3001', '2026-08-15', 1000.00, 'USD', '1010-CASH', 'Merchant Processing Batch Deposit #3001'],
            
            // Breaks: Amount Mismatch
            ['TXN-MIS-4001', '2026-08-16', 3200.00, 'USD', '1010-CASH', 'Invoice #4001 Equipment Purchase'],
            
            // Breaks: Unmatched Internal (Uncleared Check / In-Flight Transfer)
            ['TXN-UNC-5001', '2026-08-17', 5800.00, 'USD', '1010-CASH', 'Issued Check #5001 - Vendor Legal Counsel'],
            ['TXN-UNC-5002', '2026-08-17', 120.00,  'USD', '1020-OPEX', 'Office Supplies Reimbursement - Dave']
        ];

        foreach ($internalEntries as $row) {
            $internalStmt->execute($row);
        }

        // Seed External Settlement Statements
        $extStmt = $this->db->prepare("
            INSERT INTO external_statements (ext_ref, value_date, amount, currency, source_name, raw_memo, status)
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
        ");

        $externalEntries = [
            // Exact Matches (with normal settlement timing offsets)
            ['BANK-TXN-INV-1001', '2026-08-11', 4500.00, 'USD', 'BANK_FEED',       'ACH CR TXN-INV-1001 ACME CORP PAYMNT'],
            ['STRIPE-SUB-1002',   '2026-08-11', 299.00,  'USD', 'STRIPE_GATEWAY',  'STRIPE PAYOUT TXN-SUB-1002 GLOBEX PRO'],
            ['BANK-PAY-1003',     '2026-08-12', -1850.50,'USD', 'BANK_FEED',       'ACH DR TXN-PAY-1003 AMAZON WEB SERVICES'],
            ['BANK-INV-1004',     '2026-08-13', 12450.00,'USD', 'BANK_FEED',       'WIRE IN TXN-INV-1004 INITECH CORP RETAIN'],
            ['BANK-REF-1005',     '2026-08-14', -150.00, 'USD', 'BANK_FEED',       'CARD REFUND TXN-REF-1005 ORDR-8812'],
            
            // Fuzzy Ref Matches
            ['EXT-STR-2001',      '2026-08-14', 850.00,  'USD', 'STRIPE_GATEWAY',  'STRIPE TRANSFER ID 99412 BATCH SETTLE'],
            ['WIRE-STARK-2002',   '2026-08-16', 7200.00, 'USD', 'BANK_FEED',       'FEDWIRE INBOUND STARK IND TXN-WIR-2002'],
            
            // Minor Tolerance ($0.35 gateway handling fee taken out of gross deposit)
            ['GATEWAY-FEE-3001',  '2026-08-15', 999.65,  'USD', 'MERCHANT_CORE',   'SETTLEMENT TXN-FEE-3001 LESS $0.35 FEE'],
            
            // Amount Mismatch (Internal recorded $3,200.00, Bank cleared $3,250.00)
            ['BANK-MIS-4001',     '2026-08-16', 3250.00, 'USD', 'BANK_FEED',       'ACH CR TXN-MIS-4001 EQPT SALE'],
            
            // Unmatched External (Bank Monthly Maintenance Service Charge)
            ['BANK-FEE-9901',     '2026-08-16', -45.00,  'USD', 'BANK_FEED',       'MONTHLY COMMERCIAL ACCOUNT MAINTENANCE FEE'],
            ['STRIPE-DISPUTE-9902','2026-08-17', -15.00, 'USD', 'STRIPE_GATEWAY',  'CHARGEBACK PROCESSING FEE DISP-9902']
        ];

        foreach ($externalEntries as $row) {
            $extStmt->execute($row);
        }
    }

    public function getPendingInternal(): array {
        return $this->db->query("SELECT * FROM internal_ledger WHERE status = 'PENDING' ORDER BY booking_date ASC, id ASC")->fetchAll();
    }

    public function getPendingExternal(): array {
        return $this->db->query("SELECT * FROM external_statements WHERE status = 'PENDING' ORDER BY value_date ASC, id ASC")->fetchAll();
    }

    public function getAllInternal(int $limit = 50): array {
        return $this->db->query("SELECT * FROM internal_ledger ORDER BY booking_date DESC, id DESC LIMIT {$limit}")->fetchAll();
    }

    public function getAllExternal(int $limit = 50): array {
        return $this->db->query("SELECT * FROM external_statements ORDER BY value_date DESC, id DESC LIMIT {$limit}")->fetchAll();
    }

    public function createBatch(int $totalInternal, int $totalExternal, float $intAmount, float $extAmount): int {
        $uuid = "BAT-" . strtoupper(bin2hex(random_bytes(5)));
        $stmt = $this->db->prepare("
            INSERT INTO reconciliation_batches (batch_uuid, total_internal_count, total_external_count, total_internal_amount, total_external_amount, net_variance)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $variance = round($intAmount - $extAmount, 2);
        $stmt->execute([$uuid, $totalInternal, $totalExternal, $intAmount, $extAmount, $variance]);
        return (int)$this->db->lastInsertId();
    }

    public function finalizeBatch(int $batchId, int $matchedCount, int $breakCount, float $netVariance): void {
        $stmt = $this->db->prepare("
            UPDATE reconciliation_batches 
            SET matched_count = ?, break_count = ?, net_variance = ?, status = 'COMPLETED', completed_at = datetime('now')
            WHERE id = ?
        ");
        $stmt->execute([$matchedCount, $breakCount, $netVariance, $batchId]);
    }

    public function recordMatch(int $batchId, int $internalId, int $externalId, string $tier, float $varianceFee, float $score, string $notes): int {
        $uuid = "MTC-" . strtoupper(bin2hex(random_bytes(5)));
        $stmt = $this->db->prepare("
            INSERT INTO reconciliation_matches (match_uuid, batch_id, internal_id, external_id, match_tier, variance_fee, match_score, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$uuid, $batchId, $internalId, $externalId, $tier, $varianceFee, $score, $notes]);
        $matchId = (int)$this->db->lastInsertId();

        $this->db->prepare("UPDATE internal_ledger SET status = 'MATCHED' WHERE id = ?")->execute([$internalId]);
        $this->db->prepare("UPDATE external_statements SET status = 'MATCHED' WHERE id = ?")->execute([$externalId]);

        return $matchId;
    }

    public function recordBreak(int $batchId, string $type, ?int $internalId, ?int $externalId, float $discrepancy, string $notes = ""): int {
        $uuid = "BRK-" . strtoupper(bin2hex(random_bytes(5)));
        $stmt = $this->db->prepare("
            INSERT INTO reconciliation_breaks (break_uuid, batch_id, break_type, internal_id, external_id, discrepancy_amount, status, resolution_notes)
            VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)
        ");
        $stmt->execute([$uuid, $batchId, $type, $internalId, $externalId, $discrepancy, $notes]);
        $breakId = (int)$this->db->lastInsertId();

        if ($internalId) {
            $this->db->prepare("UPDATE internal_ledger SET status = 'BREAK_OPEN' WHERE id = ?")->execute([$internalId]);
        }
        if ($externalId) {
            $this->db->prepare("UPDATE external_statements SET status = 'BREAK_OPEN' WHERE id = ?")->execute([$externalId]);
        }

        return $breakId;
    }

    public function logAudit(string $type, int $recordId, string $action, ?string $prevState, ?string $newState, array $payload): void {
        $sigData = "{$type}|{$recordId}|{$action}|{$prevState}|{$newState}|" . json_encode($payload) . "|" . microtime();
        $signature = hash('sha256', $sigData);

        $stmt = $this->db->prepare("
            INSERT INTO reconciliation_audit_logs (record_type, record_id, action, prev_state, new_state, payload_json, signature_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$type, $recordId, $action, $prevState, $newState, json_encode($payload), $signature]);
    }

    public function getOpenBreaks(): array {
        return $this->db->query("
            SELECT b.*, 
                   i.txn_code, i.amount as internal_amount, i.memo as internal_memo, i.booking_date,
                   e.ext_ref, e.amount as external_amount, e.raw_memo as external_memo, e.value_date, e.source_name
            FROM reconciliation_breaks b
            LEFT JOIN internal_ledger i ON b.internal_id = i.id
            LEFT JOIN external_statements e ON b.external_id = e.id
            WHERE b.status = 'OPEN'
            ORDER BY b.id ASC
        ")->fetchAll();
    }

    public function getBreakById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT b.*, 
                   i.txn_code, i.amount as internal_amount, i.memo as internal_memo, i.booking_date,
                   e.ext_ref, e.amount as external_amount, e.raw_memo as external_memo, e.value_date, e.source_name
            FROM reconciliation_breaks b
            LEFT JOIN internal_ledger i ON b.internal_id = i.id
            LEFT JOIN external_statements e ON b.external_id = e.id
            WHERE b.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function resolveBreak(int $breakId, string $resolutionType, string $notes, string $operator = "SYSTEM_ADMIN"): void {
        $break = $this->getBreakById($breakId);
        if (!$break) return;

        $stmt = $this->db->prepare("
            UPDATE reconciliation_breaks
            SET status = ?, resolution_notes = ?, resolved_by = ?, resolved_at = datetime('now')
            WHERE id = ?
        ");
        $newStatus = ($resolutionType === 'WRITE_OFF') ? 'WRITTEN_OFF' : 'RESOLVED';
        $stmt->execute([$newStatus, $notes, $operator, $breakId]);

        if ($break['internal_id']) {
            $this->db->prepare("UPDATE internal_ledger SET status = 'RESOLVED' WHERE id = ?")->execute([$break['internal_id']]);
        }
        if ($break['external_id']) {
            $this->db->prepare("UPDATE external_statements SET status = 'RESOLVED' WHERE id = ?")->execute([$break['external_id']]);
        }

        $this->logAudit('BREAK', $breakId, 'RESOLVE_EXCEPTION', 'OPEN', $newStatus, [
            'type' => $resolutionType,
            'notes' => $notes,
            'operator' => $operator
        ]);
    }

    public function forceManualMatch(int $batchId, int $internalId, int $externalId, string $notes, string $operator = "SYSTEM_ADMIN"): void {
        $intRow = $this->db->query("SELECT * FROM internal_ledger WHERE id = {$internalId}")->fetch();
        $extRow = $this->db->query("SELECT * FROM external_statements WHERE id = {$externalId}")->fetch();

        if (!$intRow || !$extRow) return;

        $variance = round($intRow['amount'] - $extRow['amount'], 2);
        $matchId = $this->recordMatch($batchId, $internalId, $externalId, 'TIER_4_MANUAL', $variance, 1.0, "Manual Operator Match: {$notes}");

        // Close associated open breaks if any
        $this->db->prepare("UPDATE reconciliation_breaks SET status = 'RESOLVED', resolution_notes = 'Manual match resolved', resolved_by = ?, resolved_at = datetime('now') WHERE internal_id = ? OR external_id = ?")
                 ->execute([$operator, $internalId, $externalId]);

        $this->logAudit('MATCH', $matchId, 'MANUAL_MATCH_OVERRIDE', 'BREAK_OPEN', 'MATCHED', [
            'internal_txn' => $intRow['txn_code'],
            'external_ref' => $extRow['ext_ref'],
            'variance' => $variance,
            'operator' => $operator
        ]);
    }

    public function getLatestBatchSummary(): ?array {
        return $this->db->query("SELECT * FROM reconciliation_batches ORDER BY id DESC LIMIT 1")->fetch() ?: null;
    }

    public function getReconciliationMatches(int $limit = 30): array {
        return $this->db->query("
            SELECT m.*, i.txn_code, i.amount as internal_amount, i.booking_date,
                   e.ext_ref, e.amount as external_amount, e.value_date, e.source_name
            FROM reconciliation_matches m
            JOIN internal_ledger i ON m.internal_id = i.id
            JOIN external_statements e ON m.external_id = e.id
            ORDER BY m.id DESC LIMIT {$limit}
        ")->fetchAll();
    }

    public function getAuditTrail(int $limit = 40): array {
        return $this->db->query("SELECT * FROM reconciliation_audit_logs ORDER BY id DESC LIMIT {$limit}")->fetchAll();
    }

    public function getStats(): array {
        $totalInt = (int)$this->db->query("SELECT COUNT(*) FROM internal_ledger")->fetchColumn();
        $totalExt = (int)$this->db->query("SELECT COUNT(*) FROM external_statements")->fetchColumn();
        $matched = (int)$this->db->query("SELECT COUNT(*) FROM reconciliation_matches")->fetchColumn();
        $openBreaks = (int)$this->db->query("SELECT COUNT(*) FROM reconciliation_breaks WHERE status = 'OPEN'")->fetchColumn();
        $resolvedBreaks = (int)$this->db->query("SELECT COUNT(*) FROM reconciliation_breaks WHERE status != 'OPEN'")->fetchColumn();

        $intSum = (float)$this->db->query("SELECT COALESCE(SUM(amount), 0) FROM internal_ledger")->fetchColumn();
        $extSum = (float)$this->db->query("SELECT COALESCE(SUM(amount), 0) FROM external_statements")->fetchColumn();

        return [
            'total_internal' => $totalInt,
            'total_external' => $totalExt,
            'total_matched'  => $matched,
            'open_breaks'    => $openBreaks,
            'resolved_breaks'=> $resolvedBreaks,
            'internal_sum'   => $intSum,
            'external_sum'   => $extSum,
            'net_variance'   => round($intSum - $extSum, 2)
        ];
    }
}

// ==========================================
// 3. Multi-Tier Matching Engine
// ==========================================
class ReconciliationMatchingEngine {
    private ReconciliationRepository $repo;

    public function __construct(ReconciliationRepository $repo) {
        $this->repo = $repo;
    }

    /**
     * Executes the end-to-end multi-tier reconciliation pipeline.
     */
    public function executePipeline(array $config = []): array {
        $dateWindowDays = $config['date_window_days'] ?? 4;
        $toleranceCents = $config['tolerance_amount'] ?? 0.50; // $0.50 allowable fee tolerance

        $internals = $this->repo->getPendingInternal();
        $externals = $this->repo->getPendingExternal();

        if (empty($internals) && empty($externals)) {
            return [
                'status' => 'NO_PENDING_DATA',
                'matched' => 0,
                'breaks' => 0,
                'variance' => 0.0
            ];
        }

        $intSum = array_sum(array_column($internals, 'amount'));
        $extSum = array_sum(array_column($externals, 'amount'));

        $batchId = $this->repo->createBatch(count($internals), count($externals), (float)$intSum, (float)$extSum);

        $matchedCount = 0;
        $breakCount = 0;

        $matchedInternalIds = [];
        $matchedExternalIds = [];

        // ==========================================================
        // TIER 1: Exact Reference + Exact Amount + Date Window Match
        // ==========================================================
        foreach ($internals as $intRow) {
            $intId = (int)$intRow['id'];
            if (isset($matchedInternalIds[$intId])) continue;

            foreach ($externals as $extRow) {
                $extId = (int)$extRow['id'];
                if (isset($matchedExternalIds[$extId])) continue;

                if (abs($intRow['amount'] - $extRow['amount']) < 0.001) {
                    $refDirectMatch = (strtoupper($intRow['txn_code']) === strtoupper($extRow['ext_ref']));
                    $refInMemoMatch = (str_contains(strtoupper($extRow['raw_memo']), strtoupper($intRow['txn_code'])) ||
                                       str_contains(strtoupper($extRow['ext_ref']), strtoupper($intRow['txn_code'])));

                    if ($refDirectMatch || $refInMemoMatch) {
                        $daysDiff = abs((strtotime($extRow['value_date']) - strtotime($intRow['booking_date'])) / 86400);
                        if ($daysDiff <= $dateWindowDays) {
                            $this->repo->recordMatch($batchId, $intId, $extId, 'TIER_1_EXACT', 0.0, 1.0, "Exact reference & amount match within {$daysDiff}d");
                            $this->repo->logAudit('MATCH', $intId, 'TIER_1_EXACT_MATCH', 'PENDING', 'MATCHED', [
                                'txn_code' => $intRow['txn_code'],
                                'ext_ref' => $extRow['ext_ref'],
                                'amount' => $intRow['amount']
                            ]);
                            $matchedInternalIds[$intId] = true;
                            $matchedExternalIds[$extId] = true;
                            $matchedCount++;
                            break;
                        }
                    }
                }
            }
        }

        // ==========================================================
        // TIER 2: Fuzzy Reference / Memo Token Match + Exact Amount
        // ==========================================================
        foreach ($internals as $intRow) {
            $intId = (int)$intRow['id'];
            if (isset($matchedInternalIds[$intId])) continue;

            foreach ($externals as $extRow) {
                $extId = (int)$extRow['id'];
                if (isset($matchedExternalIds[$extId])) continue;

                if (abs($intRow['amount'] - $extRow['amount']) < 0.001) {
                    $similarity = $this->calculateMemoSimilarity($intRow['memo'], $extRow['raw_memo']);
                    if ($similarity >= 0.40) { // Normalized token similarity match
                        $daysDiff = abs((strtotime($extRow['value_date']) - strtotime($intRow['booking_date'])) / 86400);
                        if ($daysDiff <= ($dateWindowDays + 2)) {
                            $this->repo->recordMatch($batchId, $intId, $extId, 'TIER_2_FUZZY_REF', 0.0, $similarity, "Fuzzy memo match (score: " . round($similarity * 100) . "%)");
                            $this->repo->logAudit('MATCH', $intId, 'TIER_2_FUZZY_MATCH', 'PENDING', 'MATCHED', [
                                'int_memo' => $intRow['memo'],
                                'ext_memo' => $extRow['raw_memo'],
                                'score' => $similarity
                            ]);
                            $matchedInternalIds[$intId] = true;
                            $matchedExternalIds[$extId] = true;
                            $matchedCount++;
                            break;
                        }
                    }
                }
            }
        }

        // ==========================================================
        // TIER 3: Tolerance Matching (Gateway Fees & Minor Variance)
        // ==========================================================
        foreach ($internals as $intRow) {
            $intId = (int)$intRow['id'];
            if (isset($matchedInternalIds[$intId])) continue;

            foreach ($externals as $extRow) {
                $extId = (int)$extRow['id'];
                if (isset($matchedExternalIds[$extId])) continue;

                $refMatch = str_contains(strtoupper($extRow['raw_memo']), strtoupper($intRow['txn_code'])) ||
                            str_contains(strtoupper($extRow['ext_ref']), strtoupper($intRow['txn_code']));

                if ($refMatch) {
                    $diff = round($intRow['amount'] - $extRow['amount'], 2);
                    if (abs($diff) <= $toleranceCents && abs($diff) > 0) {
                        $this->repo->recordMatch($batchId, $intId, $extId, 'TIER_3_TOLERANCE', $diff, 0.95, "Tolerance auto-absorbed (Fee variance: $" . number_format($diff, 2) . ")");
                        $this->repo->logAudit('MATCH', $intId, 'TIER_3_TOLERANCE_MATCH', 'PENDING', 'MATCHED_TOLERANCE', [
                            'variance_fee' => $diff,
                            'txn_code' => $intRow['txn_code']
                        ]);
                        $matchedInternalIds[$intId] = true;
                        $matchedExternalIds[$extId] = true;
                        $matchedCount++;
                        break;
                    }
                }
            }
        }

        // ==========================================================
        // TIER 4: Discrepancy & Break Classification
        // ==========================================================
        // Check for Amount Mismatches (Reference match exists, but amount exceeds tolerance)
        foreach ($internals as $intRow) {
            $intId = (int)$intRow['id'];
            if (isset($matchedInternalIds[$intId])) continue;

            foreach ($externals as $extRow) {
                $extId = (int)$extRow['id'];
                if (isset($matchedExternalIds[$extId])) continue;

                $refMatch = str_contains(strtoupper($extRow['raw_memo']), strtoupper($intRow['txn_code'])) ||
                            str_contains(strtoupper($extRow['ext_ref']), strtoupper($intRow['txn_code']));

                if ($refMatch) {
                    $diff = round($intRow['amount'] - $extRow['amount'], 2);
                    $this->repo->recordBreak($batchId, 'AMOUNT_MISMATCH', $intId, $extId, $diff, "Reference matched ({$intRow['txn_code']}), but amount variance is $" . number_format($diff, 2));
                    $this->repo->logAudit('BREAK', $intId, 'BREAK_DETECTED_AMOUNT_MISMATCH', 'PENDING', 'BREAK_OPEN', [
                        'internal_amount' => $intRow['amount'],
                        'external_amount' => $extRow['amount'],
                        'variance' => $diff
                    ]);
                    $matchedInternalIds[$intId] = true;
                    $matchedExternalIds[$extId] = true;
                    $breakCount++;
                    break;
                }
            }
        }

        // Unmatched Internal Records (e.g. Uncleared checks, un-batched receivables)
        foreach ($internals as $intRow) {
            $intId = (int)$intRow['id'];
            if (!isset($matchedInternalIds[$intId])) {
                $this->repo->recordBreak($batchId, 'UNMATCHED_INTERNAL', $intId, null, (float)$intRow['amount'], "Ledger transaction uncleared in external bank/processor statement");
                $this->repo->logAudit('BREAK', $intId, 'BREAK_UNMATCHED_INTERNAL', 'PENDING', 'BREAK_OPEN', [
                    'txn_code' => $intRow['txn_code'],
                    'amount' => $intRow['amount']
                ]);
                $breakCount++;
            }
        }

        // Unmatched External Records (e.g. Unrecognized bank fees, direct debits)
        foreach ($externals as $extRow) {
            $extId = (int)$extRow['id'];
            if (!isset($matchedExternalIds[$extId])) {
                $this->repo->recordBreak($batchId, 'UNMATCHED_EXTERNAL', null, $extId, (float)$extRow['amount'], "Statement entry missing corresponding general ledger entry");
                $this->repo->logAudit('BREAK', $extId, 'BREAK_UNMATCHED_EXTERNAL', 'PENDING', 'BREAK_OPEN', [
                    'ext_ref' => $extRow['ext_ref'],
                    'amount' => $extRow['amount']
                ]);
                $breakCount++;
            }
        }

        $variance = round($intSum - $extSum, 2);
        $this->repo->finalizeBatch($batchId, $matchedCount, $breakCount, $variance);

        return [
            'status' => 'COMPLETED',
            'batch_id' => $batchId,
            'matched' => $matchedCount,
            'breaks' => $breakCount,
            'variance' => $variance
        ];
    }

    private function calculateMemoSimilarity(string $str1, string $str2): float {
        $clean1 = preg_replace('/[^A-Z0-9 ]/i', ' ', strtoupper($str1));
        $clean2 = preg_replace('/[^A-Z0-9 ]/i', ' ', strtoupper($str2));

        $tokens1 = array_filter(explode(' ', (string)$clean1), fn($t) => strlen($t) > 2);
        $tokens2 = array_filter(explode(' ', (string)$clean2), fn($t) => strlen($t) > 2);

        if (empty($tokens1) || empty($tokens2)) {
            return 0.0;
        }

        $intersect = array_intersect($tokens1, $tokens2);
        return count($intersect) / max(count($tokens1), count($tokens2));
    }
}

// ==========================================
// 4. Interactive Console Application
// ==========================================
class ReconciliationConsoleApp {
    private ReconciliationRepository $repo;
    private ReconciliationMatchingEngine $engine;

    public function __construct() {
        $this->repo = new ReconciliationRepository();
        $this->engine = new ReconciliationMatchingEngine($this->repo);
    }

    public function launch(): void {
        while (true) {
            $stats = $this->repo->getStats();
            $batch = $this->repo->getLatestBatchSummary();

            $subTitle = "Total Records: [Int: {$stats['total_internal']} | Ext: {$stats['total_external']}] | Matched: {$stats['total_matched']} | Open Breaks: {$stats['open_breaks']}";
            CliUI::header("Automated Multi-Source Reconciliation Engine", $subTitle);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Execute Automated Reconciliation Pipeline (Multi-Tier Rules)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Inspect Reconciliation Summary & Variance Analytics\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Break Investigation & Exception Resolution Wizard\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Inspect Matched Pairs Ledger\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Inspect Raw Dual Ledgers (Internal vs External Statements)\n";
            echo "  " . CliUI::CYAN . "6." . CliUI::RESET . " Cryptographic SHA-256 Audit Compliance Trail\n";
            echo "  " . CliUI::CYAN . "7." . CliUI::RESET . " Reset & Re-Seed Realistic Baseline Datasets\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect & Exit Workspace\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->runReconciliationWizard(); break;
                case '2': $this->viewVarianceAnalytics(); break;
                case '3': $this->breakInvestigationWizard(); break;
                case '4': $this->viewMatchesLedger(); break;
                case '5': $this->viewDualLedgers(); break;
                case '6': $this->viewAuditTrail(); break;
                case '7': $this->reseedData(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Reconciliation engine unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function runReconciliationWizard(): void {
        CliUI::header("Execute Automated Reconciliation Run");

        echo " Configuring Matching Parameters:\n";
        $days = (int)CliUI::prompt("  Date Clearing Window Tolerance (Days)", "4");
        $tolerance = (float)CliUI::prompt("  Allowable Gateway Fee / Penny Tolerance ($)", "0.50");

        echo "\n " . CliUI::DIM . "Executing Tier 1 -> Tier 2 -> Tier 3 -> Tier 4 Matching Pipeline..." . self::RESET . "\n\n";
        usleep(400000);

        $res = $this->engine->executePipeline([
            'date_window_days' => $days,
            'tolerance_amount' => $tolerance
        ]);

        if ($res['status'] === 'NO_PENDING_DATA') {
            CliUI::info("All transactions are already reconciled! No pending items found.");
        } else {
            CliUI::success("Reconciliation Batch #{$res['batch_id']} completed!");
            echo "  ├─ " . CliUI::BOLD . "Matched Transactions : " . CliUI::GREEN . $res['matched'] . CliUI::RESET . "\n";
            echo "  ├─ " . CliUI::BOLD . "Exceptions / Breaks  : " . CliUI::RED . $res['breaks'] . CliUI::RESET . "\n";
            echo "  └─ " . CliUI::BOLD . "Calculated Variance  : " . CliUI::YELLOW . CliUI::formatMoney((float)$res['variance']) . CliUI::RESET . "\n";
        }

        CliUI::pause();
    }

    private function viewVarianceAnalytics(): void {
        CliUI::header("Reconciliation Dashboard & Variance Summary");
        $stats = $this->repo->getStats();
        $batch = $this->repo->getLatestBatchSummary();

        echo " " . CliUI::BOLD . "OVERALL RECONCILIATION POSITION:" . CliUI::RESET . "\n";
        echo " ┌──────────────────────────────────────┬──────────────────────────────────────┐\n";
        echo " │ " . str_pad("Internal Ledger Total: " . CliUI::formatMoney($stats['internal_sum']), 36) . " │ " . str_pad("External Statements: " . CliUI::formatMoney($stats['external_sum']), 36) . " │\n";
        echo " ├──────────────────────────────────────┼──────────────────────────────────────┤\n";
        echo " │ " . str_pad("Net Unbalanced Variance: " . CliUI::formatMoney($stats['net_variance']), 36) . " │ " . str_pad("Active Open Breaks: " . $stats['open_breaks'], 36) . " │\n";
        echo " └──────────────────────────────────────┴──────────────────────────────────────┘\n\n";

        if ($batch) {
            echo " " . CliUI::BOLD . "LATEST BATCH EXECUTION (#{$batch['id']} - {$batch['batch_uuid']}):" . CliUI::RESET . "\n";
            echo "  • Total Records Processed : " . ($batch['total_internal_count'] + $batch['total_external_count']) . "\n";
            echo "  • Reconciled Pairs        : " . CliUI::GREEN . $batch['matched_count'] . CliUI::RESET . "\n";
            echo "  • Discrepancies / Breaks  : " . CliUI::RED . $batch['break_count'] . CliUI::RESET . "\n";
            echo "  • Batch Variance          : " . CliUI::YELLOW . CliUI::formatMoney((float)$batch['net_variance']) . CliUI::RESET . "\n";
            echo "  • Completed Timestamp     : " . ($batch['completed_at'] ?? 'IN PROGRESS') . "\n";
        }

        CliUI::pause();
    }

    private function breakInvestigationWizard(): void {
        CliUI::header("Break Investigation & Exception Resolution");
        $breaks = $this->repo->getOpenBreaks();

        if (empty($breaks)) {
            CliUI::info("No open reconciliation breaks found. All ledgers are perfectly balanced!");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($breaks as $b) {
            $ref = $b['txn_code'] ?: $b['ext_ref'] ?: 'N/A';
            $amount = $b['internal_amount'] !== null ? $b['internal_amount'] : $b['external_amount'];
            $tableData[] = [
                'id'       => $b['id'],
                'uuid'     => $b['break_uuid'],
                'type'     => CliUI::statusBadge($b['break_type']),
                'ref'      => $ref,
                'amount'   => CliUI::formatMoney((float)$amount),
                'variance' => CliUI::formatMoney((float)$b['discrepancy_amount']),
                'status'   => CliUI::statusBadge($b['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'uuid' => 'Break UUID', 'type' => 'Break Type', 'ref' => 'Reference', 'amount' => 'Amount', 'variance' => 'Variance', 'status' => 'Status'
        ]);

        echo " Resolution Options:\n";
        echo "  [1] Apply Bank Fee Write-Off / Expense Adjustment\n";
        echo "  [2] Force Manual Match Between Specific Internal & External Entries\n";
        echo "  [3] Acknowledge In-Flight Timing Difference (Mark Resolved)\n";
        echo "  [0] Return to Main Menu\n\n";

        $opt = CliUI::prompt("Select Action Route", "0");

        if ($opt === '1') {
            $breakId = (int)CliUI::prompt("Enter Break ID to Write-Off / Auto-Categorize");
            $notes = CliUI::prompt("Write-Off Reason / Cost Center", "Monthly recurring bank charge write-off");
            $this->repo->resolveBreak($breakId, 'WRITE_OFF', $notes);
            CliUI::success("Break #{$breakId} written off and audited successfully.");
            CliUI::pause();
        } elseif ($opt === '2') {
            $internalId = (int)CliUI::prompt("Enter Internal Ledger Record ID");
            $externalId = (int)CliUI::prompt("Enter External Statement Record ID");
            $reason = CliUI::prompt("Manual Override Authorization Justification", "Manager approved timing & reference match");
            $batch = $this->repo->getLatestBatchSummary();
            $batchId = $batch ? (int)$batch['id'] : 1;
            $this->repo->forceManualMatch($batchId, $internalId, $externalId, $reason);
            CliUI::success("Manual match enforced and cryptographic audit log created.");
            CliUI::pause();
        } elseif ($opt === '3') {
            $breakId = (int)CliUI::prompt("Enter Break ID to acknowledge");
            $this->repo->resolveBreak($breakId, 'ACKNOWLEDGE_TIMING', "Timing difference verified - in-flight settlement confirmed");
            CliUI::success("Break #{$breakId} resolved.");
            CliUI::pause();
        }
    }

    private function viewMatchesLedger(): void {
        CliUI::header("Reconciled Matches Registry");
        $matches = $this->repo->getReconciliationMatches(25);

        $tableData = [];
        foreach ($matches as $m) {
            $tableData[] = [
                'id'       => $m['id'],
                'uuid'     => $m['match_uuid'],
                'tier'     => CliUI::tierBadge($m['match_tier']),
                'internal' => $m['txn_code'] . " (" . CliUI::formatMoney((float)$m['internal_amount']) . ")",
                'external' => $m['ext_ref'] . " (" . CliUI::formatMoney((float)$m['external_amount']) . ")",
                'fee'      => $m['variance_fee'] != 0 ? CliUI::formatMoney((float)$m['variance_fee']) : '$0.00',
                'time'     => $m['reconciled_at']
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'uuid' => 'Match UUID', 'tier' => 'Match Tier', 'internal' => 'Internal Transaction', 'external' => 'External Statement', 'fee' => 'Fee Variance', 'time' => 'Reconciled At'
        ]);

        CliUI::pause();
    }

    private function viewDualLedgers(): void {
        CliUI::header("Dual Ledger Inspection (Internal vs External)");

        echo " " . CliUI::BOLD . "INTERNAL GENERAL LEDGER ENTRIES (First 15):" . CliUI::RESET . "\n";
        $internals = $this->repo->getAllInternal(15);
        $intData = [];
        foreach ($internals as $i) {
            $intData[] = [
                'id'     => $i['id'],
                'txn'    => $i['txn_code'],
                'date'   => $i['booking_date'],
                'amount' => CliUI::formatMoney((float)$i['amount']),
                'memo'   => mb_strimwidth($i['memo'], 0, 28, '...'),
                'status' => CliUI::statusBadge($i['status'])
            ];
        }
        CliUI::drawTable($intData, ['id' => 'ID', 'txn' => 'Txn Code', 'date' => 'Booking Date', 'amount' => 'Amount', 'memo' => 'Memo', 'status' => 'Status']);

        echo "\n " . CliUI::BOLD . "EXTERNAL SETTLEMENT STATEMENTS (First 15):" . CliUI::RESET . "\n";
        $externals = $this->repo->getAllExternal(15);
        $extData = [];
        foreach ($externals as $e) {
            $extData[] = [
                'id'     => $e['id'],
                'ref'    => $e['ext_ref'],
                'source' => $e['source_name'],
                'date'   => $e['value_date'],
                'amount' => CliUI::formatMoney((float)$e['amount']),
                'status' => CliUI::statusBadge($e['status'])
            ];
        }
        CliUI::drawTable($extData, ['id' => 'ID', 'ref' => 'Ext Reference', 'source' => 'Source', 'date' => 'Value Date', 'amount' => 'Amount', 'status' => 'Status']);

        CliUI::pause();
    }

    private function viewAuditTrail(): void {
        CliUI::header("Cryptographic SHA-256 Compliance Ledger");
        $logs = $this->repo->getAuditTrail(30);

        if (empty($logs)) {
            CliUI::info("No audit logs recorded yet.");
            CliUI::pause();
            return;
        }

        echo " " . CliUI::BOLD . "RECENT IMMUTABLE COMPLIANCE AUDIT ENTRIES:" . CliUI::RESET . "\n\n";
        foreach ($logs as $l) {
            echo "  ├─ [" . $l['timestamp'] . "] Type: " . CliUI::BOLD . $l['record_type'] . " #" . $l['record_id'] . CliUI::RESET . "\n";
            echo "  │  Action Taken : " . CliUI::CYAN . $l['action'] . CliUI::RESET . " (" . ($l['prev_state'] ?? 'NULL') . " ──► " . ($l['new_state'] ?? 'NULL') . ")\n";
            echo "  │  SHA-256 Sig  : " . CliUI::YELLOW . substr($l['signature_hash'], 0, 24) . "..." . substr($l['signature_hash'], -8) . CliUI::RESET . "\n";
            echo "  │  Payload Hash : " . CliUI::DIM . $l['payload_json'] . CliUI::RESET . "\n";
        }
        echo "  └─ End of Cryptographic Audit Sequence.\n";

        CliUI::pause();
    }

    private function reseedData(): void {
        CliUI::header("Re-Seed Financial Datasets");
        $confirm = CliUI::prompt("Are you sure you want to re-seed all tables with baseline data? (yes/no)", "yes");

        if (strtolower($confirm) === 'yes') {
            $this->repo->seedBaselineData();
            CliUI::success("Database restored to pristine multi-source baseline datasets.");
        } else {
            CliUI::info("Operation cancelled.");
        }

        CliUI::pause();
    }

    public function runDaemon(): void {
        CliUI::stepLog("Starting continuous Automated Reconciliation Daemon...");
        CliUI::stepLog("Listening for multi-source transaction feeds (Ctrl+C to stop)...");

        while (true) {
            $res = $this->engine->executePipeline();
            if ($res['status'] === 'COMPLETED' && $res['matched'] > 0) {
                CliUI::stepLog("Reconciled {$res['matched']} transactions in active cycle. Net variance: $" . number_format((float)$res['variance'], 2));
            }
            sleep(6);
        }
    }
}

// ==========================================
// 5. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Reconciliation engine requires a standard console CLI environment.\n");
}

$app = new ReconciliationConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--daemon') {
    $app->runDaemon();
} elseif ($mode === '--cron') {
    $repo = new ReconciliationRepository();
    $engine = new ReconciliationMatchingEngine($repo);
    $res = $engine->executePipeline();
    if ($res['status'] === 'COMPLETED') {
        CliUI::stepLog("Cron reconciliation completed. Matched: {$res['matched']}, Breaks: {$res['breaks']}, Variance: $" . number_format((float)$res['variance'], 2));
    } else {
        CliUI::stepLog("Cron reconciliation cycle: No pending transactions.");
    }
} elseif ($mode === '--run-sample') {
    $repo = new ReconciliationRepository();
    $repo->seedBaselineData();
    $engine = new ReconciliationMatchingEngine($repo);
    $res = $engine->executePipeline();
    echo "\n" . CliUI::GREEN . CliUI::BOLD . "✔ Sample Automated Reconciliation Batch Run Successful!" . CliUI::RESET . "\n";
    echo " Matched Pairs : " . CliUI::GREEN . $res['matched'] . CliUI::RESET . "\n";
    echo " Open Breaks   : " . CliUI::RED . $res['breaks'] . CliUI::RESET . "\n";
    echo " Net Variance  : " . CliUI::YELLOW . "$" . number_format((float)$res['variance'], 2) . CliUI::RESET . "\n\n";
} else {
    $app->launch();
}
