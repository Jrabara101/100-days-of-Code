<?php

declare(strict_types=1);

namespace VaultCLI\Commands;

use VaultCLI\DTOs\TransactionDTO;
use VaultCLI\Enums\TransactionType;
use VaultCLI\Repositories\TransactionRepositoryInterface;
use VaultCLI\UI\TerminalDashboard;

/**
 * AddIncomeCommand – handles `vault add-income`
 *
 * Usage:
 *   vault add-income --amount=6500.00 --category=Income --desc="Client Retainer" [--date=2026-11-14]
 */
final class AddIncomeCommand implements CommandInterface
{
    public function __construct(
        private readonly TransactionRepositoryInterface $repo,
        private readonly TerminalDashboard              $ui,
    ) {}

    public function description(): string
    {
        return 'Record a new income transaction.';
    }

    public function execute(array $args): void
    {
        $opts = $this->parseArgs($args);

        if (!isset($opts['amount'], $opts['desc'])) {
            $this->ui->error('Usage: vault add-income --amount=<n> --desc=<text> [--category=Income] [--date=YYYY-MM-DD]');
            return;
        }

        $amountCents = TransactionDTO::centsFromDecimal($opts['amount']);

        if ($amountCents <= 0) {
            $this->ui->error('Amount must be a positive number.');
            return;
        }

        $dto = new TransactionDTO(
            amountCents:  $amountCents,
            category:     ucfirst($opts['category'] ?? 'Income'),
            description:  $opts['desc'],
            type:         TransactionType::INCOME,
            date:         $opts['date'] ?? date('Y-m-d'),
            tags:         $opts['tags'] ?? null,
        );

        $id = $this->repo->save($dto);

        $this->ui->success(sprintf(
            'Income #%d recorded: %s ($%s)',
            $id,
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
