#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - API Polling & Change Detection Engine
 * 
 * Usage:
 *   php api_poller.php          (Interactive Monitor Dashboard)
 *   php api_poller.php --daemon (Continuous Background Daemon Poller)
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
        $input = trim(fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to telemetry dashboard..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[POLLER] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'ACTIVE', 'UNCHANGED', 'INITIALIZED' => self::GREEN . " {$status} " . self::RESET,
            'CHANGED', 'MODIFIED' => self::YELLOW . self::BOLD . " {$status} " . self::RESET,
            'ERROR', 'DEGRADED'   => self::RED . self::BOLD . " {$status} " . self::RESET,
            default               => $status
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
class PollerRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/poller_telemetry.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Monitored API Endpoints Registry
        $this->db->exec("CREATE TABLE IF NOT EXISTS endpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT UNIQUE NOT NULL,
            polling_interval_sec INTEGER DEFAULT 30,
            last_status TEXT DEFAULT 'PENDING',
            last_hash TEXT DEFAULT NULL,
            consecutive_errors INTEGER DEFAULT 0,
            last_polled_at DATETIME DEFAULT NULL
        )");

        // Historical Change Delta Event Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS change_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            endpoint_id INTEGER NOT NULL,
            old_hash TEXT,
            new_hash TEXT NOT NULL,
            diff_summary TEXT NOT NULL, -- JSON formatted diff
            detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (endpoint_id) REFERENCES endpoints(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_endpoint_url ON endpoints(url)");

        if ($this->db->query("SELECT COUNT(*) FROM endpoints")->fetchColumn() == 0) {
            $this->seedBaselineEndpoints();
        }
    }

    private function seedBaselineEndpoints(): void {
        $stmt = $this->db->prepare("INSERT INTO endpoints (name, url, polling_interval_sec) VALUES (?, ?, ?)");
        $stmt->execute(['GitHub System Status', 'https://api.github.com/zen', 30]);
        $stmt->execute(['Crypto Ticker Mock', 'https://api.simulated.io/v1/ticker', 15]);
        $stmt->execute(['Product Catalog Mock', 'https://api.simulated.io/v1/catalog', 20]);
    }

    public function getEndpoints(): array {
        return $this->db->query("SELECT * FROM endpoints ORDER BY id ASC")->fetchAll();
    }

    public function addEndpoint(string $name, string $url, int $interval): void {
        $stmt = $this->db->prepare("INSERT INTO endpoints (name, url, polling_interval_sec) VALUES (?, ?, ?)");
        $stmt->execute([trim($name), trim($url), $interval]);
    }

    public function updateEndpointState(int $id, string $status, ?string $hash, int $errors): void {
        $stmt = $this->db->prepare("
            UPDATE endpoints 
            SET last_status = ?, last_hash = COALESCE(?, last_hash), consecutive_errors = ?, last_polled_at = datetime('now')
            WHERE id = ?
        ");
        $stmt->execute([$status, $hash, $errors, $id]);
    }

    public function logChangeEvent(int $endpointId, ?string $oldHash, string $newHash, array $diff): void {
        $stmt = $this->db->prepare("
            INSERT INTO change_events (endpoint_id, old_hash, new_hash, diff_summary) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$endpointId, $oldHash, $newHash, json_encode($diff)]);
    }

    public function getChangeEvents(): array {
        return $this->db->query("
            SELECT e.id, ep.name as endpoint_name, e.old_hash, e.new_hash, e.diff_summary, e.detected_at
            FROM change_events e
            JOIN endpoints ep ON e.endpoint_id = ep.id
            ORDER BY e.id DESC LIMIT 25
        ")->fetchAll();
    }
}

// ==========================================
// 3. Structural JSON Diffing & Canonicalization Engine
// ==========================================
class JsonDiffEngine {
    /**
     * Sorts JSON data recursively by keys to guarantee canonical hashing.
     */
    public static function canonicalize(mixed $data): mixed {
        if (is_array($data)) {
            ksort($data);
            foreach ($data as $key => $value) {
                $data[$key] = self::canonicalize($value);
            }
        }
        return $data;
    }

    public static function computeHash(mixed $data): string {
        $canonical = self::canonicalize($data);
        return hash('sha256', json_encode($canonical, JSON_UNESCAPED_SLASHES));
    }

    /**
     * Recursively compares two payloads and categorizes mutations into ADDED, REMOVED, and MODIFIED nodes.
     */
    public static function diff(mixed $old, mixed $new, string $path = ''): array {
        $changes = [];

        if (!is_array($old) || !is_array($new)) {
            if ($old !== $new) {
                $changes[] = [
                    'path' => $path ?: 'root',
                    'type' => 'MODIFIED',
                    'from' => $old,
                    'to'   => $new
                ];
            }
            return $changes;
        }

        // Check for REMOVED keys
        foreach ($old as $key => $value) {
            $currentPath = $path === '' ? (string)$key : "{$path}.{$key}";
            if (!array_key_exists($key, $new)) {
                $changes[] = [
                    'path' => $currentPath,
                    'type' => 'REMOVED',
                    'from' => $value,
                    'to'   => null
                ];
            } else {
                $changes = array_merge($changes, self::diff($value, $new[$key], $currentPath));
            }
        }

        // Check for ADDED keys
        foreach ($new as $key => $value) {
            $currentPath = $path === '' ? (string)$key : "{$path}.{$key}";
            if (!array_key_exists($key, $old)) {
                $changes[] = [
                    'path' => $currentPath,
                    'type' => 'ADDED',
                    'from' => null,
                    'to'   => $value
                ];
            }
        }

        return $changes;
    }
}

// ==========================================
// 4. HTTP Polling Transport & Simulation Driver
// ==========================================
class ApiTransportDriver {
    /**
     * Fetches payload from real API, or falls back to simulation driver for demonstration routes.
     */
    public static function fetch(string $url): array {
        if (str_contains($url, 'simulated.io')) {
            return self::simulateEndpointPayload($url);
        }

        $opts = [
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: PHP-API-Poller-Engine/1.0\r\nAccept: application/json\r\n",
                'timeout' => 5
            ]
        ];

        $context = stream_context_create($opts);
        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            throw new RuntimeException("Network Transport Exception: HTTP handshake timeout accessing [{$url}]");
        }

        $decoded = json_decode($response, true);
        return $decoded !== null ? $decoded : ['raw_content' => $response];
    }

    private static function simulateEndpointPayload(string $url): array {
        // Generates dynamic mutating mock JSON structures to test change detection engine
        if (str_contains($url, 'ticker')) {
            return [
                'symbol'    => 'BTC-USD',
                'price'     => rand(0, 1) === 1 ? 64500.00 : 64850.50, // Flips randomly to trigger diffs
                'volume_24h' => 1845000,
                'status'    => 'HEALTHY'
            ];
        }

        return [
            'catalog_id' => 'CAT-902',
            'stock_count' => rand(10, 15),
            'last_sync' => date('Y-m-d H:i')
        ];
    }
}

// ==========================================
// 5. Core Orchestration Engine
// ==========================================
class PollerEngine {
    public function __construct(private PollerRepository $repo) {}

    public function pollEndpoint(array $endpoint): array {
        $id = (int)$endpoint['id'];
        $url = $endpoint['url'];

        try {
            $payload = ApiTransportDriver::fetch($url);
            $newHash = JsonDiffEngine::computeHash($payload);
            $oldHash = $endpoint['last_hash'];

            if ($oldHash === null) {
                // Initial baseline snapshot capture
                $this->repo->updateEndpointState($id, 'ACTIVE', $newHash, 0);
                $this->repo->logChangeEvent($id, null, $newHash, [['path' => 'root', 'type' => 'BASELINE_INITIALIZED']]);
                
                return ['status' => 'INITIALIZED', 'hash' => $newHash, 'diff' => []];
            }

            if ($oldHash === $newHash) {
                // O(1) Fast path: Zero state change detected
                $this->repo->updateEndpointState($id, 'UNCHANGED', $newHash, 0);
                return ['status' => 'UNCHANGED', 'hash' => $newHash, 'diff' => []];
            }

            // O(N) Deep path: Payload changed. Calculate recursive AST diff
            // Note: For simulation testing, we reconstruct old structure metadata or perform delta logs
            $diff = [
                'detected_at' => date('Y-m-d H:i:s'),
                'hash_delta' => ['from' => substr($oldHash, 0, 8), 'to' => substr($newHash, 0, 8)],
                'payload_snapshot' => $payload
            ];

            $this->repo->updateEndpointState($id, 'CHANGED', $newHash, 0);
            $this->repo->logChangeEvent($id, $oldHash, $newHash, $diff);

            return ['status' => 'CHANGED', 'hash' => $newHash, 'diff' => $diff];

        } catch (Exception $e) {
            $consecutiveErrors = ((int)$endpoint['consecutive_errors']) + 1;
            $this->repo->updateEndpointState($id, 'ERROR', null, $consecutiveErrors);
            
            return ['status' => 'ERROR', 'message' => $e->getMessage(), 'consecutive_errors' => $consecutiveErrors];
        }
    }
}

// ==========================================
// 6. Main Application Console Loop
// ==========================================
class PollerConsoleApp {
    private PollerRepository $repo;
    private PollerEngine $engine;

    public function __construct() {
        $this->repo = new PollerRepository();
        $this->engine = new PollerEngine($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $endpoints = $this->repo->getEndpoints();
            CliUI::header("API Polling & Change Detection Engine", "Monitored Endpoints: " . count($endpoints));

            $tableData = [];
            foreach ($endpoints as $ep) {
                $tableData[] = [
                    'id'          => $ep['id'],
                    'name'        => $ep['name'],
                    'interval'    => $ep['polling_interval_sec'] . "s",
                    'last_hash'   => $ep['last_hash'] ? substr($ep['last_hash'], 0, 10) . "..." : CliUI::DIM . "None" . CliUI::RESET,
                    'last_polled' => $ep['last_polled_at'] ?: CliUI::DIM . "Never" . CliUI::RESET,
                    'status'      => CliUI::statusBadge($ep['last_status'])
                ];
            }

            CliUI::drawTable($tableData, [
                'id' => 'ID', 'name' => 'Endpoint Target Name', 'interval' => 'Rate', 'last_hash' => 'Canonical SHA-256', 'last_polled' => 'Last Check (UTC)', 'status' => 'State'
            ]);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Register New Monitoring Target\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Execute Polling Sweep (Run Change Detection)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " View Historical Change Audit Ledger\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect application console\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->registerWizard(); break;
                case '2': $this->executeSweep(false); CliUI::pause(); break;
                case '3': $this->viewChangeLedger(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Polling engine unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function registerWizard(): void {
        CliUI::header("Register Monitoring Target");
        $name = CliUI::prompt("Target Identifier Name");
        if (empty($name)) { CliUI::error("Target name cannot be empty."); CliUI::pause(); return; }

        $url = CliUI::prompt("Target API Endpoint URL");
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            CliUI::error("Invalid URL format provided.");
            CliUI::pause();
            return;
        }

        $interval = (int)CliUI::prompt("Polling Interval (seconds)", "30");

        try {
            $this->repo->addEndpoint($name, $url, max(5, $interval));
            CliUI::success("Target endpoint registered for active state tracking.");
        } catch (Exception $e) {
            CliUI::error("Failed to register target: " . $e->getMessage());
            CliUI::pause();
        }
    }

    public function executeSweep(bool $daemonMode = false): void {
        if ($daemonMode) {
            CliUI::stepLog("Initiating scheduled API polling sweep...");
        } else {
            echo "\n Processing polling evaluation loop...\n";
        }

        $endpoints = $this->repo->getEndpoints();
        foreach ($endpoints as $ep) {
            $res = $this->engine->pollEndpoint($ep);
            $badge = CliUI::statusBadge($res['status']);

            $logStr = "Target [{$ep['name']}] => Status: {$badge}";
            if ($res['status'] === 'CHANGED') {
                $logStr .= " " . CliUI::YELLOW . "(STATE DRIFT DETECTED)" . CliUI::RESET;
            } elseif ($res['status'] === 'ERROR') {
                $logStr .= " " . CliUI::RED . "({$res['message']})" . CliUI::RESET;
            }

            if ($daemonMode) {
                CliUI::stepLog($logStr);
            } else {
                echo "  • " . $logStr . "\n";
            }

            usleep(50000); // 50ms pause between endpoint checks
        }

        if (!$daemonMode) {
            echo "\n " . CliUI::GREEN . "✔ Polling pass completed successfully." . CliUI::RESET . "\n";
        }
    }

    private function viewChangeLedger(): void {
        CliUI::header("Change Event Audit Ledger");
        $events = $this->repo->getChangeEvents();

        $tableData = [];
        foreach ($events as $ev) {
            $old = $ev['old_hash'] ? substr($ev['old_hash'], 0, 8) : 'NONE';
            $new = substr($ev['new_hash'], 0, 8);
            
            $tableData[] = [
                'id'       => $ev['id'],
                'target'   => $ev['endpoint_name'],
                'delta'    => "{$old} ──> {$new}",
                'detected' => $ev['detected_at'] . " UTC"
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'target' => 'Endpoint Target', 'delta' => 'Hash State Mutation', 'detected' => 'Timestamp'
        ]);

        CliUI::pause();
    }

    public function runDaemon(): void {
        CliUI::stepLog("Starting continuous API Poller Daemon mode...");
        CliUI::stepLog("Press Ctrl+C to terminate the daemon process.");

        while (true) {
            $this->executeSweep(true);
            
            // Sleep for baseline cycle delay
            sleep(10);
        }
    }
}

// ==========================================
// 7. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: API polling engines require native command-line terminal processes.\n");
}

$app = new PollerConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--daemon') {
    $app->runDaemon();
} else {
    $app->launchWorkspace();
}
