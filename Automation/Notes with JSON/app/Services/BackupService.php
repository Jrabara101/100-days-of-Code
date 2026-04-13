<?php

namespace App\Services;

use Exception;

/**
 * Handle backups of storage files
 */
class BackupService
{
    private string $backupDir;

    public function __construct(string $backupDir)
    {
        $this->backupDir = $backupDir;
        if (!is_dir($this->backupDir)) {
            mkdir($this->backupDir, 0777, true);
        }
    }

    public function createBackup(string $sourceFile): string
    {
        if (!file_exists($sourceFile)) {
            throw new Exception("Source file for backup not found: {$sourceFile}");
        }

        $filename = basename($sourceFile);
        $backupPath = $this->backupDir . DIRECTORY_SEPARATOR . date('Y-m-d_H-i-s') . '_' . $filename;
        
        if (!copy($sourceFile, $backupPath)) {
            throw new Exception("Failed to create backup at: {$backupPath}");
        }

        return $backupPath;
    }

    public function listBackups(): array
    {
        $files = glob($this->backupDir . DIRECTORY_SEPARATOR . '*');
        return array_map(function($f) {
            return [
                'name' => basename($f),
                'path' => $f,
                'time' => filemtime($f)
            ];
        }, $files);
    }
}
