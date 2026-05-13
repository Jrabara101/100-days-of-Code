<?php

declare(strict_types=1);

namespace ChronoVault\Commands;

use ChronoVault\Storage\JournalRepositoryInterface;
use ChronoVault\Terminal\TerminalUI;

/**
 * ReadCommand — Decrypts and renders a single journal entry.
 *
 * Usage: php cvault read #042
 *        php cvault read 42
 */
class ReadCommand implements CommandInterface
{
    public function __construct(
        private readonly JournalRepositoryInterface $repository,
        private readonly TerminalUI                 $ui,
    ) {}

    public function getName(): string
    {
        return 'read';
    }

    public function getDescription(): string
    {
        return 'Decrypt and display a journal entry (e.g., cvault read #042)';
    }

    public function execute(array $args): int
    {
        if (empty($args[0])) {
            $this->ui->error('Usage: cvault read <id>   (e.g., cvault read #042 or cvault read 42)');
            return 1;
        }

        // Parse the ID — accept '#042', '042', or '42'.
        $idStr = ltrim($args[0], '#');
        if (!ctype_digit($idStr)) {
            $this->ui->error("Invalid entry ID: '{$args[0]}'. Must be a number like #042 or 42.");
            return 1;
        }
        $id = (int) $idStr;

        try {
            $entry = $this->repository->findById($id);
        } catch (\RuntimeException $e) {
            $this->ui->error($e->getMessage());
            return 1;
        }

        if ($entry === null) {
            $this->ui->error("Entry {$args[0]} not found.");
            return 1;
        }

        $this->ui->renderEntry($entry);

        return 0;
    }
}
