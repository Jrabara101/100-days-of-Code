<?php

declare(strict_types=1);

namespace DailyQuote\App;

use DailyQuote\Cli\CliParser;
use DailyQuote\Cli\Formatter;
use DailyQuote\Exception\ApiException;
use DailyQuote\Exception\DuplicateQuoteException;
use DailyQuote\Exception\StorageException;
use DailyQuote\Service\QuoteApiService;
use DailyQuote\Service\Logger;
use DailyQuote\Storage\StorageHandler;
use DailyQuote\Renderer\HtmlRenderer;

/**
 * Application — orchestrates the full quote-fetch lifecycle.
 */
final class Application
{
    private readonly QuoteApiService $apiService;
    private readonly Logger          $logger;
    private readonly StorageHandler  $storage;
    private readonly Formatter       $formatter;
    private readonly HtmlRenderer    $htmlRenderer;

    public function __construct(private readonly string $rootDir)
    {
        $this->logger       = new Logger($this->rootDir);
        $this->apiService   = new QuoteApiService($this->logger);
        $this->storage      = new StorageHandler($this->rootDir, $this->logger);
        $this->formatter    = new Formatter();
        $this->htmlRenderer = new HtmlRenderer($this->rootDir);
    }

    /**
     * Main application runner.
     *
     * @param  list<string> $argv
     * @return int Exit code (0 = success, 1 = soft error, 2 = config error, 3 = fatal)
     */
    public function run(array $argv): int
    {
        $parser  = new CliParser($argv);
        $options = $parser->parse();

        // ── Help / Version ─────────────────────────────────────────────────
        if ($options->help) {
            $this->formatter->printHelp();
            return 0;
        }

        if ($options->version) {
            $this->formatter->printVersion();
            return 0;
        }

        // ── Banner ─────────────────────────────────────────────────────────
        $this->formatter->printBanner();

        // ── Ensure directories exist ───────────────────────────────────────
        try {
            $this->storage->ensureDirectories();
        } catch (StorageException $e) {
            $this->formatter->printError('Storage Error', $e->getMessage());
            return 2;
        }

        // ── Fetch Quote ────────────────────────────────────────────────────
        $apiUrl = $options->apiUrl ?? $_ENV['QUOTE_API_URL'];

        $this->formatter->printInfo('Fetching quote from API…', $options->verbose);
        $this->formatter->printMuted("  → {$apiUrl}", $options->verbose);

        try {
            $quote = $this->apiService->fetchQuote($apiUrl);
        } catch (ApiException $e) {
            $this->formatter->printError('API Error', $e->getMessage());
            $this->logger->error('API fetch failed', ['error' => $e->getMessage()]);
            return 1;
        }

        // ── Display Quote ──────────────────────────────────────────────────
        $this->formatter->printQuote($quote);

        // ── Save to Text ───────────────────────────────────────────────────
        if ($options->save || $options->json) {
            try {
                if ($options->save) {
                    $textPath = $this->storage->saveText($quote);
                    $this->formatter->printSuccess('Saved', "Text  → {$textPath}");
                    $this->logger->info('Quote saved as text', ['path' => $textPath]);
                }

                if ($options->json) {
                    $jsonPath = $this->storage->saveJson($quote);
                    $this->formatter->printSuccess('Saved', "JSON  → {$jsonPath}");
                    $this->logger->info('Quote saved as JSON', ['path' => $jsonPath]);
                }
            } catch (DuplicateQuoteException $e) {
                $this->formatter->printWarning('Duplicate', $e->getMessage());
                $this->logger->warning('Duplicate quote skipped', ['date' => date('Y-m-d')]);
            } catch (StorageException $e) {
                $this->formatter->printError('Storage Error', $e->getMessage());
                $this->logger->error('Storage failed', ['error' => $e->getMessage()]);
                return 1;
            }
        }

        // ── Generate HTML ──────────────────────────────────────────────────
        if ($options->html) {
            try {
                $htmlPath = $this->htmlRenderer->render($quote);
                $this->formatter->printSuccess('Saved', "HTML  → {$htmlPath}");
                $this->logger->info('HTML page generated', ['path' => $htmlPath]);
            } catch (StorageException $e) {
                $this->formatter->printError('HTML Error', $e->getMessage());
                return 1;
            }
        }

        // ── Footer ─────────────────────────────────────────────────────────
        $this->formatter->printFooter();
        $this->logger->info('Run completed successfully');

        return 0;
    }
}
