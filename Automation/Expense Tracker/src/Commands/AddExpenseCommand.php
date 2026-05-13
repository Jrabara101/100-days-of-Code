<?php

declare(strict_types=1);

namespace VaultCLI\Commands;

use VaultCLI\DTOs\TransactionDTO;
use VaultCLI\Enums\TransactionType;
use VaultCLI\Repositories\TransactionRepositoryInterface;
use VaultCLI\UI\TerminalDashboard;

/**
 * AddExpenseCommand – handles `vault add-expense`
 *
 * Usage:
 *   vault add-expense --amount=85.50 --category="Dining Out" --desc="Sushi Date" [--date=2026-11-15] [--tags=date,food]
 */
final class AddExpenseCommand implements CommandInterface
{
    public function __construct(
        private readonly TransactionRepositoryInterface $repo,
        private readonly TerminalDashboard              $ui,
    ) {}

    public function description(): string
    {
        return 'Record a new expense transaction.';
    }

    public function execute(array $args): void
    {
        $opts = $this->parseArgs($args);

        if (!isset($opts['amount'], $opts['category'], $opts['desc'])) {
            $this->ui->error('Usage: vault add-expense --amount=<n> --category=<cat> --desc=<text> [--date=YYYY-MM-DD] [--tags=a,b]');
            return;
        }

        $amountCents = TransactionDTO::centsFromDecimal($opts['amount']);

        if ($amountCents <= 0) {
            $this->ui->error('Amount must be a positive number.');
            return;
        }

        $dto = new TransactionDTO(
            amountCents:  $amountCents,
            category:     ucfirst($opts['category']),
            description:  $opts['desc'],
            type:         TransactionType::EXPENSE,
            date:         $opts['date'] ?? date('Y-m-d'),
            tags:         $opts['tags'] ?? null,
        );

        $id = $this->repo->save($dto);

        $this->ui->success(sprintf(
            'Expense #%d recorded: %s → %s ($%s)',
            $id,
            $dto->category,
            $dto->description,
            TransactionDTO::formatCents($dto->amountCents),
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
