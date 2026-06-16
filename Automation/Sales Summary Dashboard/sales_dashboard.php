#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Executive Sales Analytics Summary Dashboard
 * * Usage: php sales_dashboard.php
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

    public static function prompt(string $message): string {
        echo self::BOLD . $message . self::RESET . ": ";
        return trim(fgets(STDIN));
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main metrics node..." . self::RESET;
        fgets(STDIN);
    }

    /**
     * Renders a high-level corporate 2x2 grid card block for summary metrics
     */
    public static function drawKpiMatrix(array $kpis): void {
        $w = 33; // Card column structural width
        
        $formatGrowth = function(float $val) {
            if ($val > 0) return self::GREEN . "+" . round($val, 1) . "% MoM" . self::RESET;
            if ($val < 0) return self::RED . round($val, 1) . "% MoM" . self::RESET;
            return self::DIM . "0.0% MoM" . self::RESET;
        };

        $revGrowth = $formatGrowth($kpis['revenue_growth']);
        $volGrowth = $formatGrowth($kpis['volume_growth']);

        echo "┌" . str_repeat("─", $w) . "┬" . str_repeat("─", $w) . "┐\n";
        echo "│ " . str_pad(self::BOLD . "TOTAL REVENUE" . self::RESET, $w + 3) . " │ " . str_pad(self::BOLD . "TOTAL VOLUME (UNITS)" . self::RESET, $w + 3) . " │\n";
        echo "│ " . str_pad(self::GREEN . self::BOLD . "$" . number_format($kpis['total_revenue'], 2) . self::RESET, $w + 7) . " │ " . str_pad(self::CYAN . number_format($kpis['total_volume']) . self::RESET, $w + 4) . " │\n";
        echo "│ " . str_pad($revGrowth, $w + (strlen($revGrowth) - 10)) . " │ " . str_pad($volGrowth, $w + (strlen($volGrowth) - 10)) . " │\n";
        echo "├" . str_repeat("─", $w) . "┼" . str_repeat("─", $w) . "┤\n";
        echo "│ " . str_pad(self::BOLD . "AVERAGE TRANSACTION VALUE" . self::RESET, $w + 3) . " │ " . str_pad(self::BOLD . "TOTAL ORDERS" . self::RESET, $w + 3) . " │\n";
        echo "│ " . str_pad("$" . number_format($kpis['aov'], 2), $w) . " │ " . str_pad(number_format($kpis['total_orders']), $w) . " │\n";
        echo "└" . str_repeat("─", $w) . "┴" . str_repeat("─", $w) . "┘\n\n";
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No transaction records found.\n" . self::RESET;
            return;
        }

        $widths = array_map('strlen', $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $widths[$key] = max($widths[$key], strlen((string)($row[$key] ?? '')));
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
                echo str_pad($content, $widths[$key]) . " │ ";
            }
            echo "\n";
        }
        $drawSeparator("└", "┴", "┘", "─");
        echo "\n";
    }
}

// ==========================================
// 2. Data Repository Architecture (SQLite)
// ==========================================
class SalesRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/sales_ledger.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_name TEXT NOT NULL,
            units INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            sold_at DATETIME NOT NULL
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sold_at)");

        // Automatically seed historical records across a 60-day continuum if empty
        if ($this->db->query("SELECT COUNT(*) FROM sales")->fetchColumn() == 0) {
            $stmt = $this->db->prepare("INSERT INTO sales (product_name, units, unit_price, total_price, sold_at) VALUES (?, ?, ?, ?, datetime('now', ?))");
            
            // Previous month records (Baseline)
            for ($i = 0; $i < 40; $i++) {
                $units = rand(1, 5); $price = 49.99;
                $stmt->execute(['Enterprise Cloud Subscription', $units, $price, $units * $price, '-45 days']);
            }
            for ($i = 0; $i < 20; $i++) {
                $units = rand(1, 2); $price = 299.00;
                $stmt->execute(['Hardware Security Module', $units, $price, $units * $price, '-40 days']);
            }

            // Current month records (Growth targets)
            for ($i = 0; $i < 65; $i++) {
                $units = rand(1, 6); $price = 49.99;
                $stmt->execute(['Enterprise Cloud Subscription', $units, $price, $units * $price, '-5 days']);
            }
            for ($i = 0; $i < 28; $i++) {
                $units = rand(1, 3); $price = 299.00;
                $stmt->execute(['Hardware Security Module', $units, $price, $units * $price, '-2 days']);
            }
        }
    }

    public function injectRandomSale(string $product, int $units, float $price): void {
        $stmt = $this->db->prepare("INSERT INTO sales (product_name, units, unit_price, total_price, sold_at) VALUES (?, ?, ?, ?, datetime('now'))");
        $stmt->execute([$product, $units, $price, $units * $price]);
    }

    public function getSummaryKpis(): array {
        // Query current and prior month aggregations sequentially using native SQL time mapping
        $currentMonthRevenue = (float)$this->db->query("SELECT SUM(total_price) FROM sales WHERE strftime('%Y-%m', sold_at) = strftime('%Y-%m', 'now')")->fetchColumn();
        $priorMonthRevenue   = (float)$this->db->query("SELECT SUM(total_price) FROM sales WHERE strftime('%Y-%m', sold_at) = strftime('%Y-%m', 'now', '-1 month')")->fetchColumn();

        $currentMonthVolume  = (int)$this->db->query("SELECT SUM(units) FROM sales WHERE strftime('%Y-%m', sold_at) = strftime('%Y-%m', 'now')")->fetchColumn();
        $priorMonthVolume    = (int)$this->db->query("SELECT SUM(units) FROM sales WHERE strftime('%Y-%m', sold_at) = strftime('%Y-%m', 'now', '-1 month')")->fetchColumn();

        $orderStats = $this->db->query("SELECT COUNT(*) as total_orders, AVG(total_price) as aov FROM sales WHERE strftime('%Y-%m', sold_at) = strftime('%Y-%m', 'now')")->fetch();

        // Calculate Month-over-Month trend percentages
        $revGrowth = $priorMonthRevenue > 0 ? (($currentMonthRevenue - $priorMonthRevenue) / $priorMonthRevenue) * 100 : 0;
        $volGrowth = $priorMonthVolume > 0 ? (($currentMonthVolume - $priorMonthVolume) / $priorMonthVolume) * 100 : 0;

        return [
            'total_revenue'  => $currentMonthRevenue,
            'total_volume'   => $currentMonthVolume,
            'total_orders'   => $orderStats['total_orders'] ?? 0,
            'aov'            => $orderStats['aov'] ?? 0,
            'revenue_growth' => $revGrowth,
            'volume_growth'  => $volGrowth
        ];
    }

    public function getProductRankings(): array {
        return $this->db->query("
            SELECT product_name, SUM(units) as total_units, SUM(total_price) as gross_sales 
            FROM sales 
            WHERE strftime('%Y-%m', sold_at) = strftime('%Y-%m', 'now')
            GROUP BY product_name 
            ORDER BY gross_sales DESC
        ")->fetchAll();
    }
}

// ==========================================
// 3. Application Workspace Controller
// ==========================================
class SalesDashboardApp {
    private SalesRepository $repo;

    public function __construct() {
        $this->repo = new SalesRepository();
    }

    public function run(): void {
        while (true) {
            CliUI::header("Executive Revenue Analytics", "Current Billing Cycle Tracking Node");
            
            // Generate and output the core KPI matrix block instantly on load
            $kpis = $this->repo->getSummaryKpis();
            CliUI::drawKpiMatrix($kpis);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Generate Product Volume Performance Rankings\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Inject Real-Time Production Transaction (Mock Stream)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect analytics server context\n\n";

            switch (CliUI::prompt("Select System Route")) {
                case '1': $this->viewProductRankings(); break;
                case '2': $this->streamMockTransaction(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Analytics database links severed gracefully.\n" . CliUI::RESET;
                    exit(0);
                default:
                    // Soft validation error handling loops back without crashing the session
                    continue 2;
            }
        }
    }

    private function viewProductRankings(): void {
        CliUI::header("Product Performance Matrix");
        $rankings = $this->repo->getProductRankings();

        // Format raw mathematical floats into clean presentation currencies
        foreach ($rankings as &$row) {
            $row['gross_sales'] = "$" . number_format((float)$row['gross_sales'], 2);
            $row['total_units'] = number_format((int)$row['total_units']) . " units";
        }

        CliUI::drawTable($rankings, [
            'product_name' => 'Product Name / SKU Nomenclature',
            'total_units'  => 'Volume Sold',
            'gross_sales'  => 'Gross Captured Yield'
        ]);
        CliUI::pause();
    }

    private function streamMockTransaction(): void {
        CliUI::header("Transaction Simulation Injector");
        
        echo " Select product family line to stream:\n";
        echo "  [1] Enterprise Cloud Subscription ($49.99)\n";
        echo "  [2] Hardware Security Module ($299.00)\n\n";
        
        $choice = CliUI::prompt("Select item line");
        
        $product = $choice === '2' ? 'Hardware Security Module' : 'Enterprise Cloud Subscription';
        $price   = $choice === '2' ? 299.00 : 49.99;

        $qtyInput = CliUI::prompt("Enter volume package transaction quantity count");
        $qty = is_numeric($qtyInput) && (int)$qtyInput > 0 ? (int)$qtyInput : 1;

        // Perform memory-safe transactional write mapping
        $this->repo->injectRandomSale($product, $qty, $price);
        
        echo "\n \e[32m✔ Live transaction safely committed to storage ledger.\e[0m\n";
        sleep(1);
    }
}

// ==========================================
// 4. Runtime System Verification Bootstrap
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System error: Analytics frameworks can only launch from dedicated shell configurations.");
}

try {
    $dashboard = new SalesDashboardApp();
    $dashboard->run();
} catch (Exception $e) {
    echo "\n\e[31m\e[1mFatal Kernel Reporting Exception: \e[0m" . $e->getMessage() . "\n";
    exit(1);
}
