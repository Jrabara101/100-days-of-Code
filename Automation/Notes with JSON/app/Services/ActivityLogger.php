<?php

namespace App\Services;

/**
 * Log activities to a JSON file
 */
class ActivityLogger
{
    private string $filePath;

    public function __construct(string $filePath)
    {
        $this->filePath = $filePath;
        if (!file_exists($filePath)) {
            file_put_contents($filePath, json_encode([], JSON_PRETTY_PRINT));
        }
    }

    public function log(string $action, string $details): void
    {
        $logs = json_decode(file_get_contents($this->filePath), true);
        $logs[] = [
            'timestamp' => date('Y-m-d H:i:s'),
            'action' => $action,
            'details' => $details
        ];
        // Keep only last 100 logs
        if (count($logs) > 100) {
            array_shift($logs);
        }
        file_put_contents($this->filePath, json_encode($logs, JSON_PRETTY_PRINT));
    }

    public function getRecent(int $limit = 10): array
    {
        $logs = json_decode(file_get_contents($this->filePath), true);
        return array_reverse(array_slice($logs, -$limit));
    }
}
