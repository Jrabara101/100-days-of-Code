#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Facility Visitor Logbook Engine
 * Usage: php visitor_logbook.php
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

    public static function prompt(string $message, string $default = ""): string {
        $defLabel = $default ? self::DIM . " [{$default}]" . self::RESET : "";
        echo self::BOLD . $message . $defLabel . self::RESET . ": ";
        $input = trim(fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to management console..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo "\n" . self::GREEN . "✔ " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo "\n" . self::RED . "✖ " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . $msg . self::RESET . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'CHECKED_IN'  => self::GREEN . self::BOLD . " ON PREMISES " . self::RESET,
            'CHECKED_OUT' => self::DIM . " CHECKED OUT " . self::RESET,
            default       => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No tracking parameters found matching current context.\n" . self::RESET;
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
// 2. Data Persistence Repository (SQLite)
// ==========================================
class VisitorRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/logbook.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            company TEXT,
            purpose TEXT NOT NULL,
            host_person TEXT NOT NULL,
            check_in_time DATETIME NOT NULL,
            check_out_time DATETIME DEFAULT NULL,
            status TEXT DEFAULT 'CHECKED_IN'
        )");

        // Index applied directly across state-checking evaluation vectors
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_security_status ON visitors(status, check_in_time)");

        // Automated Sample Data Seeding Protocol
        if ($this->db->query("SELECT COUNT(*) FROM visitors")->fetchColumn() == 0) {
            $this->seedSampleLogs();
        }
    }

    private function seedSampleLogs(): void {
        $stmt = $this->db->prepare("
            INSERT INTO visitors (full_name, company, purpose, host_person, check_in_time, check_out_time, status) 
            VALUES (?, ?, ?, ?, datetime('now', ?), datetime('now', ?), ?)
        ");

        // Sample Row 1: Archived Yesterday Historical Log
        $stmt->execute(['Alice Vance', 'Cyberdyne Systems', 'System Architecture Audit', 'Dr. Miles Dyson', '-26 hours', '-24 hours', 'CHECKED_OUT']);
        
        // Sample Row 2: Archived Earlier Today Log
        $stmt->execute(['Marcus Brody', 'National Museum', 'Artifact Authentication', 'Indiana Jones', '-6 hours', '-4 hours', 'CHECKED_OUT']);
        
        // Sample Row 3: Active Live Visitor On Premises
        $stmt->execute(['Elena Fisher', 'Uncharted Media', 'Press Interview Profile', 'Nathan Drake', '-2 hours', null, 'CHECKED_IN']);
        
        // Sample Row 4: Active Live Visitor On Premises
        $stmt->execute(['Bruce Wayne', 'Wayne Enterprises', 'Quarterly Stakeholder Briefing', 'Lucius Fox', '-45 minutes', null, 'CHECKED_IN']);
    }

    public function getActiveOnPremises(): array {
        return $this->db->query("SELECT id, full_name, company, host_person, check_in_time FROM visitors WHERE status = 'CHECKED_IN' ORDER BY check_in_time DESC")->fetchAll();
    }

    public function getCompleteHistory(): array {
        return $this->db->query("SELECT id, full_name, company, purpose, check_in_time, check_out_time, status FROM visitors ORDER BY check_in_time DESC LIMIT 50")->fetchAll();
    }

    public function registerCheckIn(string $name, string $company, string $purpose, string $host): void {
        $stmt = $this->db->prepare("INSERT INTO visitors (full_name, company, purpose, host_person, check_in_time) VALUES (?, ?, ?, ?, datetime('now'))");
        $stmt->execute([$name, $company, $purpose, $host]);
    }

    public function executeCheckOut(int $id): bool|string {
        $this->db->beginTransaction();
        try {
            // Validate structural existence and current state criteria bounds
            $stmt = $this->db->prepare("SELECT status FROM visitors WHERE id = ?");
            $stmt->execute([$id]);
            $currentStatus = $stmt->fetchColumn();

            if (!$currentStatus) {
                $this->db->rollBack();
                return "Visitor log sequence record matching ID #{$id} cannot be resolved.";
            }

            if ($currentStatus === 'CHECKED_OUT') {
                $this->db->rollBack();
                return "Anomaly Guard: Selected visitor has already processed checkout structures.";
            }

            // Commit atomic state alteration mutations
            $update = $this->db->prepare("UPDATE visitors SET status = 'CHECKED_OUT', check_out_time = datetime('now') WHERE id = ?");
            $update->execute([$id]);

            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            return "Database core fault: " . $e->getMessage();
        }
    }
}

// ==========================================
// 3. System Core Loop Architecture
// ==========================================
class LogbookEngineApp {
    private VisitorRepository $repo;

    public function __construct() {
        $this->repo = new VisitorRepository();
    }

    public function run(): void {
        while (true) {
            // Count current real-time operations presence volume to inject into layout subtitles
            $activeCount = count($this->repo->getActiveOnPremises());
            CliUI::header("Facility Security Logbook Node", "Active Personnel On Premises: {$activeCount}");
            
            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Register New Visitor Check-In\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Process Visitor Check-Out / Departure\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Output Active On-Premises Roster\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Output Global Audit Ledger History\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Terminate terminal monitoring session\n\n";

            switch (CliUI::prompt("Select Operation Routing Vector")) {
                case '1': $this->checkInFlow(); break;
                case '2': $this->checkOutFlow(); break;
                case '3': $this->viewActiveOnPremises(); break;
                case '4': $this->viewGlobalHistory(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Security log monitoring context cleanly closed.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function checkInFlow(): void {
        CliUI::header("Visitor Registration Portal");
        
        $name = CliUI::prompt("Visitor Full Name");
        if (empty($name)) { CliUI::error("Visitor name parameter cannot be empty."); CliUI::pause(); return; }
        
        $company = CliUI::prompt("Corporate Affiliation / Company", "Independent/Guest");
        
        $purpose = CliUI::prompt("Purpose of Visit (e.g., Audit, Maintenance)");
        if (empty($purpose)) { CliUI::error("Audit rules dictate clear statements of visit purposes."); CliUI::pause(); return; }
        
        $host = CliUI::prompt("Internal Sponsor / Host Employee");
        if (empty($host)) { CliUI::error("Access denied. Every visitor requires a certified internal host."); CliUI::pause(); return; }

        $this->repo->registerCheckIn($name, $company, $purpose, $host);
        CliUI::success("Verification parameters cleared. Session registered as CHECKED_IN.");
    }

    private function checkOutFlow(): void {
        CliUI::header("Process Facility Departure");
        $active = $this->repo->getActiveOnPremises();

        if (empty($active)) {
            CliUI::info("Facility sweeps clear. Zero active visitor entities registered on premises.");
            CliUI::pause();
            return;
        }

        CliUI::drawTable($active, [
            'id' => 'ID', 'full_name' => 'Visitor Name', 'company' => 'Affiliation', 'host_person' => 'Internal Sponsor', 'check_in_time' => 'Checked In (UTC)'
        ]);

        $id = (int)CliUI::prompt("Enter targeting record ID to log departure checkout step");
        
        $executionResult = $this->repo->executeCheckOut($id);
        if ($executionResult === true) {
            CliUI::success("Departure clearance logged. Visitor status flipped to CHECKED_OUT.");
        } else {
            CliUI::error($executionResult);
            CliUI::pause();
        }
    }

    private function viewActiveOnPremises(): void {
        CliUI::header("Active Security Manifest Roster");
        $active = $this->repo->getActiveOnPremises();
        
        CliUI::drawTable($active, [
            'id' => 'Log ID', 'full_name' => 'Visitor Name', 'company' => 'Affiliation', 'host_person' => 'Sponsor Node', 'check_in_time' => 'Timestamp (UTC)'
        ]);
        CliUI::pause();
    }

    private function viewGlobalHistory(): void {
        CliUI::header("Historical Master Access Audit Ledger");
        $history = $this->repo->getCompleteHistory();

        foreach ($history as &$row) {
            $row['status_badge'] = CliUI::statusBadge($row['status']);
            $row['check_out_time'] = $row['check_out_time'] ?? CliUI::DIM . "N/A - Current" . CliUI::RESET;
        }

        CliUI::drawTable($history, [
            'id' => 'ID', 'full_name' => 'Name', 'company' => 'Affiliation', 'purpose' => 'Reason Vector', 'check_in_time' => 'Inbound Time', 'check_out_time' => 'Outbound Time', 'status_badge' => 'State Badge'
        ]);
        CliUI::pause();
    }
}

// ==========================================
// 4. Runtime Ingestion Guard Bootstrap
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System monitors require standard runtime terminal shell architectures to hook console outputs.");
}

try {
    $engine = new LogbookEngineApp();
    $engine->run();
} catch (Exception $e) {
    echo "\n\e[31m\e[1mFatal Operations Exception: \e[0m" . $e->getMessage() . "\n";
    exit(1);
}
