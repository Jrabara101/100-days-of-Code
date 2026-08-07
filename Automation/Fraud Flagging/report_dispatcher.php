#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Multi-Channel Automated Report Dispatcher
 * 
 * Usage:
 *   php report_dispatcher.php          (Interactive Operations Control Panel)
 *   php report_dispatcher.php --cron   (Headless Background Cron Dispatcher)
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
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[DISPATCH-WORKER] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'DELIVERED', 'SENT'  => self::GREEN . self::BOLD . "  {$status}  " . self::RESET,
            'PENDING', 'SKIPPED' => self::YELLOW . "  {$status}  " . self::RESET,
            'FAILED', 'ERROR'    => self::RED . self::BOLD . "  {$status}  " . self::RESET,
            default              => $status
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
// 2. Data Persistence Layer (SQLite Isolation)
// ==========================================
class ReportRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/reports_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Source Metrics Table (Simulated Business Operational Data)
        $this->db->exec("CREATE TABLE IF NOT EXISTS daily_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_date DATE UNIQUE NOT NULL,
            total_orders INTEGER NOT NULL,
            gross_revenue REAL NOT NULL,
            active_users INTEGER NOT NULL,
            system_errors INTEGER NOT NULL
        )");

        // Idempotent Dispatch Audit Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS report_dispatches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dispatch_key TEXT UNIQUE NOT NULL, -- Hash(report_type + date + channel)
            report_type TEXT NOT NULL,
            channel TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING', -- DELIVERED, FAILED
            payload_summary TEXT,
            dispatched_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_dispatch_key ON report_dispatches(dispatch_key)");

        // Seed initial metrics if empty
        if ($this->db->query("SELECT COUNT(*) FROM daily_metrics")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        $stmt = $this->db->prepare("
            INSERT INTO daily_metrics (metric_date, total_orders, gross_revenue, active_users, system_errors) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));

        $stmt->execute([$yesterday, 142, 18450.00, 1205, 3]);
        $stmt->execute([$today, 189, 24120.50, 1480, 0]);
    }

    public function getMetricsForDate(string $date): ?array {
        $stmt = $this->db->prepare("SELECT * FROM daily_metrics WHERE metric_date = ?");
        $stmt->execute([$date]);
        return $stmt->fetch() ?: null;
    }

    public function isDispatched(string $dispatchKey): bool {
        $stmt = $this->db->prepare("SELECT 1 FROM report_dispatches WHERE dispatch_key = ? AND status = 'DELIVERED'");
        $stmt->execute([$dispatchKey]);
        return (bool)$stmt->fetchColumn();
    }

    public function logDispatch(string $dispatchKey, string $reportType, string $channel, string $status, string $summary): void {
        $stmt = $this->db->prepare("
            INSERT INTO report_dispatches (dispatch_key, report_type, channel, status, payload_summary)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(dispatch_key) DO UPDATE SET 
                status = excluded.status, 
                payload_summary = excluded.payload_summary,
                dispatched_at = CURRENT_TIMESTAMP
        ");
        $stmt->execute([$dispatchKey, $reportType, $channel, $status, $summary]);
    }

    public function getDispatchLogs(): array {
        return $this->db->query("SELECT * FROM report_dispatches ORDER BY id DESC LIMIT 30")->fetchAll();
    }
}

// ==========================================
// 3. Domain Model DTOs & Aggregator
// ==========================================
class ReportSnapshot {
    public function __construct(
        public string $reportDate,
        public int $totalOrders,
        public float $grossRevenue,
        public int $activeUsers,
        public int $systemErrors
    ) {}

    public function getAverageOrderValue(): float {
        return $this->totalOrders > 0 ? $this->grossRevenue / $this->totalOrders : 0.0;
    }
}

class ReportDataAggregator {
    public static function compile(array $row): ReportSnapshot {
        return new ReportSnapshot(
            (string)$row['metric_date'],
            (int)$row['total_orders'],
            (float)$row['gross_revenue'],
            (int)$row['active_users'],
            (int)$row['system_errors']
        );
    }
}

// ==========================================
// 4. Strategy Pattern Channel Architecture
// ==========================================
interface ReportChannelInterface {
    public function getName(): string;
    public function send(ReportSnapshot $snapshot): bool;
}

class SlackChannelProvider implements ReportChannelInterface {
    public function getName(): string { return 'SLACK'; }

    public function send(ReportSnapshot $snapshot): bool {
        // Format Payload into Slack Block Kit Structure
        $blocks = [
            "text" => "📊 Daily Operations Executive Report - " . $snapshot->reportDate,
            "blocks" => [
                [
                    "type" => "header",
                    "text" => ["type" => "plain_text", "text" => "📊 Daily Performance Report (" . $snapshot->reportDate . ")"]
                ],
                [
                    "type" => "section",
                    "fields" => [
                        ["type" => "mrkdwn", "text" => "*Gross Revenue:*\n$" . number_format($snapshot->grossRevenue, 2)],
                        ["type" => "mrkdwn", "text" => "*Total Orders:*\n" . number_format($snapshot->totalOrders)],
                        ["type" => "mrkdwn", "text" => "*Avg Order Value:*\n$" . number_format($snapshot->getAverageOrderValue(), 2)],
                        ["type" => "mrkdwn", "text" => "*Active Users:*\n" . number_format($snapshot->activeUsers)]
                    ]
                ]
            ]
        ];

        // Simulate HTTP POST to Slack Webhook URL (usleep simulates network latency)
        usleep(120000); // 120ms network delay
        
        // In live production: curl_exec to webhook endpoint
        return true;
    }
}

class EmailChannelProvider implements ReportChannelInterface {
    public function getName(): string { return 'EMAIL'; }

    public function send(ReportSnapshot $snapshot): bool {
        // Format Payload into HTML MIME Body
        $htmlBody = "
            <html>
            <body style='font-family: sans-serif;'>
                <h2>Daily Performance Report - {$snapshot->reportDate}</h2>
                <table border='1' cellpadding='8' cellspacing='0'>
                    <tr><td><strong>Gross Revenue</strong></td><td>$" . number_format($snapshot->grossRevenue, 2) . "</td></tr>
                    <tr><td><strong>Total Orders</strong></td><td>" . number_format($snapshot->totalOrders) . "</td></tr>
                    <tr><td><strong>Average Order Value</strong></td><td>$" . number_format($snapshot->getAverageOrderValue(), 2) . "</td></tr>
                    <tr><td><strong>Active Users</strong></td><td>" . number_format($snapshot->activeUsers) . "</td></tr>
                    <tr><td><strong>System Health</strong></td><td>" . ($snapshot->systemErrors === 0 ? "ALL SYSTEMS OPERATIONAL" : "{$snapshot->systemErrors} ERRORS DETECTED") . "</td></tr>
                </table>
            </body>
            </html>
        ";

        // Simulate SMTP Relay Dispatch
        usleep(180000); // 180ms SMTP handshake delay
        
        return true;
    }
}

// ==========================================
// 5. Dispatcher Engine Orchestrator
// ==========================================
class ReportDispatcherEngine {
    private array $channels = [];

    public function __construct(private ReportRepository $repo) {}

    public function registerChannel(ReportChannelInterface $channel): void {
        $this->channels[] = $channel;
    }

    public function dispatchDailyReport(string $date, bool $forceRetry = false): array {
        $metricsRow = $this->repo->getMetricsForDate($date);
        if (!$metricsRow) {
            return ['status' => 'ERROR', 'message' => "No operational metrics found for date: {$date}"];
        }

        $snapshot = ReportDataAggregator::compile($metricsRow);
        $results = [];

        foreach ($this->channels as $channel) {
            $channelName = $channel->getName();
            $dispatchKey = hash('sha256', "DAILY_EXEC_{$date}_{$channelName}");

            // Idempotency Check: Avoid double-posting if previously delivered today
            if (!$forceRetry && $this->repo->isDispatched($dispatchKey)) {
                $results[$channelName] = 'SKIPPED_ALREADY_DELIVERED';
                continue;
            }

            try {
                $success = $channel->send($snapshot);
                if ($success) {
                    $summary = "Revenue: $" . number_format($snapshot->grossRevenue, 2) . " | Orders: {$snapshot->totalOrders}";
                    $this->repo->logDispatch($dispatchKey, 'DAILY_EXEC', $channelName, 'DELIVERED', $summary);
                    $results[$channelName] = 'DELIVERED';
                } else {
                    $this->repo->logDispatch($dispatchKey, 'DAILY_EXEC', $channelName, 'FAILED', 'Transport layer error');
                    $results[$channelName] = 'FAILED';
                }
            } catch (Exception $e) {
                $this->repo->logDispatch($dispatchKey, 'DAILY_EXEC', $channelName, 'FAILED', $e->getMessage());
                $results[$channelName] = 'ERROR: ' . $e->getMessage();
            }
        }

        return ['status' => 'SUCCESS', 'channels' => $results];
    }
}

// ==========================================
// 6. Main Application Console Loop
// ==========================================
class ReportConsoleApp {
    private ReportRepository $repo;
    private ReportDispatcherEngine $engine;

    public function __construct() {
        $this->repo = new ReportRepository();
        
        $this->engine = new ReportDispatcherEngine($this->repo);
        $this->engine->registerChannel(new SlackChannelProvider());
        $this->engine->registerChannel(new EmailChannelProvider());
    }

    public function launchWorkspace(): void {
        while (true) {
            $today = date('Y-m-d');
            $metrics = $this->repo->getMetricsForDate($today);

            CliUI::header("Automated Report Dispatcher Gateway", "Target Execution Date: " . $today);

            if ($metrics) {
                echo "  " . CliUI::BOLD . "TODAY'S AGGREGATED METRICS SNAPSHOT:" . CliUI::RESET . "\n";
                echo "  • Gross Revenue : " . CliUI::GREEN . "$" . number_format((float)$metrics['gross_revenue'], 2) . CliUI::RESET . "\n";
                echo "  • Total Orders  : " . CliUI::CYAN . number_format((int)$metrics['total_orders']) . CliUI::RESET . "\n";
                echo "  • Active Users  : " . CliUI::CYAN . number_format((int)$metrics['active_users']) . CliUI::RESET . "\n";
                echo "  • Health Status : " . ((int)$metrics['system_errors'] === 0 ? CliUI::GREEN . "HEALTHY (0 Errors)" . CliUI::RESET : CliUI::RED . "DEGRADED (" . $metrics['system_errors'] . " Errors)" . CliUI::RESET) . "\n\n";
            }

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Execute Daily Dispatches (Slack & Email)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Force Re-dispatch (Bypass Idempotency Filter)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " View Dispatch Audit Ledger\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect Console\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->triggerDispatch(false); CliUI::pause(); break;
                case '2': $this->triggerDispatch(true); CliUI::pause(); break;
                case '3': $this->viewDispatchLogs(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Reporting engine unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    public function triggerDispatch(bool $force = false, bool $headless = false): void {
        $today = date('Y-m-d');
        
        if ($headless) {
            CliUI::stepLog("Initiating automated report dispatches for date {$today}...");
        } else {
            echo "\n Processing report dispatches...\n";
        }

        $res = $this->engine->dispatchDailyReport($today, $force);

        if ($res['status'] === 'ERROR') {
            if ($headless) {
                CliUI::stepLog(CliUI::RED . "Dispatch Failure: " . $res['message'] . CliUI::RESET);
            } else {
                CliUI::error($res['message']);
            }
            return;
        }

        foreach ($res['channels'] as $channel => $outcome) {
            $badge = CliUI::statusBadge($outcome);
            $msg = "Channel [{$channel}] => Status: {$badge}";
            if ($headless) {
                CliUI::stepLog($msg);
            } else {
                echo "  • " . $msg . "\n";
            }
        }

        if (!$headless) {
            echo "\n " . CliUI::GREEN . "✔ Dispatch execution finished." . CliUI::RESET . "\n";
        }
    }

    private function viewDispatchLogs(): void {
        CliUI::header("Dispatch Audit Ledger");
        $logs = $this->repo->getDispatchLogs();

        $tableData = [];
        foreach ($logs as $l) {
            $tableData[] = [
                'id'         => $l['id'],
                'key_short'  => substr($l['dispatch_key'], 0, 10) . "...",
                'report'     => $l['report_type'],
                'channel'    => $l['channel'],
                'status'     => CliUI::statusBadge($l['status']),
                'time'       => $l['dispatched_at']
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'key_short' => 'Idempotency Key', 'report' => 'Report Type', 'channel' => 'Channel', 'status' => 'Status', 'time' => 'Dispatched At (UTC)'
        ]);

        CliUI::pause();
    }
}

// ==========================================
// 7. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Error: Reporting dispatch engines require standard console CLI environments.\n");
}

$app = new ReportConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--cron') {
    $app->triggerDispatch(false, true);
} else {
    $app->launchWorkspace();
}
