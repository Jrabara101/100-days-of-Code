<?php

declare(strict_types=1);

namespace DailyQuote\Clients;

use DailyQuote\Config\Config;
use DailyQuote\Exceptions\ApiException;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\RequestOptions;
use Psr\Log\LoggerInterface;

/**
 * QuoteApiClient — HTTP client for fetching quotes from external APIs.
 *
 * Responsibilities:
 *  - Send GET requests to configured API endpoint
 *  - Implement retry logic with configurable delay
 *  - Normalize different API response formats into a common array shape
 *  - Throw ApiException on unrecoverable failures
 */
final class QuoteApiClient
{
    private Client $http;

    public function __construct(
        private readonly Config          $config,
        private readonly LoggerInterface $logger,
    ) {
        $this->http = new Client([
            RequestOptions::TIMEOUT         => $this->config->int('QUOTE_API_TIMEOUT', 10),
            RequestOptions::CONNECT_TIMEOUT => 5,
            RequestOptions::HEADERS         => [
                'Accept'     => 'application/json',
                'User-Agent' => 'DailyQuoteFetcher/2.0 (+https://github.com/your/repo)',
            ],
        ]);
    }

    /**
     * Fetch one quote from the configured API endpoint.
     *
     * Returns a normalized array:
     * [
     *   'text'   => string,
     *   'author' => string,
     *   'source' => string,   // API hostname
     * ]
     *
     * @throws ApiException
     */
    public function fetchOne(): array
    {
        $url      = $this->config->get('QUOTE_API_URL', 'https://zenquotes.io/api/random');
        $maxRetry = $this->config->int('QUOTE_API_RETRY', 3);
        $delay    = $this->config->int('QUOTE_API_RETRY_DELAY', 2);

        $attempt = 0;
        $lastError = null;

        while ($attempt < $maxRetry) {
            $attempt++;

            try {
                $this->logger->info("API request attempt {$attempt}/{$maxRetry}", ['url' => $url]);

                $response = $this->http->get($url);
                $body     = (string) $response->getBody();
                $data     = json_decode($body, associative: true, flags: JSON_THROW_ON_ERROR);

                $normalized = $this->normalize($data, $url);

                $this->logger->info('API request successful', [
                    'attempt' => $attempt,
                    'author'  => $normalized['author'],
                ]);

                return $normalized;

            } catch (ConnectException $e) {
                $lastError = "Connection failed: " . $e->getMessage();
                $this->logger->warning("Attempt {$attempt} connection error", ['error' => $lastError]);

            } catch (RequestException $e) {
                $code      = $e->getResponse()?->getStatusCode() ?? 0;
                $lastError = "HTTP {$code}: " . $e->getMessage();
                $this->logger->warning("Attempt {$attempt} request error", ['error' => $lastError]);

                // Don't retry on 4xx (client errors)
                if ($code >= 400 && $code < 500) {
                    break;
                }

            } catch (\JsonException $e) {
                $lastError = "Invalid JSON response: " . $e->getMessage();
                $this->logger->warning("Attempt {$attempt} JSON parse error", ['error' => $lastError]);
            }

            // Wait before retry (skip delay on last attempt)
            if ($attempt < $maxRetry) {
                sleep($delay);
            }
        }

        $this->logger->error('All API attempts exhausted', ['last_error' => $lastError]);
        throw new ApiException("Failed to fetch quote after {$maxRetry} attempt(s). Last error: {$lastError}");
    }

    // ── Private ──────────────────────────────────────────────────────────────

    /**
     * Normalize API-specific response shapes into a common structure.
     *
     * Supported formats:
     *  - ZenQuotes   → [{"q":"...","a":"...","h":"..."}]
     *  - Quotable.io → {"content":"...","author":"...","tags":[...]}
     *
     * @throws ApiException when required fields are missing.
     */
    private function normalize(mixed $data, string $url): array
    {
        $host = parse_url($url, PHP_URL_HOST) ?? 'unknown';

        // ── ZenQuotes format: array of objects ──────────────────────────────
        if (is_array($data) && isset($data[0]['q'], $data[0]['a'])) {
            $quote = $data[0];
            return [
                'text'   => trim((string) $quote['q']),
                'author' => trim((string) $quote['a']),
                'source' => $host,
            ];
        }

        // ── Quotable.io format: flat object ─────────────────────────────────
        if (is_array($data) && isset($data['content'], $data['author'])) {
            return [
                'text'   => trim((string) $data['content']),
                'author' => trim((string) $data['author']),
                'source' => $host,
            ];
        }

        // ── Generic fallback: look for common field names ────────────────────
        $text   = $data['quote'] ?? $data['text'] ?? $data['body'] ?? null;
        $author = $data['author'] ?? $data['name'] ?? $data['by'] ?? 'Unknown';

        if ($text !== null) {
            return [
                'text'   => trim((string) $text),
                'author' => trim((string) $author),
                'source' => $host,
            ];
        }

        throw new ApiException(
            "Unrecognized API response format from {$host}. " .
            "Please update Config or QuoteApiClient::normalize()."
        );
    }
}
