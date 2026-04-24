<?php

declare(strict_types=1);

namespace DailyQuote\Commands;

use DailyQuote\Config\Config;
use DailyQuote\Exceptions\ApiException;
use DailyQuote\Helpers\TerminalUI;
use DailyQuote\Services\QuoteService;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * SaveCommand — Fetch a quote from the API and save it to history.
 *
 * Usage:
 *   php app.php quote:save
 *   php app.php quote:save --no-banner
 */
#[AsCommand(
    name: 'quote:save',
    description: 'Fetch a quote and save it to local history.',
    aliases: ['save'],
)]
final class SaveCommand extends Command
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

        $ui->sectionHeader('💾  FETCH & SAVE QUOTE', 'green');
        $ui->info('Fetching from API …');

        try {
            $result = $service->fetchAndSave();
            $quote  = $result['quote'];

            $ui->quoteCard($quote);

            if ($result['saved']) {
                $ui->success("Quote saved! History now contains {$service->historyCount()} quote(s).");
            } else {
                $ui->warning('This quote already exists in history — skipped.');
                $ui->info('Use "quote:fetch" to view without saving.');
            }

            $ui->footer(success: true);
            return Command::SUCCESS;

        } catch (ApiException $e) {
            $this->logger->error('SaveCommand failed', ['error' => $e->getMessage()]);
            $ui->error($e->getMessage());
            $ui->footer(success: false);
            return Command::FAILURE;
        }
    }
}
