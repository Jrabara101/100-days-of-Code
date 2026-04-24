<?php

declare(strict_types=1);

namespace DailyQuote\Logger;

use DailyQuote\Config\Config;
use Monolog\Formatter\LineFormatter;
use Monolog\Handler\NullHandler;
use Monolog\Handler\RotatingFileHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Level;
use Monolog\Logger;
use Psr\Log\LoggerInterface;

/**
 * AppLogger — Factory that wires up a Monolog logger based on Config.
 *
 * Channels:
 *  - file   → rotating daily log file (default)
 *  - stderr → outputs to STDERR for piping/debugging
 *  - null   → silences all log output
 */
final class AppLogger
{
    private const DATE_FORMAT = 'Y-m-d H:i:s';
    private const LINE_FORMAT = "[%datetime%] %level_name%: %message% %context%\n";

    /** Create and return a configured PSR-3 logger. */
    public static function create(Config $config): LoggerInterface
    {
        $channel = strtolower($config->get('LOG_CHANNEL', 'file'));
        $level   = self::resolveLevel($config->get('LOG_LEVEL', 'info'));
        $logger  = new Logger('daily-quote');

        $handler = match ($channel) {
            'stderr' => new StreamHandler(STDERR, $level),
            'null'   => new NullHandler(),
            default  => self::buildFileHandler($config->logPath(), $level),
        };

        // Clean one-line format without color noise in log files
        $formatter = new LineFormatter(
            format: self::LINE_FORMAT,
            dateFormat: self::DATE_FORMAT,
            allowInlineLineBreaks: false,
            ignoreEmptyContextAndExtra: true,
        );
        $handler->setFormatter($formatter);
        $logger->pushHandler($handler);

        return $logger;
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private static function buildFileHandler(string $logPath, Level $level): RotatingFileHandler
    {
        // Ensure log directory exists
        $dir = dirname($logPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, recursive: true);
        }

        // Keep 30 days of rolling logs
        return new RotatingFileHandler(
            filename: $logPath,
            maxFiles: 30,
            level: $level,
        );
    }

    private static function resolveLevel(string $level): Level
    {
        return match (strtolower($level)) {
            'debug'   => Level::Debug,
            'warning' => Level::Warning,
            'error'   => Level::Error,
            default   => Level::Info,
        };
    }
}
