#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Resilient Webhook-Driven Order Processor Daemon
 * Usage: php order_processor.php [port]
 * Default Port: 8081
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Presentation & TUI Layout Engine
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
    public static function success(string $msg): void { echo self::timestamp() . self::GREEN . "[ORDER] " . self::RESET . $msg . "\n"; }
    public static function warning(string $msg): void { echo self::timestamp() . self::YELLOW . "[WARN] " . self::RESET . $msg . "\n"; }
    public static function error(string $msg): void { echo self::timestamp() . self::RED . "[ERROR] " . self::RESET . $msg . "\n"; }
}

// ==========================================
// 2. Data Persistence Layer (SQLite Isolation)
// ==========================================
class OrderRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/orders_gateway.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Warehouse stock ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS inventory (
            sku TEXT PRIMARY KEY,
            stock_count INTEGER NOT NULL
        )");

        // Order Records Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            customer_email TEXT NOT NULL,
            sku TEXT NOT NULL,
            amount_paid REAL NOT NULL,
            status TEXT DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Idempotency Audit Ledger to block duplicate webhook event processing
        $this->db->exec("CREATE TABLE IF NOT EXISTS processed_webhook_events (
            event_id TEXT PRIMARY KEY,
            processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Pre-seed baseline warehouse inventory if clean
        if ($this->db->query("SELECT COUNT(*) FROM inventory")->fetchColumn() == 0) {
            $stmt = $this->db->prepare("INSERT INTO inventory (sku, stock_count) VALUES (?, ?)");
            $stmt->execute(['SKU-PRO-DESK', 15]); // 15 premium desks in stock
        }
    }

    /**
     * Idempotency Gate Check: Atomically records the incoming event ID.
     * Returns false if the unique event ID already exists in the database.
     */
    public function claimEventIdempotently(string $eventId): bool {
        try {
            $stmt = $this->db->prepare("INSERT INTO processed_webhook_events (event_id) VALUES (?)");
            $stmt->execute([$eventId]);
            return true;
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                return false; // Already processed!
            }
            throw $e;
        }
    }

    /**
     * Skillful Business Transaction Block: Encapsulates safety loops.
     * Checks inventory allocation and creates the order using an atomic lock.
     */
    public function processOrderAtomically(array $orderData): bool|string {
        $this->db->beginTransaction();
        try {
            // 1. Evaluate stock bounds with explicit row scanning intent
            $stockStmt = $this->db->prepare("SELECT stock_count FROM inventory WHERE sku = ?");
            $stockStmt->execute([$orderData['sku']]);
            $currentStock = $stockStmt->fetchColumn();

            if ($currentStock === false) {
                $this->db->rollBack();
                return "Target SKU is completely missing from current logistics catalogs.";
            }

            if ((int)$currentStock <= 0) {
                $this->db->rollBack();
                return "Stock out condition: Deficit detected on SKU target.";
            }

            // 2. Deduct inventory volume safely inside the active transaction
            $deductStmt = $this->db->prepare("UPDATE inventory SET stock_count = stock_count - 1 WHERE sku = ?");
            $deductStmt->execute([$orderData['sku']]);

            // 3. Persist the validated, structured order row data
            $orderStmt = $this->db->prepare("
                INSERT INTO orders (id, customer_email, sku, amount_paid, status) 
                VALUES (?, ?, ?, ?, 'PROCESSING')
            ");
            $orderStmt->execute([
                $orderData['order_id'],
                $orderData['email'],
                $orderData['sku'],
                $orderData['amount']
            ]);

            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            return "Database failure code exception: " . $e->getMessage();
        }
    }
}

// ==========================================
// 3. Core Webhook HTTP Server Daemon
// ==========================================
class WebhookOrderProcessorDaemon {
    private OrderRepository $repo;
    private int $port;
    private const WEBHOOK_SECRET = 'whsec_secure_production_token_hash_2026';
    private const MAX_BUFFER_LIMIT = 1048576; // 1MB maximum payload memory allocation guard

    public function __construct(int $port = 8081) {
        $this->repo = new OrderRepository();
        $this->port = $port;
    }

    public function listen(): void {
        $dsn = "tcp://0.0.0.0:{$this->port}";
        $server = stream_socket_server($dsn, $errno, $errstr);

        if (!$server) {
            CliUI::error("Could not instantiate socket listener on port {$this->port}: {$errstr} ({$errno})");
            exit(1);
        }

        CliUI::header("Webhook Order Ingestion Pipeline", "Listening Endpoint: POST http://localhost:{$this->port}/webhooks/order");
        CliUI::info("Transactional validation engine live inside localized application layers.");
        CliUI::info("Monitoring inbound webhooks securely... (Press Ctrl+C to kill)");
        echo str_repeat("─", 75) . "\n";

        while (true) {
            $client = @stream_socket_accept($server, -1);
            if (!$client) continue;

            $this->handleIncomingRequest($client);
        }

        fclose($server);
    }

    private function handleIncomingRequest($client): void {
        $headersStr = '';
        $contentLength = 0;
        $incomingSignature = '';

        // Step 1: Read HTTP Request Header Block line by line
        while (($line = fgets($client)) !== false) {
            if (trim($line) === '') {
                break; // Boundary reached
            }
            $headersStr .= $line;

            if (stripos($line, 'Content-Length:') === 0) {
                $contentLength = (int)trim(substr($line, 15));
            }
            if (stripos($line, 'X-Webhook-Signature:') === 0) {
                $incomingSignature = trim(substr($line, 20));
            }
        }

        // Defensive Buffer Check: Halt large payloads instantly
        if ($contentLength > self::MAX_BUFFER_LIMIT) {
            CliUI::warning("Rejected un-allocated stream size payload: ({$contentLength} bytes)");
            $this->respond($client, 413, "Payload Too Large");
            fclose($client);
            return;
        }

        // Step 2: Extract explicit raw content body lines based on Content-Length mapping
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

        // Step 3: Cryptographic Signature Verification (Security Perimeter Check)
        $computedSignature = hash_hmac('sha256', $rawPayload, self::WEBHOOK_SECRET);
        if (!hash_equals($computedSignature, $incomingSignature)) {
            CliUI::error("Security Alert: Invalid cryptographic payload signature verification dropped.");
            $this->respond($client, 401, "Unauthorized: Signature Mismatch");
            fclose($client);
            return;
        }

        // Step 4: Asynchronous Acknowledgment Pattern
        // Immediately decouple the upstream platform by pushing a 202 Accepted status before processing business calculations
        $this->respond($client, 202, "Accepted");
        fclose($client); 

        // Step 5: Downstream Processing Logic Pipeline
        $data = json_decode($rawPayload, true);
        if (json_last_error() !== JSON_ERROR_NONE || empty($data)) {
            CliUI::error("Malformed syntax content payload: Rejecting parser loop handles.");
            return;
        }

        $eventId = $data['event_id'] ?? null;
        if (!$eventId || !$this->repo->claimEventIdempotently($eventId)) {
            CliUI::warning("Idempotency Guard: Webhook event [{$eventId}] already processed. Skipping duplicate.");
            return;
        }

        // Step 6: Atomic Order Commitment Execution
        $result = $this->repo->processOrderAtomically($data['payload'] ?? []);

        if ($result === true) {
            CliUI::success("Successfully provisioned Order #{$data['payload']['order_id']} | Buyer: {$data['payload']['email']} | Stock Synchronized.");
        } else {
            CliUI::error("Pipeline Transaction Blocked: {$result}");
        }

        // Reclaim RAM references within active runtime loops
        gc_collect_cycles();
    }

    private function respond($client, int $statusCode, string $statusText): void {
        $body = json_encode(['status' => strtolower($statusText), 'code' => $statusCode]);
        $frame = "HTTP/1.1 {$statusCode} {$statusText}\r\n" .
                 "Content-Type: application/json\r\n" .
                 "Content-Length: " . strlen($body) . "\r\n" .
                 "Connection: close\r\n\r\n" .
                 $body;
        @fwrite($client, $frame);
    }
}

// ==========================================
// 4. Runtime System Bootstrapper Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Automated calculation architectures require native shell execution runtime pipelines.");
}

$port = isset($argv[1]) && is_numeric($argv[1]) ? (int)$argv[1] : 8081;

try {
    $daemon = new WebhookOrderProcessorDaemon($port);
    $daemon->listen();
} catch (Exception $e) {
    echo "\n\e[31m\e[1mFatal Network Ingestion Fault: \e[0m" . $e->getMessage() . "\n";
    exit(1);
}
