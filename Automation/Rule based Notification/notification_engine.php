#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Rule-Based Notification & Alert Dispatch Engine
 * 
 * Usage:
 *   php notification_engine.php           (Interactive Control Panel)
 *   php notification_engine.php --cron    (Headless Batch Queue Dispatcher)
 *   php notification_engine.php --daemon  (Continuous Event Consumer Daemon)
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
        echo self::CYAN . self::BOLD;
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
        $input = trim((string)fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to control workspace..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[NOTIFY-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'SENT', 'DELIVERED'       => self::GREEN . self::BOLD . "   SENT    " . self::RESET,
            'QUEUED', 'PENDING'       => self::BLUE . "  QUEUED   " . self::RESET,
            'PROCESSING'              => self::YELLOW . " PROCESSING" . self::RESET,
            'SUPPRESSED', 'THROTTLED' => self::YELLOW . self::BOLD . " SUPPRESSED " . self::RESET,
            'FAILED', 'ERROR'         => self::RED . self::BOLD . "  FAILED   " . self::RESET,
            default                   => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No records match current visibility metrics.\n" . self::RESET;
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
class NotificationRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/notifications_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Users Table & Channel Endpoints
        $this->db->exec("CREATE TABLE IF NOT EXISTS recipients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            slack_channel TEXT NOT NULL,
            quiet_hours_start INTEGER DEFAULT 22, -- 22:00 UTC
            quiet_hours_end INTEGER DEFAULT 7     -- 07:00 UTC
        )");

        // Notification Rules Registry
        $this->db->exec("CREATE TABLE IF NOT EXISTS rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            event_type TEXT NOT NULL,
            conditions_json TEXT NOT NULL, -- Predicates AST
            channels_json TEXT NOT NULL,   -- Target channels ['SLACK', 'EMAIL', 'SMS', 'WEBHOOK']
            recipient_id INTEGER NOT NULL,
            cooldown_seconds INTEGER DEFAULT 300,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (recipient_id) REFERENCES recipients(id)
        )");

        // Ingested Events Stream
        $this->db->exec("CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_uuid TEXT UNIQUE NOT NULL,
            event_type TEXT NOT NULL,
            severity TEXT NOT NULL, -- INFO, WARNING, CRITICAL
            payload_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Notification Queue & Dispatch Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS notification_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            rule_id INTEGER NOT NULL,
            recipient_id INTEGER NOT NULL,
            channel TEXT NOT NULL,
            status TEXT DEFAULT 'QUEUED', -- QUEUED, SENT, SUPPRESSED, FAILED
            payload_summary TEXT NOT NULL,
            error_reason TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            dispatched_at DATETIME DEFAULT NULL,
            FOREIGN KEY (event_id) REFERENCES events(id),
            FOREIGN KEY (rule_id) REFERENCES rules(id),
            FOREIGN KEY (recipient_id) REFERENCES recipients(id)
        )");

        // Cryptographic Audit Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS notification_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            queue_id INTEGER NOT NULL,
            rule_code TEXT NOT NULL,
            action_taken TEXT NOT NULL,
            signature_hash TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (queue_id) REFERENCES notification_queue(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_queue_status ON notification_queue(status)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_rule_cooldown ON notification_queue(rule_id, recipient_id, dispatched_at)");

        if ($this->db->query("SELECT COUNT(*) FROM recipients")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        // Seed Recipients
        $rStmt = $this->db->prepare("
            INSERT INTO recipients (name, email, phone, slack_channel, quiet_hours_start, quiet_hours_end) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $rStmt->execute(['Alice Vance (DevOps Lead)', 'a.vance@infra.io', '+1-555-0199', '#ops-critical', 22, 7]);
        $rStmt->execute(['Bob Smith (SecOps Analyst)', 'b.smith@secops.io', '+1-555-0142', '#security-alerts', 23, 6]);

        // Seed Notification Rules
        $ruleStmt = $this->db->prepare("
            INSERT INTO rules (rule_code, name, event_type, conditions_json, channels_json, recipient_id, cooldown_seconds) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        // Rule 1: High CPU / Infrastructure Failure Alert
        $ruleStmt->execute([
            'RULE-SYS-01',
            'High CPU Exhaustion Alert',
            'SYSTEM_METRIC',
            json_encode([
                ['field' => 'metric_name', 'operator' => 'EQUALS', 'value' => 'cpu_usage'],
                ['field' => 'value', 'operator' => 'GREATER_THAN', 'value' => 85]
            ]),
            json_encode(['SLACK', 'EMAIL']),
            1,
            120 // 2-minute cooldown
        ]);

        // Rule 2: Critical Auth Failure Spike (Bypasses DND)
        $ruleStmt->execute([
            'RULE-SEC-02',
            'Brute Force Auth Attack Spike',
            'SECURITY_INCIDENT',
            json_encode([
                ['field' => 'failed_attempts', 'operator' => 'GREATER_THAN', 'value' => 10],
                ['field' => 'geo_risk', 'operator' => 'EQUALS', 'value' => 'HIGH']
            ]),
            json_encode(['SLACK', 'SMS', 'EMAIL']),
            2,
            60 // 1-minute cooldown
        ]);

        // Rule 3: Payment Discrepancy Alert
        $ruleStmt->execute([
            'RULE-FIN-03',
            'High-Value Transfer Flag',
            'PAYMENT_TRANSFER',
            json_encode([
                ['field' => 'amount', 'operator' => 'GREATER_THAN', 'value' => 50000]
            ]),
            json_encode(['EMAIL', 'SLACK']),
            1,
            300 // 5-minute cooldown
        ]);
    }

    public function getRecipients(): array {
        return $this->db->query("SELECT * FROM recipients ORDER BY id ASC")->fetchAll();
    }

    public function getRules(): array {
        return $this->db->query("
            SELECT r.*, rc.name as recipient_name 
            FROM rules r
            JOIN recipients rc ON r.recipient_id = rc.id
            ORDER BY r.id ASC
        ")->fetchAll();
    }

    public function ingestEvent(string $eventType, string $severity, array $payload): int {
        $uuid = "EVT-" . strtoupper(bin2hex(random_bytes(6)));
        $stmt = $this->db->prepare("
            INSERT INTO events (event_uuid, event_type, severity, payload_json) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$uuid, $eventType, $severity, json_encode($payload)]);
        return (int)$this->db->lastInsertId();
    }

    public function getEventById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM events WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function getMatchingRules(string $eventType): array {
        $stmt = $this->db->prepare("
            SELECT r.*, rc.name as recipient_name, rc.email, rc.phone, rc.slack_channel,
                   rc.quiet_hours_start, rc.quiet_hours_end
            FROM rules r
            JOIN recipients rc ON r.recipient_id = rc.id
            WHERE r.event_type = ? AND r.is_active = 1
        ");
        $stmt->execute([$eventType]);
        return $stmt->fetchAll();
    }

    public function getLastDispatchedTime(int $ruleId, int $recipientId): ?string {
        $stmt = $this->db->prepare("
            SELECT dispatched_at 
            FROM notification_queue 
            WHERE rule_id = ? AND recipient_id = ? AND status = 'SENT'
            ORDER BY id DESC LIMIT 1
        ");
        $stmt->execute([$ruleId, $recipientId]);
        return $stmt->fetchColumn() ?: null;
    }

    public function queueNotification(int $eventId, int $ruleId, int $recipientId, string $channel, string $status, string $summary, ?string $error = null): int {
        $stmt = $this->db->prepare("
            INSERT INTO notification_queue (event_id, rule_id, recipient_id, channel, status, payload_summary, error_reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$eventId, $ruleId, $recipientId, $channel, $status, $summary, $error]);
        return (int)$this->db->lastInsertId();
    }

    public function getPendingQueue(): array {
        return $this->db->query("
            SELECT q.*, r.rule_code, r.name as rule_name, rc.name as recipient_name,
                   rc.email, rc.phone, rc.slack_channel, e.severity, e.event_type, e.payload_json
            FROM notification_queue q
            JOIN rules r ON q.rule_id = r.id
            JOIN recipients rc ON q.recipient_id = rc.id
            JOIN events e ON q.event_id = e.id
            WHERE q.status = 'QUEUED'
            ORDER BY q.id ASC
        ")->fetchAll();
    }

    public function markQueueDispatched(int $queueId, string $status, ?string $error = null): void {
        $stmt = $this->db->prepare("
            UPDATE notification_queue 
            SET status = ?, error_reason = ?, dispatched_at = CASE WHEN ? = 'SENT' THEN datetime('now') ELSE dispatched_at END
            WHERE id = ?
        ");
        $stmt->execute([$status, $error, $status, $queueId]);
    }

    public function logAudit(int $queueId, string $ruleCode, string $action, array $payload): void {
        $sigPayload = "{$queueId}|{$ruleCode}|{$action}|" . json_encode($payload) . "|" . microtime();
        $signature = hash('sha256', $sigPayload);

        $stmt = $this->db->prepare("
            INSERT INTO notification_audit_logs (queue_id, rule_code, action_taken, signature_hash)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$queueId, $ruleCode, $action, $signature]);
    }

    public function getQueueRegistry(): array {
        return $this->db->query("
            SELECT q.id, r.rule_code, rc.name as recipient_name, q.channel, 
                   q.status, q.payload_summary, q.created_at, q.dispatched_at
            FROM notification_queue q
            JOIN rules r ON q.rule_id = r.id
            JOIN recipients rc ON q.recipient_id = rc.id
            ORDER BY q.id DESC LIMIT 30
        ")->fetchAll();
    }

    public function getAuditTrail(int $queueId): array {
        $stmt = $this->db->prepare("SELECT * FROM notification_audit_logs WHERE queue_id = ? ORDER BY id ASC");
        $stmt->execute([$queueId]);
        return $stmt->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Predicate Evaluation Engine
// ==========================================
class PredicateEvaluator {
    /**
     * Evaluates whether an event payload matches all rule conditions.
     */
    public static function evaluate(array $payload, array $conditions): bool {
        foreach ($conditions as $cond) {
            $field = $cond['field'];
            $operator = strtoupper($cond['operator']);
            $expected = $cond['value'];

            if (!array_key_exists($field, $payload)) {
                return false;
            }

            $actual = $payload[$field];

            $matched = match ($operator) {
                'EQUALS', '=='             => ($actual == $expected),
                'STRICT_EQUALS', '==='     => ($actual === $expected),
                'NOT_EQUALS', '!='         => ($actual != $expected),
                'GREATER_THAN', '>'        => (is_numeric($actual) && is_numeric($expected) && $actual > $expected),
                'GREATER_EQUAL', '>='      => (is_numeric($actual) && is_numeric($expected) && $actual >= $expected),
                'LESS_THAN', '<'           => (is_numeric($actual) && is_numeric($expected) && $actual < $expected),
                'LESS_EQUAL', '<='         => (is_numeric($actual) && is_numeric($expected) && $actual <= $expected),
                'CONTAINS'                 => (is_string($actual) && str_contains($actual, (string)$expected)),
                'IN'                       => (is_array($expected) && in_array($actual, $expected, true)),
                default                    => false
            };

            if (!$matched) {
                return false;
            }
        }
        return true;
    }
}

// ==========================================
// 4. Channel Strategy Provider Layer
// ==========================================
interface NotificationChannelInterface {
    public function getChannelName(): string;
    public function dispatch(array $queueItem): bool;
}

class SlackChannelProvider implements NotificationChannelInterface {
    public function getChannelName(): string { return 'SLACK'; }

    public function dispatch(array $queueItem): bool {
        usleep(80000); // 80ms network latency simulation
        return true;
    }
}

class EmailChannelProvider implements NotificationChannelInterface {
    public function getChannelName(): string { return 'EMAIL'; }

    public function dispatch(array $queueItem): bool {
        usleep(120000); // 120ms SMTP relay simulation
        return true;
    }
}

class SmsChannelProvider implements NotificationChannelInterface {
    public function getChannelName(): string { return 'SMS'; }

    public function dispatch(array $queueItem): bool {
        usleep(100000); // 100ms SMS carrier gateway simulation
        return true;
    }
}

class WebhookChannelProvider implements NotificationChannelInterface {
    public function getChannelName(): string { return 'WEBHOOK'; }

    public function dispatch(array $queueItem): bool {
        usleep(90000); // 90ms HTTP POST latency simulation
        return true;
    }
}

// ==========================================
// 5. Rule Engine Orchestrator
// ==========================================
class NotificationEngine {
    private array $channelProviders = [];

    public function __construct(private NotificationRepository $repo) {
        $this->registerProvider(new SlackChannelProvider());
        $this->registerProvider(new EmailChannelProvider());
        $this->registerProvider(new SmsChannelProvider());
        $this->registerProvider(new WebhookChannelProvider());
    }

    public function registerProvider(NotificationChannelInterface $provider): void {
        $this->channelProviders[$provider->getChannelName()] = $provider;
    }

    /**
     * Evaluates an ingested event against rules, applying quiet hours and cooldown filters.
     */
    public function evaluateEvent(int $eventId): array {
        $event = $this->repo->getEventById($eventId);
        if (!$event) {
            return ['queued' => 0, 'suppressed' => 0];
        }

        $payload = json_decode($event['payload_json'], true) ?: [];
        $rules = $this->repo->getMatchingRules($event['event_type']);
        $currentUtcHour = (int)date('G'); // 0-23 UTC

        $queuedCount = 0;
        $suppressedCount = 0;

        foreach ($rules as $rule) {
            $conditions = json_decode($rule['conditions_json'], true) ?: [];
            
            // 1. Predicate Match Check
            if (!PredicateEvaluator::evaluate($payload, $conditions)) {
                continue;
            }

            $recipientId = (int)$rule['recipient_id'];
            $channels = json_decode($rule['channels_json'], true) ?: ['EMAIL'];
            $cooldownSec = (int)$rule['cooldown_seconds'];

            // 2. Cooldown Throttling Check
            $lastDispatched = $this->repo->getLastDispatchedTime((int)$rule['id'], $recipientId);
            $isCooldownThrottled = false;

            if ($lastDispatched !== null) {
                $elapsed = time() - strtotime($lastDispatched);
                if ($elapsed < $cooldownSec) {
                    $isCooldownThrottled = true;
                }
            }

            // 3. Quiet Hours Check (Bypassed if severity is CRITICAL)
            $isQuietHour = false;
            if ($event['severity'] !== 'CRITICAL') {
                $qStart = (int)$rule['quiet_hours_start'];
                $qEnd = (int)$rule['quiet_hours_end'];
                
                if ($qStart > $qEnd) { // Crosses midnight (e.g. 22 to 7)
                    $isQuietHour = ($currentUtcHour >= $qStart || $currentUtcHour < $qEnd);
                } else {
                    $isQuietHour = ($currentUtcHour >= $qStart && $currentUtcHour < $qEnd);
                }
            }

            foreach ($channels as $channel) {
                $summary = "[{$event['severity']}] {$rule['name']} ──► {$rule['recipient_name']} via {$channel}";
                
                if ($isCooldownThrottled) {
                    $qId = $this->repo->queueNotification($eventId, (int)$rule['id'], $recipientId, $channel, 'SUPPRESSED', $summary, "Throttled by rule cooldown ({$cooldownSec}s window).");
                    $this->repo->logAudit($qId, $rule['rule_code'], 'THROTTLED_COOLDOWN', $payload);
                    $suppressedCount++;
                } elseif ($isQuietHour && $channel !== 'SLACK') {
                    $qId = $this->repo->queueNotification($eventId, (int)$rule['id'], $recipientId, $channel, 'SUPPRESSED', $summary, "Suppressed by quiet hours ({$rule['quiet_hours_start']}:00-{$rule['quiet_hours_end']}:00 UTC).");
                    $this->repo->logAudit($qId, $rule['rule_code'], 'SUPPRESSED_QUIET_HOURS', $payload);
                    $suppressedCount++;
                } else {
                    $qId = $this->repo->queueNotification($eventId, (int)$rule['id'], $recipientId, $channel, 'QUEUED', $summary);
                    $this->repo->logAudit($qId, $rule['rule_code'], 'ENQUEUED', $payload);
                    $queuedCount++;
                }
            }
        }

        return ['queued' => $queuedCount, 'suppressed' => $suppressedCount];
    }

    /**
     * Dispatches pending items in the notification queue.
     */
    public function dispatchQueue(bool $headless = false): int {
        $pending = $this->repo->getPendingQueue();
        if (empty($pending)) {
            return 0;
        }

        $dispatched = 0;
        foreach ($pending as $item) {
            $channel = $item['channel'];
            $provider = $this->channelProviders[$channel] ?? null;

            if (!$provider) {
                $this->repo->markQueueDispatched((int)$item['id'], 'FAILED', "No provider registered for channel [{$channel}].");
                continue;
            }

            try {
                $success = $provider->dispatch($item);
                if ($success) {
                    $this->repo->markQueueDispatched((int)$item['id'], 'SENT');
                    $this->repo->logAudit((int)$item['id'], $item['rule_code'], 'DISPATCH_SUCCESS', ['channel' => $channel]);
                    $dispatched++;

                    $msg = "Alert [{$item['rule_code']}] dispatched via {$channel} to {$item['recipient_name']}.";
                    if ($headless) {
                        CliUI::stepLog($msg);
                    } else {
                        echo "  " . CliUI::GREEN . "✔" . CliUI::RESET . " " . $msg . "\n";
                    }
                }
            } catch (Exception $e) {
                $this->repo->markQueueDispatched((int)$item['id'], 'FAILED', $e->getMessage());
                $this->repo->logAudit((int)$item['id'], $item['rule_code'], 'DISPATCH_FAILED', ['error' => $e->getMessage()]);
            }
        }

        return $dispatched;
    }
}

// ==========================================
// 6. Main Application Console Loop
// ==========================================
class NotificationConsoleApp {
    private NotificationRepository $repo;
    private NotificationEngine $engine;

    public function __construct() {
        $this->repo = new NotificationRepository();
        $this->engine = new NotificationEngine($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $rules = $this->repo->getRules();
            $pending = $this->repo->getPendingQueue();

            CliUI::header("Rule-Based Notification Engine", "Active Rules: " . count($rules) . " | Queued Alerts: " . count($pending));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Ingest Simulated Event (Evaluate Rules & Enqueue)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Dispatch Notification Queue (Process Outbound Channels)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " View Active Notification Rules Matrix\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Inspect Notification Queue & Suppression Registry\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Audit Compliance Trail & SHA-256 Signatures\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect notification engine\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->simulateEventWizard(); break;
                case '2': $this->dispatchQueueWizard(); break;
                case '3': $this->viewRulesMatrix(); break;
                case '4': $this->viewQueueRegistry(); break;
                case '5': $this->auditTrailFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Notification engine unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function simulateEventWizard(): void {
        CliUI::header("Ingest Simulated Event");

        echo " Select Event Scenario:\n";
        echo "  [1] High CPU Spike Alert (metric_name: cpu_usage, value: 92.5) -> SYSTEM_METRIC\n";
        echo "  [2] Critical Brute Force Incident (failed_attempts: 25, geo_risk: HIGH) -> SECURITY_INCIDENT\n";
        echo "  [3] High-Value Wire Transfer (amount: 125000) -> PAYMENT_TRANSFER\n";
        echo "  [4] Low CPU Normal Metric (metric_name: cpu_usage, value: 45.0) -> No rule trigger\n\n";

        $choice = CliUI::prompt("Select Scenario (1-4)", "1");

        $eventData = match ($choice) {
            '1' => [
                'type' => 'SYSTEM_METRIC',
                'severity' => 'WARNING',
                'payload' => ['metric_name' => 'cpu_usage', 'value' => 92.5, 'host' => 'srv-prod-db-01']
            ],
            '2' => [
                'type' => 'SECURITY_INCIDENT',
                'severity' => 'CRITICAL',
                'payload' => ['failed_attempts' => 25, 'geo_risk' => 'HIGH', 'target_ip' => '192.168.1.10']
            ],
            '3' => [
                'type' => 'PAYMENT_TRANSFER',
                'severity' => 'WARNING',
                'payload' => ['amount' => 125000, 'currency' => 'USD', 'account_id' => 'ACC-99201']
            ],
            default => [
                'type' => 'SYSTEM_METRIC',
                'severity' => 'INFO',
                'payload' => ['metric_name' => 'cpu_usage', 'value' => 45.0, 'host' => 'srv-prod-web-02']
            ]
        };

        $eventId = $this->repo->ingestEvent($eventData['type'], $eventData['severity'], $eventData['payload']);
        $eval = $this->engine->evaluateEvent($eventId);

        CliUI::success("Event #{$eventId} [{$eventData['type']}] ingested! Enqueued: {$eval['queued']}, Suppressed/Throttled: {$eval['suppressed']}.");
        CliUI::pause();
    }

    private function dispatchQueueWizard(): void {
        CliUI::header("Dispatch Outbound Notification Queue");
        echo " Processing outbound channels...\n\n";

        $sent = $this->engine->dispatchQueue(false);

        if ($sent > 0) {
            echo "\n " . CliUI::GREEN . "✔ Dispatched {$sent} notifications successfully." . CliUI::RESET . "\n";
        } else {
            CliUI::info("No pending notifications in queue to dispatch.");
        }

        CliUI::pause();
    }

    private function viewRulesMatrix(): void {
        CliUI::header("Active Notification Rules Matrix");
        $rules = $this->repo->getRules();

        $tableData = [];
        foreach ($rules as $r) {
            $channels = json_decode($r['channels_json'], true) ?: [];
            $tableData[] = [
                'code'      => $r['rule_code'],
                'name'      => $r['name'],
                'event'     => $r['event_type'],
                'channels'  => implode(', ', $channels),
                'recipient' => $r['recipient_name'],
                'cooldown'  => $r['cooldown_seconds'] . "s"
            ];
        }

        CliUI::drawTable($tableData, [
            'code' => 'Rule Code', 'name' => 'Rule Name', 'event' => 'Target Event', 'channels' => 'Channels', 'recipient' => 'Assigned Recipient', 'cooldown' => 'Cooldown'
        ]);

        CliUI::pause();
    }

    private function viewQueueRegistry(): void {
        CliUI::header("Notification Queue & Suppression Registry");
        $registry = $this->repo->getQueueRegistry();

        $tableData = [];
        foreach ($registry as $q) {
            $tableData[] = [
                'id'        => $q['id'],
                'rule'      => $q['rule_code'],
                'recipient' => $q['recipient_name'],
                'channel'   => $q['channel'],
                'status'    => CliUI::statusBadge($q['status']),
                'summary'   => strlen($q['payload_summary']) > 32 ? substr($q['payload_summary'], 0, 29) . "..." : $q['payload_summary'],
                'time'      => $q['created_at']
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'rule' => 'Rule', 'recipient' => 'Recipient', 'channel' => 'Channel', 'status' => 'Status', 'summary' => 'Summary', 'time' => 'Timestamp'
        ]);

        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Compliance Audit Trail Extraction");
        $queueId = (int)CliUI::prompt("Enter Notification Queue ID to extract audit trail");

        $logs = $this->repo->getAuditTrail($queueId);
        if (empty($logs)) {
            CliUI::error("No audit logs found for that Queue ID.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL AUDIT TRAIL FOR NOTIFICATION #{$queueId}:" . CliUI::RESET . "\n";
        foreach ($logs as $l) {
            echo "  ├─ [" . $l['timestamp'] . "] Rule: " . CliUI::BOLD . $l['rule_code'] . CliUI::RESET . "\n";
            echo "  │  Action Taken : " . CliUI::CYAN . $l['action_taken'] . CliUI::RESET . "\n";
            echo "  │  SHA-256 Sig  : " . CliUI::YELLOW . substr($l['signature_hash'], 0, 16) . "..." . CliUI::RESET . "\n";
        }
        echo "  └─ End of Sequence Analysis.\n";

        CliUI::pause();
    }

    public function runDaemon(): void {
        CliUI::stepLog("Starting continuous Notification Daemon...");
        CliUI::stepLog("Listening for queued alerts and executing dispatch cycles (Ctrl+C to stop)...");

        while (true) {
            $dispatched = $this->engine->dispatchQueue(true);
            if ($dispatched > 0) {
                CliUI::stepLog("Dispatched {$dispatched} alerts in active cycle.");
            }
            sleep(5); // 5-second polling interval
        }
    }
}

// ==========================================
// 7. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Notification engine requires a standard console CLI environment.\n");
}

$app = new NotificationConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--daemon') {
    $app->runDaemon();
} elseif ($mode === '--cron') {
    $repo = new NotificationRepository();
    $engine = new NotificationEngine($repo);
    $count = $engine->dispatchQueue(true);
    CliUI::stepLog("Cron dispatch completed. Alerts sent: {$count}");
} else {
    $app->launchWorkspace();
}
