#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Autonomous CRM Follow-Up & Outreach Monitor
 * * Usage:
 * php crm_reminder.php            (Interactive CRM Representative Workspace)
 * php crm_reminder.php --cron     (Headless Background Automation Worker Node)
 */

$autoloader = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    die("\e[31m\e[1m✖ ERROR:\e[0m Composer autoloader not found. Please run 'composer require phpmailer/phpmailer'.\n");
}
require $autoloader;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

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
        echo "\n" . self::DIM . "Press Enter to return to main tracking panel..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[CRON] " . self::RESET . $msg . "\n"; }

    public static function priorityBadge(string $tier): string {
        return match ($tier) {
            'CRITICAL' => self::RED . self::BOLD . " CRITICAL " . self::RESET,
            'URGENT'   => self::YELLOW . "  URGENT  " . self::RESET,
            'NURTURE'  => self::GREEN . " NURTURE  " . self::RESET,
            default    => $tier
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No outstanding prospect reminder allocations matched filtering indexes.\n" . self::RESET;
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
// 2. Data Persistence Layer (SQLite Database)
// ==========================================
class CrmRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/crm_leads.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Master Leads Pipeline Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            contact_person TEXT NOT NULL,
            contact_email TEXT UNIQUE NOT NULL,
            last_contact_date DATETIME NOT NULL,
            lifecycle_status TEXT DEFAULT 'ACTIVE' -- ACTIVE, WON, LOST
        )");

        // Outbound Notification Audit Log (Deduplication Guard)
        $this->db->exec("CREATE TABLE IF NOT EXISTS follow_up_reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id INTEGER NOT NULL,
            reminder_tier TEXT NOT NULL, -- TIER_1, TIER_2, TIER_3
            dispatched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lead_id) REFERENCES leads(id),
            UNIQUE(lead_id, reminder_tier)
        )");

        // Speed Optimization Compound Index
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_leads_lifecycle ON leads(lifecycle_status, last_contact_date)");

        // Auto-seed template pipelines for immediate visualization prototyping
        if ($this->db->query("SELECT COUNT(*) FROM leads")->fetchColumn() == 0) {
            $stmt = $this->db->prepare("INSERT INTO leads (company_name, contact_person, contact_email, last_contact_date) VALUES (?, ?, ?, date('now', ?))");
            $stmt->execute(['Cyberdyne Systems', 'Sarah Connor', 'sconnor@cyberdyne.io', '-4 days']); // Tier 1
            $stmt->execute(['Stark Industries', 'Pepper Potts', 'pepper@stark.com', '-8 days']);     // Tier 2
            $stmt->execute(['Tyrell Corporation', 'Dr. Eldon Tyrell', 'tyrell@replicant.io', '-16 days']); // Tier 3
            $stmt->execute(['Weyland-Yutani Corp', 'Ellen Ripley', 'ripley@nostromo.org', '-1 day']);   // Warm / Current
        }
    }

    public function getOutstandingReminders(): array {
        return $this->db->query("
            SELECT *, CAST((julianday('now') - julianday(last_contact_date)) AS INTEGER) as days_idle 
            FROM leads 
            WHERE lifecycle_status = 'ACTIVE' AND last_contact_date <= date('now', '-3 days')
            ORDER BY last_contact_date ASC
        ")->fetchAll();
    }

    public function hasReminderFired(int $leadId, string $tier): bool {
        $stmt = $this->db->prepare("SELECT 1 FROM follow_up_reminders WHERE lead_id = ? AND reminder_tier = ? LIMIT 1");
        $stmt->execute([$leadId, $tier]);
        return (bool)$stmt->fetchColumn();
    }

    public function logReminderEvent(int $leadId, string $tier): void {
        $stmt = $this->db->prepare("INSERT INTO follow_up_reminders (lead_id, reminder_tier) VALUES (?, ?)");
        $stmt->execute([$leadId, $tier]);
    }

    public function logManualTouchpoint(int $leadId): void {
        // Reset lead's contact date to today and flush prior reminder blocks
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("UPDATE leads SET last_contact_date = date('now') WHERE id = ?");
            $stmt->execute([$leadId]);
            
            $flush = $this->db->prepare("DELETE FROM follow_up_reminders WHERE lead_id = ?");
            $flush->execute([leadId]);
            $this->db->commit();
        } catch (PDOException $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}

// ==========================================
// 3. SMTP Communication Notification Dispatcher
// ==========================================
class AccountNotificationMailer {
    public function sendEscalationNotice(array $lead, string $priority, int $daysIdle): bool|string {
        // Mocking SMTP network transmissions safely out-of-the-box.
        // Swap parameters inside this frame to bind to corporate Mailgun / AWS SES production hosts.
        usleep(150000); // Latency simulation
        return true;
    }
}

// ==========================================
// 4. Core System Framework Orchestrator
// ==========================================
class CrmReminderApp {
    private CrmRepository $repo;
    private AccountNotificationMailer $mailer;

    public function __construct() {
        $this->repo = new CrmRepository();
        $this->mailer = new AccountNotificationMailer();
    }

    // --- INTERACTIVE DASHBOARD VIEW ---
    public function runWorkspaceLoop(): void {
        while (true) {
            $reminders = $this->repo->getOutstandingReminders();
            
            CliUI::header("Lead Outreach & Account Retention Node", "Outstanding Actions Pending Queue: " . count($reminders));

            // Dynamic presentation mapping for immediate account summaries
            $tableData = [];
            foreach ($reminders as $row) {
                $priority = $this->evaluatePriorityTier($row['days_idle']);
                $tableData[] = [
                    'id'             => $row['id'],
                    'company_name'   => $row['company_name'],
                    'contact_person' => $row['contact_person'],
                    'days_idle'      => $row['days_idle'] . " days untouched",
                    'priority_badge' => CliUI::priorityBadge($priority)
                ];
            }

            CliUI::drawTable($tableData, [
                'id' => 'ID', 'company_name' => 'Corporate Profile Account', 'contact_person' => 'Primary Stakeholder', 'days_idle' => 'Account Aging', 'priority_badge' => 'Outreach Priority'
            ]);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Log Communication Touchpoint (Reset Retention Clock)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Trigger Autonomous Alert Sync (Background Sweep Preview)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect local workspace node session\n\n";

            switch (CliUI::prompt("Select Action")) {
                case '1': $this->processTouchpointFlow($reminders); break;
                case '2': $this->executeAutomatedSweep(false); CliUI::pause(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "CRM framework link dropped cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function processTouchpointFlow(array $activeLeads): void {
        CliUI::header("Log Account Communication");
        $id = (int)CliUI::prompt("Enter lead record ID to register outreach updates");

        $validIds = array_column($activeLeads, 'id');
        if (!in_array($id, $validIds, true)) {
            CliUI::error("Target identifier doesn't match entries inside outstanding parameters.");
            CliUI::pause();
            return;
        }

        $this->repo->logManualTouchpoint($id);
        CliUI::success("Outreach ledger updated. Retention clock set back to zero.");
        sleep(1);
    }

    // --- HEADLESS BACKGROUND DAEMON WORKER ROUTINE ---
    public function executeAutomatedSweep(bool $isCronMode = true): void {
        if ($isCronMode) {
            CliUI::stepLog("Starting automated CRM pipeline security sweep...");
        } else {
            echo "Starting diagnostic pipeline evaluation checks...\n";
        }

        $leads = $this->repo->getOutstandingReminders();
        $dispatchedCount = 0;

        foreach ($leads as $lead) {
            $daysIdle = (int)$lead['days_idle'];
            $priority = $this->evaluatePriorityTier($daysIdle);
            $tierKey = "TIER_" . ($priority === 'NURTURE' ? '1' : ($priority === 'URGENT' ? '2' : '3'));

            // Idempotency check: Assert notification trace maps remain clear
            if ($this->repo->hasReminderFired($lead['id'], $tierKey)) {
                continue;
            }

            if ($isCronMode) {
                CliUI::stepLog("Executing outbound communication route mapping for [{$priority}] Account Ref #{$lead['id']}...");
            } else {
                echo "  ➜ Transmitting escalation signals [{$priority}] to Account: {$lead['company_name']} ({$lead['contact_email']})\n";
            }

            // Fire SMTP or webhook delivery event
            $status = $this->mailer->sendEscalationNotice($lead, $priority, $daysIdle);

            if ($status === true) {
                $this->repo->logReminderEvent($lead['id'], $tierKey);
                $dispatchedCount++;
            }
        }

        $message = "Sweep protocol finished. New escalation pings committed to transport arrays: {$dispatchedCount}";
        if ($isCronMode) {
            CliUI::stepLog($message);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $message . CliUI::RESET . "\n";
        }
    }

    private function evaluatePriorityTier(int $daysIdle): string {
        if ($daysIdle >= 14) return 'CRITICAL';
        if ($daysIdle >= 7)  return 'URGENT';
        return 'NURTURE';
    }
}

// ==========================================
// 5. System Execution Bootstrap Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System error: CRM analytics reporting hooks must run inside command line terminals.");
}

$app = new CrmReminderApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--cron') {
    $app->executeAutomatedSweep(true);
} else {
    $app->runWorkspaceLoop();
}
