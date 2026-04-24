<?php

declare(strict_types=1);

namespace DailyQuote\App;

use DailyQuote\Commands\FetchCommand;
use DailyQuote\Commands\HistoryCommand;
use DailyQuote\Commands\RandomCommand;
use DailyQuote\Commands\SaveCommand;
use DailyQuote\Config\Config;
use DailyQuote\Logger\AppLogger;
use Dotenv\Dotenv;
use Symfony\Component\Console\Application as ConsoleApplication;

/**
 * Application — Main bootstrap and DI container.
 *
 * Responsible for:
 *  - Loading environment variables
 *  - Instantiating shared services
 *  - Registering CLI commands
 *  - Handing off execution to Symfony Console
 */
final class Application
{
    private ConsoleApplication $console;
    private Config $config;

    public function __construct(private readonly string $rootDir)
    {
        $this->loadEnvironment();
        $this->config  = new Config($rootDir);
        $this->console = new ConsoleApplication(
            name: $this->config->get('APP_NAME', 'Daily Quote Fetcher'),
            version: $this->config->get('APP_VERSION', '2.0.0'),
        );

        $this->ensureDirectories();
        $this->registerCommands();
    }

    /** Run the Symfony Console application and return exit code. */
    public function run(): int
    {
        // When the user types bare `php app.php` (no command word) we fall back
        // to quote:fetch.  We must NOT pass `true` (isSingleCommand) here
        // because that would break explicit `php app.php quote:save` routing.
        $this->console->setDefaultCommand('quote:fetch');

        return $this->console->run();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /** Load .env file if present; fall back to OS environment. */
    private function loadEnvironment(): void
    {
        $envFile = $this->rootDir . '/.env';

        if (file_exists($envFile)) {
            $dotenv = Dotenv::createImmutable($this->rootDir);
            $dotenv->safeLoad();
        }
    }

    /** Create required directories if they do not exist. */
    private function ensureDirectories(): void
    {
        $dirs = [
            $this->rootDir . '/logs',
            $this->rootDir . '/storage',
        ];

        foreach ($dirs as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0755, recursive: true);
            }
        }
    }

    /** Register all CLI commands with the Symfony Console. */
    private function registerCommands(): void
    {
        $logger = AppLogger::create($this->config);

        $this->console->addCommands([
            new FetchCommand($this->config, $logger),
            new SaveCommand($this->config, $logger),
            new HistoryCommand($this->config, $logger),
            new RandomCommand($this->config, $logger),
        ]);
    }
}
