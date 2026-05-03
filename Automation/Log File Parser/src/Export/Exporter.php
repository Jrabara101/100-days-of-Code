<?php

declare(strict_types=1);

namespace OmniLog\Export;

/**
 * Exporter – Writes aggregated analysis results to JSON or CSV files.
 *
 * Strategy selection via --export=json|csv CLI flag.
 * Output files are timestamped to avoid collisions.
 */
class Exporter
{
    /**
     * Export aggregated data to file.
     *
     * @param  array  $data      Result of Aggregator::toArray()
     * @param  string $format    'json' or 'csv'
     * @param  string $outputDir Directory to write the file into
     * @return string            Full path of the written file
     */
    public function export(array $data, string $format, string $outputDir = '.'): string
    {
        $timestamp = date('Ymd_His');

        return match ($format) {
            'json'  => $this->exportJson($data, $outputDir, $timestamp),
            'csv'   => $this->exportCsv($data, $outputDir, $timestamp),
            default => throw new \InvalidArgumentException(
                "Unsupported export format: '{$format}'. Use 'json' or 'csv'."
            ),
        };
    }

    private function exportJson(array $data, string $dir, string $ts): string
    {
        $path = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . "omnilog_export_{$ts}.json";
        $encoded = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if ($encoded === false) {
            throw new \RuntimeException('Failed to JSON-encode aggregation results.');
        }

        file_put_contents($path, $encoded);
        return $path;
    }

    private function exportCsv(array $data, string $dir, string $ts): string
    {
        $path = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . "omnilog_export_{$ts}.csv";
        $fp   = fopen($path, 'w');

        if ($fp === false) {
            throw new \RuntimeException("Cannot open file for writing: {$path}");
        }

        // ── Section: Summary ──────────────────────────────────────
        fputcsv($fp, ['=== OMNILOG ANALYSIS SUMMARY ===']);
        fputcsv($fp, ['Metric', 'Value']);
        fputcsv($fp, ['Total Entries',  $data['total_entries']]);
        fputcsv($fp, ['Error Entries',  $data['error_entries']]);

        fputcsv($fp, []);

        // ── Section: Status Code Distribution ────────────────────
        fputcsv($fp, ['=== STATUS CODE DISTRIBUTION ===']);
        fputcsv($fp, ['Bucket', 'Count']);
        foreach ($data['status_buckets'] as $bucket => $count) {
            fputcsv($fp, [$bucket, $count]);
        }

        fputcsv($fp, []);

        // ── Section: Top IPs ──────────────────────────────────────
        fputcsv($fp, ['=== TOP OFFENDING IPs ===']);
        fputcsv($fp, ['IP Address', 'Request Count', 'Last Status Code']);
        foreach ($data['top_ips'] as $row) {
            fputcsv($fp, [$row['ip'], $row['count'], $row['status']]);
        }

        fputcsv($fp, []);

        // ── Section: Top Endpoints ────────────────────────────────
        fputcsv($fp, ['=== TOP ENDPOINTS ===']);
        fputcsv($fp, ['Endpoint', 'Hit Count']);
        foreach ($data['top_endpoints'] as $endpoint => $count) {
            fputcsv($fp, [$endpoint, $count]);
        }

        fputcsv($fp, []);

        // ── Section: Level Counts ─────────────────────────────────
        fputcsv($fp, ['=== LOG LEVEL DISTRIBUTION ===']);
        fputcsv($fp, ['Level', 'Count']);
        foreach ($data['level_counts'] as $level => $count) {
            fputcsv($fp, [$level, $count]);
        }

        fclose($fp);
        return $path;
    }
}
