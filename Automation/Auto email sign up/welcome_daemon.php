#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI Welcome Email Daemon (PHPMailer Edition)
 * * Usage:
 * php welcome_daemon.php run       (Starts the background worker)
 * php welcome_daemon.php simulate  (Injects a fake user to test the worker)
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
const DAEMON_CONFIG = [
    'poll_interval' => 5, // Seconds to wait between database checks
];

const SMTP_CONFIG = [
    'host'       => 'smtp.mailtrap.io', // e.g., smtp.sendgrid.net
    'username'   => 'your_username',
    'password'   => 'your_password',
    'port'       => 2525,               
    'encryption' => PHPMailer::ENCRYPTION_STARTTLS, 
    'from_email' => 'welcome@yourdomain.com',
    'from_name'  => 'Your App Team'
];

// ==========================================
// 2. Visual Styling & Logger
// ==========================================
class DaemonLogger {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const DIM = "\e[2m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";
    const MAGENTA = "\e[35m";

    public static function header(): void {
        echo "\033[2J\033[;H"; 
        echo self::MAGENTA . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad("WELCOME EMAIL BACKGROUND WORKER", 71, " ", STR_PAD_BOTH) . " ║\n";
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    private static function timestamp(): string {
        return self::DIM . "[" . date('Y-m-d H:i:s') . "] " . self::RESET;
    }

    public static function info(string $msg): void { echo self::timestamp() . self::CYAN . "[INFO] " . self::RESET . $msg . "\n"; }
    public static function success(string $msg): void { echo self::timestamp() . self::GREEN . "[SUCCESS] " . self::RESET . $msg . "\n"; }
    public static function warning(string $msg): void { echo self::timestamp() . self::YELLOW . "[WARN] " . self::RESET . $msg . "\n"; }
    public static function error(string $msg): void { echo self::timestamp() . self::RED . "[ERROR] " . self::RESET . $msg . "\n"; }
    public static function processing(string $msg): void { echo self::timestamp() . self::MAGENTA . "[WORK] " . self::RESET . $msg . "\n"; }
}

// ==========================================
// 3. Database Repository
// ==========================================
class UserRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/app_database.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initDb();
    }

    private function initDb(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            welcome_status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSING, SENT, FAILED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
    }

    public function getPendingSignups(): array {
        // Fetch users waiting for a welcome email
        $stmt = $this->db->query("SELECT * FROM users WHERE welcome_status = 'PENDING' ORDER BY created_at ASC LIMIT 50");
        return $stmt->fetchAll();
    }

    public function updateWelcomeStatus(int $userId, string $status): void {
        $stmt = $this->db->prepare("UPDATE users SET welcome_status = ? WHERE id = ?");
        $stmt->execute([$status, $userId]);
    }

    // Used purely for simulating web app signups in the CLI
    public function simulateWebSignup(string $name, string $email): void {
        try {
            $stmt = $this->db->prepare("INSERT INTO users (name, email) VALUES (?, ?)");
            $stmt->execute([$name, $email]);
            DaemonLogger::success("Simulated signup for {$email}. (Status: PENDING)");
        } catch (PDOException $e) {
            DaemonLogger::error("Failed to simulate signup: " . $e->getMessage());
        }
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

    public function sendWelcomeEmail(string $toEmail, string $toName): bool|string {
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host       = $this->config['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->config['username'];
            $mail->Password   = $this->config['password'];
            $mail->SMTPSecure = $this->config['encryption'];
            $mail->Port       = $this->config['port'];
            
            // Optimization for daemons: reuse connection if sending many emails at once
            $mail->SMTPKeepAlive = true; 

            $mail->setFrom($this->config['from_email'], $this->config['from_name']);
            $mail->addAddress($toEmail, $toName);

            $mail->isHTML(true);
            $mail->Subject = "Welcome to the App, {$toName}! 🎉";
            
            // Build a simple HTML template
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>
                    <h2>Hi {$toName},</h2>
                    <p>We are thrilled to have you on board. Your account has been successfully created.</p>
                    <p>If you have any questions, just reply to this email.</p>
                    <br>
                    <p>Cheers,<br>The App Team</p>
                </div>
            ";
            $mail->AltBody = "Hi {$toName}, Welcome to the App! We are thrilled to have you on board.";

            $mail->send();
            return true;
            
        } catch (PHPMailerException $e) {
            return $mail->ErrorInfo;
        } finally {
            $mail->smtpClose(); // Free up resources
        }
    }
}

// ==========================================
// 5. The Application Daemon
// ==========================================
class WelcomeWorker {
    private UserRepository $repo;
    private SmtpMailer $mailer;

    public function __construct() {
        $this->repo = new UserRepository();
        $this->mailer = new SmtpMailer(SMTP_CONFIG);
    }

    public function runDaemon(): void {
        DaemonLogger::header();
        DaemonLogger::info("Daemon started. Polling database every " . DAEMON_CONFIG['poll_interval'] . " seconds.");
        DaemonLogger::info("Press Ctrl+C to stop.");
        echo str_repeat("─", 75) . "\n";

        // The Infinite Worker Loop
        while (true) {
            $pendingUsers = $this->repo->getPendingSignups();

            if (!empty($pendingUsers)) {
                DaemonLogger::processing("Found " . count($pendingUsers) . " new signups. Processing batch...");
                
                foreach ($pendingUsers as $user) {
                    $this->processUser($user);
                }
                
                DaemonLogger::info("Batch complete. Resuming standby.");
            }

            // Sleep to prevent maxing out the CPU (Crucial for daemons!)
            sleep(DAEMON_CONFIG['poll_interval']);
            
            // Optional memory cleanup
            unset($pendingUsers); 
        }
    }

    private function processUser(array $user): void {
        // Step 1: Lock the record to prevent race conditions if running multiple workers
        $this->repo->updateWelcomeStatus($user['id'], 'PROCESSING');
        
        DaemonLogger::processing("Sending welcome email to {$user['email']}...");

        // Step 2: Attempt Delivery
        $result = $this->mailer->sendWelcomeEmail($user['email'], $user['name']);

        // Step 3: Update State
        if ($result === true) {
            $this->repo->updateWelcomeStatus($user['id'], 'SENT');
            DaemonLogger::success("Email sent to {$user['email']} successfully.");
        } else {
            $this->repo->updateWelcomeStatus($user['id'], 'FAILED');
            DaemonLogger::error("Failed to send to {$user['email']}. SMTP Error: {$result}");
        }
    }

    public function handleCommand(string $command): void {
        if ($command === 'run') {
            $this->runDaemon();
        } elseif ($command === 'simulate') {
            // Helper to test the daemon
            $randomString = substr(md5(mt_rand()), 0, 5);
            $this->repo->simulateWebSignup("User {$randomString}", "test{$randomString}@example.com");
        } else {
            echo "Usage: php welcome_daemon.php [run|simulate]\n";
        }
    }
}

// ==========================================
// Bootstrap
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("This application must be run from the command line.");
}

$worker = new WelcomeWorker();
$command = $argv[1] ?? 'help';
$worker->handleCommand($command);
