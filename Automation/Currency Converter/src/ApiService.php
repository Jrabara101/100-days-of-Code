<?php

declare(strict_types=1);

namespace CurrencyConverter;

/**
 * ApiService — Handles all HTTP communication with the exchange-rate API.
 *
 * Uses the free Open Exchange Rates / ExchangeRate-API endpoint.
 * Falls back to a no-key endpoint (exchangerate.host) when no API key
 * is configured.
 *
 * All network errors are converted to \RuntimeException so callers only
 * need to catch one type.
 */
final class ApiService
{
    /** Timeout in seconds for each cURL request. */
    private const TIMEOUT = 10;

    /** Free, no-key-required base URL (latest endpoint). */
    private const FREE_API_BASE = 'https://api.exchangerate-api.com/v4/latest/';

    /**
     * @param string $apiKey  Optional API key; if empty the free endpoint is used.
     */
    public function __construct(private readonly string $apiKey = '') {}

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Fetch all exchange rates relative to $baseCurrency.
     *
     * @return array{
     *     base: string,
     *     date: string,
     *     rates: array<string, float>
     * }
     *
     * @throws \RuntimeException on any network or parsing error.
     */
    public function fetchRates(string $baseCurrency): array
    {
        $url  = $this->buildUrl($baseCurrency);
        $json = $this->get($url);

        return $this->parseResponse($json, $baseCurrency);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Build the appropriate endpoint URL.
     */
    private function buildUrl(string $baseCurrency): string
    {
        // ExchangeRate-API v4 free endpoint — no key needed
        return self::FREE_API_BASE . strtoupper($baseCurrency);
    }

    /**
     * Execute an HTTP GET request via cURL and return the raw body.
     *
     * @throws \RuntimeException on curl error, non-200 status, or empty body.
     */
    private function get(string $url): string
    {
        if (!extension_loaded('curl')) {
            throw new \RuntimeException(
                'The cURL PHP extension is required but not loaded. ' .
                'Enable it in php.ini and restart.'
            );
        }

        $ch = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => self::TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => self::TIMEOUT,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS      => 3,
            CURLOPT_USERAGENT      => 'PHPCurrencyConverterCLI/1.0',
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $body  = curl_exec($ch);
        $errno = curl_errno($ch);
        $error = curl_error($ch);
        $http  = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        // Network-level error
        if ($errno !== 0 || $body === false) {
            $detail = $errno === CURLE_OPERATION_TIMEDOUT
                ? 'Request timed out — check your internet connection.'
                : "cURL error #{$errno}: {$error}";
            throw new \RuntimeException($detail);
        }

        // HTTP-level error
        if ($http !== 200) {
            throw new \RuntimeException(
                "API returned HTTP {$http}. The currency code may be unsupported or the service is down."
            );
        }

        if (empty($body)) {
            throw new \RuntimeException('API returned an empty response.');
        }

        return (string) $body;
    }

    /**
     * Decode and validate the JSON response.
     *
     * @return array{base: string, date: string, rates: array<string, float>}
     *
     * @throws \RuntimeException on malformed or unexpected JSON structure.
     */
    private function parseResponse(string $json, string $baseCurrency): array
    {
        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException(
                'Failed to parse API response: ' . json_last_error_msg()
            );
        }

        if (!is_array($data)) {
            throw new \RuntimeException('Unexpected API response format.');
        }

        // ExchangeRate-API v4 uses "result" key on errors
        if (isset($data['result']) && $data['result'] === 'error') {
            $msg = $data['error-type'] ?? 'unknown error';
            throw new \RuntimeException("API error: {$msg}");
        }

        if (empty($data['rates']) || !is_array($data['rates'])) {
            throw new \RuntimeException(
                "No rates found in API response for base currency '{$baseCurrency}'."
            );
        }

        return [
            'base'  => strtoupper($data['base'] ?? $baseCurrency),
            'date'  => $data['date'] ?? date('Y-m-d'),
            'rates' => array_map('floatval', $data['rates']),
        ];
    }
}
