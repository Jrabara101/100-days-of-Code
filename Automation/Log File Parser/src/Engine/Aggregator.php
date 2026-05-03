<?php

declare(strict_types=1);

namespace OmniLog\Engine;

use OmniLog\Enums\LogLevel;
use OmniLog\Models\LogEntry;

/**
 * Aggregator – Rolling statistical accumulator for parsed log entries.
 *
 * Uses plain PHP arrays as hash maps — O(1) average-case insert and lookup.
 * All aggregation happens in a single pass (no second file scan required),
 * keeping the overall pipeline at O(n) time and O(k) space where k is the
 * cardinality of unique IPs + endpoints, not the total line count.
 *
 * No external libraries required; this avoids dependency bloat and keeps
 * the tool portable to any server with PHP 8.2+.
 */
class Aggregator
{
    private array $ipCounts       = [];
    private array $ipPrimStatus   = [];
    private array $statusBuckets  = ['2xx' => 0, '3xx' => 0, '4xx' => 0, '5xx' => 0];
    private array $endpointCounts = [];
    private array $levelCounts    = [];
    private int   $totalEntries   = 0;
    private int   $errorEntries   = 0;

    /**
     * Ingest a single LogEntry into all rolling metrics.
     * Called once per passing log line; O(1) per call.
     */
    public function ingest(LogEntry $entry): void
    {
        $this->totalEntries++;

        // ── IP tracking ────────────────────────────────────────────
        $ip = $entry->ip;
        $this->ipCounts[$ip]     = ($this->ipCounts[$ip] ?? 0) + 1;
        $this->ipPrimStatus[$ip] = $entry->statusCode; // most recent status

        // ── Status code bucketing ──────────────────────────────────
        $bucket = match (true) {
            $entry->statusCode >= 500 => '5xx',
            $entry->statusCode >= 400 => '4xx',
            $entry->statusCode >= 300 => '3xx',
            default                   => '2xx',
        };
        $this->statusBuckets[$bucket]++;

        // ── Endpoint tracking ──────────────────────────────────────
        $ep = $entry->endpoint;
        $this->endpointCounts[$ep] = ($this->endpointCounts[$ep] ?? 0) + 1;

        // ── Level tracking ─────────────────────────────────────────
        $lv = $entry->level->value;
        $this->levelCounts[$lv] = ($this->levelCounts[$lv] ?? 0) + 1;

        // ── Error counter ──────────────────────────────────────────
        if ($entry->level->isError()) {
            $this->errorEntries++;
        }
    }

    /** Top N IPs by request count, descending. */
    public function getTopIps(int $n = 10): array
    {
        arsort($this->ipCounts);
        $result = [];
        foreach (array_slice($this->ipCounts, 0, $n, preserve_keys: true) as $ip => $count) {
            $result[] = [
                'ip'     => $ip,
                'count'  => $count,
                'status' => $this->ipPrimStatus[$ip] ?? '-',
            ];
        }
        return $result;
    }

    /** Top N endpoints by hit count, descending. */
    public function getTopEndpoints(int $n = 10): array
    {
        arsort($this->endpointCounts);
        return array_slice($this->endpointCounts, 0, $n, preserve_keys: true);
    }

    public function getStatusBuckets(): array
    {
        return $this->statusBuckets;
    }

    public function getLevelCounts(): array
    {
        return $this->levelCounts;
    }

    public function getTotalEntries(): int
    {
        return $this->totalEntries;
    }

    public function getErrorEntries(): int
    {
        return $this->errorEntries;
    }

    /** Serialize all metrics into a flat array for export. */
    public function toArray(): array
    {
        return [
            'total_entries'   => $this->totalEntries,
            'error_entries'   => $this->errorEntries,
            'top_ips'         => $this->getTopIps(),
            'status_buckets'  => $this->statusBuckets,
            'top_endpoints'   => $this->getTopEndpoints(),
            'level_counts'    => $this->levelCounts,
        ];
    }
}
