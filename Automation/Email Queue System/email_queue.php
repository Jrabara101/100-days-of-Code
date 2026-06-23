#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Resilient Email Queue & Worker Engine
 * * Usage:
 * php email_queue.php push "user@test.com" "Subject" "Body"   (Queue an email)
 * php email_queue.php work                                   (Process the queue via Cron)
 * php email_queue.php status                                 (View system metrics)
 */

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

    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function success(string $msg): void { echo self::GREEN . self::BOLD . "✔ SUCCESS: " . self::RESET . self::GREEN . $msg . self::RESET . "\n"; }
    public static function error(string $msg): void { echo self::RED . self::BOLD . "✖ ERROR: " . self::RESET . self::RED . $msg . self::RESET . "\n"; }
    
    public static function step(string $workerId, string $msg): void {
        echo " [" . date('H:i:s') . "] [Worker-{$workerId}] {$msg}\n";
    }

    public static function badge(string $status): string {
        return match (strtoupper($status)) {
            'PENDING'    => self::YELLOW . " PENDING " . self::RESET,
            'PROCESSING' => self::BLUE . " IN_FLIGHT" . self::RESET,
            'SENT'       => self::GREEN . "   SENT   " . self::RESET,
            'FAILED'     => self::RED . "  FAILED  " . self::RESET,
            default      => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) return;
        $widths = array_map('strlen', $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
                $widths[$key] = max($widths[$key], strlen($cleanString));
            }
        }
        $drawSeparator = function($l, $m, $r) use ($widths) {
            $segments = array_map(fn($w) => str_repeat("─", $w + 2), $widths);
            echo $l . implode($m, $segments) . $r . "\n";
        };
        $drawSeparator("┌", "┬", "┐");
        echo "│ ";
        foreach ($headers as $key => $label) {
            echo self::BOLD . self::CYAN . str_pad($label, $widths[$key]) . self::RESET . " │ ";
        }
        echo "\n";
        $drawSeparator("├", "┼", "┤");
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
        $drawSeparator("└", "┴", "┘");
    }
}

// ==========================================
// 2. Data Persistence Layer (SQLite Queue)
// ==========================================
class QueueRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/email_queue.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        $this->db->exec("CREATE TABLE IF NOT EXISTS email_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSING, SENT, FAILED
            worker_lock TEXT DEFAULT NULL,
            attempts INTEGER DEFAULT 0,
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_queue_status ON email_queue(status, attempts)");
    }

    public function push(string $to, string $subject, string $body): void {
        $stmt = $this->db->prepare("INSERT INTO email_queue (recipient, subject, body) VALUES (?, ?, ?)");
        $stmt->execute([strtolower(trim($to)), trim($subject), trim($body)]);
    }

    /**
     * High-Performance Mutex Lock: Claims a chunk of emails using a unique token 
     * before reading them. This prevents multiple parallel workers from duplicate-sending.
     */
    public function claimBatch(string $workerId, int $limit): array {
        $this->db->beginTransaction();
        try {
            // Find IDs of pending emails or failed emails eligible for retry (under 3 attempts)
            $stmt = $this->db->prepare("
                SELECT id FROM email_queue 
                WHERE (status = 'PENDING' OR (status = 'FAILED' AND attempts < 3))
                ORDER BY id ASC LIMIT ?
            ");
            $stmt->execute([$limit]);
            $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (empty($ids)) {
                $this->db->commit();
                return [];
            }

            // Stringify the IDs for an atomic UPDATE
            $idList = implode(',', $ids);
            $lockStmt = $this->db->prepare("
                UPDATE email_queue 
                SET status = 'PROCESSING', worker_lock = ?, attempts = attempts + 1, updated_at = datetime('now')
                WHERE id IN ({$idList})
            ");
            $lockStmt->execute([$workerId]);

            // Now safely select the actual data tied directly to our unique worker signature
            $fetchStmt = $this->db->prepare("SELECT * FROM email_queue WHERE worker_lock = ? AND status = 'PROCESSING'");
            $fetchStmt->execute([$workerId]);
            $emails = $fetchStmt->fetchAll();

            $this->db->commit();
            return $emails;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function markAsSent(int $id): void {
        $stmt = $this->db->prepare("UPDATE email_queue SET status = 'SENT', worker_lock = NULL, error_message = NULL, updated_at = datetime('now') WHERE id = ?");
        $stmt->execute([$id]);
    }

    public function markAsFailed(int $id, string $errorMessage): void {
        $stmt = $this->db->prepare("UPDATE email_queue SET status = 'FAILED', worker_lock = NULL, error_message = ?, updated_at = datetime('now') WHERE id = ?");
        $stmt->execute([$errorMessage, $id]);
    }

    public function getMetrics(): array {
        return $this->db->query("SELECT status, COUNT(*) as count FROM email_queue GROUP BY status")->fetchAll();
    }

    public function getRecentLogs(): array {
        return $this->db->query("SELECT id, recipient, subject, attempts, status FROM email_queue ORDER BY updated_at DESC LIMIT 15")->fetchAll();
    }
}

// ==========================================
// 3. Mail Transmission Interface & Adapter
// ==========================================
interface MailerInterface {
    public function send(string $to, string $subject, string $body): void;
}

class SmtpMailerMock implements MailerInterface {
    public function send(string $to, string $subject, string $body): void {
        // Simulate minor variable network latency inherent to TCP handsakes
        usleep(rand(50000, 150000)); 

        // Simulate an occasional structural edge case failure for pipeline robustness demonstration
        if ($to === 'fail@test.com') {
            throw new Exception("SMTP Authentication handshake rejected by remote MTA host relay.");
        }
    }
}

// ==========================================
// 4. Background Queue Worker Processor
// ==========================================
class QueueWorker {
    private QueueRepository $repo;
    private MailerInterface $mailer;
    private string $workerId;
    private const BATCH_LIMIT = 50; 
    private const THROTTLE_USLEEP = 100000; // 0.1 seconds delay to preserve downstream SMTP window rules

    public function __construct() {
        $this->repo = new QueueRepository();
        $this->mailer = new SmtpMailerMock(); // In production, pass an authenticated PHPMailer or AWS SES wrapper here
        $this->workerId = substr(md5(getmypid() . uniqid()), 0, 6);
    }

    public function process(): void {
        CliUI::step($this->workerId, "Acquiring mutex bounds on pending queue transactions...");
        
        $batch = $this->repo->claimBatch($this->workerId, self::BATCH_LIMIT);
        $count = count($batch);

        if ($count === 0) {
            CliUI::step($this->workerId, "Queue execution loop finished. Zero jobs requiring attention.");
            return;
        }

        CliUI::step($this->workerId, "Successfully locked a processing batch of " . CliUI::YELLOW . $count . CliUI::RESET . " messages.");

        $successes = 0;
        $failures = 0;

        foreach ($batch as $email) {
            try {
                // Execute mail delivery via injected mail driver service
                $this->mailer->send($email['recipient'], $email['subject'], $email['body']);
                
                $this->repo->markAsSent($email['id']);
                $successes++;
            } catch (Exception $e) {
                $this->repo->markAsFailed($email['id'], $e->getMessage());
                $failures++;
                CliUI::step($this->workerId, CliUI::RED . "[ALERT] Delivery failed on Job #{$email['id']}: " . CliUI::RESET . $e->getMessage());
            }

            usleep(self::THROTTLE_USLEEP); // Throttling protection step
        }

        CliUI::step($this->workerId, "Batch cycle summarized cleanly. (" . CliUI::GREEN . "Sent: {$successes}" . CliUI::RESET . " | " . CliUI::RED . "Failed: {$failures}" . CliUI::RESET . ")");
    }
}

// ==========================================
// 5. Runtime Routing Control Hub
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Asymmetric system daemons must run inside strict terminal shells.");
}

$repo = new QueueRepository();
$action = $argv[1] ?? 'help';

switch ($action) {
    case 'push':
        if ($argc < 5) {
            CliUI::error("Missing argument variables. Syntax: php email_queue.php push <to> <subject> <body>");
            exit(1);
        }
        $repo->push($argv[2], $argv[3], $argv[4]);
        CliUI::success("Payload transaction pushed to structural queue table index.");
        break;

    case 'work':
        $worker = new QueueWorker();
        $worker->process();
        break;

    case 'status':
        CliUI::header("Queue Analytics Node Monitor");
        
        echo " " . CliUI::BOLD . "Global Volumetric Pipeline Distribution Counts:" . CliUI::RESET . "\n";
        $metrics = $repo->getMetrics();
        $formattedMetrics = [];
        foreach ($metrics as $metric) {
            $formattedMetrics[] = ['status' => CliUI::badge($metric['status']), 'total' => number_format($metric['count'])];
        }
        CliUI::drawTable($formattedMetrics, ['status' => 'Queue State Metric', 'total' => 'Total Rows']);

        echo "\n " . CliUI::BOLD . "Recent Queue Lifecycle Events Ledger:" . CliUI::RESET . "\n";
        $logs = $repo->getRecentLogs();
        foreach ($logs as &$log) {
            $log['status'] = CliUI::badge($log['status']);
        }
        CliUI::drawTable($logs, ['id' => 'ID', 'recipient' => 'Recipient Address', 'subject' => 'Subject Block Text', 'attempts' => 'Attempts', 'status' => 'Operational State']);
        echo "\n";
        break;

    default:
        CliUI::header("Asynchronous Ingestion Hub");
        echo "Commands Blueprint Engine Route Paths:\n";
        echo "  " . CliUI::CYAN . "push <to> <subject> <body>" . CliUI::RESET . " - Inject a unique mail transactional delivery instruction\n";
        echo "  " . CliUI::CYAN . "work" . CliUI::RESET . "                       - Wake the background system worker processor daemon\n";
        echo "  " . CliUI::CYAN . "status" . CliUI::RESET . "                     - Print full telemetry analysis overview tables\n\n";
        break;
}
