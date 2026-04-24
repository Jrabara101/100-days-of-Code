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
 * FetchCommand — Fetch and display a quote from the API.
 *
 * Usage:
 *   php app.php quote:fetch
 *   php app.php quote:fetch --no-banner
 *   php app.php quote:fetch --save
 */
#[AsCommand(
    name: 'quote:fetch',
    description: 'Fetch and display a fresh quote from the API.',
    aliases: ['fetch'],
)]
final class FetchCommand extends Command
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
            ->addOption('no-banner', null, InputOption::VALUE_NONE, 'Hide the application banner')
            ->addOption('save',      's',  InputOption::VALUE_NONE, 'Also save the quote to history');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $ui      = new TerminalUI($output);
        $service = new QuoteService($this->config, $this->logger);

        // Banner
        if (!$input->getOption('no-banner') && $this->config->bool('DISPLAY_BANNER', true)) {
            $ui->banner($this->config->get('APP_VERSION', '2.0.0'));
        }

        $ui->sectionHeader('🌐  FETCHING QUOTE FROM API', 'cyan');
        $ui->info('Connecting to ' . $this->config->get('QUOTE_API_URL', '—') . ' …');

        try {
            $quote = $service->fetch();

            $ui->success('Quote received!');
            $ui->quoteCard($quote);

            // Optionally save
            if ($input->getOption('save')) {
                $saved = $service->fetchAndSave()['saved'];
                if ($saved) {
                    $ui->success('Quote saved to history.');
                } else {
                    $ui->warning('Duplicate — quote already in history.');
                }
            }

            $ui->footer(success: true);
            return Command::SUCCESS;

        } catch (ApiException $e) {
            $this->logger->error('FetchCommand failed', ['error' => $e->getMessage()]);
            $ui->error($e->getMessage());
            $ui->footer(success: false);
            return Command::FAILURE;
        }
    }
}
