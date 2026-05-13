<?php

declare(strict_types=1);

namespace VaultCLI;

use VaultCLI\Commands\AddExpenseCommand;
use VaultCLI\Commands\AddIncomeCommand;
use VaultCLI\Commands\CommandInterface;
use VaultCLI\Commands\DeleteTransactionCommand;
use VaultCLI\Commands\HelpCommand;
use VaultCLI\Commands\SetBudgetCommand;
use VaultCLI\Commands\ViewReportCommand;
use VaultCLI\Repositories\SQLiteBudgetRepository;
use VaultCLI\Repositories\SQLiteTransactionRepository;
use VaultCLI\UI\TerminalDashboard;

/**
 * Application – the Composition Root & CLI Router
 *
 * ════════════════════════════════════════════════════════════════════
 *  Command Pattern: Routing
 * ════════════════════════════════════════════════════════════════════
 * The Application class acts as the Command Invoker.  It:
 *
 *   1. Constructs all dependencies (DI by hand – no container needed).
 *   2. Registers each Command object against its CLI keyword.
 *   3. Reads argv[1] and dispatches to the matching Command.
 *
 * Adding a new sub-command requires:
 *   a. Create a new class implementing CommandInterface.
 *   b. Register it in the $commands map below.
 *   Zero changes to existing code – Open/Closed Principle satisfied.
 *
 * ════════════════════════════════════════════════════════════════════
 *  Composition Root
 * ════════════════════════════════════════════════════════════════════
 * All object construction happens here, at the application boundary.
 * No "new" keyword exists inside Commands or Repositories – they
 * declare their dependencies via constructor parameters (Constructor
 * Injection).  This makes each class independently unit-testable by
 * substituting mock implementations of their interfaces.
 */
final class Application
{
    private TerminalDashboard $ui;

    /** @var array<string, CommandInterface> */
    private array $commands;

    public function __construct()
    {
        // ── Infrastructure layer ────────────────────────────────────────────────
        $this->ui    = new TerminalDashboard();
        $txRepo      = new SQLiteTransactionRepository(VAULT_DB_PATH);
        $budgetRepo  = new SQLiteBudgetRepository(VAULT_DB_PATH);

        // ── Command registry ────────────────────────────────────────────────────
        $this->commands = [
            'add-expense' => new AddExpenseCommand($txRepo, $this->ui),
            'add-income'  => new AddIncomeCommand($txRepo, $this->ui),
            'set-budget'  => new SetBudgetCommand($budgetRepo, $this->ui),
            'report'      => new ViewReportCommand($txRepo, $budgetRepo, $this->ui),
            'delete'      => new DeleteTransactionCommand($txRepo, $this->ui),
        ];

        // Help command has access to the full registry for self-documenting output
        $this->commands['help'] = new HelpCommand($this->commands, $this->ui);
    }

    /**
     * Parse argv and dispatch to the matching Command.
     *
     * @param string[] $argv  PHP's global $argv array
     */
    public function run(array $argv): void
    {
        // argv[0] = script name, argv[1] = sub-command
        $subCommand = $argv[1] ?? 'help';

        // Normalize --help flag
        if ($subCommand === '--help' || $subCommand === '-h') {
            $subCommand = 'help';
        }

        // Unknown command gracefully falls through to help + error
        if (!isset($this->commands[$subCommand])) {
            $this->ui->error("Unknown command: '{$subCommand}'");
            echo PHP_EOL;
            $this->commands['help']->execute([]);
            exit(1);
        }

        // Slice args: everything after the sub-command keyword
        $args = array_slice($argv, 2);

        $this->commands[$subCommand]->execute($args);
    }
}
