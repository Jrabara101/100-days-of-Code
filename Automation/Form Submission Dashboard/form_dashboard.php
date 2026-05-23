#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI Form Submissions Dashboard
 * 
 * Usage: php form_dashboard.php
 */

// ==========================================
// 1. Visual Styling & UI Engine
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

    public static function clearScreen(): void {
        echo "\033[2J\033[;H";
    }

    public static function header(string $title, string $stats = ""): void {
        self::clearScreen();
        echo self::BLUE . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        if ($stats) {
            echo "║ " . str_pad($stats, 71, " ", STR_PAD_BOTH) . " ║\n";
        }
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function badge(string $status): string {
        return match (strtoupper($status)) {
            'UNREAD' => self::RED . " UNREAD " . self::RESET,
            'READ' => self::YELLOW . "  READ  " . self::RESET,
            'RESOLVED' => self::GREEN . "RESOLVED" . self::RESET,
            default => $status
        };
    }

    public static function prompt(string $message, string $default = ""): string {
        $defLabel = $default ? self::DIM . " [{$default}]" . self::RESET : "";
        echo self::BOLD . $message . $defLabel . self::RESET . ": ";
        $input = trim(fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to dashboard..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo "\n" . self::GREEN . "✔ " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo "\n" . self::RED . "✖ " . $msg . self::RESET . "\n"; sleep(1); }

    public static function drawTable(array $data): void {
        if (empty($data)) {
            echo self::DIM . "No submissions found.\n" . self::RESET;
            return;
        }

        // Hardcoded headers for the list view to maintain clean UI
        $headers = ['ID', 'Form', 'Submitter', 'Date', 'Status'];
        $widths = [4, 15, 20, 12, 10]; 

        $drawSeparator = function($l, $m, $r, $lineChar) use ($widths) {
            $segments = array_map(fn($w) => str_repeat($lineChar, $w + 2), $widths);
            echo $l . implode($m, $segments) . $r . "\n";
        };

        $drawSeparator("┌", "┬", "┐", "─");
        
        // Headers
        echo "│ ";
        foreach ($headers as $i => $h) {
            echo self::BOLD . self::CYAN . str_pad($h, $widths[$i]) . self::RESET . " │ ";
        }
        echo "\n";
        $drawSeparator("├", "┼", "┤", "─");

        // Rows
        foreach ($data as $row) {
            echo "│ ";
            echo str_pad($row['id'], $widths[0]) . " │ ";
            echo str_pad(substr($row['form_name'], 0, $widths[1]), $widths[1]) . " │ ";
            echo str_pad(substr($row['submitter_name'], 0, $widths[2]), $widths[2]) . " │ ";
            echo str_pad(date('M j, y', strtotime($row['created_at'])), $widths[3]) . " │ ";
            // Badge calculation
            $badge = self::badge($row['status']);
            // Badges have hidden ANSI characters, str_pad messes them up. 
            // We know the visible string is 8 chars, so we pad the difference visually.
            $padding = str_repeat(" ", max(0, $widths[4] - 8));
            echo $badge . $padding . " │ \n";
        }
        $drawSeparator("└", "┴", "┘", "─");
        echo "\n";
    }
}

// ==========================================
// 2. Database & Repository
// ==========================================
class SubmissionRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/forms_data.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initDb();
    }

    private function initDb(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            form_name TEXT NOT NULL,
            submitter_name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'UNREAD',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Seed data if empty
        if ($this->db->query("SELECT COUNT(*) FROM submissions")->fetchColumn() == 0) {
            $this->seedData();
        }
    }

    private function seedData(): void {
        $stmt = $this->db->prepare("INSERT INTO submissions (form_name, submitter_name, email, message, status, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))");
        $mock = [
            ['Contact Us', 'Alice Johnson', 'alice@example.com', 'I need help resetting my password. The email never arrives.', 'UNREAD', '-10 minutes'],
            ['Sales Inquiry', 'Bob Smith', 'bob@enterprise.com', 'We are looking for an enterprise license for 500 users. Please call me.', 'UNREAD', '-2 hours'],
            ['Support', 'Charlie Davis', 'charlie@demo.net', 'The latest update broke the export feature. It just returns a 500 error.', 'READ', '-1 day'],
            ['Contact Us', 'Diana Prince', 'diana@amazon.org', 'Just wanted to say your new features look amazing! Keep it up.', 'RESOLVED', '-3 days'],
        ];
        foreach ($mock as $row) {
            $stmt->execute($row);
        }
    }

    public function getDashboardStats(): array {
        return [
            'total' => $this->db->query("SELECT COUNT(*) FROM submissions")->fetchColumn(),
            'unread' => $this->db->query("SELECT COUNT(*) FROM submissions WHERE status = 'UNREAD'")->fetchColumn()
        ];
    }

    public function getAll(string $filter = 'ALL'): array {
        $sql = "SELECT id, form_name, submitter_name, created_at, status FROM submissions ";
        if ($filter !== 'ALL') {
            $sql .= "WHERE status = :status ";
        }
        $sql .= "ORDER BY created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        if ($filter !== 'ALL') $stmt->execute(['status' => $filter]);
        else $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM submissions WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function updateStatus(int $id, string $status): void {
        $stmt = $this->db->prepare("UPDATE submissions SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
    }

    public function exportToCsv(string $filename): int {
        $data = $this->db->query("SELECT * FROM submissions ORDER BY created_at DESC")->fetchAll();
        if (empty($data)) return 0;

        $file = fopen($filename, 'w');
        fputcsv($file, array_keys($data[0])); // Headers
        foreach ($data as $row) {
            fputcsv($file, $row);
        }
        fclose($file);
        return count($data);
    }
}

// ==========================================
// 3. Application Controller
// ==========================================
class DashboardApp {
    private SubmissionRepository $repo;

    public function __construct() {
        $this->repo = new SubmissionRepository();
    }

    public function run(): void {
        while (true) {
            $stats = $this->repo->getDashboardStats();
            $subtitle = "Total: {$stats['total']} | Unread: " . CliUI::RED . "{$stats['unread']}" . CliUI::RESET;
            CliUI::header("Form Submissions Dashboard", $subtitle);
            
            // Show recent unread by default on the dashboard
            echo CliUI::DIM . "Recent Submissions:\n" . CliUI::RESET;
            CliUI::drawTable($this->repo->getAll());

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Read/View Submission Details\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Filter by Unread Only\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Export Data to CSV\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Exit\n\n";

            switch (CliUI::prompt("Select Action")) {
                case '1': $this->viewSubmission(); break;
                case '2': $this->filterUnread(); break;
                case '3': $this->exportCsv(); break;
                case '0': 
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Session closed.\n" . CliUI::RESET;
                    exit(0);
                default:
                    CliUI::error("Invalid choice.");
            }
        }
    }

    private function viewSubmission(): void {
        $id = (int)CliUI::prompt("Enter Submission ID to read");
        $sub = $this->repo->getById($id);

        if (!$sub) {
            CliUI::error("Submission #{$id} not found.");
            return;
        }

        // Auto-mark as READ if it was UNREAD
        if ($sub['status'] === 'UNREAD') {
            $this->repo->updateStatus($id, 'READ');
            $sub['status'] = 'READ'; // Update local state for display
        }

        CliUI::header("Submission #{$id}", "From: {$sub['form_name']}");
        
        echo CliUI::BOLD . "Submitter: " . CliUI::RESET . "{$sub['submitter_name']} <{$sub['email']}>\n";
        echo CliUI::BOLD . "Date:      " . CliUI::RESET . $sub['created_at'] . "\n";
        echo CliUI::BOLD . "Status:    " . CliUI::RESET . CliUI::badge($sub['status']) . "\n";
        echo str_repeat("─", 75) . "\n\n";
        
        // Wordwrap the message so it doesn't break terminal lines abruptly
        echo wordwrap($sub['message'], 75, "\n") . "\n\n";
        echo str_repeat("─", 75) . "\n";

        echo "\n" . CliUI::DIM . "Workflow Actions:\n" . CliUI::RESET;
        echo " [R] Mark as Resolved\n";
        echo " [U] Mark as Unread\n";
        echo " [Enter] Back to Dashboard\n\n";

        $action = strtoupper(CliUI::prompt("Action"));
        if ($action === 'R') {
            $this->repo->updateStatus($id, 'RESOLVED');
            CliUI::success("Submission marked as RESOLVED.");
        } elseif ($action === 'U') {
            $this->repo->updateStatus($id, 'UNREAD');
            CliUI::success("Submission marked as UNREAD.");
        }
    }

    private function filterUnread(): void {
        CliUI::header("Unread Submissions");
        CliUI::drawTable($this->repo->getAll('UNREAD'));
        CliUI::pause();
    }

    private function exportCsv(): void {
        $filename = CliUI::prompt("Enter filename", "submissions_export.csv");
        if (!str_ends_with($filename, '.csv')) {
            $filename .= '.csv';
        }

        $count = $this->repo->exportCsv($filename);
        if ($count > 0) {
            CliUI::success("Successfully exported {$count} records to {$filename}");
        } else {
            CliUI::error("No data available to export.");
        }
    }
}

// Bootstrap
if (php_sapi_name() !== 'cli') die("This application must be run from the command line.");
(new DashboardApp())->run();
