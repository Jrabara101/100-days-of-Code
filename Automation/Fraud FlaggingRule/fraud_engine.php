#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Fraud Flagging Rule Engine
 * 
 * Usage:
 *   php fraud_engine.php          (Interactive Fraud Operations Dashboard)
 *   php fraud_engine.php --cron   (Headless Batch Ingestion Queue)
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
        echo self::RED . self::BOLD;
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
        echo "\n" . self::DIM . "Press Enter to return to security operations center..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[FRAUD-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'APPROVED' => self::GREEN . self::BOLD . "  APPROVED " . self::RESET,
            'REVIEW'   => self::YELLOW . self::BOLD . "   REVIEW  " . self::RESET,
            'BLOCKED'  => self::RED . self::BOLD . "  BLOCKED  " . self::RESET,
            default    => $status
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
                $cleanString = preg_replace('#\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
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
                $cleanString = preg_replace('#\x1b[[][^A-Za-z]*[A-Za-z]#', '', $content);
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
class FraudRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/fraud_telemetry.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            account_age_days INTEGER DEFAULT 0
        )");

        $this->db->exec("CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            ip_address TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING', -- APPROVED, REVIEW, BLOCKED
            risk_score INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )");

        $this->db->exec("CREATE TABLE IF NOT EXISTS fraud_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id INTEGER NOT NULL,
            rule_name TEXT NOT NULL,
            risk_delta INTEGER NOT NULL,
            reason TEXT NOT NULL,
            logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_tx_user_time ON transactions(user_id, created_at)");

        if ($this->db->query("SELECT COUNT(*) FROM users")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        $stmt = $this->db->prepare("INSERT INTO users (email, account_age_days) VALUES (?, ?)");
        $stmt->execute(['trusted.user@example.com', 450]);   // Old account, low risk
        $stmt->execute(['new.buyer@example.com', 2]);        // New account, medium risk
        $stmt->execute(['suspicious.bot@anon.net', 0]);      // Brand new account, high risk
    }

    public function insertTransaction(int $userId, float $amount, string $ip): int {
        $stmt = $this->db->prepare("INSERT INTO transactions (user_id, amount, ip_address) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $amount, $ip]);
        return (int)$this->db->lastInsertId();
    }

    public function getUser(int $userId): array {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }

    public function countUserTransactionsSince(int $userId, string $dateTime): int {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM transactions WHERE user_id = ? AND created_at >= ?");
        $stmt->execute([$userId, $dateTime]);
        return (int)$stmt->fetchColumn();
    }

    public function updateTransactionState(int $txId, string $status, int $score): void {
        $stmt = $this->db->prepare("UPDATE transactions SET status = ?, risk_score = ? WHERE id = ?");
        $stmt->execute([$status, $score, $txId]);
    }

    public function logRuleFire(int $txId, string $rule, int $delta, string $reason): void {
        $stmt = $this->db->prepare("INSERT INTO fraud_audit_logs (transaction_id, rule_name, risk_delta, reason) VALUES (?, ?, ?, ?)");
        $stmt->execute([$txId, $rule, $delta, $reason]);
    }

    public function getTransactionRegistry(): array {
        return $this->db->query("
            SELECT t.id, u.email, t.amount, t.ip_address, t.status, t.risk_score, t.created_at
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.id DESC LIMIT 25
        ")->fetchAll();
    }

    public function getAuditTrail(int $txId): array {
        $stmt = $this->db->prepare("SELECT * FROM fraud_audit_logs WHERE transaction_id = ? ORDER BY id ASC");
        $stmt->execute([$txId]);
        return $stmt->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Extensible Rules Engine Domain Service
// ==========================================

// DTO representing the facts of the transaction
class TransactionContext {
    public function __construct(
        public int $id,
        public array $user,
        public float $amount,
        public string $ip
    ) {}
}

class RuleResult {
    public function __construct(
        public int $scoreDelta,
        public string $reason
    ) {}
}

interface FraudRuleInterface {
    public function evaluate(TransactionContext $context): ?RuleResult;
}

// Rule 1: High Amount Anomaly
class HighValueRule implements FraudRuleInterface {
    public function evaluate(TransactionContext $context): ?RuleResult {
        if ($context->amount > 5000) {
            return new RuleResult(100, "Critical Value Exceeded (>$5000)");
        }
        if ($context->amount > 1000) {
            return new RuleResult(40, "High Value Transaction (>$1000)");
        }
        return null;
    }
}

// Rule 2: Account Age Trust Matrix
class AccountAgeRule implements FraudRuleInterface {
    public function evaluate(TransactionContext $context): ?RuleResult {
        $age = (int)$context->user['account_age_days'];
        if ($age < 1) {
            return new RuleResult(50, "Zero-Day Account Origin");
        }
        if ($age < 7) {
            return new RuleResult(20, "New Account (Under 7 Days)");
        }
        // Negative scoring (trust building) for established users
        if ($age > 365) {
            return new RuleResult(-15, "Trusted Account History (>1 Year)");
        }
        return null;
    }
}

// Rule 3: Velocity Check (Requires DB lookup)
class VelocityRule implements FraudRuleInterface {
    public function __construct(private FraudRepository $repo) {}

    public function evaluate(TransactionContext $context): ?RuleResult {
        // Look back 15 minutes
        $lookback = date('Y-m-d H:i:s', time() - (15 * 60));
        $count = $this->repo->countUserTransactionsSince((int)$context->user['id'], $lookback);
        
        if ($count >= 5) {
            return new RuleResult(80, "High Velocity: 5+ transactions in 15 minutes");
        }
        if ($count >= 3) {
            return new RuleResult(30, "Elevated Velocity: 3+ transactions in 15 minutes");
        }
        return null;
    }
}

// Orchestrator
class FraudScoringEngine {
    private array $rules = [];
    
    // Threshold Configurations
    private const THRESHOLD_BLOCK = 85;
    private const THRESHOLD_REVIEW = 50;

    public function addRule(FraudRuleInterface $rule): void {
        $this->rules[] = $rule;
    }

    /**
     * Executes the scoring matrix atomically.
     */
    public function process(TransactionContext $context, FraudRepository $repo): array {
        $totalScore = 0;
        $triggeredRules = [];

        foreach ($this->rules as $rule) {
            $result = $rule->evaluate($context);
            if ($result !== null) {
                $totalScore += $result->scoreDelta;
                $triggeredRules[] = [
                    'name' => (new ReflectionClass($rule))->getShortName(),
                    'delta' => $result->scoreDelta,
                    'reason' => $result->reason
                ];
            }
        }

        // Clamp minimum score to 0
        $totalScore = max(0, $totalScore);

        $status = 'APPROVED';
        if ($totalScore >= self::THRESHOLD_BLOCK) {
            $status = 'BLOCKED';
        } elseif ($totalScore >= self::THRESHOLD_REVIEW) {
            $status = 'REVIEW';
        }

        // Atomic commit of results and audit trails
        $repo->getPDO()->beginTransaction();
        try {
            $repo->updateTransactionState($context->id, $status, $totalScore);
            foreach ($triggeredRules as $tr) {
                $repo->logRuleFire($context->id, $tr['name'], $tr['delta'], $tr['reason']);
            }
            $repo->getPDO()->commit();
        } catch (Exception $e) {
            $repo->getPDO()->rollBack();
            throw $e;
        }

        return ['status' => $status, 'score' => $totalScore, 'rules_fired' => count($triggeredRules)];
    }
}

// ==========================================
// 4. Main Application Controller
// ==========================================
class FraudOperationsConsole {
    private FraudRepository $repo;
    private FraudScoringEngine $engine;

    public function __construct() {
        $this->repo = new FraudRepository();
        
        // Wire up Rules Engine
        $this->engine = new FraudScoringEngine();
        $this->engine->addRule(new HighValueRule());
        $this->engine->addRule(new AccountAgeRule());
        $this->engine->addRule(new VelocityRule($this->repo)); // Inject repo dependency
    }

    public function launchWorkspace(): void {
        while (true) {
            $registry = $this->repo->getTransactionRegistry();
            
            // Calculate active manual review volume
            $reviewCount = count(array_filter($registry, fn($t) => $t['status'] === 'REVIEW'));

            CliUI::header("Risk & Fraud Operations Center", "Pending Manual Reviews: " . $reviewCount);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Simulate Incoming Transactions (Run Rule Engine)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " View Global Transaction Integrity Ledger\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Audit Security Explanation Trail (Why was it flagged?)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect security workspace\n\n";

            switch (CliUI::prompt("Select Security Vector")) {
                case '1': $this->simulateTransactions(); break;
                case '2': $this->viewLedger(); break;
                case '3': $this->auditTransactionFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Fraud telemetry monitoring unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    continue 2;
            }
        }
    }

    private function simulateTransactions(): void {
        CliUI::header("Simulate Transaction Streams");

        // Scenarios
        $scenarios = [
            ['user_id' => 1, 'amount' => 45.00,  'ip' => '192.168.1.10', 'desc' => 'Normal user, small purchase'],
            ['user_id' => 1, 'amount' => 1200.0, 'ip' => '192.168.1.10', 'desc' => 'Normal user, high value'],
            ['user_id' => 2, 'amount' => 850.00, 'ip' => '10.0.0.50',    'desc' => 'New user, medium value'],
            ['user_id' => 3, 'amount' => 6000.0, 'ip' => '45.22.19.1',   'desc' => 'Zero-day user, massive value'],
            ['user_id' => 3, 'amount' => 10.00,  'ip' => '45.22.19.1',   'desc' => 'Zero-day user, velocity card-testing simulation']
        ];

        foreach ($scenarios as $idx => $s) {
            $user = $this->repo->getUser($s['user_id']);
            $txId = $this->repo->insertTransaction($s['user_id'], $s['amount'], $s['ip']);
            
            $context = new TransactionContext($txId, $user, $s['amount'], $s['ip']);
            $result = $this->engine->process($context, $this->repo);

            $color = match($result['status']) {
                'APPROVED' => CliUI::GREEN,
                'REVIEW' => CliUI::YELLOW,
                'BLOCKED' => CliUI::RED,
                default => CliUI::RESET
            };

            CliUI::stepLog("TX [{$txId}] | User: {$user['email']} | $" . number_format($s['amount'], 2));
            echo "  └─ Score: " . CliUI::BOLD . str_pad((string)$result['score'], 3, "0", STR_PAD_LEFT) . CliUI::RESET . " | Status: {$color}{$result['status']}" . CliUI::RESET . " | Rules Fired: {$result['rules_fired']}\n";
            
            usleep(200000); // 200ms pause for visual effect
        }
        
        CliUI::pause();
    }

    private function viewLedger(): void {
        CliUI::header("Global Transaction Registry");
        $ledger = $this->repo->getTransactionRegistry();

        $tableData = [];
        foreach ($ledger as $tx) {
            $tableData[] = [
                'id'     => $tx['id'],
                'user'   => $tx['email'],
                'amount' => "$" . number_format($tx['amount'], 2),
                'ip'     => $tx['ip_address'],
                'score'  => $tx['risk_score'],
                'status' => CliUI::statusBadge($tx['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'TX ID', 'user' => 'Customer Email', 'amount' => 'Value', 'ip' => 'IP Address', 'score' => 'Risk Score', 'status' => 'Outcome'
        ]);

        CliUI::pause();
    }

    private function auditTransactionFlow(): void {
        CliUI::header("Fraud Analysis & Explanation Trace");
        
        $txId = (int)CliUI::prompt("Enter Transaction ID to analyze rule execution");
        $logs = $this->repo->getAuditTrail($txId);

        if (empty($logs)) {
            CliUI::error("No rule triggers found for this transaction. (Score remained 0 or TX does not exist).");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "EXPLAINABLE AI/RULE AUDIT FOR TX #{$txId}:" . CliUI::RESET . "\n";
        
        $totalSum = 0;
        foreach ($logs as $log) {
            $delta = (int)$log['risk_delta'];
            $totalSum += $delta;
            $color = $delta > 0 ? CliUI::RED : CliUI::GREEN;
            $sign = $delta > 0 ? "+" : "";

            echo "  ├─ [" . $log['logged_at'] . "] Rule: " . CliUI::BOLD . $log['rule_name'] . CliUI::RESET . "\n";
            echo "  │  Delta Impact : " . $color . $sign . $delta . " pts" . CliUI::RESET . "\n";
            echo "  │  Trigger Rsn  : " . CliUI::DIM . $log['reason'] . CliUI::RESET . "\n";
        }
        echo "  └─ Final Accumulated Impact: " . CliUI::BOLD . $totalSum . " pts\n";

        CliUI::pause();
    }
}

// ==========================================
// 5. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Security Compliance Guard: Fraud operations engines require standard console CLI environments.");
}

try {
    $app = new FraudOperationsConsole();
    $app->launchWorkspace();
} catch (Exception $e) {
    echo "\n\e[31m\e[1mFatal Application Kernel Crash: \e[0m" . $e->getMessage() . "\n";
    exit(1);
}
