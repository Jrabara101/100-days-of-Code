#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI Newsletter Subscriber Manager
 *
 * Usage: php newsletter.php
 *
 * Features:
 *  - Stateful interactive loop (no re-running the script)
 *  - SQLite data layer via PDO with prepared statements
 *  - UPSERT logic (re-activates unsubscribed emails gracefully)
 *  - Status toggle (ACTIVE / UNSUBSCRIBED) — never hard-deletes
 *  - Email validation before any DB write
 *  - Dynamic ASCII/Unicode table renderer with ANSI-aware width calc
 *  - CSV export compatible with Mailchimp, SendGrid, AWS SES
 */

// ==========================================
// 1. Visual Styling & UI Engine
// ==========================================
class CliUI {
    const RESET   = "\e[0m";
    const BOLD    = "\e[1m";
    const DIM     = "\e[2m";
    const GREEN   = "\e[32m";
    const RED     = "\e[31m";
    const CYAN    = "\e[36m";
    const YELLOW  = "\e[33m";
    const MAGENTA = "\e[35m";

    public static function clearScreen(): void {
        echo "\033[2J\033[;H";
    }

    public static function header(string $title, string $subtitle = ""): void {
        self::clearScreen();
        echo self::MAGENTA . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        if ($subtitle) {
            // Strip ANSI for padding calculation, then re-insert raw subtitle
            $clean = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', $subtitle);
            $padLen = max(0, 71 - strlen($clean));
            $leftPad  = (int)floor($padLen / 2);
            $rightPad = (int)ceil($padLen / 2);
            echo "║ " . str_repeat(" ", $leftPad) . $subtitle . str_repeat(" ", $rightPad) . " ║\n";
        }
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function prompt(string $message, string $default = ""): string {
        $defLabel = $default ? self::DIM . " [{$default}]" . self::RESET : "";
        echo self::BOLD . $message . $defLabel . self::RESET . ": ";
        $input = trim(fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function success(string $msg): void {
        echo "\n" . self::GREEN . self::BOLD . "✔ " . $msg . self::RESET . "\n";
        sleep(1);
    }

    public static function error(string $msg): void {
        echo "\n" . self::RED . self::BOLD . "✖ " . $msg . self::RESET . "\n";
        sleep(1);
    }

    public static function warning(string $msg): void {
        echo "\n" . self::YELLOW . "⚠ " . $msg . self::RESET . "\n";
        sleep(1);
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main menu..." . self::RESET;
        fgets(STDIN);
    }

    public static function badge(string $status): string {
        return match (strtoupper($status)) {
            'ACTIVE'       => self::GREEN . " ACTIVE " . self::RESET,
            'UNSUBSCRIBED' => self::RED   . " OPT-OUT" . self::RESET,
            default        => $status
        };
    }

    /**
     * Strips ANSI escape codes to calculate the true visible string length.
     */
    private static function visibleLength(string $str): int {
        return strlen(preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', $str));
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "  No subscribers found.\n" . self::RESET;
            return;
        }

        // ── Calculate dynamic column widths ────────────────────────────
        $widths = [];
        foreach ($headers as $key => $label) {
            $widths[$key] = strlen($label);
        }
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $clean = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
                $widths[$key] = max($widths[$key], min(strlen($clean), 35));
            }
        }

        $drawSeparator = function (string $l, string $m, string $r, string $ch) use ($headers, $widths): void {
            $segments = [];
            foreach ($headers as $key => $label) {
                $segments[] = str_repeat($ch, $widths[$key] + 2);
            }
            echo $l . implode($m, $segments) . $r . "\n";
        };

        // ── Header ─────────────────────────────────────────────────────
        $drawSeparator("┌", "┬", "┐", "─");
        echo "│ ";
        foreach ($headers as $key => $label) {
            echo self::BOLD . self::CYAN . str_pad($label, $widths[$key]) . self::RESET . " │ ";
        }
        echo "\n";
        $drawSeparator("├", "┼", "┤", "─");

        // ── Rows ───────────────────────────────────────────────────────
        foreach ($data as $row) {
            echo "│ ";
            foreach ($headers as $key => $label) {
                $content = (string)($row[$key] ?? '');
                $clean   = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', $content);

                // Truncate long values
                if (strlen($clean) > 35) {
                    $content = substr($clean, 0, 32) . "...";
                    $clean   = $content;
                }

                $padding = str_repeat(" ", max(0, $widths[$key] - strlen($clean)));
                echo $content . $padding . " │ ";
            }
            echo "\n";
        }

        $drawSeparator("└", "┴", "┘", "─");
        echo "\n";
    }
}

// ==========================================
// 2. Database & Data Repository
// ==========================================
class SubscriberRepository {
    private PDO $db;

    public function __construct() {
        $dbPath   = __DIR__ . '/newsletter_data.sqlite';
        $this->db = new PDO("sqlite:" . $dbPath);
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initDb();
    }

    private function initDb(): void {
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS subscribers (
                id         INTEGER  PRIMARY KEY AUTOINCREMENT,
                email      TEXT     UNIQUE NOT NULL,
                name       TEXT,
                status     TEXT     DEFAULT 'ACTIVE',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }

    // ── Stats ──────────────────────────────────────────────────────────
    public function getStats(): array {
        return [
            'total'  => $this->db->query("SELECT COUNT(*) FROM subscribers")->fetchColumn(),
            'active' => $this->db->query("SELECT COUNT(*) FROM subscribers WHERE status = 'ACTIVE'")->fetchColumn(),
            'unsub'  => $this->db->query("SELECT COUNT(*) FROM subscribers WHERE status = 'UNSUBSCRIBED'")->fetchColumn(),
        ];
    }

    // ── Add / Re-activate ──────────────────────────────────────────────
    public function addSubscriber(string $email, string $name): bool|string {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return "Invalid email format.";
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO subscribers (email, name, status) VALUES (?, ?, 'ACTIVE')
                ON CONFLICT(email) DO UPDATE SET status = 'ACTIVE', name = excluded.name
            ");
            $stmt->execute([strtolower($email), $name]);
            return true;
        } catch (PDOException $e) {
            return "Database error: " . $e->getMessage();
        }
    }

    // ── Soft-delete (UNSUBSCRIBE) ──────────────────────────────────────
    public function unsubscribe(string $email): bool {
        $stmt = $this->db->prepare("UPDATE subscribers SET status = 'UNSUBSCRIBED' WHERE email = ?");
        $stmt->execute([strtolower($email)]);
        return $stmt->rowCount() > 0;
    }

    // ── Fetch ──────────────────────────────────────────────────────────
    public function getAllSubscribers(string $statusFilter = 'ALL'): array {
        $sql = "SELECT id, name, email, created_at, status FROM subscribers ";
        if ($statusFilter !== 'ALL') {
            $sql .= "WHERE status = :status ";
        }
        $sql .= "ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        if ($statusFilter !== 'ALL') {
            $stmt->execute(['status' => $statusFilter]);
        } else {
            $stmt->execute();
        }

        $data = $stmt->fetchAll();

        // Decorate rows for UI rendering
        foreach ($data as &$row) {
            $row['status_badge'] = CliUI::badge($row['status']);
            $row['date']         = date('Y-m-d', strtotime($row['created_at']));
        }
        unset($row);

        return $data;
    }

    // ── Export ─────────────────────────────────────────────────────────
    public function exportToCsv(string $filename): int {
        $data = $this->db
            ->query("SELECT id, name, email, status, created_at FROM subscribers ORDER BY created_at DESC")
            ->fetchAll();

        if (empty($data)) {
            return 0;
        }

        $file = fopen($filename, 'w');
        fputcsv($file, array_keys($data[0]));   // Column headers
        foreach ($data as $row) {
            fputcsv($file, $row);
        }
        fclose($file);

        return count($data);
    }
}

// ==========================================
// 3. Application Controller (The Loop)
// ==========================================
class NewsletterApp {
    private SubscriberRepository $repo;

    public function __construct() {
        $this->repo = new SubscriberRepository();
    }

    // ── Main loop ──────────────────────────────────────────────────────
    public function run(): void {
        while (true) {
            $stats    = $this->repo->getStats();
            $subtitle =
                "Active: "   . CliUI::GREEN . "{$stats['active']}" . CliUI::RESET .
                " | Opt-Outs: " . CliUI::RED   . "{$stats['unsub']}"  . CliUI::RESET .
                " | Total: {$stats['total']}";

            CliUI::header("Newsletter Manager", $subtitle);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Add New Subscriber\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Process Unsubscribe\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " View Active List\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " View All (Including Opt-Outs)\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Export to CSV\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Exit\n\n";

            switch (CliUI::prompt("Select Action")) {
                case '1': $this->addFlow();           break;
                case '2': $this->unsubscribeFlow();   break;
                case '3': $this->viewList('ACTIVE');  break;
                case '4': $this->viewList('ALL');     break;
                case '5': $this->exportFlow();        break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::MAGENTA . "Session closed. Goodbye!\n" . CliUI::RESET;
                    exit(0);
                default:
                    CliUI::error("Invalid choice. Please enter a number from the menu.");
            }
        }
    }

    // ── Add subscriber flow ────────────────────────────────────────────
    private function addFlow(): void {
        CliUI::header("Add Subscriber");
        $email = CliUI::prompt("Email Address");
        if (empty($email)) {
            CliUI::warning("No email entered — returning to menu.");
            return;
        }

        $name   = CliUI::prompt("Name (Optional)");
        $result = $this->repo->addSubscriber($email, $name);

        if ($result === true) {
            CliUI::success("{$email} has been added / re-activated on the active list.");
        } else {
            CliUI::error($result);
        }
    }

    // ── Unsubscribe flow ───────────────────────────────────────────────
    private function unsubscribeFlow(): void {
        CliUI::header("Process Unsubscribe");
        echo CliUI::DIM . "  Marks an email as opted-out without deleting their history.\n\n" . CliUI::RESET;

        $email = CliUI::prompt("Email Address to Opt-Out");
        if (empty($email)) {
            CliUI::warning("No email entered — returning to menu.");
            return;
        }

        if ($this->repo->unsubscribe($email)) {
            CliUI::success("{$email} has been successfully unsubscribed.");
        } else {
            CliUI::warning("{$email} was not found in the database.");
        }
    }

    // ── View list ──────────────────────────────────────────────────────
    private function viewList(string $filter): void {
        $title = $filter === 'ACTIVE' ? "Active Subscribers" : "All Database Records";
        CliUI::header($title);

        $data = $this->repo->getAllSubscribers($filter);

        CliUI::drawTable($data, [
            'id'           => 'ID',
            'name'         => 'Name',
            'email'        => 'Email Address',
            'date'         => 'Subscribed',
            'status_badge' => 'Status',
        ]);

        CliUI::pause();
    }

    // ── Export CSV flow ────────────────────────────────────────────────
    private function exportFlow(): void {
        CliUI::header("Export Database");
        $filename = CliUI::prompt("Enter export filename", "newsletter_export.csv");

        // Guarantee .csv extension
        if (!str_ends_with(strtolower($filename), '.csv')) {
            $filename .= '.csv';
        }

        $fullPath = __DIR__ . DIRECTORY_SEPARATOR . $filename;
        echo "\n" . CliUI::CYAN . "  Generating {$filename}..." . CliUI::RESET . "\n";

        $count = $this->repo->exportToCsv($fullPath);

        if ($count > 0) {
            CliUI::success("Export complete! {$count} records saved to {$filename}");
        } else {
            CliUI::warning("The database is empty. Nothing to export.");
        }

        CliUI::pause();
    }
}

// ==========================================
// 4. Bootstrap
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("This application must be run from the command line.\n");
}

try {
    $app = new NewsletterApp();
    $app->run();
} catch (Exception $e) {
    echo "\n\e[31m\e[1mFatal Error: \e[0m" . $e->getMessage() . "\n";
    exit(1);
}
