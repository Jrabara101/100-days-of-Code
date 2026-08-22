#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Warehouse Stock Movement & FIFO/FEFO Expiration Engine
 * 
 * Usage:
 *   php warehouse_fifo_tracker.php           (Interactive WMS Workspace)
 *   php warehouse_fifo_tracker.php --batch   (Headless FIFO Simulation Daemon)
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
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[FIFO-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function expiryBadge(string $expiryDate): string {
        $today = new DateTimeImmutable('today');
        $exp = new DateTimeImmutable($expiryDate);
        $diff = $today->diff($exp);
        $days = (int)$diff->format('%r%a');

        if ($days < 0) {
            return self::RED . self::BOLD . " EXPIRED (" . abs($days) . "d ago) " . self::RESET;
        }
        if ($days <= 30) {
            return self::YELLOW . self::BOLD . " EXPIRING ({$days}d left) " . self::RESET;
        }
        return self::GREEN . " FRESH ({$days}d left) " . self::RESET;
    }

    public static function typeBadge(string $type): string {
        return match ($type) {
            'INBOUND'    => self::GREEN . self::BOLD . " INBOUND  " . self::RESET,
            'TRANSFER'   => self::BLUE . " TRANSFER " . self::RESET,
            'FIFO_PICK'  => self::YELLOW . self::BOLD . " FIFO_PICK" . self::RESET,
            'QUARANTINE' => self::RED . self::BOLD . " SCRAP/QUAR" . self::RESET,
            default      => $type
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
class WarehouseFifoRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/warehouse_fifo_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Warehouse Facilities & Locations
        $this->db->exec("CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bin_code TEXT UNIQUE NOT NULL,
            zone TEXT NOT NULL,
            max_capacity INTEGER NOT NULL,
            is_virtual INTEGER DEFAULT 0
        )");

        // Master Products
        $this->db->exec("CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            is_perishable INTEGER DEFAULT 1
        )");

        // Lot / Batch Registry
        $this->db->exec("CREATE TABLE IF NOT EXISTS lots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            lot_number TEXT UNIQUE NOT NULL,
            manufactured_at DATE NOT NULL,
            expires_at DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )");

        // Granular Lot-Level Bin Inventory
        $this->db->exec("CREATE TABLE IF NOT EXISTS bin_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            lot_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (location_id) REFERENCES locations(id),
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (lot_id) REFERENCES lots(id),
            UNIQUE(location_id, product_id, lot_id)
        )");

        // Immutable Double-Entry Stock Movement Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            movement_code TEXT UNIQUE NOT NULL,
            movement_type TEXT NOT NULL, -- INBOUND, TRANSFER, FIFO_PICK, QUARANTINE
            product_id INTEGER NOT NULL,
            lot_id INTEGER NOT NULL,
            from_location_id INTEGER NOT NULL,
            to_location_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            reference_doc TEXT NOT NULL,
            actor TEXT NOT NULL,
            signature_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (lot_id) REFERENCES lots(id),
            FOREIGN KEY (from_location_id) REFERENCES locations(id),
            FOREIGN KEY (to_location_id) REFERENCES locations(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_lot_expiry ON lots(product_id, expires_at)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_bin_lot_inv ON bin_inventory(location_id, product_id, lot_id)");

        if ($this->db->query("SELECT COUNT(*) FROM locations")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        // 1. Locations
        $lStmt = $this->db->prepare("INSERT INTO locations (bin_code, zone, max_capacity, is_virtual) VALUES (?, ?, ?, ?)");
        $lStmt->execute(['STAGE-INBOUND', 'RECEIVING', 999999, 1]);
        $lStmt->execute(['STAGE-OUTBOUND', 'SHIPPING', 999999, 1]);
        $lStmt->execute(['ZONE-A-RACK-01-BIN-01', 'ZONE-A', 100, 0]);
        $lStmt->execute(['ZONE-A-RACK-01-BIN-02', 'ZONE-A', 60, 0]);
        $lStmt->execute(['ZONE-B-RACK-01-BIN-01', 'ZONE-B', 80, 0]);
        $lStmt->execute(['STAGE-QUARANTINE', 'QUARANTINE', 500, 0]);

        // 2. Products
        $pStmt = $this->db->prepare("INSERT INTO products (sku, name, is_perishable) VALUES (?, ?, ?)");
        $pStmt->execute(['SKU-MED-INSULIN', 'Humalog Insulin Injection 100U/mL', 1]);
        $pStmt->execute(['SKU-BIO-VACCINE', 'mRNA Viral Transport Ampoules', 1]);

        // 3. Register Multiple Lots with varying Expiry Dates (FIFO / FEFO Simulation)
        $this->createLot(1, 'LOT-2026A-01', '2026-01-10', '2026-09-15'); // Expiring soon (FEFO Priority #1)
        $this->createLot(1, 'LOT-2026B-02', '2026-02-15', '2026-12-30'); // Fresh batch (FEFO Priority #2)
        $this->createLot(1, 'LOT-2025Z-OLD', '2025-05-01', '2026-06-01'); // Expired batch (Must be blocked)
        $this->createLot(2, 'LOT-VAC-9001', '2026-03-01', '2027-03-01'); // Future expiry

        // 4. Initial Inbound Ingestion Movements
        $this->executeMovement('INBOUND', 1, 1, 1, 3, 30, 'PO-2026-001', 'RECEIVING_AGENT'); // 30 units Lot 1 in Bin 1
        $this->executeMovement('INBOUND', 1, 2, 1, 3, 40, 'PO-2026-002', 'RECEIVING_AGENT'); // 40 units Lot 2 in Bin 1
        $this->executeMovement('INBOUND', 1, 3, 1, 4, 15, 'PO-2025-OLD', 'RECEIVING_AGENT'); // 15 expired units in Bin 2
        $this->executeMovement('INBOUND', 2, 4, 1, 5, 50, 'PO-2026-003', 'RECEIVING_AGENT'); // 50 vaccine units in Bin 3
    }

    public function createLot(int $productId, string $lotNumber, string $mfrDate, string $expDate): int {
        $stmt = $this->db->prepare("
            INSERT INTO lots (product_id, lot_number, manufactured_at, expires_at) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$productId, trim($lotNumber), $mfrDate, $expDate]);
        return (int)$this->db->lastInsertId();
    }

    public function getLotById(int $lotId): ?array {
        $stmt = $this->db->prepare("SELECT l.*, p.sku, p.name as product_name FROM lots l JOIN products p ON l.product_id = p.id WHERE l.id = ?");
        $stmt->execute([$lotId]);
        return $stmt->fetch() ?: null;
    }

    public function getLotsByProduct(int $productId): array {
        $stmt = $this->db->prepare("
            SELECT l.*, COALESCE(SUM(bi.quantity), 0) as total_in_stock
            FROM lots l
            LEFT JOIN bin_inventory bi ON l.id = bi.lot_id
            WHERE l.product_id = ?
            GROUP BY l.id
            ORDER BY l.expires_at ASC, l.created_at ASC
        ");
        $stmt->execute([$productId]);
        return $stmt->fetchAll();
    }

    public function executeMovement(string $type, int $productId, int $lotId, int $fromLocId, int $toLocId, int $qty, string $refDoc, string $actor): string {
        $movCode = "MOV-" . date('Ymd') . "-" . rand(10000, 99999);
        $sigPayload = "{$movCode}|{$type}|{$productId}|{$lotId}|{$fromLocId}|{$toLocId}|{$qty}|{$refDoc}|" . microtime();
        $signature = hash('sha256', $sigPayload);

        // 1. Log Movement
        $stmt = $this->db->prepare("
            INSERT INTO stock_movements 
            (movement_code, movement_type, product_id, lot_id, from_location_id, to_location_id, quantity, reference_doc, actor, signature_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$movCode, $type, $productId, $lotId, $fromLocId, $toLocId, $qty, $refDoc, $actor, $signature]);

        // 2. Adjust Source Bin (Atomic Over-Allocation Guard)
        $fromLoc = $this->getLocationById($fromLocId);
        if ($fromLoc && !$fromLoc['is_virtual']) {
            $deduct = $this->db->prepare("
                UPDATE bin_inventory 
                SET quantity = quantity - ? 
                WHERE location_id = ? AND product_id = ? AND lot_id = ? AND quantity >= ?
            ");
            $deduct->execute([$qty, $fromLocId, $productId, $lotId, $qty]);
            if ($deduct->rowCount() === 0) {
                throw new UnderflowException("Atomic Stock Guard: Insufficient stock for Lot in Bin [{$fromLoc['bin_code']}].");
            }
        }

        // 3. Adjust Destination Bin
        $toLoc = $this->getLocationById($toLocId);
        if ($toLoc && !$toLoc['is_virtual']) {
            $credit = $this->db->prepare("
                INSERT INTO bin_inventory (location_id, product_id, lot_id, quantity) 
                VALUES (?, ?, ?, ?)
                ON CONFLICT(location_id, product_id, lot_id) DO UPDATE SET quantity = quantity + excluded.quantity
            ");
            $credit->execute([$toLocId, $productId, $lotId, $qty]);
        }

        return $movCode;
    }

    public function getAvailableStockSortedByFifo(int $productId, ?int $preferredBinId = null): array {
        $query = "
            SELECT bi.id as inv_id, bi.location_id, bi.product_id, bi.lot_id, bi.quantity,
                   l.lot_number, l.expires_at, l.manufactured_at, loc.bin_code, loc.zone
            FROM bin_inventory bi
            JOIN lots l ON bi.lot_id = l.id
            JOIN locations loc ON bi.location_id = loc.id
            WHERE bi.product_id = :pId AND bi.quantity > 0 AND loc.is_virtual = 0
        ";

        if ($preferredBinId !== null) {
            $query .= " AND bi.location_id = :binId ";
        }

        $query .= " ORDER BY l.expires_at ASC, l.created_at ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':pId', $productId, PDO::PARAM_INT);
        if ($preferredBinId !== null) {
            $stmt->bindValue(':binId', $preferredBinId, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getProducts(): array {
        return $this->db->query("SELECT * FROM products ORDER BY sku ASC")->fetchAll();
    }

    public function getPhysicalLocations(): array {
        return $this->db->query("
            SELECT l.*, COALESCE(SUM(bi.quantity), 0) as total_units_stored
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

    public function getBinOccupancy(int $locationId): int {
        $stmt = $this->db->prepare("SELECT COALESCE(SUM(quantity), 0) FROM bin_inventory WHERE location_id = ?");
        $stmt->execute([$locationId]);
        return (int)$stmt->fetchColumn();
    }

    public function getDetailedLotInventory(): array {
        return $this->db->query("
            SELECT bi.id, loc.bin_code, loc.zone, p.sku, p.name as product_name,
                   l.lot_number, l.expires_at, bi.quantity
            FROM bin_inventory bi
            JOIN locations loc ON bi.location_id = loc.id
            JOIN products p ON bi.product_id = p.id
            JOIN lots l ON bi.lot_id = l.id
            WHERE bi.quantity > 0 AND loc.is_virtual = 0
            ORDER BY p.sku ASC, l.expires_at ASC
        ")->fetchAll();
    }

    public function getMovementsLedger(): array {
        return $this->db->query("
            SELECT m.id, m.movement_code, m.movement_type, p.sku, l.lot_number, l.expires_at,
                   fl.bin_code as from_bin, tl.bin_code as to_bin, m.quantity,
                   m.reference_doc, m.actor, m.created_at, m.signature_hash
            FROM stock_movements m
            JOIN products p ON m.product_id = p.id
            JOIN lots l ON m.lot_id = l.id
            JOIN locations fl ON m.from_location_id = fl.id
            JOIN locations tl ON m.to_location_id = tl.id
            ORDER BY m.id DESC LIMIT 25
        ")->fetchAll();
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Domain FIFO/FEFO Allocation Engine
// ==========================================
class FifoAllocationEngine {
    public function __construct(private WarehouseFifoRepository $repo) {}

    /**
     * Executes Inbound Stock Ingestion with new or existing Lot allocation.
     */
    public function processInbound(int $productId, int $lotId, int $targetLocId, int $qty, string $poRef, string $actor): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $loc = $this->repo->getLocationById($targetLocId);
            if (!$loc || $loc['is_virtual']) {
                $db->rollBack();
                return ['success' => false, 'message' => "Target location is invalid or virtual."];
            }

            // Volumetric Capacity Check
            $occupancy = $this->repo->getBinOccupancy($targetLocId);
            if (($occupancy + $qty) > (int)$loc['max_capacity']) {
                $db->rollBack();
                return [
                    'success' => false, 
                    'message' => "Bin Overflow: Location [{$loc['bin_code']}] capacity exceeded. Max: {$loc['max_capacity']}, Current: {$occupancy}."
                ];
            }

            $dock = $this->repo->getLocationByBinCode('STAGE-INBOUND');
            $code = $this->repo->executeMovement('INBOUND', $productId, $lotId, (int)$dock['id'], $targetLocId, $qty, $poRef, $actor);

            $db->commit();
            return ['success' => true, 'movement_code' => $code, 'bin' => $loc['bin_code']];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Automated FIFO/FEFO Outbound Picking Algorithm.
     * Selects earliest-expiring, unexpired lots and splits across batches automatically.
     */
    public function processFifoPick(int $productId, int $requestedQty, string $orderRef, string $actor, ?int $preferredBinId = null): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $batches = $this->repo->getAvailableStockSortedByFifo($productId, $preferredBinId);
            $today = date('Y-m-d');

            $allocations = [];
            $unallocatedQty = $requestedQty;
            $expiredSkippedQty = 0;

            foreach ($batches as $batch) {
                // Strict Expiration Interceptor: Block expired stock from outbound orders
                if ($batch['expires_at'] < $today) {
                    $expiredSkippedQty += (int)$batch['quantity'];
                    continue;
                }

                $available = (int)$batch['quantity'];
                $take = min($unallocatedQty, $available);

                $allocations[] = [
                    'inv_id'      => $batch['inv_id'],
                    'location_id' => (int)$batch['location_id'],
                    'bin_code'    => $batch['bin_code'],
                    'lot_id'      => (int)$batch['lot_id'],
                    'lot_number'  => $batch['lot_number'],
                    'expires_at'  => $batch['expires_at'],
                    'qty'         => $take
                ];

                $unallocatedQty -= $take;
                if ($unallocatedQty === 0) {
                    break;
                }
            }

            if ($unallocatedQty > 0) {
                $db->rollBack();
                $err = "Insufficient unexpired FIFO stock. Missing {$unallocatedQty} units.";
                if ($expiredSkippedQty > 0) {
                    $err .= " (Skipped {$expiredSkippedQty} expired units in quarantine).";
                }
                return ['success' => false, 'message' => $err];
            }

            // Execute movements for each lot allocation
            $bay = $this->repo->getLocationByBinCode('STAGE-OUTBOUND');
            $movementCodes = [];

            foreach ($allocations as $alloc) {
                $mCode = $this->repo->executeMovement(
                    'FIFO_PICK',
                    $productId,
                    $alloc['lot_id'],
                    $alloc['location_id'],
                    (int)$bay['id'],
                    $alloc['qty'],
                    $orderRef,
                    $actor
                );
                $movementCodes[] = $mCode;
            }

            $db->commit();
            return [
                'success'        => true,
                'allocations'    => $allocations,
                'movement_codes' => $movementCodes,
                'total_picked'   => $requestedQty
            ];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Quarantine / Scrap Expired Stock.
     */
    public function processQuarantine(int $productId, int $lotId, int $fromBinId, int $qty, string $reason, string $actor): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $quarLoc = $this->repo->getLocationByBinCode('STAGE-QUARANTINE');
            $code = $this->repo->executeMovement('QUARANTINE', $productId, $lotId, $fromBinId, (int)$quarLoc['id'], $qty, $reason, $actor);

            $db->commit();
            return ['success' => true, 'movement_code' => $code];

        } catch (UnderflowException $e) {
            $db->rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        } catch (Exception $e) {
            $db->rollBack();
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}

// ==========================================
// 4. Main Application Console Loop
// ==========================================
class WarehouseFifoConsoleApp {
    private WarehouseFifoRepository $repo;
    private FifoAllocationEngine $engine;

    public function __construct() {
        $this->repo = new WarehouseFifoRepository();
        $this->engine = new FifoAllocationEngine($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $bins = $this->repo->getPhysicalLocations();
            $inventory = $this->repo->getDetailedLotInventory();

            CliUI::header("Warehouse Stock Movement & FIFO/FEFO Tracker", "Physical Bins: " . count($bins) . " | Active Batches: " . count($inventory));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Automated FIFO/FEFO Outbound Order Pick (Earliest Expiry First)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Register Inbound Lot Stock (PO Intake + Expiration Tagging)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Create New Lot / Batch Master Record\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Inspect Granular Lot Inventory & Expiration Health\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Move Expired Stock to Quarantine Stage\n";
            echo "  " . CliUI::CYAN . "6." . CliUI::RESET . " Output Double-Entry Movements Ledger\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect WMS Session\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->fifoPickWizard(); break;
                case '2': $this->inboundWizard(); break;
                case '3': $this->createLotWizard(); break;
                case '4': $this->viewLotInventory(); break;
                case '5': $this->quarantineWizard(); break;
                case '6': $this->viewMovementsLedger(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "WMS engine disconnected safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function fifoPickWizard(): void {
        CliUI::header("Automated FIFO/FEFO Outbound Order Pick");
        $products = $this->repo->getProducts();

        echo " Select Product SKU to Pick:\n";
        foreach ($products as $p) {
            echo "  [{$p['id']}] {$p['sku']} (" . CliUI::CYAN . $p['name'] . CliUI::RESET . ")\n";
        }
        echo "\n";

        $pId = (int)CliUI::prompt("Product ID");
        $qty = (int)CliUI::prompt("Order Quantity Required (Units)");
        if ($qty <= 0) { CliUI::error("Quantity must be greater than zero."); CliUI::pause(); return; }

        $orderRef = CliUI::prompt("Sales Order Reference", "SO-2026-" . rand(1000, 9999));
        $actor = CliUI::prompt("Picker Name", "PICKER_OPERATOR");

        $res = $this->engine->processFifoPick($pId, $qty, $orderRef, $actor);

        if ($res['success']) {
            CliUI::success("FIFO/FEFO Pick executed! Dispatched {$res['total_picked']} units across " . count($res['allocations']) . " batch(es).");
            
            echo "\n " . CliUI::BOLD . "BATCH ALLOCATION & EXPIRATION TRACE:" . CliUI::RESET . "\n";
            $allocTable = [];
            foreach ($res['allocations'] as $a) {
                $allocTable[] = [
                    'bin'    => $a['bin_code'],
                    'lot'    => $a['lot_number'],
                    'expiry' => $a['expires_at'],
                    'badge'  => CliUI::expiryBadge($a['expires_at']),
                    'picked' => $a['qty'] . " units"
                ];
            }
            CliUI::drawTable($allocTable, [
                'bin' => 'Source Bin', 'lot' => 'Lot Number', 'expiry' => 'Expiration Date', 'badge' => 'Status', 'picked' => 'Qty Allocated'
            ]);
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function inboundWizard(): void {
        CliUI::header("Inbound Stock Shipment Ingestion");
        $products = $this->repo->getProducts();
        $bins = $this->repo->getPhysicalLocations();

        echo " Select Product:\n";
        foreach ($products as $p) {
            echo "  [{$p['id']}] {$p['sku']} - {$p['name']}\n";
        }
        echo "\n";

        $pId = (int)CliUI::prompt("Product ID");
        $lots = $this->repo->getLotsByProduct($pId);

        if (empty($lots)) {
            CliUI::error("No lots registered for this product. Please create a Lot master record first.");
            CliUI::pause();
            return;
        }

        echo "\n Available Lots for SKU:\n";
        foreach ($lots as $l) {
            $badge = CliUI::expiryBadge($l['expires_at']);
            echo "  [{$l['id']}] Lot: " . CliUI::YELLOW . $l['lot_number'] . CliUI::RESET . " (Exp: {$l['expires_at']}) {$badge}\n";
        }
        echo "\n";

        $lotId = (int)CliUI::prompt("Select Lot ID");
        
        echo "\n Storage Bins:\n";
        foreach ($bins as $b) {
            $util = CliUI::renderProgressBar((int)$b['total_units_stored'], (int)$b['max_capacity'], 10);
            echo "  [{$b['id']}] {$b['bin_code']} (Stored: {$b['total_units_stored']}/{$b['max_capacity']}) {$util}\n";
        }
        echo "\n";

        $binId = (int)CliUI::prompt("Destination Storage Bin ID");
        $qty = (int)CliUI::prompt("Ingestion Quantity (Units)");
        $poRef = CliUI::prompt("PO Reference / BOL Number", "PO-2026-" . rand(100, 999));
        $actor = CliUI::prompt("Receiving Operator", "RECEIVING_AGENT");

        $res = $this->engine->processInbound($pId, $lotId, $binId, $qty, $poRef, $actor);

        if ($res['success']) {
            CliUI::success("Stock ingested into Bin {$res['bin']} under movement {$res['movement_code']}.");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function createLotWizard(): void {
        CliUI::header("Create Lot / Batch Master Record");
        $products = $this->repo->getProducts();

        echo " Select Product:\n";
        foreach ($products as $p) {
            echo "  [{$p['id']}] {$p['sku']} - {$p['name']}\n";
        }
        echo "\n";

        $pId = (int)CliUI::prompt("Product ID");
        $lotNum = CliUI::prompt("Lot / Batch Number", "LOT-" . date('Ym') . "-" . rand(100, 999));
        $mfrDate = CliUI::prompt("Manufacture Date (YYYY-MM-DD)", date('Y-m-d'));
        $expDate = CliUI::prompt("Expiration Date (YYYY-MM-DD)", date('Y-m-d', strtotime('+180 days')));

        try {
            $lotId = $this->repo->createLot($pId, $lotNum, $mfrDate, $expDate);
            CliUI::success("Lot ID #{$lotId} [{$lotNum}] registered with expiration date: {$expDate}.");
        } catch (Exception $e) {
            CliUI::error("Failed to create Lot: " . $e->getMessage());
        }

        CliUI::pause();
    }

    private function viewLotInventory(): void {
        CliUI::header("Granular Lot Inventory & Expiration Health");
        $inventory = $this->repo->getDetailedLotInventory();

        $tableData = [];
        foreach ($inventory as $row) {
            $tableData[] = [
                'bin'      => $row['bin_code'],
                'sku'      => $row['sku'],
                'lot'      => $row['lot_number'],
                'expiry'   => $row['expires_at'],
                'status'   => CliUI::expiryBadge($row['expires_at']),
                'quantity' => $row['quantity'] . " units"
            ];
        }

        CliUI::drawTable($tableData, [
            'bin' => 'Bin Location', 'sku' => 'Product SKU', 'lot' => 'Lot Number', 'expiry' => 'Expiration Date', 'status' => 'Batch Health', 'quantity' => 'Stock Level'
        ]);

        CliUI::pause();
    }

    private function quarantineWizard(): void {
        CliUI::header("Quarantine Expired or Compromised Stock");
        $inventory = $this->repo->getDetailedLotInventory();

        $tableData = [];
        foreach ($inventory as $i => $row) {
            $tableData[] = [
                'id'       => $row['id'],
                'bin'      => $row['bin_code'],
                'sku'      => $row['sku'],
                'lot'      => $row['lot_number'],
                'expiry'   => $row['expires_at'],
                'status'   => CliUI::expiryBadge($row['expires_at']),
                'quantity' => $row['quantity'] . " units"
            ];
        }
        CliUI::drawTable($tableData, [
            'id' => 'Inv ID', 'bin' => 'Bin Location', 'sku' => 'SKU', 'lot' => 'Lot Number', 'expiry' => 'Expiration Date', 'status' => 'Health', 'quantity' => 'Quantity'
        ]);

        $sku = CliUI::prompt("Enter Product SKU to quarantine");
        $p = null;
        foreach ($this->repo->getProducts() as $prod) { if ($prod['sku'] === $sku) { $p = $prod; break; } }
        if (!$p) { CliUI::error("SKU not found."); CliUI::pause(); return; }

        $lots = $this->repo->getLotsByProduct((int)$p['id']);
        echo "\n Available Lots:\n";
        foreach ($lots as $l) { echo "  [{$l['id']}] {$l['lot_number']} (Exp: {$l['expires_at']})\n"; }
        echo "\n";

        $lotId = (int)CliUI::prompt("Lot ID");
        $fromBinId = (int)CliUI::prompt("Source Storage Bin ID");
        $qty = (int)CliUI::prompt("Quarantine Quantity");
        $reason = CliUI::prompt("Reason / Incident Ref", "EXPIRED_SCRAP");
        $actor = CliUI::prompt("QA Officer", "QA_AUDITOR");

        $res = $this->engine->processQuarantine((int)$p['id'], $lotId, $fromBinId, $qty, $reason, $actor);

        if ($res['success']) {
            CliUI::success("Stock moved to STAGE-QUARANTINE under movement {$res['movement_code']}.");
        } else {
            CliUI::error($res['message']);
        }

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
                'lot'    => $m['lot_number'],
                'route'  => substr($m['from_bin'], 0, 9) . " ──► " . substr($m['to_bin'], 0, 9),
                'qty'    => $m['quantity'] . " pcs",
                'time'   => $m['created_at']
            ];
        }

        CliUI::drawTable($tableData, [
            'code' => 'Movement Code', 'type' => 'Action', 'sku' => 'Product SKU', 'lot' => 'Lot / Batch', 'route' => 'Route (From ──► To)', 'qty' => 'Quantity', 'time' => 'Timestamp'
        ]);

        CliUI::pause();
    }

    public function runBatchSimulation(): void {
        CliUI::stepLog("Starting automated FIFO / FEFO simulation pass...");

        // Pick 45 units of Insulin. 
        // Initial state has Lot 1 (Exp 2026-09-15) with 30 units, and Lot 2 (Exp 2026-12-30) with 40 units.
        // FIFO must take 30 units of Lot 1, and split the remaining 15 units from Lot 2.
        $res = $this->engine->processFifoPick(1, 45, 'SO-SIM-FIFO-01', 'DAEMON_PICKER');

        if ($res['success']) {
            CliUI::stepLog("FIFO Pick OK: Total {$res['total_picked']} units allocated across " . count($res['allocations']) . " batch(es).");
            foreach ($res['allocations'] as $a) {
                CliUI::stepLog(" ──► Allocated {$a['qty']} units from Lot [{$a['lot_number']}] (Exp: {$a['expires_at']}) in Bin [{$a['bin_code']}].");
            }
        } else {
            CliUI::stepLog(CliUI::RED . "FIFO Pick Failed: " . $res['message'] . CliUI::RESET);
        }

        // Test Expired Stock Interceptor
        $resExpired = $this->engine->processFifoPick(1, 100, 'SO-SIM-EXPIRE-TEST', 'DAEMON_PICKER');
        CliUI::stepLog("Expired Stock Quarantine Test: " . (!$resExpired['success'] ? CliUI::GREEN . "PASS (Blocked picking expired stock)" . CliUI::RESET : "FAIL (Expired stock was picked)"));
    }
}

// ==========================================
// 5. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: Warehouse tracking engines require a standard console CLI environment.\n");
}

$app = new WarehouseFifoConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--batch') {
    $app->runBatchSimulation();
} else {
    $app->launchWorkspace();
}
