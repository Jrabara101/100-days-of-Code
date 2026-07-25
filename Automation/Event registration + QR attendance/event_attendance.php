#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Event Registration & QR Attendance Verification Engine
 * 
 * Usage:
 *   php event_attendance.php          (Interactive Staff TUI Workspace)
 *   php event_attendance.php --scan   (Headless Batch Scanner Simulator)
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
    const WHITE_BG = "\e[47m\e[30m";

    public static function clearScreen(): void { echo "\033[2J\033[;H"; }

    public static function header(string $title, string $subtitle = ""): void {
        self::clearScreen();
        echo self::MAGENTA . self::BOLD;
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
        echo "\n" . self::DIM . "Press Enter to return to main workspace..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[GATE-SCANNER] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'CHECKED_IN' => self::GREEN . self::BOLD . " CHECKED IN " . self::RESET,
            'REGISTERED' => self::CYAN . " REGISTERED " . self::RESET,
            'DUPLICATE'  => self::YELLOW . self::BOLD . " DUPLICATE  " . self::RESET,
            'INVALID'    => self::RED . self::BOLD . "  INVALID   " . self::RESET,
            default      => $status
        };
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

    /**
     * Visual Barcode/QR Graphic Renderer for CLI Output
     */
    public static function renderQrBadge(string $token, string $attendeeName): void {
        $hash = md5($token);
        echo "\n" . self::WHITE_BG . "                                        " . self::RESET . "\n";
        echo self::WHITE_BG . "  █▀▀▀▀▀█  ▀█▄█▀█▀  █▀▀▀▀▀█  " . self::RESET . "\n";
        echo self::WHITE_BG . "  █ ███ █  █▀ █ ▀█  █ ███ █  " . self::RESET . "\n";
        echo self::WHITE_BG . "  █ ▀▀▀ █  ▀█▀█▀▀█  █ ▀▀▀ █  " . self::RESET . "\n";
        echo self::WHITE_BG . "  ▀▀▀▀▀▀▀  ▀ ▀ ▀ ▀  ▀▀▀▀▀▀▀  " . self::RESET . "\n";
        
        // Generate pseudo-random matrix lines based on token hash bytes
        for ($i = 0; $i < 3; $i++) {
            $line = "  ";
            for ($j = 0; $j < 27; $j++) {
                $charHex = $hash[($i * 9 + $j) % 32];
                $line .= (hexdec($charHex) % 2 === 0) ? "█" : " ";
            }
            echo self::WHITE_BG . $line . "  " . self::RESET . "\n";
        }

        echo self::WHITE_BG . "  █▀▀▀▀▀█  █▀  ▀▀█  ██ ▀ █▀  " . self::RESET . "\n";
        echo self::WHITE_BG . "  █ ███ █  ▀█▀ █▀▀  ▀▀▀█ ▀█  " . self::RESET . "\n";
        echo self::WHITE_BG . "  █ ▀▀▀ █  ▀ ▀▀▀▀   ▀ ▀▀▀▀▀  " . self::RESET . "\n";
        echo self::WHITE_BG . "                                        " . self::RESET . "\n";
        echo " " . self::BOLD . "ATTENDEE:" . self::RESET . " {$attendeeName}\n";
        echo " " . self::BOLD . "QR TOKEN:" . self::RESET . " " . self::YELLOW . $token . self::RESET . "\n\n";
    }
}

// ==========================================
// 2. Data Persistence Layer (SQLite Isolation)
// ==========================================
class EventRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/event_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Events Master Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            venue TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            event_date DATETIME NOT NULL
        )");

        // Attendees & Ticket Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS attendees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            qr_token TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'REGISTERED', -- REGISTERED, CHECKED_IN, CANCELLED
            registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            checked_in_at DATETIME DEFAULT NULL,
            FOREIGN KEY (event_id) REFERENCES events(id),
            UNIQUE(event_id, email)
        )");

        // Check-in Audit Logs
        $this->db->exec("CREATE TABLE IF NOT EXISTS checkin_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attendee_id INTEGER NOT NULL,
            scanned_token TEXT NOT NULL,
            scan_result TEXT NOT NULL, -- SUCCESS, DUPLICATE_REJECTED, INVALID
            scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (attendee_id) REFERENCES attendees(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_attendee_token ON attendees(qr_token)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_attendee_status ON attendees(event_id, status)");

        // Seed initial event dataset if empty
        if ($this->db->query("SELECT COUNT(*) FROM events")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        $stmt = $this->db->prepare("INSERT INTO events (title, venue, capacity, event_date) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Global Tech Summit 2026', 'Convention Center - Main Hall', 250, '2026-09-15 09:00:00']);

        // Register default attendees
        $this->registerAttendee(1, 'Alice Vance', 'a.vance@techsummit.io');
        $this->registerAttendee(1, 'Marcus Brody', 'm.brody@museum.org');
        $this->registerAttendee(1, 'Elena Fisher', 'e.fisher@journal.com');
    }

    /**
     * Generates a cryptographically secure token and stores the attendee record.
     */
    public function registerAttendee(int $eventId, string $fullName, string $email): array {
        $this->db->beginTransaction();
        try {
            // Check capacity limit
            $evtStmt = $this->db->prepare("
                SELECT capacity, (SELECT COUNT(*) FROM attendees WHERE event_id = ?) as registered 
                FROM events WHERE id = ?
            ");
            $evtStmt->execute([$eventId, $eventId]);
            $evt = $evtStmt->fetch();

            if (!$evt) {
                throw new DomainException("Event ID {$eventId} not found.");
            }

            if ((int)$evt['registered'] >= (int)$evt['capacity']) {
                throw new DomainException("Registration Closed: Event has reached full capacity ({$evt['capacity']}).");
            }

            // Cryptographic Token Generation
            $token = "EVT-2026-" . strtoupper(bin2hex(random_bytes(6)));

            $stmt = $this->db->prepare("
                INSERT INTO attendees (event_id, full_name, email, qr_token) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$eventId, trim($fullName), strtolower(trim($email)), $token]);
            $attendeeId = (int)$this->db->lastInsertId();

            $this->db->commit();
            return ['id' => $attendeeId, 'name' => $fullName, 'token' => $token];

        } catch (PDOException $e) {
            $this->db->rollBack();
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                throw new DomainException("Duplicate Entry: Email [{$email}] is already registered for this event.");
            }
            throw $e;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Atomic QR Code Check-In Processor.
     * Prevents race conditions and double check-ins.
     */
    public function processQrCheckIn(string $token): array {
        $this->db->beginTransaction();
        try {
            // Find attendee by QR token
            $stmt = $this->db->prepare("SELECT * FROM attendees WHERE qr_token = ?");
            $stmt->execute([trim($token)]);
            $attendee = $stmt->fetch();

            if (!$attendee) {
                $this->db->rollBack();
                return [
                    'status' => 'INVALID',
                    'message' => 'Invalid QR Code: Token not recognized in database.',
                    'attendee' => null
                ];
            }

            // Idempotency Check: Already checked in?
            if ($attendee['status'] === 'CHECKED_IN') {
                $this->logAudit((int)$attendee['id'], $token, 'DUPLICATE_REJECTED');
                $this->db->commit();
                return [
                    'status' => 'DUPLICATE',
                    'message' => "Already Checked In! Scanned previously at " . $attendee['checked_in_at'] . " UTC.",
                    'attendee' => $attendee
                ];
            }

            // Execute atomic check-in state transition
            $now = date('Y-m-d H:i:s');
            $updateStmt = $this->db->prepare("
                UPDATE attendees 
                SET status = 'CHECKED_IN', checked_in_at = ? 
                WHERE id = ? AND status = 'REGISTERED'
            ");
            $updateStmt->execute([$now, $attendee['id']]);

            if ($updateStmt->rowCount() === 0) {
                $this->db->rollBack();
                return [
                    'status' => 'DUPLICATE',
                    'message' => "Concurrent Check-In Detected: Token was processed by another terminal.",
                    'attendee' => $attendee
                ];
            }

            $this->logAudit((int)$attendee['id'], $token, 'SUCCESS');
            $this->db->commit();

            $attendee['status'] = 'CHECKED_IN';
            $attendee['checked_in_at'] = $now;

            return [
                'status' => 'CHECKED_IN',
                'message' => 'Check-in successful! Welcome to the event.',
                'attendee' => $attendee
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function logAudit(int $attendeeId, string $token, string $result): void {
        $stmt = $this->db->prepare("
            INSERT INTO checkin_audit_logs (attendee_id, scanned_token, scan_result) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$attendeeId, $token, $result]);
    }

    public function getEvents(): array {
        return $this->db->query("SELECT * FROM events ORDER BY id ASC")->fetchAll();
    }

    public function getEventMetrics(int $eventId): array {
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) as total_registered,
                COUNT(CASE WHEN status = 'CHECKED_IN' THEN 1 END) as total_checked_in
            FROM attendees WHERE event_id = ?
        ");
        $stmt->execute([$eventId]);
        return $stmt->fetch();
    }

    public function getAttendees(int $eventId): array {
        $stmt = $this->db->prepare("
            SELECT id, full_name, email, qr_token, status, checked_in_at 
            FROM attendees 
            WHERE event_id = ? 
            ORDER BY id DESC
        ");
        $stmt->execute([$eventId]);
        return $stmt->fetchAll();
    }

    public function getAuditTrail(): array {
        return $this->db->query("
            SELECT l.id, l.scanned_token, l.scan_result, l.scanned_at, a.full_name
            FROM checkin_audit_logs l
            JOIN attendees a ON l.attendee_id = a.id
            ORDER BY l.id DESC LIMIT 30
        ")->fetchAll();
    }
}

// ==========================================
// 3. Application Controller Loop
// ==========================================
class EventConsoleApp {
    private EventRepository $repo;

    public function __construct() {
        $this->repo = new EventRepository();
    }

    public function launchWorkspace(): void {
        while (true) {
            $events = $this->repo->getEvents();
            $activeEvent = $events[0] ?? null;

            $subtitle = "Event: " . ($activeEvent ? $activeEvent['title'] : "None");
            CliUI::header("Event Registration & QR Attendance Gateway", $subtitle);

            if ($activeEvent) {
                $metrics = $this->repo->getEventMetrics((int)$activeEvent['id']);
                $pct = $metrics['total_registered'] > 0 
                    ? round(($metrics['total_checked_in'] / $metrics['total_registered']) * 100, 1) 
                    : 0;

                echo "  " . CliUI::BOLD . "LIVE VENUE ATTENDANCE METRICS:" . CliUI::RESET . "\n";
                echo "  • Registered: " . CliUI::CYAN . $metrics['total_registered'] . CliUI::RESET . " / " . $activeEvent['capacity'] . "\n";
                echo "  • Checked In: " . CliUI::GREEN . $metrics['total_checked_in'] . CliUI::RESET . " ({$pct}% Turnout)\n\n";
            }

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Register New Attendee (Issue QR Ticket Badge)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Scan QR Token (Door Check-In Gate)\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " View Attendee Roster & Ticket Tokens\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " View Check-In Audit Logs & Replay Rejections\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect application session\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->registerWizard($activeEvent); break;
                case '2': $this->scanWizard(); break;
                case '3': $this->viewRoster($activeEvent); break;
                case '4': $this->viewAuditTrail(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Event management session disconnected safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function registerWizard(?array $event): void {
        if (!$event) { CliUI::error("No active event found."); CliUI::pause(); return; }

        CliUI::header("Register Attendee Wizard", "Event: {$event['title']}");
        $name = CliUI::prompt("Attendee Full Name");
        if (empty($name)) { CliUI::error("Attendee name is required."); CliUI::pause(); return; }

        $email = CliUI::prompt("Attendee Email Address");

        try {
            $reg = $this->repo->registerAttendee((int)$event['id'], $name, $email);
            CliUI::success("Registration complete! Issued Ticket Token: {$reg['token']}");
            CliUI::renderQrBadge($reg['token'], $reg['name']);
        } catch (DomainException $e) {
            CliUI::error($e->getMessage());
        } catch (Exception $e) {
            CliUI::error("System Error: " . $e->getMessage());
        }

        CliUI::pause();
    }

    private function scanWizard(): void {
        CliUI::header("Door Gate Scanner", "Scan or Paste QR Token Payload");
        $token = CliUI::prompt("Scan QR Code (Input Token)");

        if (empty($token)) {
            CliUI::error("Scan payload cannot be empty.");
            CliUI::pause();
            return;
        }

        $result = $this->repo->processQrCheckIn($token);

        echo "\n" . str_repeat("─", 75) . "\n";
        echo " " . CliUI::BOLD . "SCAN RESULT:" . CliUI::RESET . " " . CliUI::statusBadge($result['status']) . "\n";
        echo " " . CliUI::BOLD . "DETAILS:" . CliUI::RESET . " " . $result['message'] . "\n";

        if ($result['attendee']) {
            echo " " . CliUI::BOLD . "ATTENDEE:" . CliUI::RESET . " " . $result['attendee']['full_name'] . " (" . $result['attendee']['email'] . ")\n";
        }
        echo str_repeat("─", 75) . "\n";

        CliUI::pause();
    }

    private function viewRoster(?array $event): void {
        if (!$event) { return; }
        CliUI::header("Attendee Roster", "Event: {$event['title']}");

        $roster = $this->repo->getAttendees((int)$event['id']);
        $tableData = [];

        foreach ($roster as $r) {
            $tableData[] = [
                'id'         => $r['id'],
                'name'       => $r['full_name'],
                'email'      => $r['email'],
                'qr_token'   => $r['qr_token'],
                'checkin_at' => $r['checked_in_at'] ?: CliUI::DIM . "Not Checked In" . CliUI::RESET,
                'status'     => CliUI::statusBadge($r['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'name' => 'Attendee Name', 'email' => 'Email', 'qr_token' => 'QR Ticket Token', 'checkin_at' => 'Checked In At (UTC)', 'status' => 'Status'
        ]);

        CliUI::pause();
    }

    private function viewAuditTrail(): void {
        CliUI::header("Check-In Audit & Replay Rejection Logs");
        $logs = $this->repo->getAuditTrail();

        $tableData = [];
        foreach ($logs as $l) {
            $tableData[] = [
                'id'        => $l['id'],
                'name'      => $l['full_name'],
                'token'     => $l['scanned_token'],
                'result'    => CliUI::statusBadge($l['scan_result']),
                'scanned'   => $l['scanned_at'] . " UTC"
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'Log ID', 'name' => 'Attendee', 'token' => 'Scanned QR Token', 'result' => 'Result Code', 'scanned' => 'Timestamp'
        ]);

        CliUI::pause();
    }

    public function runScanSimulation(): void {
        CliUI::stepLog("Starting automated QR door scanner simulation pass...");
        
        $roster = $this->repo->getAttendees(1);
        if (empty($roster)) {
            CliUI::stepLog("No attendees available to simulate.");
            return;
        }

        // Simulate scanning attendees in batch
        foreach ($roster as $attendee) {
            $res = $this->repo->processQrCheckIn($attendee['qr_token']);
            CliUI::stepLog("Scanned Token [{$attendee['qr_token']}] ({$attendee['full_name']}) => " . $res['status'] . ": " . $res['message']);
            usleep(100000); // 100ms pause between scans
        }

        // Intentionally simulate scanning the first attendee AGAIN to test duplicate prevention
        $firstToken = $roster[0]['qr_token'];
        $resDup = $this->repo->processQrCheckIn($firstToken);
        CliUI::stepLog("REPLAY TEST: Rescanned Token [{$firstToken}] => " . $resDup['status'] . ": " . $resDup['message']);
    }
}

// ==========================================
// 4. Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Error: This system must be run from a command-line terminal.\n");
}

$app = new EventConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--scan') {
    $app->runScanSimulation();
} else {
    $app->launchWorkspace();
}
