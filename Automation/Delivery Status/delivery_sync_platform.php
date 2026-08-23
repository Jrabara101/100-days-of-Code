#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Enterprise Delivery Status Sync & Normalization Platform
 * 
 * Usage:
 *   php delivery_sync_platform.php           (Interactive Operations Workspace)
 *   php delivery_sync_platform.php --sync    (Headless Carrier Polling & Outbox Run)
 *   php delivery_sync_platform.php --daemon  (Continuous Real-Time Sync Daemon)
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
        echo "\n" . self::DIM . "Press Enter to return to main workspace..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[SYNC-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'DELIVERED'        => self::GREEN . self::BOLD . "  DELIVERED  " . self::RESET,
            'OUT_FOR_DELIVERY' => self::MAGENTA . self::BOLD . " OUT_FOR_DEL " . self::RESET,
            'IN_TRANSIT'       => self::BLUE . "  IN_TRANSIT " . self::RESET,
            'PICKED_UP'        => self::CYAN . "  PICKED_UP  " . self::RESET,
            'MANIFEST_CREATED' => self::DIM . "  MANIFESTED " . self::RESET,
            'EXCEPTION'        => self::RED . self::BOLD . "  EXCEPTION  " . self::RESET,
            default            => $status
        };
    }

    public static function renderProgressBar(int $currentRank, int $maxRank = 50, int $width = 10): string {
        $ratio = min(1.0, max(0.0, $currentRank / $maxRank));
        $filled = (int)round($ratio * $width);
        $empty = $width - $filled;
        $pct = round($ratio * 100);

        $color = ($pct >= 100) ? self::GREEN : (($pct >= 60) ? self::BLUE : self::YELLOW);
        return $color . "[" . str_repeat("■", $filled) . str_repeat(" ", $empty) . "] " . str_pad((string)$pct, 3, " ", STR_PAD_LEFT) . "%" . self::RESET;
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
class DeliveryRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/delivery_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Shipments Master Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS shipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_number TEXT UNIQUE NOT NULL,
            carrier TEXT NOT NULL, -- FEDEX, DHL, UPS
            recipient_name TEXT NOT NULL,
            destination_city TEXT NOT NULL,
            canonical_status TEXT DEFAULT 'MANIFEST_CREATED',
            status_weight INTEGER DEFAULT 10,
            estimated_delivery DATETIME NOT NULL,
            last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Tracking Checkpoints Ledger (Atomic & Deduplicated)
        $this->db->exec("CREATE TABLE IF NOT EXISTS tracking_checkpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shipment_id INTEGER NOT NULL,
            carrier_event_id TEXT NOT NULL,
            canonical_status TEXT NOT NULL,
            raw_status TEXT NOT NULL,
            location TEXT NOT NULL,
            event_timestamp DATETIME NOT NULL,
            is_out_of_order INTEGER DEFAULT 0,
            idempotency_hash TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shipment_id) REFERENCES shipments(id)
        )");

        // Outbound Webhook Queue
        $this->db->exec("CREATE TABLE IF NOT EXISTS webhook_outbox (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shipment_id INTEGER NOT NULL,
            target_url TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING', -- PENDING, DELIVERED, FAILED
            attempt_count INTEGER DEFAULT 0,
            next_retry_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shipment_id) REFERENCES shipments(id)
        )");

        // Cryptographic Audit Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS sync_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_number TEXT NOT NULL,
            action_taken TEXT NOT NULL,
            details TEXT NOT NULL,
            signature_hash TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_shipment_status ON shipments(canonical_status)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_checkpoint_lookup ON tracking_checkpoints(shipment_id, event_timestamp)");

        if ((int)$this->db->query("SELECT COUNT(*) FROM shipments")->fetchColumn() === 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        $sStmt = $this->db->prepare("
            INSERT INTO shipments (tracking_number, carrier, recipient_name, destination_city, canonical_status, status_weight, estimated_delivery)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $sStmt->execute(['FDX-9901-US', 'FEDEX', 'Alice Vance', 'Seattle, WA', 'IN_TRANSIT', 30, date('Y-m-d H:i:s', strtotime('+2 days'))]);
        $sStmt->execute(['DHL-8812-EU', 'DHL', 'Marcus Brody', 'Frankfurt, DE', 'OUT_FOR_DELIVERY', 40, date('Y-m-d H:i:s', strtotime('+4 hours'))]);
        $sStmt->execute(['UPS-7734-AP', 'UPS', 'Elena Fisher', 'Tokyo, JP', 'MANIFEST_CREATED', 10, date('Y-m-d H:i:s', strtotime('+5 days'))]);

        // Seed initial checkpoint logs
        $this->recordCheckpoint(1, 'EVT-01', 'PICKED_UP', 'PU', 'Memphis Hub, TN', date('Y-m-d H:i:s', strtotime('-12 hours')), 0);
        $this->recordCheckpoint(1, 'EVT-02', 'IN_TRANSIT', 'IT', 'Seattle Sorting Center, WA', date('Y-m-d H:i:s', strtotime('-2 hours')), 0);
        $this->recordCheckpoint(2, 'EVT-03', 'IN_TRANSIT', 'WC', 'Leipzig Hub, DE', date('Y-m-d H:i:s', strtotime('-8 hours')), 0);
        $this->recordCheckpoint(2, 'EVT-04', 'OUT_FOR_DELIVERY', 'OD', 'Frankfurt Delivery Depot', date('Y-m-d H:i:s', strtotime('-1 hour')), 0);
    }

    public function recordCheckpoint(int $shipmentId, string $carrierEventId, string $canonicalStatus, string $rawStatus, string $location, string $timestamp, int $isOutOfOrder): bool {
        $hash = hash('sha256', "{$shipmentId}|{$carrierEventId}|{$canonicalStatus}|{$timestamp}");

        try {
            $stmt = $this->db->prepare("
                INSERT INTO tracking_checkpoints (shipment_id, carrier_event_id, canonical_status, raw_status, location, event_timestamp, is_out_of_order, idempotency_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$shipmentId, $carrierEventId, $canonicalStatus, $rawStatus, $location, $timestamp, $isOutOfOrder, $hash]);
            return true;
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                return false; // Deduplicated
            }
            throw $e;
        }
    }

    public function updateShipmentState(int $id, string $status, int $weight): void {
        $stmt = $this->db->prepare("
            UPDATE shipments 
            SET canonical_status = ?, status_weight = ?, last_synced_at = datetime('now')
            WHERE id = ?
        ");
        $stmt->execute([$status, $weight, $id]);
    }

    public function enqueueWebhook(int $shipmentId, string $targetUrl, array $payload): void {
        $stmt = $this->db->prepare("
            INSERT INTO webhook_outbox (shipment_id, target_url, payload_json)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$shipmentId, $targetUrl, json_encode($payload)]);
    }

    public function logAudit(string $trackingNumber, string $action, string $details): void {
        $sig = hash('sha256', "{$trackingNumber}|{$action}|{$details}|" . microtime());
        $stmt = $this->db->prepare("
            INSERT INTO sync_audit_logs (tracking_number, action_taken, details, signature_hash)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$trackingNumber, $action, $details, $sig]);
    }

    public function getShipments(): array {
        return $this->db->query("SELECT * FROM shipments ORDER BY id ASC")->fetchAll();
    }

    public function getShipmentByTracking(string $tracking): ?array {
        $stmt = $this->db->prepare("SELECT * FROM shipments WHERE tracking_number = ?");
        $stmt->execute([trim($tracking)]);
        return $stmt->fetch() ?: null;
    }

    public function getCheckpointsForShipment(int $shipmentId): array {
        $stmt = $this->db->prepare("SELECT * FROM tracking_checkpoints WHERE shipment_id = ? ORDER BY event_timestamp ASC");
        $stmt->execute([$shipmentId]);
        return $stmt->fetchAll();
    }

    public function getPendingWebhooks(): array {
        return $this->db->query("
            SELECT * FROM webhook_outbox 
            WHERE status = 'PENDING' AND next_retry_at <= datetime('now') 
            ORDER BY id ASC LIMIT 20
        ")->fetchAll();
    }

    public function markWebhookSent(int $id): void {
        $stmt = $this->db->prepare("UPDATE webhook_outbox SET status = 'DELIVERED' WHERE id = ?");
        $stmt->execute([$id]);
    }

    public function markWebhookFailed(int $id, int $attempt): void {
        $backoffSec = min(3600, 60 * (2 ** $attempt));
        $nextRetry = date('Y-m-d H:i:s', time() + $backoffSec);

        $stmt = $this->db->prepare("
            UPDATE webhook_outbox 
            SET status = CASE WHEN ? >= 5 THEN 'FAILED' ELSE 'PENDING' END,
                attempt_count = ?,
                next_retry_at = ?
            WHERE id = ?
        ");
        $stmt->execute([$attempt, $attempt, $nextRetry, $id]);
    }

    public function getAuditLogs(): array {
        return $this->db->query("SELECT * FROM sync_audit_logs ORDER BY id DESC LIMIT 25")->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Carrier Adapter Strategy Layer
// ==========================================
interface CarrierAdapterInterface {
    public function getCarrierCode(): string;
    public function normalizeEvent(array $rawPayload): array;
}

class FedExAdapter implements CarrierAdapterInterface {
    public function getCarrierCode(): string { return 'FEDEX'; }

    public function normalizeEvent(array $rawPayload): array {
        $rawStatus = strtoupper($rawPayload['status_code'] ?? 'UNKNOWN');
        $canonical = match ($rawStatus) {
            'OC' => 'MANIFEST_CREATED',
            'PU' => 'PICKED_UP',
            'IT', 'AR', 'DP' => 'IN_TRANSIT',
            'OD' => 'OUT_FOR_DELIVERY',
            'DL' => 'DELIVERED',
            'DE', 'SE' => 'EXCEPTION',
            default => 'IN_TRANSIT'
        };

        return [
            'carrier_event_id' => $rawPayload['event_id'] ?? bin2hex(random_bytes(4)),
            'canonical_status' => $canonical,
            'raw_status'       => $rawStatus,
            'location'         => $rawPayload['scan_location'] ?? 'FedEx Facility',
            'timestamp'        => $rawPayload['timestamp'] ?? date('Y-m-d H:i:s')
        ];
    }
}

class DhlAdapter implements CarrierAdapterInterface {
    public function getCarrierCode(): string { return 'DHL'; }

    public function normalizeEvent(array $rawPayload): array {
        $rawStatus = strtoupper($rawPayload['checkpoint_code'] ?? 'UNKNOWN');
        $canonical = match ($rawStatus) {
            'PL' => 'MANIFEST_CREATED',
            'PU' => 'PICKED_UP',
            'DF', 'WC' => 'IN_TRANSIT',
            'OD' => 'OUT_FOR_DELIVERY',
            'OK' => 'DELIVERED',
            'NH', 'CR' => 'EXCEPTION',
            default => 'IN_TRANSIT'
        };

        return [
            'carrier_event_id' => $rawPayload['event_id'] ?? bin2hex(random_bytes(4)),
            'canonical_status' => $canonical,
            'raw_status'       => $rawStatus,
            'location'         => $rawPayload['location_name'] ?? 'DHL Hub',
            'timestamp'        => $rawPayload['timestamp'] ?? date('Y-m-d H:i:s')
        ];
    }
}

class UpsAdapter implements CarrierAdapterInterface {
    public function getCarrierCode(): string { return 'UPS'; }

    public function normalizeEvent(array $rawPayload): array {
        $rawStatus = strtoupper($rawPayload['activity_type'] ?? 'UNKNOWN');
        $canonical = match ($rawStatus) {
            'M' => 'MANIFEST_CREATED',
            'P' => 'PICKED_UP',
            'I' => 'IN_TRANSIT',
            'O' => 'OUT_FOR_DELIVERY',
            'D' => 'DELIVERED',
            'X' => 'EXCEPTION',
            default => 'IN_TRANSIT'
        };

        return [
            'carrier_event_id' => $rawPayload['event_id'] ?? bin2hex(random_bytes(4)),
            'canonical_status' => $canonical,
            'raw_status'       => $rawStatus,
            'location'         => $rawPayload['city'] ?? 'UPS Sorting Center',
            'timestamp'        => $rawPayload['timestamp'] ?? date('Y-m-d H:i:s')
        ];
    }
}

// ==========================================
// 4. Synchronization & Ingestion Orchestrator
// ==========================================
class DeliverySyncEngine {
    private array $adapters = [];
    private const STATE_WEIGHTS = [
        'MANIFEST_CREATED'   => 10,
        'PICKED_UP'          => 20,
        'IN_TRANSIT'         => 30,
        'OUT_FOR_DELIVERY'   => 40,
        'DELIVERY_ATTEMPTED' => 45,
        'DELIVERED'          => 50,
        'EXCEPTION'          => 99
    ];

    public function __construct(private DeliveryRepository $repo) {
        $this->registerAdapter(new FedExAdapter());
        $this->registerAdapter(new DhlAdapter());
        $this->registerAdapter(new UpsAdapter());
    }

    public function registerAdapter(CarrierAdapterInterface $adapter): void {
        $this->adapters[$adapter->getCarrierCode()] = $adapter;
    }

    /**
     * Ingests a raw webhook event, normalizes the payload, and applies the sequence guard.
     */
    public function ingestCarrierEvent(string $carrier, string $trackingNumber, array $rawPayload): array {
        $adapter = $this->adapters[strtoupper($carrier)] ?? null;
        if (!$adapter) {
            return ['success' => false, 'message' => "Unsupported carrier [{$carrier}]."];
        }

        $shipment = $this->repo->getShipmentByTracking($trackingNumber);
        if (!$shipment) {
            return ['success' => false, 'message' => "Shipment [{$trackingNumber}] is not registered in platform."];
        }

        $normalized = $adapter->normalizeEvent($rawPayload);
        $newWeight = self::STATE_WEIGHTS[$normalized['canonical_status']] ?? 30;
        $currentWeight = (int)$shipment['status_weight'];

        // Monotonic Sequence Guard Check
        $isOutOfOrder = 0;
        if ($newWeight < $currentWeight && $normalized['canonical_status'] !== 'EXCEPTION') {
            $isOutOfOrder = 1;
        }

        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            // 1. Record Checkpoint (Idempotent Guard)
            $recorded = $this->repo->recordCheckpoint(
                (int)$shipment['id'],
                $normalized['carrier_event_id'],
                $normalized['canonical_status'],
                $normalized['raw_status'],
                $normalized['location'],
                $normalized['timestamp'],
                $isOutOfOrder
            );

            if (!$recorded) {
                $db->rollBack();
                return ['success' => true, 'deduplicated' => true, 'message' => 'Duplicate webhook ignored via SHA-256 seal.'];
            }

            // 2. Mutate Shipment Status if sequence order is valid
            if ($isOutOfOrder === 0) {
                $this->repo->updateShipmentState((int)$shipment['id'], $normalized['canonical_status'], $newWeight);
                
                // Enqueue Downstream Merchant Notification Webhook
                $this->repo->enqueueWebhook((int)$shipment['id'], 'https://merchant.enterprise.com/webhooks/shipping', [
                    'tracking_number'  => $trackingNumber,
                    'status'           => $normalized['canonical_status'],
                    'location'         => $normalized['location'],
                    'timestamp'        => $normalized['timestamp']
                ]);

                $this->repo->logAudit($trackingNumber, 'STATUS_MUTATED', "State advanced to {$normalized['canonical_status']} via {$carrier} event.");
            } else {
                $this->repo->logAudit($trackingNumber, 'OUT_OF_ORDER_IGNORED', "Checkpoint [{$normalized['canonical_status']}] stored but skipped state advance (Current: {$shipment['canonical_status']}).");
            }

            $db->commit();
            return [
                'success'          => true,
                'deduplicated'     => false,
                'canonical_status' => $normalized['canonical_status'],
                'is_out_of_order'  => (bool)$isOutOfOrder
            ];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Dispatches queued merchant webhooks with retry backoff.
     */
    public function dispatchOutbox(bool $headless = false): int {
        $pending = $this->repo->getPendingWebhooks();
        $dispatched = 0;

        foreach ($pending as $item) {
            usleep(50000); // 50ms HTTP connection simulation
            
            // 95% simulated delivery success rate
            $success = (rand(1, 100) <= 95);

            if ($success) {
                $this->repo->markWebhookSent((int)$item['id']);
                $dispatched++;
                if ($headless) {
                    CliUI::stepLog("Webhook dispatched to {$item['target_url']} for Shipment #{$item['shipment_id']}.");
                }
            } else {
                $attempt = ((int)$item['attempt_count']) + 1;
                $this->repo->markWebhookFailed((int)$item['id'], $attempt);
                if ($headless) {
                    CliUI::stepLog(CliUI::YELLOW . "Webhook attempt {$attempt} failed for Shipment #{$item['shipment_id']}. Enqueued backoff retry." . CliUI::RESET);
                }
            }
        }
        return $dispatched;
    }
}

// ==========================================
// 5. Main Application Console Loop
// ==========================================
class DeliveryConsoleApp {
    private DeliveryRepository $repo;
    private DeliverySyncEngine $engine;

    public function __construct() {
        $this->repo = new DeliveryRepository();
        $this->engine = new DeliverySyncEngine($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $shipments = $this->repo->getShipments();
            CliUI::header("Delivery Status Synchronization Platform", "Active Monitored Trackings: " . count($shipments));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Simulate Carrier Webhook Event (Ingest & Sequence Guard)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Inspect Shipment History & Checkpoint Timeline\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " View Global Shipments Grid & Progress Bar\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Dispatch Downstream Merchant Webhooks Outbox\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Audit Synchronization SHA-256 Ledger\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect Platform\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->simulateWebhookWizard(); break;
                case '2': $this->inspectShipmentWizard(); break;
                case '3': $this->viewShipmentsGrid(); break;
                case '4': $this->dispatchOutboxWizard(); break;
                case '5': $this->auditTrailFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Delivery sync engine unmounted cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function simulateWebhookWizard(): void {
        CliUI::header("Simulate Inbound Carrier Webhook");

        $shipments = $this->repo->getShipments();
        echo " Select Target Shipment:\n";
        foreach ($shipments as $s) {
            echo "  [{$s['id']}] " . CliUI::BOLD . $s['tracking_number'] . CliUI::RESET . " ({$s['carrier']}) ──► " . CliUI::statusBadge($s['canonical_status']) . "\n";
        }
        echo "\n";

        $tracking = CliUI::prompt("Enter Tracking Number", "FDX-9901-US");
        $target = $this->repo->getShipmentByTracking($tracking);
        if (!$target) {
            CliUI::error("Tracking number not found.");
            CliUI::pause();
            return;
        }

        echo "\n Select Carrier Status Event Scenario:\n";
        if ($target['carrier'] === 'FEDEX') {
            echo "  [1] Out for Delivery (OD) -> Canonical: OUT_FOR_DELIVERY\n";
            echo "  [2] Delivered (DL) -> Canonical: DELIVERED\n";
            echo "  [3] Out-of-Order Replay (PU - Picked Up) -> Test Sequence Guard\n";
            echo "  [4] Weather Exception (DE) -> Canonical: EXCEPTION\n";
        } else {
            echo "  [1] Final Delivery (OK / D) -> Canonical: DELIVERED\n";
            echo "  [2] Transit Hub Scan -> Canonical: IN_TRANSIT\n";
        }
        echo "\n";

        $choice = CliUI::prompt("Select Scenario", "1");
        $rawEvent = match ($choice) {
            '1' => ['status_code' => 'OD', 'scan_location' => 'Local Distribution Facility', 'timestamp' => date('Y-m-d H:i:s')],
            '2' => ['status_code' => 'DL', 'scan_location' => 'Front Door / Porch', 'timestamp' => date('Y-m-d H:i:s')],
            '3' => ['status_code' => 'PU', 'scan_location' => 'Original Origin Facility', 'timestamp' => date('Y-m-d H:i:s', strtotime('-1 day'))],
            '4' => ['status_code' => 'DE', 'scan_location' => 'Mountain Pass Sorting Station', 'timestamp' => date('Y-m-d H:i:s')],
            default => ['status_code' => 'IT', 'scan_location' => 'General Hub', 'timestamp' => date('Y-m-d H:i:s')]
        };

        $res = $this->engine->ingestCarrierEvent($target['carrier'], $tracking, $rawEvent);

        if ($res['deduplicated'] ?? false) {
            CliUI::info($res['message']);
        } elseif ($res['success']) {
            if ($res['is_out_of_order']) {
                CliUI::info("Sequence Guard Activated: Out-of-order event [{$res['canonical_status']}] stored in checkpoints but parent status was preserved at {$target['canonical_status']}.");
            } else {
                CliUI::success("Status synchronized! Advanced state to " . CliUI::statusBadge($res['canonical_status']));
            }
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function inspectShipmentWizard(): void {
        CliUI::header("Shipment History & Checkpoint Timeline");
        $tracking = CliUI::prompt("Enter Tracking Number", "FDX-9901-US");

        $shipment = $this->repo->getShipmentByTracking($tracking);
        if (!$shipment) {
            CliUI::error("Shipment not found.");
            CliUI::pause();
            return;
        }

        $checkpoints = $this->repo->getCheckpointsForShipment((int)$shipment['id']);

        echo " " . CliUI::BOLD . "PACKAGE DETAILS:" . CliUI::RESET . "\n";
        echo "  • Tracking Number : " . CliUI::CYAN . $shipment['tracking_number'] . CliUI::RESET . " ({$shipment['carrier']})\n";
        echo "  • Recipient       : {$shipment['recipient_name']} ──► {$shipment['destination_city']}\n";
        echo "  • Current Status  : " . CliUI::statusBadge($shipment['canonical_status']) . "\n";
        echo "  • Estimated Arrival: {$shipment['estimated_delivery']} UTC\n\n";

        echo " " . CliUI::BOLD . "CHRONOLOGICAL CHECKPOINT TIMELINE:" . CliUI::RESET . "\n";
        foreach ($checkpoints as $c) {
            $flag = $c['is_out_of_order'] ? CliUI::RED . " [OUT-OF-ORDER SCAN] " . CliUI::RESET : "";
            echo "  ├─ [" . $c['event_timestamp'] . "] " . CliUI::BOLD . $c['location'] . CliUI::RESET . " ──► " . CliUI::statusBadge($c['canonical_status']) . $flag . "\n";
            echo "  │  Raw Carrier Code: " . CliUI::DIM . $c['raw_status'] . " (Event ID: {$c['carrier_event_id']})" . CliUI::RESET . "\n";
        }
        echo "  └─ End of Tracking Timeline.\n";

        CliUI::pause();
    }

    private function viewShipmentsGrid(): void {
        CliUI::header("Global Shipments Status Grid");
        $shipments = $this->repo->getShipments();

        $tableData = [];
        foreach ($shipments as $s) {
            $tableData[] = [
                'id'        => $s['id'],
                'tracking'  => $s['tracking_number'],
                'carrier'   => $s['carrier'],
                'recipient' => $s['recipient_name'],
                'dest'      => $s['destination_city'],
                'status'    => CliUI::statusBadge($s['canonical_status']),
                'progress'  => CliUI::renderProgressBar((int)$s['status_weight'], 50, 8)
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'tracking' => 'Tracking Number', 'carrier' => 'Carrier', 'recipient' => 'Recipient', 'dest' => 'Destination', 'status' => 'Canonical Status', 'progress' => 'Journey Progress'
        ]);

        CliUI::pause();
    }

    private function dispatchOutboxWizard(): void {
        CliUI::header("Dispatch Downstream Webhooks Outbox");
        $count = $this->engine->dispatchOutbox(false);

        if ($count > 0) {
            CliUI::success("Dispatched {$count} merchant webhooks successfully.");
        } else {
            CliUI::info("Outbox is empty. No pending webhooks to dispatch.");
        }

        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Audit Synchronization Cryptographic Ledger");
        $logs = $this->repo->getAuditLogs();

        $tableData = [];
        foreach ($logs as $l) {
            $tableData[] = [
                'id'        => $l['id'],
                'tracking'  => $l['tracking_number'],
                'action'    => $l['action_taken'],
                'details'   => strlen($l['details']) > 32 ? substr($l['details'], 0, 29) . "..." : $l['details'],
                'sig_short' => substr($l['signature_hash'], 0, 10) . "...",
                'time'      => $l['timestamp']
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'tracking' => 'Tracking Number', 'action' => 'Sync Action', 'details' => 'Event Summary', 'sig_short' => 'SHA-256 Seal', 'time' => 'Timestamp'
        ]);

        CliUI::pause();
    }

    public function runDaemon(): void {
        CliUI::stepLog("Starting continuous Delivery Status Sync Daemon...");
        CliUI::stepLog("Polling carrier gateways and dispatching downstream webhooks (Ctrl+C to stop)...");

        while (true) {
            $dispatched = $this->engine->dispatchOutbox(true);
            if ($dispatched > 0) {
                CliUI::stepLog("Dispatched {$dispatched} merchant callbacks in active sweep.");
            }
            sleep(5);
        }
    }
}

// ==========================================
// 6. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Delivery sync engine requires a standard console CLI environment.\n");
}

$app = new DeliveryConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--daemon') {
    $app->runDaemon();
} elseif ($mode === '--sync') {
    $repo = new DeliveryRepository();
    $engine = new DeliverySyncEngine($repo);
    $sent = $engine->dispatchOutbox(true);
    CliUI::stepLog("Sync run finished. Webhooks dispatched: {$sent}");
} else {
    $app->launchWorkspace();
}
