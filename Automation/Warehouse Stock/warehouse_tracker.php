#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Warehouse Stock Movement Tracker & WMS Engine
 * 
 * Usage:
 *   php warehouse_tracker.php           (Interactive Operations Workspace)
 *   php warehouse_tracker.php --batch   (Headless Batch Movement Simulation)
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
        $input = trim(fgets(STDIN) ?: "");
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main workspace..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[WMS-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function typeBadge(string $type): string {
        return match ($type) {
            'RECEIVING', 'INBOUND' => self::GREEN . self::BOLD . " RECEIVE " . self::RESET,
            'TRANSFER', 'RELOCATE' => self::BLUE . " TRANSFER " . self::RESET,
            'PICKING', 'OUTBOUND'  => self::YELLOW . self::BOLD . " PICKING " . self::RESET,
            'ADJUSTMENT', 'SCRAP'  => self::RED . self::BOLD . " ADJUST  " . self::RESET,
            default                => $type
        };
    }

    public static function renderProgressBar(int $current, int $max, int $width = 12): string {
        $ratio = $max > 0 ? min(1.0, max(0.0, $current / $max)) : 0;
        $filled = (int)round($ratio * $width);
        $empty = $width - $filled;
        $pct = round($ratio * 100);

        $color = ($pct >= 90) ? self::RED : (($pct >= 70) ? self::YELLOW : self::GREEN);
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
// 2. Data Persistence Layer (SQLite Isolation)
// ==========================================
class WarehouseRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/warehouse_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Warehouse Facilities
        $this->db->exec("CREATE TABLE IF NOT EXISTS warehouses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL
        )");

        // Storage Bin Topology
        $this->db->exec("CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            warehouse_id INTEGER NOT NULL,
            bin_code TEXT UNIQUE NOT NULL,
            zone TEXT NOT NULL,
            max_capacity INTEGER NOT NULL,
            is_virtual INTEGER DEFAULT 0, -- 1 for Receiving Docks, Shipping Bays
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        )");

        // Products Master Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            unit_weight_kg REAL NOT NULL
        )");

        // Bin Inventory Balances (Materialized View of Double-Entry Ledger)
        $this->db->exec("CREATE TABLE IF NOT EXISTS bin_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (location_id) REFERENCES locations(id),
            FOREIGN KEY (product_id) REFERENCES products(id),
            UNIQUE(location_id, product_id)
        )");

        // Immutable Double-Entry Stock Movement Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            movement_code TEXT UNIQUE NOT NULL,
            movement_type TEXT NOT NULL, -- INBOUND, TRANSFER, OUTBOUND, ADJUSTMENT
            product_id INTEGER NOT NULL,
            from_location_id INTEGER NOT NULL,
            to_location_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            reference_doc TEXT NOT NULL,
            actor TEXT NOT NULL,
            signature_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (from_location_id) REFERENCES locations(id),
            FOREIGN KEY (to_location_id) REFERENCES locations(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_movements_sku ON stock_movements(product_id, created_at)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_bin_inv ON bin_inventory(location_id, product_id)");

        if ($this->db->query("SELECT COUNT(*) FROM warehouses")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        // 1. Warehouse Facility
        $this->db->exec("INSERT INTO warehouses (code, name) VALUES ('WH-MAIN-01', 'Central Logistics Distribution Hub')");

        // 2. Locations (Virtual Docks & Physical Bins)
        $lStmt = $this->db->prepare("INSERT INTO locations (warehouse_id, bin_code, zone, max_capacity, is_virtual) VALUES (?, ?, ?, ?, ?)");
        $lStmt->execute([1, 'STAGE-INBOUND', 'RECEIVING', 999999, 1]); // Virtual Source
        $lStmt->execute([1, 'STAGE-OUTBOUND', 'SHIPPING', 999999, 1]);  // Virtual Destination
        $lStmt->execute([1, 'ZONE-A-RACK-01-BIN-01', 'ZONE-A', 100, 0]);
        $lStmt->execute([1, 'ZONE-A-RACK-01-BIN-02', 'ZONE-A', 50, 0]);
        $lStmt->execute([1, 'ZONE-B-RACK-02-BIN-01', 'ZONE-B', 80, 0]);
        $lStmt->execute([1, 'OVERFLOW-HOLD-01', 'OVERFLOW', 500, 0]);

        // 3. Products
        $pStmt = $this->db->prepare("INSERT INTO products (sku, name, unit_weight_kg) VALUES (?, ?, ?)");
        $pStmt->execute(['SKU-NV-5090', 'NVIDIA RTX 5090 Enterprise GPU', 2.1]);
        $pStmt->execute(['SKU-ARM-M4', 'Apple Silicon M4 Logic Board', 0.4]);
        $pStmt->execute(['SKU-SFP-100G', '100GbE Optical Transceiver Module', 0.1]);

        // 4. Initial Inbound Balances
        $this->executeMovement('INBOUND', 1, 1, 3, 40, 'PO-2026-INIT-01', 'SYSTEM_SEED');
        $this->executeMovement('INBOUND', 2, 1, 4, 35, 'PO-2026-INIT-02', 'SYSTEM_SEED');
        $this->executeMovement('INBOUND', 3, 1, 5, 75, 'PO-2026-INIT-03', 'SYSTEM_SEED');
    }

    public function executeMovement(string $type, int $productId, int $fromLocId, int $toLocId, int $qty, string $refDoc, string $actor): string {
        $movCode = "MOV-" . date('Ymd') . "-" . rand(10000, 99999);
        $sigPayload = "{$movCode}|{$type}|{$productId}|{$fromLocId}|{$toLocId}|{$qty}|{$refDoc}|" . microtime();
        $signature = hash('sha256', $sigPayload);

        // 1. Insert Movement Record
        $stmt = $this->db->prepare("
            INSERT INTO stock_movements 
            (movement_code, movement_type, product_id, from_location_id, to_location_id, quantity, reference_doc, actor, signature_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$movCode, $type, $productId, $fromLocId, $toLocId, $qty, $refDoc, $actor, $signature]);

        // 2. Adjust Source Bin (Skip if virtual receiving dock)
        $fromLoc = $this->getLocationById($fromLocId);
        if ($fromLoc && !$fromLoc['is_virtual']) {
            $deduct = $this->db->prepare("
                UPDATE bin_inventory 
                SET quantity = quantity - ? 
                WHERE location_id = ? AND product_id = ? AND quantity >= ?
            ");
            $deduct->execute([$qty, $fromLocId, $productId, $qty]);
            if ($deduct->rowCount() === 0) {
                throw new UnderflowException("Atomic Stock Guard: Insufficient inventory in Bin [{$fromLoc['bin_code']}].");
            }
        }

        // 3. Adjust Destination Bin (Skip if virtual shipping bay)
        $toLoc = $this->getLocationById($toLocId);
        if ($toLoc && !$toLoc['is_virtual']) {
            $credit = $this->db->prepare("
                INSERT INTO bin_inventory (location_id, product_id, quantity) 
                VALUES (?, ?, ?)
                ON CONFLICT(location_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity
            ");
            $credit->execute([$toLocId, $productId, $qty]);
        }

        return $movCode;
    }

    public function getProducts(): array {
        return $this->db->query("SELECT * FROM products ORDER BY sku ASC")->fetchAll();
    }

    public function getPhysicalLocations(): array {
        return $this->db->query("
            SELECT l.*, 
                   COALESCE(SUM(bi.quantity), 0) as total_units_stored
            FROM locations l
            LEFT JOIN bin_inventory bi ON l.id = bi.location_id
            WHERE l.is_virtual = 0
            GROUP BY l.id
            ORDER BY l.bin_code ASC
        ")->fetchAll();
    }

    public function getLocationById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM locations WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function getLocationByBinCode(string $code): ?array {
        $stmt = $this->db->prepare("SELECT * FROM locations WHERE bin_code = ?");
        $stmt->execute([trim($code)]);
        return $stmt->fetch() ?: null;
    }

    public function getBinStock(int $locationId, int $productId): int {
        $stmt = $this->db->prepare("SELECT quantity FROM bin_inventory WHERE location_id = ? AND product_id = ?");
        $stmt->execute([$locationId, $productId]);
        return (int)$stmt->fetchColumn();
    }

    public function getBinOccupancy(int $locationId): int {
        $stmt = $this->db->prepare("SELECT COALESCE(SUM(quantity), 0) FROM bin_inventory WHERE location_id = ?");
        $stmt->execute([$locationId]);
        return (int)$stmt->fetchColumn();
    }

    public function getMovementsLedger(): array {
        return $this->db->query("
            SELECT m.id, m.movement_code, m.movement_type, p.sku, p.name as product_name,
                   fl.bin_code as from_bin, tl.bin_code as to_bin, m.quantity,
                   m.reference_doc, m.actor, m.created_at, m.signature_hash
            FROM stock_movements m
            JOIN products p ON m.product_id = p.id
            JOIN locations fl ON m.from_location_id = fl.id
            JOIN locations tl ON m.to_location_id = tl.id
            ORDER BY m.id DESC LIMIT 25
        ")->fetchAll();
    }

    public function getAuditTrail(int $movementId): array {
        $stmt = $this->db->prepare("SELECT * FROM stock_movements WHERE id = ?");
        $stmt->execute([$movementId]);
        return $stmt->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Domain Stock Movement Engine
// ==========================================
class StockMovementEngine {
    public function __construct(private WarehouseRepository $repo) {}

    /**
     * Executes Inbound Stock Ingestion from Receiving Dock to Target Storage Bin.
     */
    public function processInbound(int $productId, int $targetLocationId, int $qty, string $poRef, string $actor): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $loc = $this->repo->getLocationById($targetLocationId);
            if (!$loc || $loc['is_virtual']) {
                $db->rollBack();
                return ['success' => false, 'message' => "Target location is invalid or virtual."];
            }

            // Volumetric Capacity Check
            $currentOccupancy = $this->repo->getBinOccupancy($targetLocationId);
            if (($currentOccupancy + $qty) > (int)$loc['max_capacity']) {
                $db->rollBack();
                $overage = ($currentOccupancy + $qty) - (int)$loc['max_capacity'];
                return [
                    'success' => false, 
                    'message' => "Bin Overflow: Location [{$loc['bin_code']}] capacity exceeded by {$overage} units. Max: {$loc['max_capacity']}, Current: {$currentOccupancy}."
                ];
            }

            $dock = $this->repo->getLocationByBinCode('STAGE-INBOUND');
            $code = $this->repo->executeMovement('INBOUND', $productId, (int)$dock['id'], $targetLocationId, $qty, $poRef, $actor);

            $db->commit();
            return ['success' => true, 'movement_code' => $code, 'bin' => $loc['bin_code']];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Executes Inter-Bin Stock Relocation.
     */
    public function processTransfer(int $productId, int $fromLocId, int $toLocId, int $qty, string $refDoc, string $actor): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $fromLoc = $this->repo->getLocationById($fromLocId);
            $toLoc = $this->repo->getLocationById($toLocId);

            if (!$fromLoc || !$toLoc || $fromLoc['is_virtual'] || $toLoc['is_virtual']) {
                $db->rollBack();
                return ['success' => false, 'message' => "Source or destination bin is invalid/virtual."];
            }

            // Check destination capacity
            $destOccupancy = $this->repo->getBinOccupancy($toLocId);
            if (($destOccupancy + $qty) > (int)$toLoc['max_capacity']) {
                $db->rollBack();
                return ['success' => false, 'message' => "Destination Bin [{$toLoc['bin_code']}] capacity exceeded."];
            }

            $code = $this->repo->executeMovement('TRANSFER', $productId, $fromLocId, $toLocId, $qty, $refDoc, $actor);

            $db->commit();
            return ['success' => true, 'movement_code' => $code];

        } catch (UnderflowException $e) {
            $db->rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Executes Outbound Order Picking (Bin to Shipping Bay).
     */
    public function processOutbound(int $productId, int $fromLocId, int $qty, string $orderRef, string $actor): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $fromLoc = $this->repo->getLocationById($fromLocId);
            $bay = $this->repo->getLocationByBinCode('STAGE-OUTBOUND');

            if (!$fromLoc || $fromLoc['is_virtual']) {
                $db->rollBack();
                return ['success' => false, 'message' => "Source pick bin is invalid."];
            }

            $code = $this->repo->executeMovement('OUTBOUND', $productId, $fromLocId, (int)$bay['id'], $qty, $orderRef, $actor);

            $db->commit();
            return ['success' => true, 'movement_code' => $code];

        } catch (UnderflowException $e) {
            $db->rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
}

// ==========================================
// 4. Main Application Console Loop
// ==========================================
class WarehouseConsoleApp {
    private WarehouseRepository $repo;
    private StockMovementEngine $engine;

    public function __construct() {
        $this->repo = new WarehouseRepository();
        $this->engine = new StockMovementEngine($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $bins = $this->repo->getPhysicalLocations();
            CliUI::header("Warehouse Stock Movement Tracker & WMS", "Physical Storage Bins Monitored: " . count($bins));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Register Inbound Stock Shipment (PO Ingestion)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Relocate Stock Between Bins (Inter-Bin Transfer)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Pick Outbound Order Stock (Fulfillment Pick)\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Inspect Warehouse Bin Topology & Utilization\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Output Double-Entry Movements Ledger\n";
            echo "  " . CliUI::CYAN . "6." . CliUI::RESET . " Audit Transaction SHA-256 Signature Seal\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect WMS Session\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->inboundWizard(); break;
                case '2': $this->transferWizard(); break;
                case '3': $this->outboundWizard(); break;
                case '4': $this->viewBinTopology(); break;
                case '5': $this->viewMovementsLedger(); break;
                case '6': $this->auditTrailFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "WMS control infrastructure unmounted cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function inboundWizard(): void {
        CliUI::header("Inbound Stock Shipment Ingestion");
        $products = $this->repo->getProducts();
        $bins = $this->repo->getPhysicalLocations();

        echo " Select Product to Ingest:\n";
        foreach ($products as $p) {
            echo "  [{$p['id']}] {$p['sku']} (" . CliUI::CYAN . $p['name'] . CliUI::RESET . ")\n";
        }
        echo "\n";

        $pId = (int)CliUI::prompt("Product ID");
        $validPids = array_column($products, 'id');
        if (!in_array($pId, $validPids, true)) { CliUI::error("Invalid Product ID."); CliUI::pause(); return; }

        echo "\n Available Storage Bins:\n";
        foreach ($bins as $b) {
            $util = CliUI::renderProgressBar((int)$b['total_units_stored'], (int)$b['max_capacity'], 10);
            echo "  [{$b['id']}] {$b['bin_code']} (Stored: {$b['total_units_stored']}/{$b['max_capacity']}) {$util}\n";
        }
        echo "\n";

        $binId = (int)CliUI::prompt("Destination Storage Bin ID");
        $validBins = array_column($bins, 'id');
        if (!in_array($binId, $validBins, true)) { CliUI::error("Invalid Bin ID."); CliUI::pause(); return; }

        $qty = (int)CliUI::prompt("Ingestion Quantity (Units)");
        if ($qty <= 0) { CliUI::error("Quantity must be greater than zero."); CliUI::pause(); return; }

        $poRef = CliUI::prompt("PO Reference / BOL Number", "PO-2026-" . rand(100, 999));
        $actor = CliUI::prompt("Receiving Operator", "RECEIVING_AGENT");

        $res = $this->engine->processInbound($pId, $binId, $qty, $poRef, $actor);

        if ($res['success']) {
            CliUI::success("Stock ingested successfully! Movement Code: {$res['movement_code']} ──► Routed to Bin {$res['bin']}");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function transferWizard(): void {
        CliUI::header("Inter-Bin Stock Transfer");
        $products = $this->repo->getProducts();
        $bins = $this->repo->getPhysicalLocations();

        echo " Select Product to Relocate:\n";
        foreach ($products as $p) {
            echo "  [{$p['id']}] {$p['sku']} - {$p['name']}\n";
        }
        echo "\n";

        $pId = (int)CliUI::prompt("Product ID");
        $fromBinId = (int)CliUI::prompt("Source Storage Bin ID");
        $toBinId   = (int)CliUI::prompt("Destination Storage Bin ID");
        $qty       = (int)CliUI::prompt("Transfer Quantity (Units)");

        if ($fromBinId === $toBinId) {
            CliUI::error("Source and destination bins cannot be identical.");
            CliUI::pause();
            return;
        }

        $refDoc = CliUI::prompt("Transfer Requisition Code", "TRF-2026-" . rand(100, 999));
        $actor  = CliUI::prompt("Warehouse Operator", "WMS_OPERATOR");

        $res = $this->engine->processTransfer($pId, $fromBinId, $toBinId, $qty, $refDoc, $actor);

        if ($res['success']) {
            CliUI::success("Stock relocated cleanly! Movement Code: {$res['movement_code']}");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function outboundWizard(): void {
        CliUI::header("Outbound Order Fulfillment Pick");
        $products = $this->repo->getProducts();
        $bins = $this->repo->getPhysicalLocations();

        echo " Select Product to Pick:\n";
        foreach ($products as $p) {
            echo "  [{$p['id']}] {$p['sku']} - {$p['name']}\n";
        }
        echo "\n";

        $pId = (int)CliUI::prompt("Product ID");
        $fromBinId = (int)CliUI::prompt("Source Pick Bin ID");
        $qty = (int)CliUI::prompt("Pick Quantity (Units)");
        $orderRef = CliUI::prompt("Sales Order / Picklist Ref", "SO-2026-" . rand(1000, 9999));
        $actor = CliUI::prompt("Picker Name", "PICKER_ARTHUR");

        $res = $this->engine->processOutbound($pId, $fromBinId, $qty, $orderRef, $actor);

        if ($res['success']) {
            CliUI::success("Pick confirmed & dispatched to Shipping Bay! Movement Code: {$res['movement_code']}");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function viewBinTopology(): void {
        CliUI::header("Storage Bin Topology & Utilization");
        $bins = $this->repo->getPhysicalLocations();

        $tableData = [];
        foreach ($bins as $b) {
            $tableData[] = [
                'id'       => $b['id'],
                'bin_code' => $b['bin_code'],
                'zone'     => $b['zone'],
                'stored'   => $b['total_units_stored'] . " / " . $b['max_capacity'],
                'util'     => CliUI::renderProgressBar((int)$b['total_units_stored'], (int)$b['max_capacity'], 10)
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'bin_code' => 'Storage Location Bin', 'zone' => 'Zone', 'stored' => 'Units Stored', 'util' => 'Bin Utilization'
        ]);

        CliUI::pause();
    }

    private function viewMovementsLedger(): void {
        CliUI::header("Double-Entry Stock Movements Ledger");
        $ledger = $this->repo->getMovementsLedger();

        $tableData = [];
        foreach ($ledger as $m) {
            $tableData[] = [
                'code'   => $m['movement_code'],
                'type'   => CliUI::typeBadge($m['movement_type']),
                'sku'    => $m['sku'],
                'route'  => substr($m['from_bin'], 0, 10) . " ──► " . substr($m['to_bin'], 0, 10),
                'qty'    => $m['quantity'] . " pcs",
                'ref'    => $m['reference_doc'],
                'time'   => $m['created_at']
            ];
        }

        CliUI::drawTable($tableData, [
            'code' => 'Movement Code', 'type' => 'Action', 'sku' => 'Product SKU', 'route' => 'Route (From ──► To)', 'qty' => 'Quantity', 'ref' => 'Ref Doc', 'time' => 'Timestamp'
        ]);

        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Cryptographic SHA-256 Audit Extraction");
        $movId = (int)CliUI::prompt("Enter Movement ID to inspect integrity seal");

        $logs = $this->repo->getAuditTrail($movId);
        if (empty($logs)) {
            CliUI::error("Movement record not found.");
            CliUI::pause();
            return;
        }

        $m = $logs[0];
        echo "\n " . CliUI::BOLD . "TRANSACTION LEDGER SEAL FOR [{$m['movement_code']}]:" . CliUI::RESET . "\n";
        echo "  ├─ Movement Type : " . $m['movement_type'] . "\n";
        echo "  ├─ Quantity      : " . $m['quantity'] . " Units\n";
        echo "  ├─ Actor Code    : " . $m['actor'] . "\n";
        echo "  ├─ Reference Doc : " . $m['reference_doc'] . "\n";
        echo "  ├─ Created At    : " . $m['created_at'] . " UTC\n";
        echo "  └─ SHA-256 Seal  : " . CliUI::YELLOW . $m['signature_hash'] . CliUI::RESET . "\n";

        CliUI::pause();
    }

    public function runBatchSimulation(): void {
        CliUI::stepLog("Starting automated warehouse movement simulation pass...");

        // 1. Inbound Ingestion
        $res1 = $this->engine->processInbound(1, 3, 20, 'PO-2026-SIM-01', 'DAEMON_BOT');
        CliUI::stepLog("Inbound Ingestion: " . ($res1['success'] ? "Movement [{$res1['movement_code']}] OK" : "FAILED: {$res1['message']}"));

        // 2. Inter-Bin Relocation
        $res2 = $this->engine->processTransfer(1, 3, 4, 10, 'TRF-SIM-01', 'DAEMON_BOT');
        CliUI::stepLog("Transfer Relocation: " . ($res2['success'] ? "Movement [{$res2['movement_code']}] OK" : "FAILED: {$res2['message']}"));

        // 3. Outbound Picking
        $res3 = $this->engine->processOutbound(1, 4, 5, 'SO-SIM-01', 'DAEMON_BOT');
        CliUI::stepLog("Outbound Pick: " . ($res3['success'] ? "Movement [{$res3['movement_code']}] OK" : "FAILED: {$res3['message']}"));

        // 4. Over-picking test (Expect failure)
        $res4 = $this->engine->processOutbound(1, 4, 9999, 'SO-SIM-FAIL', 'DAEMON_BOT');
        CliUI::stepLog("Over-Pick Safety Guard Test: " . (!$res4['success'] ? CliUI::GREEN . "PASS (Blocked: {$res4['message']})" . CliUI::RESET : "FAIL (Incorrectly allowed)"));
    }
}

// ==========================================
// 5. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Warehouse management tracking engines require a standard console CLI environment.\n");
}

$app = new WarehouseConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--batch') {
    $app->runBatchSimulation();
} else {
    $app->launchWorkspace();
}
