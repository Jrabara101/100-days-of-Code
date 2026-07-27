#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - E-Commerce Abandoned Cart Recovery Engine
 * 
 * Usage:
 *   php cart_recovery.php          (Interactive Store Manager Dashboard)
 *   php cart_recovery.php --cron   (Headless Background Reminder Dispatcher)
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
        $input = trim((string)fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main dashboard..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[RECOVERY-WORKER] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'RECOVERED', 'CHECKED_OUT' => self::GREEN . self::BOLD . " RECOVERED " . self::RESET,
            'ACTIVE', 'BROWSING'       => self::CYAN . "  ACTIVE   " . self::RESET,
            'ABANDONED'                => self::YELLOW . self::BOLD . " ABANDONED " . self::RESET,
            'LOST'                     => self::RED . self::BOLD . "   LOST    " . self::RESET,
            default                    => $status
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
class CartRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/ecommerce_carts.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Customer Profiles
        $this->db->exec("CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL
        )");

        // Shopping Carts
        $this->db->exec("CREATE TABLE IF NOT EXISTS carts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            status TEXT DEFAULT 'ACTIVE', -- ACTIVE, RECOVERED, LOST
            total_value REAL DEFAULT 0.00,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        )");

        // Idempotent Escalation Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS cart_reminders_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cart_id INTEGER NOT NULL,
            tier_level TEXT NOT NULL, -- TIER_1, TIER_2, TIER_3
            dispatched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cart_id) REFERENCES carts(id),
            UNIQUE(cart_id, tier_level)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_cart_status_time ON carts(status, updated_at)");

        // Pre-seed realistic timeline data if clean
        if ($this->db->query("SELECT COUNT(*) FROM customers")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        $now = time();
        
        $cStmt = $this->db->prepare("INSERT INTO customers (full_name, email) VALUES (?, ?)");
        $cStmt->execute(['Alice Vance', 'alice@example.com']);
        $cStmt->execute(['Bob Smith', 'bob@example.com']);
        $cStmt->execute(['Charlie Brown', 'charlie@example.com']);
        $cStmt->execute(['Diana Prince', 'diana@example.com']);

        $cartStmt = $this->db->prepare("INSERT INTO carts (customer_id, status, total_value, updated_at) VALUES (?, ?, ?, ?)");
        
        // Cart 1: Active, updated 15 mins ago (Should NOT trigger reminder yet)
        $cartStmt->execute([1, 'ACTIVE', 1299.99, date('Y-m-d H:i:s', $now - 900)]);
        
        // Cart 2: Abandoned, updated 2 hours ago (Candidate for TIER_1)
        $cartStmt->execute([2, 'ACTIVE', 45.50, date('Y-m-d H:i:s', $now - 7200)]);
        
        // Cart 3: Abandoned, updated 26 hours ago (Candidate for TIER_2)
        $cartStmt->execute([3, 'ACTIVE', 350.00, date('Y-m-d H:i:s', $now - 93600)]);
        
        // Cart 4: Recovered (Successfully checked out, proves metrics calculation)
        $cartStmt->execute([4, 'RECOVERED', 2100.00, date('Y-m-d H:i:s', $now - 172800)]);
    }

    public function getEligibleAbandonedCarts(): array {
        // Fetch all ACTIVE carts where the last update was more than 1 hour ago
        return $this->db->query("
            SELECT c.id, c.total_value, c.updated_at, cu.full_name, cu.email,
                   CAST((julianday('now') - julianday(c.updated_at)) * 24 AS INTEGER) as idle_hours
            FROM carts c
            JOIN customers cu ON c.customer_id = cu.id
            WHERE c.status = 'ACTIVE' 
              AND c.updated_at <= datetime('now', '-1 hour')
            ORDER BY c.updated_at ASC
        ")->fetchAll();
    }

    public function getCartRegistry(): array {
        return $this->db->query("
            SELECT c.id, cu.full_name, c.total_value, c.status, c.updated_at,
                   CAST((julianday('now') - julianday(c.updated_at)) * 24 AS INTEGER) as idle_hours
            FROM carts c
            JOIN customers cu ON c.customer_id = cu.id
            ORDER BY c.updated_at DESC LIMIT 20
        ")->fetchAll();
    }

    public function getFinancialMetrics(): array {
        $stmt = $this->db->query("
            SELECT 
                SUM(CASE WHEN status = 'RECOVERED' THEN total_value ELSE 0 END) as recovered_revenue,
                SUM(CASE WHEN status = 'ACTIVE' THEN total_value ELSE 0 END) as pending_revenue,
                SUM(CASE WHEN status = 'LOST' THEN total_value ELSE 0 END) as lost_revenue
            FROM carts
        ");
        return $stmt->fetch();
    }

    public function checkoutCart(int $cartId): void {
        $stmt = $this->db->prepare("UPDATE carts SET status = 'RECOVERED', updated_at = datetime('now') WHERE id = ?");
        $stmt->execute([$cartId]);
    }

    public function checkReminderSent(int $cartId, string $tier): bool {
        $stmt = $this->db->prepare("SELECT 1 FROM cart_reminders_log WHERE cart_id = ? AND tier_level = ? LIMIT 1");
        $stmt->execute([$cartId, $tier]);
        return (bool)$stmt->fetchColumn();
    }

    /**
     * Atomically executes a reminder block, ensuring concurrency locks block double-dispatches.
     */
    public function logReminderAtomically(int $cartId, string $tier): bool {
        try {
            $stmt = $this->db->prepare("INSERT INTO cart_reminders_log (cart_id, tier_level) VALUES (?, ?)");
            $stmt->execute([$cartId, $tier]);
            return true;
        } catch (PDOException $e) {
            // Unique constraint violation means another worker already processed this tier
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                return false;
            }
            throw $e;
        }
    }
}

// ==========================================
// 3. Communications Dispatcher Service
// ==========================================
class EmailNotificationDispatcher {
    public static function sendRecoveryEmail(array $cart, string $tier): bool {
        // Simulate network API transmission latency to external ESP (e.g., SendGrid/Mailgun)
        usleep(150000);

        $subject = match($tier) {
            'TIER_1' => "Did you forget something, {$cart['full_name']}?",
            'TIER_2' => "Complete your purchase and get 10% off today!",
            'TIER_3' => "Final Notice: Your cart is about to expire."
        };

        return true; // Assume success for structural simulation
    }
}

// ==========================================
// 4. Core Recovery Workflow Engine
// ==========================================
class CartRecoveryApp {
    private CartRepository $repo;

    public function __construct() {
        $this->repo = new CartRepository();
    }

    public function launchDashboard(): void {
        while (true) {
            $metrics = $this->repo->getFinancialMetrics();
            $recovered = $metrics['recovered_revenue'] ?? 0;
            $pending   = $metrics['pending_revenue'] ?? 0;
            $lost      = $metrics['lost_revenue'] ?? 0;
            
            $yield = ($recovered + $lost) > 0 ? round(($recovered / ($recovered + $lost)) * 100, 1) : 0;

            CliUI::header("E-Commerce Cart Recovery Center", "Revenue Retention & Metrics");
            
            echo "  " . CliUI::BOLD . "FINANCIAL TELEMETRY:" . CliUI::RESET . "\n";
            echo "  • Total Recovered : " . CliUI::GREEN . "$" . number_format((float)$recovered, 2) . CliUI::RESET . "\n";
            echo "  • Pipeline at Risk: " . CliUI::YELLOW . "$" . number_format((float)$pending, 2) . CliUI::RESET . "\n";
            echo "  • Recovery Yield  : " . CliUI::CYAN . "{$yield}%" . CliUI::RESET . "\n\n";

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Process Abandoned Carts Matrix (Run Engine)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " View Global Active Cart Registry\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Simulate Customer Checkout (Test Recovery Analytics)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Terminate Dashboard Session\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->executeRecoverySweep(false); CliUI::pause(); break;
                case '2': $this->viewRegistry(); break;
                case '3': $this->simulateCheckoutFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "E-Commerce tracking tools unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    public function executeRecoverySweep(bool $headlessMode = true): void {
        if ($headlessMode) {
            CliUI::stepLog("Querying active cart states for idle abandonment thresholds...");
        } else {
            echo "Scanning cart timeline vectors...\n";
        }

        $candidates = $this->repo->getEligibleAbandonedCarts();
        if (empty($candidates)) {
            if ($headlessMode) {
                CliUI::stepLog("No eligible abandoned carts detected inside targeting parameters.");
            } else {
                CliUI::info("Zero active carts have breached the 1-hour abandonment threshold.");
            }
            return;
        }

        $processed = 0;
        foreach ($candidates as $cart) {
            // Determine Tier Escalation Target
            $idle = (int)$cart['idle_hours'];
            $tier = 'NONE';
            
            if ($idle >= 72) { $tier = 'TIER_3'; }
            elseif ($idle >= 24) { $tier = 'TIER_2'; }
            elseif ($idle >= 1) { $tier = 'TIER_1'; }

            if ($tier === 'NONE') continue;

            // Idempotency Check (Read layer)
            if ($this->repo->checkReminderSent((int)$cart['id'], $tier)) {
                continue; // This specific tier was already dispatched for this cart
            }

            // Atomic Lock & Dispatch (Write layer)
            if ($this->repo->logReminderAtomically((int)$cart['id'], $tier)) {
                EmailNotificationDispatcher::sendRecoveryEmail($cart, $tier);
                
                $msg = "Dispatched [{$tier}] sequence to {$cart['full_name']} (Cart #{$cart['id']} | Idle: {$idle} hrs | Val: $" . number_format((float)$cart['total_value'], 2) . ")";
                if ($headlessMode) {
                    CliUI::stepLog($msg);
                } else {
                    echo "  " . CliUI::GREEN . "✔" . CliUI::RESET . " " . $msg . "\n";
                }
                $processed++;
            }
            
            usleep(50000); // 50ms execution throttle to protect SMTP endpoints
        }

        $summary = "Recovery pipeline sweep completed. Messages transmitted: {$processed}";
        if ($headlessMode) {
            CliUI::stepLog($summary);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $summary . CliUI::RESET . "\n";
        }
    }

    private function viewRegistry(): void {
        CliUI::header("Global Cart Status Registry");
        $registry = $this->repo->getCartRegistry();

        $tableData = [];
        foreach ($registry as $c) {
            $statusLabel = $c['status'] === 'ACTIVE' && $c['idle_hours'] >= 1 ? 'ABANDONED' : $c['status'];

            $tableData[] = [
                'id'       => $c['id'],
                'customer' => $c['full_name'],
                'value'    => "$" . number_format((float)$c['total_value'], 2),
                'idle'     => $c['idle_hours'] . " hrs",
                'status'   => CliUI::statusBadge($statusLabel)
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'customer' => 'Customer', 'value' => 'Cart Value', 'idle' => 'Idle Aging', 'status' => 'Computed Status'
        ]);

        CliUI::pause();
    }

    private function simulateCheckoutFlow(): void {
        CliUI::header("Simulate Customer Checkout Recovery");
        
        $registry = $this->repo->getCartRegistry();
        $actives = array_filter($registry, fn($c) => $c['status'] === 'ACTIVE');
        
        if (empty($actives)) {
            CliUI::error("No active/abandoned carts available to simulate checkout.");
            CliUI::pause();
            return;
        }

        $id = (int)CliUI::prompt("Enter Active Cart ID to mark as checked out");
        
        $validIds = array_column($actives, 'id');
        if (!in_array($id, $validIds, true)) {
            CliUI::error("Invalid ID or Cart is not in an ACTIVE state.");
            CliUI::pause();
            return;
        }

        $this->repo->checkoutCart($id);
        CliUI::success("Transaction successful! Revenue has been registered and cart marked RECOVERED.");
        CliUI::pause();
    }
}

// ==========================================
// 5. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Monitoring Guard: Cart recovery engines require standard console CLI environments.");
}

$app = new CartRecoveryApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--cron') {
    $app->executeRecoverySweep(true);
} else {
    $app->launchDashboard();
}
