#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Standalone Webhook HTTP Receiver & Logger Daemon
 *
 * Usage: php webhook_logger.php [port]
 * Default Port: 8080
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Layout & TUI Render Component
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const DIM = "\e[2m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";
    const BLUE = "\e[34m";

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

    private static function timestamp(): string {
        return self::DIM . "[" . date('Y-m-d H:i:s') . "] " . self::RESET;
    }

    public static function info(string $msg): void { echo self::timestamp() . self::CYAN . "[INFO] " . self::RESET . $msg . "\n"; }
    public static function success(string $msg): void { echo self::timestamp() . self::GREEN . "[RCVD] " . self::RESET . $msg . "\n"; }
    public static function warning(string $msg): void { echo self::timestamp() . self::YELLOW . "[WARN] " . self::RESET . $msg . "\n"; }
    public static function error(string $msg): void { echo self::timestamp() . self::RED . "[FAIL] " . self::RESET . $msg . "\n"; }
}

// ==========================================
// 2. Data Persistence & Audit Storage Layer
// ==========================================
class WebhookRepository {
    private PDO $db;
    private string $archiveDir;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/webhooks_audit.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        $this->archiveDir = __DIR__ . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'webhooks';
        if (!is_dir($this->archiveDir)) {
            mkdir($this->archiveDir, 0755, true);
        }

        $this->initSchema();
    }

    private function initSchema(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS webhook_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_ip TEXT NOT NULL,
            user_agent TEXT,
            payload_size INTEGER NOT NULL,
            file_archive_path TEXT NOT NULL,
            received_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
    }

    public function logIncoming(string $ip, ?string $userAgent, string $rawPayload): void {
        $payloadSize = strlen($rawPayload);
        
        // Generate a unique token hash identifier for safe local filesystem chunk storage
        $token = hash('sha256', microtime(true) . uniqid('', true));
        $fileName = "payload_" . date('Y_m_d_His') . "_" . substr($token, 0, 10) . ".json";
        $absolutePath = $this->archiveDir . DIRECTORY_SEPARATOR . $fileName;

        // Persist the un-truncated raw body cleanly to separate raw storage files
        file_put_contents($absolutePath, $rawPayload);

        // Index metadata metrics into our query engine table
        $stmt = $this->db->prepare("INSERT INTO webhook_logs (sender_ip, user_agent, payload_size, file_archive_path) VALUES (?, ?, ?, ?)");
        $stmt->execute([$ip, $userAgent ?? 'Unknown', $payloadSize, $absolutePath]);
    }
}

// ==========================================
// 3. Core Daemon HTTP Socket Listener Engine
// ==========================================
class WebhookReceiverDaemon {
    private WebhookRepository $repo;
    private int $port;
    private const MAX_PAYLOAD_BYTES = 2097152; // Enforce explicit 2MB buffer protection limits

    public function __construct(int $port = 8080) {
        $this->repo = new WebhookRepository();
        $this->port = $port;
    }

    public function start(): void {
        // Construct standard stream sockets binding patterns
        $dsn = "tcp://0.0.0.0:{$this->port}";
        $server = stream_socket_server($dsn, $errno, $errstr);

        if (!$server) {
            CliUI::error("Could not bind socket interface infrastructure on port {$this->port}: {$errstr} ({$errno})");
            exit(1);
        }

        CliUI::header("Asymmetric Webhook Ingestion Daemon", "Listening Address: HTTP://localhost:{$this->port}");
        CliUI::info("Micro-daemon server successfully spawned inside memory space loop constraints.");
        CliUI::info("Awaiting outbound communication signals from external webhooks... (Ctrl+C to kill)");
        echo str_repeat("─", 75) . "\n";

        while (true) {
            // Infinite listening loop blocking thread wait point until connection maps hit the port bounds
            $client = @stream_socket_accept($server, -1);
            if (!$client) continue;

            $this->handleClientConnection($client);
        }

        fclose($server);
    }

    private function handleClientConnection($client): void {
        $peerName = stream_socket_get_name($client, true);
        $senderIp = parse_url("tcp://" . $peerName, PHP_URL_HOST) ?? 'Unknown';

        $rawHeaders = '';
        $contentLength = 0;
        $userAgent = null;

        // Step 1: Read HTTP request string headers line-by-line sequentially
        while (($line = fgets($client)) !== false) {
            if (trim($line) === '') {
                break; // Header block chunk stream closed
            }
            $rawHeaders .= $line;

            if (stripos($line, 'Content-Length:') === 0) {
                $contentLength = (int)trim(substr($line, 15));
            }
            if (stripos($line, 'User-Agent:') === 0) {
                $userAgent = trim(substr($line, 11));
            }
        }

        // Defensive Core Rule: Intercept DoS volumetric payloads immediately
        if ($contentLength > self::MAX_PAYLOAD_BYTES) {
            CliUI::warning("Rejected out-of-bounds stream payload size metric from connection node: {$senderIp} ({$contentLength} bytes)");
            $this->respond($client, 413, "Payload Too Large");
            fclose($client);
            return;
        }

        // Step 2: Extract explicit raw content body payload lines based on declared length sizes
        $rawPayload = '';
        if ($contentLength > 0) {
            $bytesRead = 0;
            while ($bytesRead < $contentLength) {
                $chunk = fread($client, min(8192, $contentLength - $bytesRead));
                if ($chunk === false || $chunk === '') {
                    break;
                }
                $rawPayload .= $chunk;
                $bytesRead += strlen($chunk);
            }
        }

        // Step 3: Asynchronous Acknowledgment Pattern
        // Immediately reply with an HTTP 202 status back to the external vendor network connection pipeline
        $this->respond($client, 202, "Accepted");
        fclose($client); // Break client network line bounds instantly before performing filesystem modifications

        // Step 4: Downstream Data Ingestion Processing
        if (!empty($rawPayload)) {
            try {
                // Persist files and update tracking structures safely out-of-band
                $this->repo->logIncoming($senderIp, $userAgent, $rawPayload);
                
                // Attempt inline JSON pretty-printing for enhanced terminal log scannability
                $decoded = json_decode($rawPayload, true);
                $summary = (json_last_error() === JSON_ERROR_NONE && !empty($decoded)) 
                    ? json_encode($decoded, JSON_UNESCAPED_SLASHES) 
                    : $rawPayload;

                if (strlen($summary) > 45) {
                    $summary = substr($summary, 0, 42) . "...";
                }

                CliUI::success("Origin: " . CliUI::BOLD . str_pad($senderIp, 15) . CliUI::RESET . " | Bytes: " . str_pad((string)$contentLength, 5) . " | Content: " . CliUI::DIM . $summary);
            } catch (Exception $e) {
                CliUI::error("Failed parsing pipeline storage steps from sender {$senderIp}: " . $e->getMessage());
            }
        } else {
            CliUI::warning("Received zero-length null payload event tracking sequence line from connection location: {$senderIp}");
        }

        // Prevent process garbage leak accumulations recursively inside persistent daemon loop cycles
        gc_collect_cycles();
    }

    private function respond($client, int $statusCode, string $statusText): void {
        $responseBody = json_encode(['status' => strtolower($statusText), 'code' => $statusCode]);
        $httpFrame = "HTTP/1.1 {$statusCode} {$statusText}\r\n" .
                     "Content-Type: application/json\r\n" .
                     "Content-Length: " . strlen($responseBody) . "\r\n" .
                     "Connection: close\r\n\r\n" .
                     $responseBody;
        @fwrite($client, $httpFrame);
    }
}

// ==========================================
// 4. Runtime Validation Entry Point
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Error: Daemon background HTTP listener loops must run exclusively within terminal system shell contexts.");
}

$port = isset($argv[1]) && is_numeric($argv[1]) ? (int)$argv[1] : 8080;

try {
    $daemon = new WebhookReceiverDaemon($port);
    $daemon->start();
} catch (Exception $e) {
    echo "\n\e[31m\e[1mFatal Network Daemon Exception: \e[0m" . $e->getMessage() . "\n";
    exit(1);
}
