<?php

declare(strict_types=1);

namespace DailyQuote\Commands;

use DailyQuote\Config\Config;
use DailyQuote\Exceptions\StorageException;
use DailyQuote\Helpers\TerminalUI;
use DailyQuote\Services\QuoteService;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * HistoryCommand — Browse previously saved quotes.
 *
 * Usage:
 *   php app.php quote:history
 *   php app.php quote:history --page=2
 *   php app.php quote:history --per-page=5
 *   php app.php quote:history --no-banner
 */
#[AsCommand(
    name: 'quote:history',
    description: 'Browse previously saved quotes.',
    aliases: ['history'],
)]
final class HistoryCommand extends Command
{
    public function __construct(
        private readonly Config          $config,
        private readonly LoggerInterface $logger,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('page',     'p', InputOption::VALUE_OPTIONAL, 'Page number', '1')
            ->addOption('per-page', null, InputOption::VALUE_OPTIONAL, 'Items per page', '10')
            ->addOption('no-banner', null, InputOption::VALUE_NONE, 'Hide the application banner');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $ui      = new TerminalUI($output);
        $service = new QuoteService($this->config, $this->logger);

        if (!$input->getOption('no-banner') && $this->config->bool('DISPLAY_BANNER', true)) {
            $ui->banner($this->config->get('APP_VERSION', '2.0.0'));
        }

        $page    = max(1, (int) $input->getOption('page'));
        $perPage = max(1, min(50, (int) $input->getOption('per-page')));

        try {
            $history = $service->history();

            if (empty($history)) {
                $ui->sectionHeader('📜  QUOTE HISTORY', 'yellow');
                $ui->blank();
                $ui->warning('No quotes saved yet.');
                $ui->info('Run "php app.php quote:save" to fetch and save your first quote.');
                $ui->footer(success: true);
                return Command::SUCCESS;
            }

            $ui->historyTable($history, $page, $perPage);

            $ui->label('Total saved', (string) count($history));
            $ui->label('Storage file', $this->config->get('QUOTE_STORAGE_FILE', 'storage/quotes.json'));
            $ui->footer(success: true);

            return Command::SUCCESS;

        } catch (StorageException $e) {
            $this->logger->error('HistoryCommand failed', ['error' => $e->getMessage()]);
            $ui->error('Storage error: ' . $e->getMessage());
            $ui->footer(success: false);
            return Command::FAILURE;
        }
    }
}
