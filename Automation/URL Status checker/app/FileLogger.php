<?php

declare(strict_types=1);

namespace App;

/**
 * FileLogger
 *
 * Appends URL check results to a structured plain-text log file.
 * Each session is separated with a dated header block.
 *
 * @package App
 */
class FileLogger
{
    /** @var string Absolute path to the log file */
    private string $logPath;

    /** @var bool Whether the session header has been written yet */
    private bool $headerWritten = false;

    /**
     * @param string $logPath Full path to the log file (created if not exists)
     */
    public function __construct(string $logPath)
    {
        $this->logPath = $logPath;
        $this->ensureDirectory();
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Write the session header once per run.
     */
    public function writeSessionHeader(int $urlCount, int $timeout, int $retries): void
    {
        if ($this->headerWritten) {
            return;
        }

        $line = str_repeat('=', 80);
        $now  = date('Y-m-d H:i:s');

        $header  = PHP_EOL . $line . PHP_EOL;
        $header .= "  URL STATUS CHECKER — Session Log" . PHP_EOL;
        $header .= "  Date       : {$now}" . PHP_EOL;
        $header .= "  URLs Queued: {$urlCount}" . PHP_EOL;
        $header .= "  Timeout    : {$timeout}s" . PHP_EOL;
        $header .= "  Retries    : {$retries}" . PHP_EOL;
        $header .= $line . PHP_EOL;

        $this->append($header);
        $this->headerWritten = true;
    }

    /**
     * Log a single URL result entry.
     *
     * @param array<string, mixed> $result
     */
    public function logResult(array $result): void
    {
        $sep    = str_repeat('-', 60);
        $entry  = PHP_EOL . $sep . PHP_EOL;
        $entry .= "  URL        : {$result['url']}" . PHP_EOL;
        $entry .= "  Status     : " . ($result['status_code'] ?? 'N/A') . PHP_EOL;
        $entry .= "  Meaning    : {$result['status_meaning']}" . PHP_EOL;
        $entry .= "  Category   : {$result['category']}" . PHP_EOL;
        $entry .= "  Resp. Time : " . ($result['response_time_ms'] !== null ? $result['response_time_ms'] . ' ms' : 'N/A') . PHP_EOL;
        $entry .= "  Redirected : " . ($result['redirected'] ? 'Yes (' . $result['redirect_count'] . 'x)' : 'No') . PHP_EOL;

        if ($result['final_url'] !== null) {
            $entry .= "  Final URL  : {$result['final_url']}" . PHP_EOL;
        }
        if ($result['error'] !== null) {
            $entry .= "  Error      : {$result['error']}" . PHP_EOL;
        }

        $entry .= "  Checked At : {$result['timestamp']}" . PHP_EOL;

        $this->append($entry);
    }

    /**
     * Write a summary footer block at the end of the session.
     *
     * @param array<string, int|float> $summary
     */
    public function writeSummary(array $summary): void
    {
        $line    = str_repeat('=', 80);
        $footer  = PHP_EOL . $line . PHP_EOL;
        $footer .= "  SUMMARY" . PHP_EOL;
        $footer .= "  Total Checked : {$summary['total']}" . PHP_EOL;
        $footer .= "  Online (2xx)  : {$summary['online']}" . PHP_EOL;
        $footer .= "  Redirecting   : {$summary['redirect']}" . PHP_EOL;
        $footer .= "  Client Error  : {$summary['client']}" . PHP_EOL;
        $footer .= "  Server Error  : {$summary['server']}" . PHP_EOL;
        $footer .= "  Invalid URL   : {$summary['invalid']}" . PHP_EOL;
        $footer .= "  Failed/Timeout: {$summary['failed']}" . PHP_EOL;
        $footer .= "  Avg. Resp.    : {$summary['avg_time']} ms" . PHP_EOL;
        $footer .= $line . PHP_EOL . PHP_EOL;

        $this->append($footer);
    }

    /**
     * Return the log file path.
     */
    public function getPath(): string
    {
        return $this->logPath;
    }

    // ─── Internal Helpers ────────────────────────────────────────────────────

    /**
     * Append text to the log file.
     *
     * @throws \RuntimeException On write failure
     */
    private function append(string $content): void
    {
        if (file_put_contents($this->logPath, $content, FILE_APPEND | LOCK_EX) === false) {
            throw new \RuntimeException("Cannot write to log file: {$this->logPath}");
        }
    }

    /**
     * Ensure the log directory exists; create it if it does not.
     */
    private function ensureDirectory(): void
    {
        $dir = dirname($this->logPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}
