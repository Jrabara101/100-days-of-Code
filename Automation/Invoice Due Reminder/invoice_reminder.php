#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Invoice Due Reminder & Escalation Engine
 * * Usage:
 * php invoice_reminder.php        (Interactive Billing Dashboard)
 * php invoice_reminder.php work   (Automated Background Cron Task)
 */

$autoloader = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    die("\e[31m\e[1m✖ ERROR:\e[0m Composer autoloader not found. Run 'composer require phpmailer/phpmailer'.\n");
}
require $autoloader;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

// ==========================================
// 1. Configuration Constants
// ==========================================
const SMTP_CONFIG = [
    'host'       => 'smtp.mailtrap.io', // e.g., smtp.sendgrid.net
    'username'   => 'your_username',
    'password'   => 'your_password',
    'port'       => 2525,               
    'encryption' => PHPMailer::ENCRYPTION_STARTTLS, 
    'from_email' => 'billing@yourenterprise.com',
    'from_name'  => 'Enterprise Billing Systems'
];

// The Escalation Matrix: Defines the rules for tracking intervals
const REMINDER_TIERS = [
    ['tier' => 'FIRST',  'days' => 1,  'subject' => 'Friendly Notice: Invoice past due'],
    ['tier' => 'SECOND', 'days' => 7,  'subject' => 'Urgent Reminder: Your account is past due'],
    ['tier' => 'FINAL',  'days' => 14, 'subject' => 'COLLECTIONS WARNING: Immediate payment required']
];

date_default_timezone_set('UTC');

// ==========================================
// 2. Visual Styling & TUI Component
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

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No matching operational records found.\n" . self::RESET;
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
// 3. Relational Infrastructure Repository
// ==========================================
class InvoiceRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/billing.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Master ledger containing dynamic client context
        $this->db->exec("CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            client_name TEXT NOT NULL,
            client_email TEXT NOT NULL,
            amount REAL NOT NULL,
            due_date DATETIME NOT NULL,
            status TEXT DEFAULT 'UNPAID' -- UNPAID, PAID
        )");

        // Immutable auditing table to enforce strict single notification pings
        $this->db->exec("CREATE TABLE IF NOT EXISTS invoice_reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id TEXT NOT NULL,
            reminder_tier TEXT NOT NULL,
            dispatched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id),
            UNIQUE(invoice_id, reminder_tier)
        )");

        // Database performance index generation optimization passes
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_inv_lookup ON invoices(status, due_date)");

        // Auto-seed simulation records if base sandbox layer maps empty
        if ($this->db->query("SELECT COUNT(*) FROM invoices")->fetchColumn() == 0) {
            $stmt = $this->db->prepare("INSERT INTO invoices (id, client_name, client_email, amount, due_date, status) VALUES (?, ?, ?, ?, ?, 'UNPAID')");
            $stmt->execute(['INV-2026-001', 'Acme Corp', 'billing@acme.com', 1250.00, date('Y-m-d', strtotime('-2 days'))]);
            $stmt->execute(['INV-2026-002', 'Stark Industries', 'pepper@stark.com', 8500.00, date('Y-m-d', strtotime('-8 days'))]);
            $stmt->execute(['INV-2026-003', 'Wayne Enterprises', 'bruce@wayne.co', 14200.00, date('Y-m-d', strtotime('-15 days'))]);
            $stmt->execute(['INV-2026-004', 'Cyberdyne Systems', 'miles@cyberdyne.net', 450.00, date('Y-m-d', strtotime('+5 days'))]); // Current
        }
    }

    public function getActiveUnpaidInvoices(): array {
        return $this->db->query("SELECT *, CAST((julianday('now') - julianday(due_date)) AS INTEGER) as days_overdue FROM invoices WHERE status = 'UNPAID' AND due_date <= date('now') ORDER BY due_date ASC")->fetchAll();
    }

    public function hasReminderBeenSent(string $invoiceId, string $tier): bool {
        $stmt = $this->db->prepare("SELECT 1 FROM invoice_reminders WHERE invoice_id = ? AND reminder_tier = ? LIMIT 1");
        $stmt->execute([$invoiceId, $tier]);
        return (bool)$stmt->fetchColumn();
    }

    public function logReminderDispatch(string $invoiceId, string $tier): void {
        $stmt = $this->db->prepare("INSERT INTO invoice_reminders (invoice_id, reminder_tier) VALUES (?, ?)");
        $stmt->execute([$invoiceId, $tier]);
    }

    public function getHistoricalLogs(): array {
        return $this->db->query("
            SELECT r.id, r.invoice_id, i.client_name, r.reminder_tier, r.dispatched_at 
            FROM invoice_reminders r
            JOIN invoices i ON r.invoice_id = i.id
            ORDER BY r.dispatched_at DESC LIMIT 50
        ")->fetchAll();
    }
}

// ==========================================
// 4. SMTP Transaction Dispatch Engine
// ==========================================
class BillingMailer {
    private array $config;

    public function __construct(array $config) {
        $this->config = $config;
    }

    public function sendReminder(array $invoice, array $tierConfig): bool|string {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = $this->config['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->config['username'];
            $mail->Password   = $this->config['password'];
            $mail->SMTPSecure = $this->config['encryption'];
            $mail->Port       = $this->config['port'];

            $mail->setFrom($this->config['from_email'], $this->config['from_name']);
            $mail->addAddress($invoice['client_email'], $invoice['client_name']);

            $mail->isHTML(true);
            $mail->Subject = $tierConfig['subject'] . " [#" . $invoice['id'] . "]";
            
            // Generate priority email structural styling canvas maps
            $borderColor = $tierConfig['tier'] === 'FINAL' ? '#dc2626' : '#ea580c';
            
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid {$borderColor}; border-radius: 6px; overflow: hidden;'>
                    <div style='background-color: {$borderColor}; color: white; padding: 15px 20px; font-weight: bold; font-size: 18px;'>
                        🚨 ACCOUNT OVERDUE NOTIFICATION
                    </div>
                    <div style='padding: 20px; color: #333;'>
                        <p>Dear {$invoice['client_name']},</p>
                        <p>This notification serves as a formal notice that invoice <strong>{$invoice['id']}</strong> is currently overdue.</p>
                        
                        <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>
                            <tr style='background: #f8fafc;'>
                                <td style='padding: 10px; border: 1px solid #e2e8f0;'><strong>Invoice Ref:</strong></td>
                                <td style='padding: 10px; border: 1px solid #e2e8f0;'>{$invoice['id']}</td>
                            </tr>
                            <tr>
                                <td style='padding: 10px; border: 1px solid #e2e8f0;'><strong>Balance Due:</strong></td>
                                <td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;'>$" . number_format($invoice['amount'], 2) . "</td>
                            </tr>
                            <tr style='background: #f8fafc;'>
                                <td style='padding: 10px; border: 1px solid #e2e8f0;'><strong>Original Due Date:</strong></td>
                                <td style='padding: 10px; border: 1px solid #e2e8f0; color: #dc2626;'>{$invoice['due_date']}</td>
                            </tr>
                        </table>
                        
                        <p>Please process immediate payment transfers to clear your balance statement tracking nodes.</p>
                    </div>
                </div>
            ";

            $mail->send();
            return true;
        } catch (PHPMailerException $e) {
            return $mail->ErrorInfo;
        }
    }
}

// ==========================================
// 5. Automated System Core Orchestrator
// ==========================================
class ReminderApp {
    private InvoiceRepository $repo;
    private BillingMailer $mailer;

    public function __construct() {
        $this->repo = new InvoiceRepository();
        $this->mailer = new BillingMailer(SMTP_CONFIG);
    }

    // --- INTERACTIVE WORKSPACE ---
    public function dashboard(): void {
        while (true) {
            CliUI::header("Enterprise Arrears Dashboard", "Internal Financial Control Matrix");
            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Analyze Outstanding Delinquent Pipeline\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Print Historical Reminder Log Ledger\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Trigger Manual Sync Check (Ad-hoc Worker Run)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Terminate active shell context\n\n";

            switch (CliUI::prompt("Select Operation Module")) {
                case '1': $this->analyzePipeline(); break;
                case '2': $this->viewLogs(); break;
                case '3': $this->runWorker(false); CliUI::pause(); break;
                case '0': 
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "System infrastructure connections closed.\n" . CliUI::RESET;
                    exit(0);
                default: CliUI::error("Unresolved programmatic route code mapping parameters."); CliUI::pause();
            }
        }
    }

    private function analyzePipeline(): void {
        CliUI::header("Outstanding Arrears Analysis");
        $pipeline = $this->repo->getActiveUnpaidInvoices();
        
        foreach ($pipeline as &$inv) {
            $inv['amount_fmt'] = "$" . number_format($inv['amount'], 2);
            $inv['days_over'] = $inv['days_overdue'] . " Days Past Due";
        }

        CliUI::drawTable($pipeline, [
            'id' => 'Invoice #', 'client_name' => 'Corporate Entity', 'amount_fmt' => 'Balance Due', 'due_date' => 'Maturity Date', 'days_over' => 'Aging Status'
        ]);
        CliUI::pause();
    }

    private function viewLogs(): void {
        CliUI::header("Reminder Despatch History Ledger");
        $logs = $this->repo->getHistoricalLogs();
        CliUI::drawTable($logs, [
            'id' => 'ID', 'invoice_id' => 'Invoice Ref', 'client_name' => 'Customer', 'reminder_tier' => 'Tier Milestone', 'dispatched_at' => 'Timestamp'
        ]);
        CliUI::pause();
    }

    // --- AUTONOMOUS DAEMON WORKER TASK LOOP ---
    public function runWorker(bool $isCronMode = true): void {
        $prefix = $isCronMode ? "[" . date('Y-m-d H:i:s') . "] " : "";
        echo "{$prefix}Starting billing tracking matrix audit evaluation step...\n";

        $unpaidInvoices = $this->repo->getActiveUnpaidInvoices();
        $processedCount = 0;

        foreach ($unpaidInvoices as $invoice) {
            $daysOverdue = (int)$invoice['days_overdue'];
            
            // Map the current row context to our strict configuration matrix profiles
            $matchedTier = null;
            foreach (REMINDER_TIERS as $tier) {
                if ($daysOverdue >= $tier['days']) {
                    $matchedTier = $tier; // Continually evaluate to scale down tracking window bounds
                }
            }

            if ($matchedTier === null) {
                continue; // Invoice is due today, but hasn't reached the aging day count boundary yet
            }

            // High-Performance Gate Check: Ensure we have not already transmitted this explicit notification record
            if ($this->repo->hasReminderBeenSent($invoice['id'], $matchedTier['tier'])) {
                continue; 
            }

            echo "  ➜ Processing Escalation Milestone [{$matchedTier['tier']}] for Invoice Reference #{$invoice['id']} ({$invoice['client_name']})... ";

            // Fire SMTP network transmission step
            $status = $this->mailer->sendReminder($invoice, $matchedTier);

            if ($status === true) {
                $this->repo->logReminderDispatch($invoice['id'], $matchedTier['tier']);
                echo CliUI::GREEN . "DISPATCHED" . CliUI::RESET . "\n";
                $processedCount++;
            } else {
                echo CliUI::RED . "CRITICAL FAULT -> SMTP Server Error: {$status}" . CliUI::RESET . "\n";
            }

            usleep(200000); // Throttling protection step to relieve remote email servers
        }

        echo "{$prefix}Automation tracking run completed. Dynamic actions processed: {$processedCount}\n";
    }
}

// ==========================================
// 6. Global Operational Bootstrapper
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Automated operations engine loops must execute exclusively inside secure shell terminals.");
}

$app = new ReminderApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === 'work') {
    // Background automation execution mode
    $app->runWorker(true);
} else {
    // Interactive management user interface
    $app->dashboard();
}
