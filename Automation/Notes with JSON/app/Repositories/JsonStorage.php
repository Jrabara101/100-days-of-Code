<?php

namespace App\Repositories;

use Exception;

/**
 * Handle low-level JSON storage operations
 */
class JsonStorage
{
    private string $filePath;

    public function __construct(string $filePath)
    {
        $this->filePath = $filePath;
        $this->ensureFileExists();
    }

    private function ensureFileExists(): void
    {
        if (!file_exists($this->filePath)) {
            $directory = dirname($this->filePath);
            if (!is_dir($directory)) {
                mkdir($directory, 0777, true);
            }
            file_put_contents($this->filePath, json_encode(['notes' => [], 'last_id' => 0], JSON_PRETTY_PRINT));
        }
    }

    public function read(): array
    {
        $content = file_get_contents($this->filePath);
        if ($content === false) {
            throw new Exception("Could not read storage file: {$this->filePath}");
        }

        $data = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Storage file is corrupted or invalid JSON: " . json_last_error_msg());
        }

        return $data;
    }

    public function write(array $data): bool
    {
        $json = json_encode($data, JSON_PRETTY_PRINT);
        if ($json === false) {
            throw new Exception("Could not encode data to JSON");
        }

        return file_put_contents($this->filePath, $json) !== false;
    }

    public function getFilePath(): string
    {
        return $this->filePath;
    }
}
