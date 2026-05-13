<?php

declare(strict_types=1);

namespace VaultCLI\Commands;

use VaultCLI\Repositories\TransactionRepositoryInterface;
use VaultCLI\UI\TerminalDashboard;

/**
 * DeleteTransactionCommand – handles `vault delete`
 *
 * Usage:
 *   vault delete --id=104
 */
final class DeleteTransactionCommand implements CommandInterface
{
    public function __construct(
        private readonly TransactionRepositoryInterface $repo,
        private readonly TerminalDashboard              $ui,
    ) {}

    public function description(): string
    {
        return 'Permanently delete a transaction by ID.';
    }

    public function execute(array $args): void
    {
        $opts = $this->parseArgs($args);

        if (!isset($opts['id'])) {
            $this->ui->error('Usage: vault delete --id=<transaction_id>');
            return;
        }

        $id = (int) $opts['id'];
        $tx = $this->repo->findById($id);

        if ($tx === null) {
            $this->ui->error("Transaction #$id not found.");
            return;
        }

        $this->repo->delete($id);
        $this->ui->success("Transaction #$id deleted successfully.");
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
