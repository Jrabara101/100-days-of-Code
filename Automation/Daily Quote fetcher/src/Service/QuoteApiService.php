<?php

declare(strict_types=1);

namespace DailyQuote\Service;

use DailyQuote\Exception\ApiException;
use DailyQuote\Model\Quote;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Psr\Http\Message\ResponseInterface;

/**
 * QuoteApiService — fetches quotes from an HTTP API with retry logic.
 */
final class QuoteApiService
{
    private readonly Client $http;
    private readonly int    $maxRetries;
    private readonly int    $retryDelay;

    public function __construct(private readonly Logger $logger)
    {
        $this->maxRetries = (int) ($_ENV['QUOTE_API_RETRY_ATTEMPTS'] ?? 3);
        $this->retryDelay = (int) ($_ENV['QUOTE_API_RETRY_DELAY']    ?? 2);

        $stack = HandlerStack::create();
        $stack->push($this->buildRetryMiddleware());

        $this->http = new Client([
            'handler' => $stack,
            'timeout' => (float) ($_ENV['QUOTE_API_TIMEOUT'] ?? 10),
            'headers' => [
                'Accept'     => 'application/json',
                'User-Agent' => 'DailyQuoteFetcher/1.0 (github.com/daily-quote)',
            ],
        ]);
    }

    /**
     * Fetch a quote from the given URL.
     *
     * @throws ApiException on HTTP / parse failure
     */
    public function fetchQuote(string $url): Quote
    {
        $this->logger->info('Requesting quote', ['url' => $url]);

        try {
            $response = $this->http->get($url);
        } catch (ConnectException $e) {
            throw new ApiException(
                'Cannot connect to API — check your internet connection.',
                previous: $e
            );
        } catch (RequestException $e) {
            $code = $e->getResponse()?->getStatusCode() ?? 0;
            throw new ApiException("API request failed (HTTP {$code}): " . $e->getMessage(), previous: $e);
        }

        return $this->parseResponse($response);
    }

    // ── Private ────────────────────────────────────────────────────────────

    /**
     * Parse the Guzzle response into a Quote model.
     *
     * @throws ApiException on invalid payload
     */
    private function parseResponse(ResponseInterface $response): Quote
    {
        $status = $response->getStatusCode();

        if ($status !== 200) {
            throw new ApiException("Unexpected HTTP status: {$status}");
        }

        $body = (string) $response->getBody();

        /** @var mixed $data */
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new ApiException('Invalid JSON from API: ' . json_last_error_msg());
        }

        // ZenQuotes returns an array of objects
        if (is_array($data) && isset($data[0]) && is_array($data[0])) {
            $item = $data[0];
        } elseif (is_array($data) && isset($data['q'])) {
            $item = $data;
        } else {
            throw new ApiException('Unrecognised API response structure.');
        }

        if (empty($item['q']) || empty($item['a'])) {
            throw new ApiException('API returned empty quote or author.');
        }

        $this->logger->info('Quote received', [
            'author' => $item['a'],
            'length' => strlen($item['q']),
        ]);

        return Quote::fromZenQuotesArray($item);
    }

    /**
     * Build a Guzzle retry middleware with exponential back-off.
     */
    private function buildRetryMiddleware(): callable
    {
        $maxRetries = $this->maxRetries;
        $baseDelay  = $this->retryDelay;
        $logger     = $this->logger;

        $decider = static function (
            int              $retries,
            Request          $request,
            ?Response        $response,
            ?\Throwable      $exception,
        ) use ($maxRetries): bool {
            if ($retries >= $maxRetries) {
                return false;
            }
            if ($exception instanceof ConnectException) {
                return true;
            }
            if ($response && $response->getStatusCode() >= 500) {
                return true;
            }
            return false;
        };

        $delay = static function (int $retries) use ($baseDelay, $logger): int {
            $wait = $baseDelay * (2 ** ($retries - 1));   // exponential back-off
            $logger->warning("Retry #{$retries} — waiting {$wait}s…");
            return $wait * 1_000;                          // milliseconds for Guzzle
        };

        return Middleware::retry($decider, $delay);
    }
}
