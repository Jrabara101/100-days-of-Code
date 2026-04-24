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
 * RandomCommand — Display a random quote from the local history.
 *
 * Usage:
 *   php app.php quote:random
 *   php app.php quote:random --no-banner
 */
#[AsCommand(
    name: 'quote:random',
    description: 'Display a random quote from local history.',
    aliases: ['random'],
)]
final class RandomCommand extends Command
{
    public function __construct(
        private readonly Config          $config,
        private readonly LoggerInterface $logger,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('no-banner', null, InputOption::VALUE_NONE, 'Hide the application banner');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $ui      = new TerminalUI($output);
        $service = new QuoteService($this->config, $this->logger);

        if (!$input->getOption('no-banner') && $this->config->bool('DISPLAY_BANNER', true)) {
            $ui->banner($this->config->get('APP_VERSION', '2.0.0'));
        }

        $ui->sectionHeader('🎲  RANDOM QUOTE FROM HISTORY', 'magenta');

        try {
            $quote = $service->random();

            if ($quote === null) {
                $ui->blank();
                $ui->warning('History is empty — nothing to display.');
                $ui->info('Run "php app.php quote:save" to start building your collection.');
                $ui->footer(success: true);
                return Command::SUCCESS;
            }

            // Show the saved_at date as the "fetched_at" display
            $quote['fetched_at'] = $quote['saved_at'] ?? $quote['fetched_at'] ?? 'unknown';
            $ui->quoteCard($quote);

            $ui->info("Drawn from {$service->historyCount()} saved quote(s).");
            $ui->footer(success: true);

            return Command::SUCCESS;

        } catch (StorageException $e) {
            $this->logger->error('RandomCommand failed', ['error' => $e->getMessage()]);
            $ui->error('Storage error: ' . $e->getMessage());
            $ui->footer(success: false);
            return Command::FAILURE;
        }
    }
}
