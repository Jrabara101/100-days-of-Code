<?php

declare(strict_types=1);

namespace DailyQuote\Config;

/**
 * Config — Centralized configuration manager.
 *
 * Reads from environment variables (loaded by vlucas/phpdotenv) with
 * sensible defaults so the application works out-of-the-box even
 * without a .env file.
 */
final class Config
{
    /** Resolved configuration values. */
    private array $values;

    public function __construct(private readonly string $rootDir)
    {
        $this->values = $this->buildDefaults();
    }

    /**
     * Retrieve a configuration value by key.
     *
     * @param  string  $key     Env-var name / config key.
     * @param  mixed   $default Fallback when key is absent or empty.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $raw = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key) ?: null;

        if ($raw !== null && $raw !== '') {
            return $raw;
        }

        return $this->values[$key] ?? $default;
    }

    /** Typed boolean helper. */
    public function bool(string $key, bool $default = false): bool
    {
        $val = strtolower((string) $this->get($key, $default ? 'true' : 'false'));
        return in_array($val, ['true', '1', 'yes', 'on'], strict: true);
    }

    /** Typed integer helper. */
    public function int(string $key, int $default = 0): int
    {
        return (int) $this->get($key, $default);
    }

    /** Absolute path helpers. */
    public function storagePath(): string
    {
        return $this->rootDir . '/' . ltrim($this->get('QUOTE_STORAGE_FILE', 'storage/quotes.json'), '/\\');
    }

    public function logPath(): string
    {
        return $this->rootDir . '/' . ltrim($this->get('LOG_FILE', 'logs/app.log'), '/\\');
    }

    public function rootDir(): string
    {
        return $this->rootDir;
    }

    // ── Private ──────────────────────────────────────────────────────────────

    /** Built-in defaults — mirrors .env.example exactly. */
    private function buildDefaults(): array
    {
        return [
            'APP_NAME'              => 'Daily Quote Fetcher',
            'APP_VERSION'           => '2.0.0',
            'APP_ENV'               => 'production',
            'APP_DEBUG'             => 'false',

            'QUOTE_API_URL'         => 'https://zenquotes.io/api/random',
            'QUOTE_API_TIMEOUT'     => '10',
            'QUOTE_API_RETRY'       => '3',
            'QUOTE_API_RETRY_DELAY' => '2',

            'QUOTE_STORAGE_FILE'    => 'storage/quotes.json',
            'QUOTE_HISTORY_LIMIT'   => '100',

            'LOG_CHANNEL'           => 'file',
            'LOG_LEVEL'             => 'info',
            'LOG_FILE'              => 'logs/app.log',

            'DISPLAY_COLORS'        => 'true',
            'DISPLAY_BANNER'        => 'true',
            'DISPLAY_TIMESTAMP'     => 'true',
        ];
    }
}
