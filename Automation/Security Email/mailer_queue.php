#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI Scheduled Email Sender (PHPMailer/SMTP Edition)
 */

// Gracefully check for Composer Autoloader
$autoloader = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloader)) {
    die("\e[31m\e[1m✖ ERROR:\e[0m Composer autoloader not found. Please run 'composer require phpmailer/phpmailer' first.\n");
}
require $autoloader;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

// ==========================================
// 1. SMTP Configuration
// ==========================================
const SMTP_CONFIG = [
    'host'       => 'smtp.mailtrap.io', // e.g., smtp.sendgrid.net
    'username'   => 'your_username',
    'password'   => 'your_password',
    'port'       => 2525,               // Usually 587 for TLS, 465 for SSL, 2525 for Mailtrap
    'encryption' => PHPMailer::ENCRYPTION_STARTTLS, 
    'from_email' => 'system@yourdomain.com',
    'from_name'  => 'System Automations'
];

// ==========================================
// 2. Visual Styling & UI Component
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const DIM = "\e[2m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";

    public static function header(string $title): void {
        echo "\033[2J\033[;H"; 
        echo self::CYAN . self::BOLD;
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

    public static function success(string $msg): void { echo self::GREEN . "✔ " . $msg . self::RESET . "\n"; }
    public static function error(string $msg): void { echo self::RED . "✖ " . $msg . self::RESET . "\n"; }
    public static function info(string $msg): void { echo self::CYAN . "ℹ " . $msg . self::RESET . "\n"; }

    public static function badge(string $status): string {
        return match (strtoupper($status)) {
            'PENDING' => self::YELLOW . " PENDING " . self::RESET,
            'SENT'    => self::GREEN . "  SENT   " . self::RESET,
            'FAILED'  => self::RED . " FAILED  " . self::RESET,
            default   => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No emails in queue.\n" . self::RESET;
            return;
        }

        $widths = array_map('strlen', $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
                $widths[$key] = max($widths[$key], min(strlen($cleanString), 30)); 
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
                if (strlen($cleanString) > 30) {
                    $content = substr($cleanString, 0, 27) . "...";
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
// 3. Database & Data Repository
// ==========================================
class EmailQueueRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/mailer_queue.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initDb();
    }

    private function initDb(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            to_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            scheduled_for DATETIME NOT NULL,
            sent_at DATETIME NULL,
            error_log TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
    }

    public function queueEmail(string $to, string $subject, string $body, string $scheduledFor): void {
        $stmt = $this->db->prepare("INSERT INTO queue (to_email, subject, body, scheduled_for) VALUES (?, ?, ?, ?)");
        $stmt->execute([$to, $subject, $body, $scheduledFor]);
    }

    public function getPendingEmails(): array {
        $stmt = $this->db->prepare("SELECT * FROM queue WHERE status = 'PENDING' AND scheduled_for <= datetime('now', 'localtime') ORDER BY scheduled_for ASC");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function getAll(): array {
        return $this->db->query("SELECT id, to_email, subject, scheduled_for, status, error_log FROM queue ORDER BY created_at DESC")->fetchAll();
    }

    public function markAsSent(int $id): void {
        $stmt = $this->db->prepare("UPDATE queue SET status = 'SENT', sent_at = datetime('now', 'localtime'), error_log = NULL WHERE id = ?");
        $stmt->execute([$id]);
    }

    public function markAsFailed(int $id, string $error): void {
        $stmt = $this->db->prepare("UPDATE queue SET status = 'FAILED', error_log = ? WHERE id = ?");
        $stmt->execute([$error, $id]);
    }
}

// ==========================================
// 4. Mailer Interfaces & Services
// ==========================================
interface MailerInterface {
    /**
     * @return bool|string True on success, error message string on failure.
     */
    public function send(string $to, string $subject, string $body): bool|string;
}

class SmtpMailer implements MailerInterface {
    private array $config;

    public function __construct(array $config) {
        $this->config = $config;
    }

    public function send(string $to, string $subject, string $body): bool|string {
        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = $this->config['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->config['username'];
            $mail->Password   = $this->config['password'];
            $mail->SMTPSecure = $this->config['encryption'];
            $mail->Port       = $this->config['port'];

            // Recipients
            $mail->setFrom($this->config['from_email'], $this->config['from_name']);
            $mail->addAddress($to);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;

            // Attempt delivery
            $mail->send();
            return true;
            
        } catch (PHPMailerException $e) {
            // Return the specific SMTP error so the queue worker can log it to the database
            return $mail->ErrorInfo;
        }
    }
}

// ==========================================
// 5. CLI Application Controller
// ==========================================
class MailerApp {
    private EmailQueueRepository $repo;
    private MailerInterface $mailer;

    public function __construct() {
        $this->repo = new EmailQueueRepository();
        
        // Inject the SmtpMailer with our configuration constant
        $this->mailer = new SmtpMailer(SMTP_CONFIG); 
    }

    public function handleCommand(string $command): void {
        switch ($command) {
            case 'add':     $this->addFlow(); break;
            case 'queue':   $this->viewQueue(); break;
            case 'process': $this->processQueue(); break;
            default:
                CliUI::error("Unknown command: {$command}");
                $this->showHelp();
        }
    }

    private function addFlow(): void {
        CliUI::header("Queue New Email");
        $to = CliUI::prompt("Recipient Email");
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            CliUI::error("Invalid email format.");
            return;
        }

        $subject = CliUI::prompt("Subject");
        $body = CliUI::prompt("Body (HTML allowed)");
        
        echo CliUI::DIM . "Format: YYYY-MM-DD HH:MM:SS or offset like '+1 hour', '+5 minutes', 'tomorrow'.\n" . CliUI::RESET;
        $scheduledInput = CliUI::prompt("Schedule for", "now");
        
        try {
            $date = new DateTime($scheduledInput);
            $formattedDate = $date->format('Y-m-d H:i:s');
        } catch (Exception $e) {
            CliUI::error("Invalid date format.");
            return;
        }

        $this->repo->queueEmail($to, $subject, $body, $formattedDate);
        CliUI::success("Email queued successfully for delivery at {$formattedDate}.");
    }

    private function viewQueue(): void {
        CliUI::header("Email Queue Status");
        $emails = $this->repo->getAll();
        
        foreach ($emails as &$email) {
            $email['status_badge'] = CliUI::badge($email['status']);
        }

        CliUI::drawTable($emails, [
            'id' => 'ID',
            'to_email' => 'Recipient',
            'subject' => 'Subject',
            'scheduled_for' => 'Scheduled For',
            'status_badge' => 'Status'
        ]);
        
        // Let's also print recent errors cleanly
        $failed = array_filter($emails, fn($e) => $e['status'] === 'FAILED');
        if (!empty($failed)) {
            echo "\n" . CliUI::RED . CliUI::BOLD . "Recent SMTP Errors:\n" . CliUI::RESET;
            foreach (array_slice($failed, 0, 3) as $fail) {
                echo " - ID {$fail['id']}: " . CliUI::DIM . $fail['error_log'] . CliUI::RESET . "\n";
            }
            echo "\n";
        }
    }

    private function processQueue(): void {
        $pending = $this->repo->getPendingEmails();
        $count = count($pending);
        
        CliUI::info("Found {$count} pending emails ready for delivery...");

        if ($count === 0) return;

        foreach ($pending as $email) {
            echo "Processing ID {$email['id']} to {$email['to_email']}... ";
            
            // The mailer now returns `true` or an error string from the SMTP server
            $result = $this->mailer->send($email['to_email'], $email['subject'], $email['body']);
            
            if ($result === true) {
                $this->repo->markAsSent($email['id']);
                echo CliUI::GREEN . "SENT" . CliUI::RESET . "\n";
            } else {
                // Save the exact SMTP error reason to the database
                $this->repo->markAsFailed($email['id'], "SMTP Error: " . $result);
                echo CliUI::RED . "FAILED" . CliUI::RESET . "\n";
            }
            
            usleep(200000); // 0.2 seconds sleep to respect rate limits
        }
        
        CliUI::success("Queue processing complete.");
    }

    public function showHelp(): void {
        echo "Commands:\n";
        echo "  " . CliUI::CYAN . "add" . CliUI::RESET . "      - Interactive prompt to queue an email\n";
        echo "  " . CliUI::CYAN . "queue" . CliUI::RESET . "    - View current queue status\n";
        echo "  " . CliUI::CYAN . "process" . CliUI::RESET . "  - Run the worker to send pending emails via SMTP\n\n";
    }
}

// ==========================================
// Bootstrap
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("This application must be run from the command line.");
}

$app = new MailerApp();
if ($argc < 2) {
    CliUI::header("Scheduled Mailer CLI (SMTP)");
    $app->showHelp();
    exit(1);
}

$app->handleCommand($argv[1]);
