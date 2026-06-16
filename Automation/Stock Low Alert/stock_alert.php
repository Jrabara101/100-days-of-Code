#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Intelligent Low Stock Alert & Inventory Engine
 * * Usage:
 * php stock_alert.php        (Interactive Inventory Dashboard)
 * php stock_alert.php check  (Headless Background Cron Monitoring Task)
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Styling & TUI Layout Engine
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

    public static function prompt(string $message, string $default = ""): string {
        $defLabel = $default ? self::DIM . " [{$default}]" . self::RESET : "";
        echo self::BOLD . $message . $defLabel . self::RESET . ": ";
        $input = trim(fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main dashboard..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ " . $msg . self::RESET . "\n"; }
    public static function error(string $msg): void { echo self::RED . "✖ " . $msg . self::RESET . "\n"; }
    public static function info(string $msg): void { echo self::CYAN . "ℹ " . $msg . self::RESET . "\n"; }

    public static function severityBadge(string $severity): string {
        return match ($severity) {
            'CRITICAL' => self::RED . self::BOLD . " CRITICAL " . self::RESET,
            'URGENT'   => self::RED . "  URGENT  " . self::RESET,
            'WARNING'  => self::YELLOW . " WARNING  " . self::RESET,
            'HEALTHY'  => self::GREEN . " HEALTHY  " . self::RESET,
            default    => $severity
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No matching stock inventory nodes found.\n" . self::RESET;
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
                // Adjust padding calculations to cleanly offset hidden ANSI visual strings
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
// 2. Database & Repository Isolation Layer
// ==========================================
class InventoryRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/inventory.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            stock_level INTEGER NOT NULL,
            reorder_level INTEGER NOT NULL,
            alert_status TEXT DEFAULT 'CLEARED' -- CLEARED, NOTIFIED
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_stock_evaluation ON products(stock_level, reorder_level)");

        // Seed default sandbox items for real-time validation prototyping
        if ($this->db->query("SELECT COUNT(*) FROM products")->fetchColumn() == 0) {
            $stmt = $this->db->prepare("INSERT INTO products (sku, name, stock_level, reorder_level) VALUES (?, ?, ?, ?)");
            $stmt->execute(['SKU-CORE-001', 'Enterprise Server Mainboard', 15, 5]);
            $stmt->execute(['SKU-ROUT-052', 'Fiber Optic Transceiver', 2, 10]); // Low Warning
            $stmt->execute(['SKU-CABL-112', 'Cat6A Shielded Patch Cable', 0, 20]); // Critical
        }
    }

    public function getAll(): array {
        return $this->db->query("SELECT * FROM products ORDER BY sku ASC")->fetchAll();
    }

    public function findBySku(string $sku): ?array {
        $stmt = $this->db->prepare("SELECT * FROM products WHERE sku = ? LIMIT 1");
        $stmt->execute([$sku]);
        return $stmt->fetch() ?: null;
    }

    public function updateStock(string $sku, int $newStock): void {
        // If stock level rises above safety thresholds, we automatically heal and clear alert states
        $stmt = $this->db->prepare("
            UPDATE products 
            SET stock_level = :stock,
                alert_status = CASE WHEN :stock > reorder_level THEN 'CLEARED' ELSE alert_status END
            WHERE sku = :sku
        ");
        $stmt->execute(['stock' => $newStock, 'sku' => $sku]);
    }

    public function getBreachedStockItems(): array {
        return $this->db->query("SELECT * FROM products WHERE stock_level <= reorder_level")->fetchAll();
    }

    public function markAsNotified(int $id): void {
        $stmt = $this->db->prepare("UPDATE products SET alert_status = 'NOTIFIED' WHERE id = ?");
        $stmt->execute([$id]);
    }
}

// ==========================================
// 3. Application System Core
// ==========================================
class InventoryManagerApp {
    private InventoryRepository $repo;

    public function __construct() {
        $this->repo = new InventoryRepository();
    }

    public function dashboard(): void {
        while (true) {
            CliUI::header("Global Inventory Operations Node", "Safety Metric Evaluation Suite");
            
            // Output summary grid instantly inside the workspace interface
            $items = $this->repo->getAll();
            foreach ($items as &$item) {
                $item['severity'] = $this->calculateSeverity($item['stock_level'], $item['reorder_level']);
                $item['status_badge'] = CliUI::severityBadge($item['severity']);
            }
            CliUI::drawTable($items, [
                'sku' => 'SKU', 'name' => 'Item Nomenclature', 'stock_level' => 'In-Stock', 'reorder_level' => 'Safety Max', 'status_badge' => 'Operational State'
            ]);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Correct/Update Stock Inventory Count\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Execute Ad-Hoc Alert Evaluation Sequence\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect shell workspace\n\n";

            switch (CliUI::prompt("Route Command")) {
                case '1': $this->stockAdjustmentFlow(); break;
                case '2': $this->checkAlerts(false); CliUI::pause(); break;
                case '0': 
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Console infrastructure terminated.\n" . CliUI::RESET;
                    exit(0);
                default: CliUI::error("Unresolved route parameters."); CliUI::pause();
            }
        }
    }

    private function stockAdjustmentFlow(): void {
        CliUI::header("Inventory Stock Adjustment Matrix");
        $sku = strtoupper(CliUI::prompt("Scan or Input Item SKU"));
        $product = $this->repo->findBySku($sku);

        if (!$product) {
            CliUI::error("SKU lookup failed inside current warehouse bounds.");
            CliUI::pause();
            return;
        }

        echo "\n Currently matching entity: " . CliUI::BOLD . "{$product['name']}" . CliUI::RESET . "\n";
        echo " Active Ledger Volume balance count: " . CliUI::YELLOW . "{$product['stock_level']} units\n\n" . CliUI::RESET;

        $qty = CliUI::prompt("Input absolute verified physical stock volume count");
        if (!is_numeric($qty) || (int)$qty < 0) {
            CliUI::error("Stock counts must evaluate to non-negative whole volumes.");
            CliUI::pause();
            return;
        }

        $this->repo->updateStock($sku, (int)$qty);
        CliUI::success("Ledger transactional modifications written to storage.");
        sleep(1);
    }

    public function checkAlerts(bool $headlessMode = true): void {
        $prefix = $headlessMode ? "[" . date('Y-m-d H:i:s') . "] [CRON WORKER] " : "";
        echo "{$prefix}Scanning global inventory assets for security stock breaches...\n";

        $breachedItems = $this->repo->getBreachedStockItems();
        $dispatchedCount = 0;

        foreach ($breachedItems as $item) {
            // Guard Rule: Skip dispatch step if we already logged a notice for this low-stock occurrence
            if ($item['alert_status'] === 'NOTIFIED') {
                continue;
            }

            $severity = $this->calculateSeverity($item['stock_level'], $item['reorder_level']);
            
            // Emulate outbound multi-channel pipelines (Slack, SMS, or Corporate SMTP relays via PHPMailer)
            echo "  " . CliUI::RED . "➜ ALERT TRIGGERED [{$severity}]" . CliUI::RESET . " Item SKU: {$item['sku']} ('{$item['name']}') is running low. Current Balance: {$item['stock_level']} / Min Safety Reorder Point: {$item['reorder_level']}\n";
            
            // Mark state internally to protect the monitoring network against notification cascades
            $this->repo->markAsNotified($item['id']);
            $dispatchedCount++;
        }

        echo "{$prefix}Breach assessment routing loop closed. Alerts pushed to pipeline: " . CliUI::BOLD . "{$dispatchedCount}\n" . CliUI::RESET;
    }

    private function calculateSeverity(int $stock, int $reorder): string {
        if ($stock > $reorder) return 'HEALTHY';
        if ($stock === 0) return 'CRITICAL';
        if ($stock <= ($reorder * 0.3)) return 'URGENT';
        return 'WARNING';
    }
}

// ==========================================
// 4. Global Structural Bootstrapper
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System monitors require standard terminal access nodes.");
}

$app = new InventoryManagerApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === 'check') {
    $app->checkAlerts(true);
} else {
    $app->dashboard();
}
