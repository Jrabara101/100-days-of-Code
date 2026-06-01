#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Automated Inactive Account Eraser/Archiver
 * * Usage:
 * php account_cleanup.php            (Safe Dry Run - Visual Preview Only)
 * php account_cleanup.php --commit   (Executes actual database mutations)
 */

// ==========================================
// 1. Visual Styling & Log Architecture
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const DIM = "\e[2m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";

    public static function header(string $title, bool $isCommitMode): void {
        $modeLabel = $isCommitMode ? self::RED . "⚠️ LIVE COMMIT MODE" : self::GREEN . "🛡️ SAFE DRY RUN (PREVIEW)";
        echo self::CYAN . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET;
        echo " Execution Engine State: {$modeLabel}" . self::RESET . "\n\n";
    }

    private static function timestamp(): string {
        return self::DIM . "[" . date('Y-m-d H:i:s') . "] " . self::RESET;
    }

    public static function info(string $msg): void { echo self::timestamp() . self::CYAN . "[INFO] " . self::RESET . $msg . "\n"; }
    public static function success(string $msg): void { echo self::timestamp() . self::GREEN . "[OK]   " . self::RESET . $msg . "\n"; }
    public static function warning(string $msg): void { echo self::timestamp() . self::YELLOW . "[WARN] " . self::RESET . $msg . "\n"; }
    public static function error(string $msg): void { echo self::timestamp() . self::RED . "[FAIL] " . self::RESET . $msg . "\n"; exit(1); }
}

// ==========================================
// 2. Database Layer Singleton
// ==========================================
class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dbPath = __DIR__ . '/users_database.sqlite';
            self::$instance = new PDO("sqlite:" . $dbPath);
            self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            self::ensureSampleSchema();
        }
        return self::$instance;
    }

    private static function ensureSampleSchema(): void {
        // Creates mock schema. Real setups would have indexes on status and last_login!
        self::$instance->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED
            last_login DATETIME NOT NULL
        )");

        // Auto-seed dummy records if the database is blank
        if (self::$instance->query("SELECT COUNT(*) FROM users")->fetchColumn() == 0) {
            $stmt = self::$instance->prepare("INSERT INTO users (username, email, status, last_login) VALUES (?, ?, 'ACTIVE', datetime('now', ?))");
            $stmt->execute(['ActiveUser', 'active@example.com', '-2 hours']);
            $stmt->execute(['SemiActiveUser', 'semi@example.com', '-6 months']);
            $stmt->execute(['GhostUser1', 'ghost1@example.com', '-366 days']);
            $stmt->execute(['GhostUser2', 'ghost2@example.com', '-500 days']);
        }
    }
}

// ==========================================
// 3. Cleanup Engine (The Core Worker Logic)
// ==========================================
class AccountCleanupEngine {
    private PDO $db;
    private bool $commitMode;
    private const CHUNK_SIZE = 100; // Limits database memory consumption per batch
    private const INACTIVITY_THRESHOLD = '-365 days'; // Definition of an inactive user

    public function __construct(bool $commitMode) {
        $this->db = Database::getConnection();
        $this->commitMode = $commitMode;
    }

    public function execute(): void {
        // Calculate the rigid timestamp cutoff
        $cutoffDate = date('Y-m-d H:i:s', strtotime(self::INACTIVITY_THRESHOLD));
        CliUI::info("Targeting accounts inactive since before: " . CliUI::YELLOW . $cutoffDate . CliUI::RESET);

        $lastProcessedId = 0;
        $totalProcessed = 0;

        while (true) {
            // Using ID-based cursor pagination instead of OFFSET for optimal index performance
            $stmt = $this->db->prepare("
                SELECT id, username, email, last_login 
                FROM users 
                WHERE status = 'ACTIVE' 
                  AND last_login < :cutoff 
                  AND id > :last_id 
                ORDER BY id ASC 
                LIMIT :limit
            ");
            
            $stmt->bindValue(':cutoff', $cutoffDate, PDO::PARAM_STR);
            $stmt->bindValue(':last_id', $lastProcessedId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', self::CHUNK_SIZE, PDO::PARAM_INT);
            $stmt->execute();
            
            $batch = $stmt->fetchAll();

            if (empty($batch)) {
                break; // Break the continuous worker loop when no more records align
            }

            foreach ($batch as $user) {
                $this->processAccount($user);
                $lastProcessedId = $user['id'];
                $totalProcessed++;
            }

            // Free loop RAM immediately inside the chunk loop
            unset($batch);
        }

        if ($totalProcessed > 0) {
            $finalStatus = $this->commitMode ? "mutated/archived" : "flagged for observation";
            CliUI::success("Operation finished. Total accounts {$finalStatus}: {$totalProcessed}");
        } else {
            CliUI::success("Scan complete. Zero users met the criteria for cleanup.");
        }
    }

    private function processAccount(array $user): void {
        if (!$this->commitMode) {
            CliUI::info("[DRY RUN] Would archive user #{$user['id']} ({$user['username']}) - Last seen: {$user['last_login']}");
            return;
        }

        // Database Transactions isolate mutations safely
        $this->db->beginTransaction();
        try {
            // Senior Architecture Decision: Instead of a straight DELETE, we archive and clear PII data 
            // for absolute protection and legal/audit logging support.
            $archiveSql = "
                UPDATE users 
                SET status = 'ARCHIVED',
                    username = 'archived_user_' || id,
                    email = 'archived_' || id || '@deleted.internal',
                    last_login = '1970-01-01 00:00:00'
                WHERE id = :id
            ";
            
            $stmt = $this->db->prepare($archiveSql);
            $stmt->execute([':id' => $user['id']]);

            $this->db->commit();
            CliUI::success("Archived and scrubbed inactive user #{$user['id']}");
        } catch (PDOException $e) {
            $this->db->rollBack();
            CliUI::error("Transaction failed on user #{$user['id']}! Rollback executed. Error: " . $e->getMessage());
        }
    }
}

// ==========================================
// 4. Runtime Guard & Router
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("This application must be run exclusively from the command line.");
}

// Check for parameters or input arguments safely
$commitMode = false;
if (isset($argv[1]) && $argv[1] === '--commit') {
    $commitMode = true;
}

CliUI::header("Auto-Deletion & Anonymization Engine", $commitMode);

try {
    $engine = new AccountCleanupEngine($commitMode);
    $engine->execute();
} catch (Exception $e) {
    CliUI::error("Fatal Kernel Crash: " . $e->getMessage());
}
