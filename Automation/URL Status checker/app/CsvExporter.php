<?php

declare(strict_types=1);

namespace App;

/**
 * CsvExporter
 *
 * Exports URL check results to a well-structured CSV file.
 * Each export is stamped with a unique filename to avoid overwriting.
 *
 * @package App
 */
class CsvExporter
{
    /** @var string Directory where CSV files are saved */
    private string $exportDir;

    /** @var string[] CSV column headers */
    private const HEADERS = [
        'URL',
        'Valid',
        'HTTP Status Code',
        'Status Meaning',
        'Category',
        'Response Time (ms)',
        'Redirected',
        'Redirect Count',
        'Final URL',
        'Error',
        'Checked At',
    ];

    /**
     * @param string $exportDir Absolute path to the exports directory
     */
    public function __construct(string $exportDir)
    {
        $this->exportDir = rtrim($exportDir, DIRECTORY_SEPARATOR);
        $this->ensureDirectory();
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Export an array of results to a CSV file.
     * Returns the path of the created file.
     *
     * @param  array<array<string, mixed>> $results
     * @return string  Absolute path to the CSV file
     * @throws \RuntimeException On file write failure
     */
    public function export(array $results): string
    {
        $filename = 'url-check-' . date('Y-m-d_H-i-s') . '.csv';
        $filePath = $this->exportDir . DIRECTORY_SEPARATOR . $filename;

        $handle = fopen($filePath, 'w');
        if ($handle === false) {
            throw new \RuntimeException("Cannot create CSV file: {$filePath}");
        }

        // Write BOM for Excel UTF-8 compatibility
        fwrite($handle, "\xEF\xBB\xBF");

        // Write header row
        fputcsv($handle, self::HEADERS);

        // Write each result row
        foreach ($results as $result) {
            fputcsv($handle, $this->resultToRow($result));
        }

        fclose($handle);
        return $filePath;
    }

    /**
     * Return the export directory path.
     */
    public function getExportDir(): string
    {
        return $this->exportDir;
    }

    // ─── Internal Helpers ────────────────────────────────────────────────────

    /**
     * Map a result array to an ordered CSV row array.
     *
     * @param  array<string, mixed> $result
     * @return array<int, string>
     */
    private function resultToRow(array $result): array
    {
        return [
            $result['url']                                     ?? '',
            $result['valid'] ? 'Yes' : 'No',
            $result['status_code'] !== null ? (string)$result['status_code'] : '',
            $result['status_meaning']                          ?? '',
            $result['category']                                ?? '',
            $result['response_time_ms'] !== null ? (string)$result['response_time_ms'] : '',
            $result['redirected'] ? 'Yes' : 'No',
            (string)($result['redirect_count']                 ?? 0),
            $result['final_url']                               ?? '',
            $result['error']                                   ?? '',
            $result['timestamp']                               ?? '',
        ];
    }

    /**
     * Ensure the export directory exists; create it recursively if not.
     */
    private function ensureDirectory(): void
    {
        if (!is_dir($this->exportDir)) {
            mkdir($this->exportDir, 0755, true);
        }
    }
}
