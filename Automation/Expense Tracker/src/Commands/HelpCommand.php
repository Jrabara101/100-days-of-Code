<?php

declare(strict_types=1);

namespace VaultCLI\Commands;

use VaultCLI\UI\TerminalDashboard;

/**
 * HelpCommand – handles `vault --help` or `vault help`
 *
 * Iterates the registered command map and prints formatted usage.
 */
final class HelpCommand implements CommandInterface
{
    /** @param array<string, CommandInterface> $commands */
    public function __construct(
        private readonly array           $commands,
        private readonly TerminalDashboard $ui,
    ) {}

    public function description(): string
    {
        return 'Display this help screen.';
    }

    public function execute(array $args): void
    {
        $this->ui->renderHelp($this->commands);
    }
}
