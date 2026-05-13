<?php

declare(strict_types=1);

namespace ChronoVault\Commands;

use ChronoVault\Storage\JournalRepositoryInterface;
use ChronoVault\Terminal\TerminalUI;

/**
 * ListCommand — Renders the paginated entry table with metadata.
 *
 * Usage: php cvault list
 *        php cvault list 20    (show last 20)
 */
class ListCommand implements CommandInterface
{
    private const DEFAULT_LIMIT = 10;

    public function __construct(
        private readonly JournalRepositoryInterface $repository,
        private readonly TerminalUI                 $ui,
    ) {}

    public function getName(): string
    {
        return 'list';
    }

    public function getDescription(): string
    {
        return 'Show a table of recent journal entries with metadata';
    }

    public function execute(array $args): int
    {
        $limit = isset($args[0]) && ctype_digit($args[0])
            ? (int) $args[0]
            : self::DEFAULT_LIMIT;

        $entries = $this->repository->findRecent($limit);

        if (empty($entries)) {
            $this->ui->info('No journal entries found. Start writing with: cvault write');
            return 0;
        }

        $this->ui->renderEntryTable($entries);

        return 0;
    }
}
