<?php

declare(strict_types=1);

namespace VaultCLI\Commands;

/**
 * CommandInterface – Command Pattern contract.
 *
 * Architectural note: Each CLI sub-command is encapsulated as an
 * independent object that implements this interface.  The Application
 * router maps argv[1] → Command class.  This satisfies:
 *
 *  • Open/Closed Principle – add a new command without touching existing code.
 *  • Single Responsibility  – each Command owns exactly one operation.
 *  • Liskov Substitution    – any Command is substitutable in the router.
 *
 * The $args array carries everything after the sub-command keyword
 * (e.g., ["--amount=1500.00", "--category=Housing", ...]).
 */
interface CommandInterface
{
    /** Return a one-line description shown in --help output. */
    public function description(): string;

    /** Execute the command. $args are the remaining CLI tokens. */
    public function execute(array $args): void;
}
