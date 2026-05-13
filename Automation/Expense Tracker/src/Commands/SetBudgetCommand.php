<?php

declare(strict_types=1);

namespace VaultCLI\Commands;

use VaultCLI\DTOs\BudgetDTO;
use VaultCLI\DTOs\TransactionDTO;
use VaultCLI\Repositories\BudgetRepositoryInterface;
use VaultCLI\UI\TerminalDashboard;

/**
 * SetBudgetCommand – handles `vault set-budget`
 *
 * Usage:
 *   vault set-budget --category="Groceries" --limit=600
 */
final class SetBudgetCommand implements CommandInterface
{
    public function __construct(
        private readonly BudgetRepositoryInterface $repo,
        private readonly TerminalDashboard         $ui,
    ) {}

    public function description(): string
    {
        return 'Set or update a monthly budget limit for a category.';
    }

    public function execute(array $args): void
    {
        $opts = $this->parseArgs($args);

        if (!isset($opts['category'], $opts['limit'])) {
            $this->ui->error('Usage: vault set-budget --category=<cat> --limit=<amount>');
            return;
        }

        $limitCents = TransactionDTO::centsFromDecimal($opts['limit']);

        if ($limitCents <= 0) {
            $this->ui->error('Limit must be a positive number.');
            return;
        }

        $dto = new BudgetDTO(
            category:   ucfirst($opts['category']),
            limitCents: $limitCents,
        );

        $this->repo->save($dto);

        $this->ui->success(sprintf(
            'Budget for "%s" set to $%s/month.',
            $dto->category,
            TransactionDTO::formatCents($dto->limitCents),
        ));
    }

    private function parseArgs(array $args): array
    {
        $opts = [];
        foreach ($args as $arg) {
            if (preg_match('/^--(\w[\w-]*)=(.+)$/', $arg, $m)) {
                $opts[$m[1]] = $m[2];
            }
        }
        return $opts;
    }
}
