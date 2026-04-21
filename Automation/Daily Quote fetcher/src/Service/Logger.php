<?php

declare(strict_types=1);

namespace DailyQuote\Service;

use DailyQuote\Exception\StorageException;

/**
 * Logger — PSR-3-inspired file logger with level filtering.
 *
 * Levels (ascending severity): debug, info, warning, error, critical
 */
final class Logger
{
    private const LEVELS = ['debug' => 0, 'info' => 1, 'warning' => 2, 'error' => 3, 'critical' => 4];

    private readonly string $logFile;
    private readonly int    $minLevel;
    private readonly bool   $enabled;

    public function __construct(private readonly string $rootDir)
    {
        $logDir  = $rootDir . DIRECTORY_SEPARATOR . ($_ENV['LOG_DIR'] ?? 'storage/logs');
        $date    = date('Y-m-d');

        $this->enabled  = filter_var($_ENV['LOG_ENABLED'] ?? 'true', FILTER_VALIDATE_BOOLEAN);
        $this->logFile  = $logDir . DIRECTORY_SEPARATOR . "quote-{$date}.log";
        $rawLevel       = strtolower($_ENV['LOG_LEVEL'] ?? 'info');
        $this->minLevel = self::LEVELS[$rawLevel] ?? self::LEVELS['info'];
    }

    public function debug(string $message, array $context = []): void
    {
        $this->write('DEBUG', $message, $context);
    }

    public function info(string $message, array $context = []): void
    {
        $this->write('INFO', $message, $context);
    }

    public function warning(string $message, array $context = []): void
    {
        $this->write('WARNING', $message, $context);
    }

    public function error(string $message, array $context = []): void
    {
        $this->write('ERROR', $message, $context);
    }

    public function critical(string $message, array $context = []): void
    {
        $this->write('CRITICAL', $message, $context);
    }

    // ── Private ────────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed> $context
     * @throws StorageException on file write failure
     */
    private function write(string $level, string $message, array $context = []): void
    {
        if (! $this->enabled) {
            return;
        }

        $levelInt = self::LEVELS[strtolower($level)] ?? 0;
        if ($levelInt < $this->minLevel) {
            return;
        }

        $dir = dirname($this->logFile);
        if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
            // If we can't create the log dir, silently skip — don't crash the app
            return;
        }

        $ctx  = empty($context) ? '' : '  ' . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $line = sprintf(
            "[%s] [%s] %s%s\n",
            date('Y-m-d H:i:s'),
            str_pad($level, 8),
            $message,
            $ctx
        );

        if (file_put_contents($this->logFile, $line, FILE_APPEND | LOCK_EX) === false) {
            // Logging failure should never crash the main process
        }
    }
}
