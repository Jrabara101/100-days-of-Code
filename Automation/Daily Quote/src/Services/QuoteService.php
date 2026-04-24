<?php

declare(strict_types=1);

namespace DailyQuote\Services;

use DailyQuote\Clients\QuoteApiClient;
use DailyQuote\Config\Config;
use DailyQuote\Exceptions\ApiException;
use DailyQuote\Storage\QuoteStorage;
use Psr\Log\LoggerInterface;

/**
 * QuoteService — Orchestrates the business logic layer.
 *
 * Acts as the mediator between the API client, storage layer,
 * and the CLI commands. Commands should only talk to this class.
 */
final class QuoteService
{
    private QuoteApiClient $client;
    private QuoteStorage   $storage;

    public function __construct(
        Config                         $config,
        private readonly LoggerInterface $logger,
    ) {
        $this->client  = new QuoteApiClient($config, $logger);
        $this->storage = new QuoteStorage($config);
    }

    /**
     * Fetch a fresh quote from the API.
     *
     * Returns the quote array enriched with a fetched_at timestamp.
     *
     * @throws ApiException
     */
    public function fetch(): array
    {
        $quote = $this->client->fetchOne();

        $quote['fetched_at'] = date(DATE_ATOM);

        $this->logger->info('Quote fetched successfully', [
            'author' => $quote['author'],
            'source' => $quote['source'],
        ]);

        return $quote;
    }

    /**
     * Fetch a quote and immediately save it to history.
     *
     * @return array{quote: array, saved: bool, duplicate: bool}
     * @throws ApiException
     */
    public function fetchAndSave(): array
    {
        $quote = $this->fetch();
        $saved = $this->storage->save($quote);

        if ($saved) {
            $this->logger->info('Quote saved to history', ['author' => $quote['author']]);
        } else {
            $this->logger->info('Duplicate quote — not saved', ['author' => $quote['author']]);
        }

        return [
            'quote'     => $quote,
            'saved'     => $saved,
            'duplicate' => !$saved,
        ];
    }

    /**
     * Return all saved quotes.
     *
     * @return array<int, array>
     */
    public function history(): array
    {
        return $this->storage->load();
    }

    /**
     * Return a random quote from history or null if empty.
     */
    public function random(): ?array
    {
        return $this->storage->random();
    }

    /** Total number of saved quotes. */
    public function historyCount(): int
    {
        return $this->storage->count();
    }
}
