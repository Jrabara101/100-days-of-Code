#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Memory-Safe CSV Import/Export
 * * Usage: 
 * php csv_sync.php import data.csv my_table
 * php csv_sync.php export export.csv my_table
 */

// ==========================================
// 1. Visual Styling & UI Engine
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const DIM = "\e[2m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";

    public static function clearScreen(): void { echo "\033[2J\033[;H"; }

    public static function header(string $title, string $subtitle = ""): void {
        self::clearScreen();
        echo self::CYAN . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        if ($subtitle !== "") {
            echo "║ " . str_pad($subtitle, 71, " ", STR_PAD_BOTH) . " ║\n";
        }
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function info(string $msg): void { echo self::CYAN . "ℹ " . self::RESET . $msg . "\n"; }
    public static function success(string $msg): void { echo "\n" . self::GREEN . self::BOLD . "✔ " . $msg . self::RESET . "\n\n"; }
    public static function error(string $msg): void { echo "\n" . self::RED . self::BOLD . "✖ " . $msg . self::RESET . "\n\n"; exit(1); }
    
    /**
     * Overwrites the current terminal line to show real-time progress
     */
    public static function progress(string $msg): void {
        echo "\r" . str_repeat(" ", 80); // Clear line
        echo "\r" . self::YELLOW . "⚙ " . self::RESET . $msg;
    }
}

// ==========================================
// 2. Database Component
// ==========================================
class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            // Using SQLite for zero-config demonstration. 
            // In production, swap this DSN for MySQL: "mysql:host=127.0.0.1;dbname=app_db;charset=utf8mb4"
            $dbPath = __DIR__ . '/data_sync.sqlite';
            self::$instance = new PDO("sqlite:" . $dbPath);
            self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        }
        return self::$instance;
    }

    /**
     * Helper to auto-create a table if testing without a pre-existing DB
     */
    public static function ensureTableExists(string $tableName, array $columns): void {
        $db = self::getConnection();
        $cols = implode(" TEXT, ", $columns) . " TEXT"; // Simplified dynamic typing for SQLite demo
        $db->exec("CREATE TABLE IF NOT EXISTS {$tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT, {$cols})");
    }
}

// ==========================================
// 3. Core Import / Export Engine
// ==========================================
class CsvManager {
    private PDO $db;
    private const CHUNK_SIZE = 500; // Optimal batch size for inserts

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Generator function to yield one row at a time.
     * Prevents memory exhaustion on massive CSVs.
     */
    private function readCsvChunked(string $filepath): Generator {
        $handle = fopen($filepath, 'r');
        if (!$handle) {
            CliUI::error("Could not open file: {$filepath}");
        }

        $headers = fgetcsv($handle);
        if (!$headers) {
            fclose($handle);
            CliUI::error("CSV file is empty or missing headers.");
        }

        // Clean headers (remove BOM, trim whitespace)
        $headers = array_map(fn($h) => trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h)), $headers);

        while (($row = fgetcsv($handle)) !== false) {
            // Skip empty lines
            if (array_filter($row)) {
                yield array_combine($headers, $row);
            }
        }
        fclose($handle);
    }

    public function import(string $filepath, string $tableName): void {
        if (!file_exists($filepath)) CliUI::error("File not found: {$filepath}");
        
        CliUI::info("Initializing memory-safe CSV stream...");
        $startTime = microtime(true);
        $totalImported = 0;
        
        $generator = $this->readCsvChunked($filepath);
        $chunk = [];
        $columns = [];

        foreach ($generator as $row) {
            if (empty($columns)) {
                $columns = array_keys($row);
                // Auto-create table for demonstration purposes
                Database::ensureTableExists($tableName, $columns);
            }

            $chunk[] = $row;

            if (count($chunk) === self::CHUNK_SIZE) {
                $this->insertChunk($tableName, $columns, $chunk);
                $totalImported += count($chunk);
                CliUI::progress("Imported {$totalImported} rows...");
                $chunk = []; // Free memory
            }
        }

        // Insert remaining rows
        if (!empty($chunk)) {
            $this->insertChunk($tableName, $columns, $chunk);
            $totalImported += count($chunk);
            CliUI::progress("Imported {$totalImported} rows...");
        }

        $duration = round(microtime(true) - $startTime, 2);
        CliUI::success("Successfully imported {$totalImported} rows into '{$tableName}' in {$duration}s.");
    }

    private function insertChunk(string $tableName, array $columns, array $dataChunk): void {
        $this->db->beginTransaction();
        try {
            $colNames = implode(',', $columns);
            $placeholders = implode(',', array_fill(0, count($columns), '?'));
            $sql = "INSERT INTO {$tableName} ({$colNames}) VALUES ({$placeholders})";
            
            $stmt = $this->db->prepare($sql);
            
            foreach ($dataChunk as $row) {
                $stmt->execute(array_values($row));
            }
            $this->db->commit();
        } catch (PDOException $e) {
            $this->db->rollBack();
            CliUI::error("Database Error during import chunk: " . $e->getMessage());
        }
    }

    public function export(string $tableName, string $filepath): void {
        CliUI::info("Preparing database query stream...");
        $startTime = microtime(true);
        
        // Ensure table exists before querying
        try {
            $check = $this->db->query("SELECT 1 FROM {$tableName} LIMIT 1");
        } catch (PDOException $e) {
            CliUI::error("Table '{$tableName}' does not exist.");
        }

        $handle = fopen($filepath, 'w');
        if (!$handle) CliUI::error("Could not create export file: {$filepath}");

        // Using unbuffered queries if possible (native to MySQL, SQLite simulates it well enough)
        $stmt = $this->db->prepare("SELECT * FROM {$tableName}");
        $stmt->execute();

        $rowCount = 0;
        $headersWritten = false;

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (!$headersWritten) {
                fputcsv($handle, array_keys($row));
                $headersWritten = true;
            }
            fputcsv($handle, array_values($row));
            $rowCount++;
            
            if ($rowCount % 1000 === 0) {
                CliUI::progress("Exported {$rowCount} rows...");
            }
        }

        fclose($handle);
        $duration = round(microtime(true) - $startTime, 2);
        $fileSize = round(filesize($filepath) / 1024 / 1024, 2);

        CliUI::progress("Exported {$rowCount} rows...");
        CliUI::success("Export complete: {$rowCount} rows written to {$filepath} ({$fileSize} MB) in {$duration}s.");
    }
}

// ==========================================
// 4. CLI Router / Bootstrap
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("This script can only be run from the command line.");
}

if ($argc < 4) {
    CliUI::header("Data Sync: CSV & Database");
    echo "Usage:\n";
    echo "  " . CliUI::CYAN . "php csv_sync.php import" . CliUI::RESET . " <path_to_csv> <table_name>\n";
    echo "  " . CliUI::CYAN . "php csv_sync.php export" . CliUI::RESET . " <path_to_csv> <table_name>\n\n";
    echo CliUI::DIM . "Note: If importing, the CSV headers must match the DB columns.\n" . CliUI::RESET;
    exit(1);
}

$action = strtolower($argv[1]);
$filepath = $argv[2];
$tableName = $argv[3];

CliUI::header("Data Sync", ucfirst($action) . " mode active");

$manager = new CsvManager();

try {
    if ($action === 'import') {
        $manager->import($filepath, $tableName);
    } elseif ($action === 'export') {
        $manager->export($tableName, $filepath);
    } else {
        CliUI::error("Unknown action: {$action}. Use 'import' or 'export'.");
    }
} catch (Exception $e) {
    CliUI::error("Fatal System Error: " . $e->getMessage());
}
