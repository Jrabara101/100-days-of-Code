#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI Reminder Scheduler
 * * Usage:
 * php reminder_scheduler.php        (Interactive Dashboard)
 * php reminder_scheduler.php work   (Background Cron Worker)
 */

$autoloader = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    die("\e[31m\e[1m✖ ERROR:\e[0m Composer autoloader not found. Run 'composer require phpmailer/phpmailer'.\n");
}
require $autoloader;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

// ==========================================
// 1. Configuration
// ==========================================
const SMTP_CONFIG = [
    'host'       => 'smtp.mailtrap.io', // e.g., smtp.sendgrid.net
    'username'   => 'your_username',
    'password'   => 'your_password',
    'port'       => 2525,               
    'encryption' => PHPMailer::ENCRYPTION_STARTTLS, 
    'from_email' => 'reminders@yourdomain.com',
    'from_name'  => 'Your Reminder Bot'
];

// Set your application's default timezone
date_default_timezone_set('UTC'); 

// ==========================================
// 2. Visual Styling & UI Engine
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

    public static function header(string $title): void {
        self::clearScreen();
        echo self::BLUE . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function prompt(string $message, string $default = ""): string {
        $defLabel = $default ? self::DIM . " [{$default}]" . self::RESET : "";
        echo self::BOLD . $message . $defLabel . self::RESET . ": ";
        $input = trim(fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to menu..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo "\n" . self::GREEN . "✔ " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo "\n" . self::RED . "✖ " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ " . $msg . self::RESET . "\n"; }

    public static function badge(string $status): string {
        return match (strtoupper($status)) {
            'PENDING'  => self::YELLOW . " PENDING " . self::RESET,
            'SENT'     => self::GREEN . "  SENT   " . self::RESET,
            'CANCELED' => self::DIM . " CANCELED" . self::RESET,
            'FAILED'   => self::RED . " FAILED  " . self::RESET,
            default    => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No reminders found.\n" . self::RESET;
            return;
        }

        $widths = array_map('strlen', $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
                $widths[$key] = max($widths[$key], min(strlen($cleanString), 35)); 
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
                if (strlen($cleanString) > 35) {
                    $content = substr($cleanString, 0, 32) . "...";
                    $cleanString = $content;
                }
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
// 3. Database Repository
// ==========================================
class ReminderRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/reminders.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initDb();
    }

    private function initDb(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            send_at DATETIME NOT NULL,
            status TEXT DEFAULT 'PENDING',
            error_log TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
    }

    public function createReminder(string $email, string $subject, string $message, string $sendAt): void {
        $stmt = $this->db->prepare("INSERT INTO reminders (email, subject, message, send_at) VALUES (?, ?, ?, ?)");
        $stmt->execute([$email, $subject, $message, $sendAt]);
    }

    public function getUpcoming(): array {
        return $this->db->query("SELECT id, email, subject, send_at, status FROM reminders WHERE status = 'PENDING' ORDER BY send_at ASC")->fetchAll();
    }

    public function getAll(): array {
        return $this->db->query("SELECT id, email, subject, send_at, status FROM reminders ORDER BY created_at DESC LIMIT 50")->fetchAll();
    }

    public function cancelReminder(int $id): bool {
        $stmt = $this->db->prepare("UPDATE reminders SET status = 'CANCELED' WHERE id = ? AND status = 'PENDING'");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public function getDueReminders(): array {
        $stmt = $this->db->prepare("SELECT * FROM reminders WHERE status = 'PENDING' AND send_at <= datetime('now') ORDER BY send_at ASC");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function updateStatus(int $id, string $status, ?string $error = null): void {
        $stmt = $this->db->prepare("UPDATE reminders SET status = ?, error_log = ? WHERE id = ?");
        $stmt->execute([$status, $error, $id]);
    }
}

// ==========================================
// 4. PHPMailer Service
// ==========================================
class SmtpMailer {
    private array $config;

    public function __construct(array $config) {
        $this->config = $config;
    }

    public function send(string $to, string $subject, string $body): bool|string {
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
            $mail->addAddress($to);

            $mail->isHTML(true);
            $mail->Subject = "🔔 Reminder: " . $subject;
            
            // Clean, professional reminder template
            $mail->Body = "
                <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                    <div style='background: #3b82f6; color: white; padding: 15px 20px;'>
                        <h2 style='margin: 0;'>Scheduled Reminder</h2>
                    </div>
                    <div style='padding: 20px; color: #333; line-height: 1.6;'>
                        <p style='font-size: 18px; font-weight: bold;'>{$subject}</p>
                        <p>" . nl2br(htmlspecialchars($body)) . "</p>
                    </div>
                    <div style='background: #f9fafb; padding: 15px 20px; text-align: center; color: #6b7280; font-size: 12px;'>
                        This is an automated reminder you scheduled via the CLI.
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
// 5. Application Controller
// ==========================================
class ReminderApp {
    private ReminderRepository $repo;
    private SmtpMailer $mailer;

    public function __construct() {
        $this->repo = new ReminderRepository();
        $this->mailer = new SmtpMailer(SMTP_CONFIG);
    }

    // --- INTERACTIVE MODE ---
    public function interactiveMode(): void {
        while (true) {
            CliUI::header("Reminder Scheduler Dashboard");
            
            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Create New Reminder\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " View Upcoming Reminders\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Cancel a Reminder\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " View All History\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Exit\n\n";

            switch (CliUI::prompt("Select Action")) {
                case '1': $this->createFlow(); break;
                case '2': $this->viewUpcoming(); break;
                case '3': $this->cancelFlow(); break;
                case '4': $this->viewHistory(); break;
                case '0': 
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Goodbye!\n" . CliUI::RESET;
                    exit(0);
                default: CliUI::error("Invalid choice.");
            }
        }
    }

    private function createFlow(): void {
        CliUI::header("Create a Reminder");
        
        $email = CliUI::prompt("Send to Email");
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            CliUI::error("Invalid email format."); return;
        }

        $subject = CliUI::prompt("Reminder Subject");
        if (empty($subject)) { CliUI::error("Subject is required."); return; }
        
        $message = CliUI::prompt("Details/Notes (Optional)");

        echo "\n" . CliUI::DIM . "Tip: You can say 'tomorrow at 9am', '+2 days', 'next friday', etc.\n" . CliUI::RESET;
        $when = CliUI::prompt("When should we remind you?");
        
        // Time Parsing Magic
        $timestamp = strtotime($when);
        if ($timestamp === false) {
            CliUI::error("Could not understand that time format. Try something like '+1 hour'.");
            return;
        }

        // Validate it's in the future
        if ($timestamp <= time()) {
            CliUI::error("You cannot schedule a reminder in the past.");
            return;
        }

        $dbDate = date('Y-m-d H:i:s', $timestamp);
        $friendlyDate = date('l, F jS Y \a\t g:i A', $timestamp);

        $this->repo->createReminder($email, $subject, $message, $dbDate);
        CliUI::success("Reminder set! Will send on: {$friendlyDate} (UTC)");
    }

    private function viewUpcoming(): void {
        CliUI::header("Upcoming Reminders");
        $reminders = $this->repo->getUpcoming();
        
        foreach ($reminders as &$r) {
            $r['status_badge'] = CliUI::badge($r['status']);
        }

        CliUI::drawTable($reminders, [
            'id' => 'ID', 'email' => 'To', 'subject' => 'Subject', 'send_at' => 'Scheduled For', 'status_badge' => 'Status'
        ]);
        CliUI::pause();
    }

    private function viewHistory(): void {
        CliUI::header("Reminder History (Last 50)");
        $reminders = $this->repo->getAll();
        
        foreach ($reminders as &$r) {
            $r['status_badge'] = CliUI::badge($r['status']);
        }

        CliUI::drawTable($reminders, [
            'id' => 'ID', 'email' => 'To', 'subject' => 'Subject', 'send_at' => 'Date', 'status_badge' => 'Status'
        ]);
        CliUI::pause();
    }

    private function cancelFlow(): void {
        $this->viewUpcoming();
        $id = (int)CliUI::prompt("Enter the ID of the reminder to cancel (0 to exit)");
        
        if ($id === 0) return;

        if ($this->repo->cancelReminder($id)) {
            CliUI::success("Reminder #{$id} has been canceled.");
        } else {
            CliUI::error("Could not cancel. ID might be invalid or already processed.");
        }
    }

    // --- WORKER MODE ---
    public function processWorker(): void {
        $due = $this->repo->getDueReminders();
        $count = count($due);
        
        echo CliUI::DIM . "[" . date('Y-m-d H:i:s') . "] Checking for due reminders... " . CliUI::RESET;

        if ($count === 0) {
            echo "None pending.\n";
            return;
        }

        echo CliUI::CYAN . "Found {$count}. Processing...\n" . CliUI::RESET;

        foreach ($due as $reminder) {
            echo "  -> Sending #{$reminder['id']} ('{$reminder['subject']}')... ";
            
            $result = $this->mailer->send($reminder['email'], $reminder['subject'], $reminder['message']);
            
            if ($result === true) {
                $this->repo->updateStatus($reminder['id'], 'SENT');
                echo CliUI::GREEN . "OK\n" . CliUI::RESET;
            } else {
                $this->repo->updateStatus($reminder['id'], 'FAILED', $result);
                echo CliUI::RED . "FAILED\n" . CliUI::RESET;
            }
        }
    }
}

// ==========================================
// Bootstrap
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("This application must be run from the command line.");
}

$app = new ReminderApp();
$arg = $argv[1] ?? 'interactive';

if ($arg === 'work') {
    // Hidden background worker command
    $app->processWorker();
} else {
    // Interactive Dashboard
    $app->interactiveMode();
}
