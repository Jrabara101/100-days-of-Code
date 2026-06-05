#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Automated Historical Data Archiver
 * * Usage:
 * php data_archiver.php            (Safe Dry Run - Analysis Mode)
 * php data_archiver.php --commit   (Execute Active Migration Loop)
 */

// ==========================================
// 1. Visual Styling & Log Engine
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
        $modeLabel = $isCommitMode ? self::RED . "⚠️ LIVE MIGRATION ACTIVE" : self::GREEN . "🛡️ SAFE ANALYSIS MODE";
        echo self::CYAN . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET;
        echo " Data Lifecycle State: {$modeLabel}" . self::RESET . "\n\n";
    }

    private static function timestamp(): string {
        return self::DIM . "[" . date('Y-m-d H:i:s') . "] " . self::RESET;
    }

    public static function info(string $msg): void { echo self::timestamp() . self::CYAN . "[INFO] " . self::RESET . $msg . "\n"; }
    public static function success(string $msg): void { echo self::timestamp() . self::GREEN . "[OK]   " . self::RESET . $msg . "\n"; }
    public static function warning(string $msg): void { echo self::timestamp() . self::YELLOW . "[WARN] " . self::RESET . $msg . "\n"; }
    public static function error(string $msg): void { echo self::timestamp() . self::RED . "[FAIL] " . self::RESET . $msg . "\n"; exit(1); }
    
    public static function progress(string $msg): void {
        echo "\r" . str_repeat(" ", 80) . "\r" . self::YELLOW . "⚙ " . self::RESET . $msg;
    }
}

// ==========================================
// 2. Database Infrastructure Singleton
// ==========================================
class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dbPath = __DIR__ . '/production_log.sqlite';
            self::$instance = new PDO("sqlite:" . $dbPath);
            self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            self::setupMockEnvironment();
        }
        return self::$instance;
    }

    private static function setupMockEnvironment(): void {
        // Active table
        self::$instance->exec("CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            payload TEXT,
            created_at DATETIME NOT NULL
        )");

        // Historical cold storage archive table matching exact structure
        self::$instance->exec("CREATE TABLE IF NOT EXISTS activity_logs_archive (
            id INTEGER PRIMARY KEY,
            event_name TEXT NOT NULL,
            payload TEXT,
            created_at DATETIME NOT NULL,
            archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Ensure indexes exist on dates for high performance
        self::$instance->exec("CREATE INDEX IF NOT EXISTS idx_logs_created_at ON activity_logs(created_at)");

        // Populate seed data for simulation if empty
        if (self::$instance->query("SELECT COUNT(*) FROM activity_logs")->fetchColumn() == 0) {
            self::$instance->beginTransaction();
            try {
                $stmt = self::$instance->prepare("INSERT INTO activity_logs (event_name, payload, created_at) VALUES (?, ?, datetime('now', ?))");
                for ($i = 1; $i <= 1200; $i++) {
                    $stmt->execute(["UserLogin", "IP: 192.168.1.{$i}", "-100 days"]); // Hot rows
                }
                for ($i = 1; $i <= 1500; $i++) {
                    $stmt->execute(["API_Dump", "Response payload data stream", "-400 days"]); // Cold historical data
                }
                self::$instance->commit();
            } catch (Exception $e) {
                self::$instance->rollBack();
                throw $e;
            }
        }
    }
}

// ==========================================
// 3. Lifecycle & Archive Manager Engine
// ==========================================
class AutoArchiver {
    private PDO $db;
    private bool $commitMode;
    
    // Config thresholds
    private const CHUNK_SIZE = 400;             // Limit row size per transaction to avoid locks
    private const RETENTION_THRESHOLD = '-365 days'; // Archive criteria boundary
    private const THROTTLE_MS = 50000;          // Sleep 50ms between chunks to relieve DB stress

    public function __construct(bool $commitMode) {
        $this->db = Database::getConnection();
        $this->commitMode = $commitMode;
    }

    public function execute(): void {
        $cutoffDate = date('Y-m-d H:i:s', strtotime(self::RETENTION_THRESHOLD));
        CliUI::info("Targeting rows older than threshold: " . CliUI::YELLOW . $cutoffDate . CliUI::RESET);

        // 1. Calculate the total match size
        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM activity_logs WHERE created_at < ?");
        $countStmt->execute([$cutoffDate]);
        $totalToArchive = (int)$countStmt->fetchColumn();

        if ($totalToArchive === 0) {
            CliUI::success("Data footprint is healthy. Zero records found requiring archiving.");
            return;
        }

        CliUI::info("Identified " . CliUI::YELLOW . "{$totalToArchive}" . CliUI::RESET . " records ready to undergo data migration.");

        if (!$this->commitMode) {
            CliUI::warning("Running in Analysis mode. Add " . CliUI::BOLD . "--commit" . CliUI::RESET . CliUI::YELLOW . " to perform data migration step.");
            return;
        }

        // 2. Continuous Chunk Migration Cycle
        $totalMigrated = 0;
        $startTime = microtime(true);

        while (true) {
            // Fetch chunk target IDs safely 
            $fetchStmt = $this->db->prepare("
                SELECT id, event_name, payload, created_at 
                FROM activity_logs 
                WHERE created_at < :cutoff 
                LIMIT :limit
            ");
            $fetchStmt->bindValue(':cutoff', $cutoffDate, PDO::PARAM_STR);
            $fetchStmt->bindValue(':limit', self::CHUNK_SIZE, PDO::PARAM_INT);
            $fetchStmt->execute();
            
            $chunkRows = $fetchStmt->fetchAll();

            if (empty($chunkRows)) {
                break; // Everything cleared successfully
            }

            // Atomic batch switch execution
            $this->migrateBatch($chunkRows);
            
            $totalMigrated += count($chunkRows);
            CliUI::progress("Progressively shifted records: {$totalMigrated} / {$totalToArchive}");

            // Throttling step to release resources back to application workers
            usleep(self::THROTTLE_MS);
            unset($chunkRows);
        }

        $elapsedTime = round(microtime(true) - $startTime, 2);
        CliUI::success("Lifecycle processing complete! Total migrated records: {$totalMigrated} in {$elapsedTime}s.");
    }

    private function migrateBatch(array $rows): void {
        $this->db->beginTransaction();
        try {
            // Prepared insertion setup
            $insertStmt = $this->db->prepare("
                INSERT INTO activity_logs_archive (id, event_name, payload, created_at) 
                VALUES (?, ?, ?, ?)
            ");

            // Prepared deletion setup
            $deleteStmt = $this->db->prepare("DELETE FROM activity_logs WHERE id = ?");

            // Execute pair sequences across items inside the transaction bounds
            foreach ($rows as $row) {
                $insertStmt->execute([
                    $row['id'],
                    $row['event_name'],
                    $row['payload'],
                    $row['created_at']
                ]);
                $deleteStmt->execute([$row['id']]);
            }

            $this->db->commit();
        } catch (PDOException $e) {
            $this->db->rollBack();
            CliUI::error("Transaction layer mapping error encountered during batch pipeline. Rolling back changes. Reason: " . $e->getMessage());
        }
    }
}

// ==========================================
// 4. Initialization & Router Control
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Error: This tool is built strictly for terminal systems execution.");
}

$commitMode = isset($argv[1]) && $argv[1] === '--commit';

CliUI::header("Autonomous Cold-Storage Data Archiver", $commitMode);

try {
    $archiver = new AutoArchiver($commitMode);
    $archiver->execute();
} catch (Exception $e) {
    CliUI::error("Fatal Kernel Error: " . $e->getMessage());
}
