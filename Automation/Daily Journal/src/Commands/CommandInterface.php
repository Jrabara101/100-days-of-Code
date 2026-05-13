<?php

declare(strict_types=1);

namespace ChronoVault\Commands;

/**
 * CommandInterface — Contract for all CLI commands.
 */
interface CommandInterface
{
    /**
     * Executes the command.
     *
     * @param array $args  Command-line arguments (argv slice after command name).
     * @return int         Exit code: 0 = success, non-zero = error.
     */
    public function execute(array $args): int;

    /**
     * Returns the command name as typed by the user (e.g., 'write', 'read').
     */
    public function getName(): string;

    /**
     * Returns a one-line description for the help screen.
     */
    public function getDescription(): string;
}
