#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Autonomous Support Ticket SLA Escalation & Monitoring Engine
 * * Usage:
 * php sla_monitor.php          (Interactive Operations Control Panel)
 * php sla_monitor.php --cron   (Headless Background Automation Worker Node)
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

    public static function prompt(string $message): string {
        echo self::BOLD . $message . self::RESET . ": ";
        return trim(fgets(STDIN));
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main operations panel..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; }
    public static function cronLog(string $msg): void { echo " [" . date('Y-m-d H:i:s') . "] " . self::CYAN . "[SLA-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $state): string {
        return match ($state) {
            'BREACHED' => self::RED . self::BOLD . " BREACHED " . self::RESET,
            'WARNING'  => self::YELLOW . self::BOLD . "  WARNING  " . self::RESET,
            'HEALTHY'  => self::GREEN . "  HEALTHY  " . self::RESET,
            default    => $state
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No active support tickets found matching current index parameters.\n" . self::RESET;
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
// 2. Data Persistence Layer (SQLite Storage)
// ==========================================
class SlaRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/sla_pipeline.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Core Support Tickets Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            priority TEXT NOT NULL, -- CRITICAL, HIGH, MEDIUM
            status TEXT DEFAULT 'OPEN', -- OPEN, RESOLVED
            created_at DATETIME NOT NULL,
            sla_deadline DATETIME NOT NULL
        )");

        // Immutable SLA Notification Audit Trail (Idempotency Guard)
        $this->db->exec("CREATE TABLE IF NOT EXISTS sla_reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id INTEGER NOT NULL,
            milestone TEXT NOT NULL, -- WARNING, BREACHED
            dispatched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ticket_id) REFERENCES tickets(id),
            UNIQUE(ticket_id, milestone)
        )");

        // Optimization Performance Index
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_tickets_sla ON tickets(status, sla_deadline)");

        // Automatically seed realistic scenarios across the aging continuum if empty
        if ($this->db->query("SELECT COUNT(*) FROM tickets")->fetchColumn() == 0) {
            $now = time();
            $stmt = $this->db->prepare("INSERT INTO tickets (subject, priority, created_at, sla_deadline) VALUES (?, ?, ?, ?)");
            
            // Scenario 1: Critical Ticket that has officially breached
            $t1_start = date('Y-m-d H:i:s', $now - 10800); // 3 hours ago
            $t1_end   = date('Y-m-d H:i:s', $now - 3600);  // Deadine passed 1 hour ago
            $stmt->execute(['Production cluster database deadlock timeout error', 'CRITICAL', $t1_start, $t1_end]);

            // Scenario 2: High Priority Ticket approaching the 75% Warning Threshold
            $t2_start = date('Y-m-d H:i:s', $now - 23400); // 6.5 hours ago
            $t2_end   = date('Y-m-d H:i:s', $now + 5400);  // Expiry in 1.5 hours (Total 8hr window)
            $stmt->execute(['Corporate SSO SAML token mapping sync failure', 'HIGH', $t2_start, $t2_end]);

            // Scenario 3: Medium Ticket in completely healthy state
            $t3_start = date('Y-m-d H:i:s', $now - 3600);  // 1 hour ago
            $t3_end   = date('Y-m-d H:i:s', $now + 82800); // Expiry in 23 hours (Total 24hr window)
            $stmt->execute(['Requesting dynamic custom CSV data extraction export', 'MEDIUM', $t3_start, $t3_end]);
        }
    }

    public function getOpenTickets(): array {
        return $this->db->query("
            SELECT *, 
            CAST((julianday(sla_deadline) - julianday('now')) * 24 * 60 AS INTEGER) as minutes_left,
            CAST((julianday('now') - julianday(created_at)) * 24 * 60 AS INTEGER) as minutes_aged
            FROM tickets 
            WHERE status = 'OPEN' 
            ORDER BY sla_deadline ASC
        ")->fetchAll();
    }

    public function hasReminderFired(int $ticketId, string $milestone): bool {
        $stmt = $this->db->prepare("SELECT 1 FROM sla_reminders WHERE ticket_id = ? AND milestone = ? LIMIT 1");
        $stmt->execute([$ticketId, $milestone]);
        return (bool)$stmt->fetchColumn();
    }

    public function logReminderEvent(int $ticketId, string $milestone): void {
        $stmt = $this->db->prepare("INSERT INTO sla_reminders (ticket_id, milestone) VALUES (?, ?)");
        $stmt->execute([$ticketId, $milestone]);
    }

    public function createTicket(string $subject, string $priority, int $windowHours): void {
        $start = date('Y-m-d H:i:s');
        $end = date('Y-m-d H:i:s', time() + ($windowHours * 3600));
        $stmt = $this->db->prepare("INSERT INTO tickets (subject, priority, created_at, sla_deadline) VALUES (?, ?, ?, ?)");
        $stmt->execute([trim($subject), $priority, $start, $end]);
    }
}

// ==========================================
// 3. Multi-Channel Escalation Mailer
// ==========================================
class SlaNotificationService {
    public function dispatchAlert(array $ticket, string $milestone): void {
        // Extensible hook vector: easily bind Twilio SMS, Slack Webhooks, or native PHPMailer classes here
        // We simulate a clean pipeline transmission with micro-latency constraints
        usleep(100000); 
    }
}

// ==========================================
// 4. Core System Framework Orchestrator
// ==========================================
class SlaMonitorApp {
    private SlaRepository $repo;
    private SlaNotificationService $notifier;

    // Config Matrix: Maps priority definitions to total structural lifespan windows
    private const PRIORITY_MAP = [
        'CRITICAL' => 2,
        'HIGH'     => 8,
        'MEDIUM'   => 24
    ];

    public function __construct() {
        $this->repo = new SlaRepository();
        $this->notifier = new SlaNotificationService();
    }

    // --- INTERACTIVE WORKSPACE TUI ---
    public function runWorkspaceLoop(): void {
        while (true) {
            $tickets = $this->repo->getOpenTickets();
            CliUI::header("Support Service Level Agreement Monitor", "Active Open Backlog Queue: " . count($tickets));

            $tableData = [];
            foreach ($tickets as $row) {
                $totalWindowMinutes = self::PRIORITY_MAP[$row['priority']] * 60;
                $state = $this->evaluateSlaState($row['minutes_left'], $totalWindowMinutes);
                
                $tableData[] = [
                    'id'          => $row['id'],
                    'priority'    => $row['priority'],
                    'subject'     => strlen($row['subject']) > 32 ? substr($row['subject'], 0, 29) . "..." : $row['subject'],
                    'time_metric' => $row['minutes_left'] < 0 
                                     ? CliUI::RED . abs($row['minutes_left']) . " mins overdue" . CliUI::RESET 
                                     : $row['minutes_left'] . " mins remaining",
                    'badge'       => CliUI::statusBadge($state)
                ];
            }

            CliUI::drawTable($tableData, [
                'id' => 'ID', 'priority' => 'Priority', 'subject' => 'Ticket Description Subject', 'time_metric' => 'Sla Clock Time', 'badge' => 'Operational State'
            ]);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Provision & Inject New Support Ticket Case\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Execute Ad-Hoc SLA Pipeline Sweep (Run Worker Verification)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Sever interactive console monitoring session\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->injectTicketFlow(); break;
                case '2': $this->executeAutomatedSweep(false); CliUI::pause(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "SLA tracking link dropped cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function injectTicketFlow(): void {
        CliUI::header("Provision New Support Case");
        $subject = CliUI::prompt("Enter ticket issue summary statement");
        if (empty($subject)) { CliUI::error("Subject lines are strictly required."); CliUI::pause(); return; }

        echo "\n Select target priority ranking category:\n";
        echo "  [1] CRITICAL (2-Hour Resolution Boundary)\n";
        echo "  [2] HIGH     (8-Hour Resolution Boundary)\n";
        echo "  [3] MEDIUM   (24-Hour Resolution Boundary)\n\n";
        
        $choice = CliUI::prompt("Input priority choice key");
        
        $priority = match($choice) {
            '1' => 'CRITICAL',
            '2' => 'HIGH',
            default => 'MEDIUM'
        };

        $this->repo->createTicket($subject, $priority, self::PRIORITY_MAP[$priority]);
        CliUI::success("Ticket written successfully to database cluster pipelines.");
        sleep(1);
    }

    // --- HEADLESS BACKGROUND DAEMON WORKER ---
    public function executeAutomatedSweep(bool $isCronMode = true): void {
        $prefix = $isCronMode ? "" : "Manual Diagnostic Run: ";
        if ($isCronMode) {
            CliUI::cronLog("Initiating multi-tenant SLA escalation matrix scan...");
        } else {
            echo "Starting pipeline evaluation checks...\n";
        }

        $tickets = $this->repo->getOpenTickets();
        $alertsFired = 0;

        foreach ($tickets as $ticket) {
            $totalWindowMinutes = self::PRIORITY_MAP[$ticket['priority']] * 60;
            $state = $this->evaluateSlaState($ticket['minutes_left'], $totalWindowMinutes);

            if ($state === 'HEALTHY') {
                continue; // Ticket is within safe boundaries; no escalation necessary.
            }

            // Enforce strict single-dispatch constraints via our idempotency audit log
            if ($this->repo->hasReminderFired($ticket['id'], $state)) {
                continue;
            }

            // Logic block execution trace reporting
            $logMsg = "{$prefix}SLA Alert Triggered [{$state}] on Ticket #{$ticket['id']} [Priority: {$ticket['priority']}]. Time Remaining: {$ticket['minutes_left']} mins.";
            if ($isCronMode) {
                CliUI::cronLog(CliUI::YELLOW . $logMsg . CliUI::RESET);
            } else {
                echo "  " . CliUI::RED . "➜ ESCALATION DETECTED" . CliUI::RESET . " Ticket #{$ticket['id']} status flipped to [{$state}]. Sending alert data bundles...\n";
            }

            // Execute out-of-band message processing transmission
            $this->notifier->dispatchAlert($ticket, $state);
            
            // Persist notification trace state directly down to disk storage
            $this->repo->logReminderEvent($ticket['id'], $state);
            $alertsFired++;
        }

        $summaryMsg = "SLA tracking sweep completed. Dynamic escalation pings committed to transport: {$alertsFired}";
        if ($isCronMode) {
            CliUI::cronLog($summaryMsg);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $summaryMsg . CliUI::RESET . "\n";
        }
    }

    private function evaluateSlaState(int $minutesLeft, int $totalWindowMinutes): string {
        if ($minutesLeft <= 0) {
            return 'BREACHED';
        }
        
        // Compute precise ratio thresholds
        $elapsedRatio = 1 - ($minutesLeft / $totalWindowMinutes);
        if ($elapsedRatio >= 0.75) {
            return 'WARNING';
        }

        return 'HEALTHY';
    }
}

// ==========================================
// 5. System Execution Bootstrap Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Monitoring Guard: SLA processing daemons require direct bash or zsh shell terminals.");
}

$app = new SlaMonitorApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--cron') {
    $app->executeAutomatedSweep(true);
} else {
    $app->runWorkspaceLoop();
}
