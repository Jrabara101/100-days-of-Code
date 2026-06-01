#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI Static Data Backup System
 * * Usage: php backup_cli.php <source_dir> <backup_dest_dir> [retention_days]
 * Example: php backup_cli.php /var/www/html/public/uploads /var/backups/myapp 7
 */

// ==========================================
// 1. Visual Styling & Auditing Component
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const DIM = "\e[2m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";

    public static function header(string $title, string $subtitle = ""): void {
        echo self::CYAN . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        if ($subtitle) {
            echo "║ " . str_pad($subtitle, 71, " ", STR_PAD_BOTH) . " ║\n";
        }
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    private static function timestamp(): string {
        return self::DIM . "[" . date('Y-m-d H:i:s') . "] " . self::RESET;
    }

    public static function success(string $msg): void { echo self::timestamp() . self::GREEN . self::BOLD . "✔ SUCCESS: " . self::RESET . $msg . "\n"; }
    public static function error(string $msg): void { echo self::timestamp() . self::RED . self::BOLD . "✖ ERROR: " . self::RESET . $msg . "\n"; exit(1); }
    public static function warning(string $msg): void { echo self::timestamp() . self::YELLOW . "⚠ WARNING: " . self::RESET . $msg . "\n"; }
    public static function info(string $msg): void { echo self::timestamp() . self::CYAN . "ℹ INFO: " . self::RESET . $msg . "\n"; }

    public static function formatBytes(int $bytes, int $precision = 2): string {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

// ==========================================
// 2. Core Backup Logic
// ==========================================
class BackupManager {
    private string $sourceDir;
    private string $destDir;
    private int $retentionDays;

    public function __construct(string $sourceDir, string $destDir, int $retentionDays = 7) {
        $this->sourceDir = rtrim($sourceDir, DIRECTORY_SEPARATOR);
        $this->destDir = rtrim($destDir, DIRECTORY_SEPARATOR);
        $this->retentionDays = $retentionDays;
    }

    public function run(): void {
        $this->validate();
        
        $backupFile = $this->destDir . DIRECTORY_SEPARATOR . 'backup_' . date('Y_m_d_His') . '.zip';
        
        $stats = $this->createArchive($backupFile);
        $deletedCount = $this->enforceRetentionPolicy();

        $this->printSummary($stats, $deletedCount, $backupFile);
    }

    private function validate(): void {
        CliUI::info("Starting validation checks...");

        if (!extension_loaded('zip')) {
            CliUI::error("The ZipArchive extension is not loaded in PHP.");
        }

        if (!is_dir($this->sourceDir) || !is_readable($this->sourceDir)) {
            CliUI::error("Source directory does not exist or is not readable: {$this->sourceDir}");
        }

        if (!is_dir($this->destDir)) {
            CliUI::info("Destination directory does not exist. Attempting to create it...");
            if (!mkdir($this->destDir, 0755, true)) {
                CliUI::error("Failed to create destination directory: {$this->destDir}");
            }
        }

        if (!is_writable($this->destDir)) {
            CliUI::error("Destination directory is not writable: {$this->destDir}");
        }
        
        CliUI::success("Validation passed. Ready to back up.");
    }

    private function createArchive(string $destinationPath): array {
        CliUI::info("Initializing memory-efficient directory traversal...");
        
        $zip = new ZipArchive();
        if ($zip->open($destinationPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            CliUI::error("Cannot create zip archive at {$destinationPath}");
        }

        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->sourceDir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::LEAVES_ONLY
        );

        $fileCount = 0;
        $totalSize = 0;

        CliUI::info("Compressing files. This may take a while depending on size...");

        foreach ($files as $name => $file) {
            // Skip unreadable files to prevent the whole backup from crashing
            if (!$file->isReadable()) {
                CliUI::warning("Skipping unreadable file: {$file->getRealPath()}");
                continue;
            }

            // Get real and relative path for zip structure
            $filePath = $file->getRealPath();
            $relativePath = substr($filePath, strlen($this->sourceDir) + 1);

            // Add current file to archive
            $zip->addFile($filePath, $relativePath);
            
            $fileCount++;
            $totalSize += $file->getSize();
        }

        $zip->close();
        
        CliUI::success("Archive created successfully.");

        return [
            'files' => $fileCount,
            'size' => $totalSize,
            'archive_size' => filesize($destinationPath)
        ];
    }

    private function enforceRetentionPolicy(): int {
        if ($this->retentionDays <= 0) {
            CliUI::info("Retention policy is disabled (0 days). Keeping all backups.");
            return 0;
        }

        CliUI::info("Enforcing {$this->retentionDays}-day retention policy...");
        $deleted = 0;
        $now = time();

        $backups = glob($this->destDir . DIRECTORY_SEPARATOR . 'backup_*.zip');
        
        foreach ($backups as $file) {
            if (is_file($file)) {
                // Calculate age in days
                $fileAgeDays = ($now - filemtime($file)) / (60 * 60 * 24);
                
                if ($fileAgeDays >= $this->retentionDays) {
                    if (unlink($file)) {
                        CliUI::info("Deleted old backup: " . basename($file));
                        $deleted++;
                    } else {
                        CliUI::warning("Failed to delete old backup: " . basename($file));
                    }
                }
            }
        }

        return $deleted;
    }

    private function printSummary(array $stats, int $deletedCount, string $backupFile): void {
        echo "\n" . CliUI::BOLD . CliUI::CYAN . "=== BACKUP SUMMARY ===" . CliUI::RESET . "\n";
        
        // Dynamic ASCII Table for Summary
        $headers = ['Metric', 'Value'];
        $data = [
            ['File Created', basename($backupFile)],
            ['Files Processed', number_format($stats['files'])],
            ['Raw Data Size', CliUI::formatBytes($stats['size'])],
            ['Compressed Size', CliUI::formatBytes($stats['archive_size'])],
            ['Compression Ratio', round((1 - ($stats['archive_size'] / max($stats['size'], 1))) * 100, 1) . '%'],
            ['Old Backups Cleaned', (string)$deletedCount]
        ];

        // Drawing Table
        $col1W = 22; $col2W = 35;
        echo "┌" . str_repeat("─", $col1W + 2) . "┬" . str_repeat("─", $col2W + 2) . "┐\n";
        foreach ($data as $row) {
            echo "│ " . str_pad($row[0], $col1W) . " │ " . str_pad($row[1], $col2W) . " │\n";
        }
        echo "└" . str_repeat("─", $col1W + 2) . "┴" . str_repeat("─", $col2W + 2) . "┘\n\n";
    }
}

// ==========================================
// 3. CLI Bootstrap & Argument Parsing
// ==========================================

if (php_sapi_name() !== 'cli') {
    die("This script can only be run from the command line.");
}

if ($argc < 3) {
    CliUI::header("Daily Data Backup Worker");
    echo "Usage: php " . basename(__FILE__) . " <source_dir> <destination_dir> [retention_days]\n";
    echo "  " . CliUI::CYAN . "source_dir" . CliUI::RESET . "      : The folder containing files you want to backup\n";
    echo "  " . CliUI::CYAN . "destination_dir" . CliUI::RESET . " : The folder where the .zip file will be saved\n";
    echo "  " . CliUI::CYAN . "retention_days" . CliUI::RESET . "  : (Optional) Delete backups older than this. Default is 7.\n\n";
    exit(1);
}

$source = $argv[1];
$dest = $argv[2];
$retention = isset($argv[3]) ? (int)$argv[3] : 7;

CliUI::header("Daily Data Backup Worker", "Source: {$source} | Dest: {$dest}");

try {
    $manager = new BackupManager($source, $dest, $retention);
    $manager->run();
} catch (Exception $e) {
    CliUI::error("Fatal Exception: " . $e->getMessage());
}
