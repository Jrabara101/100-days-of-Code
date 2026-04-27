<?php

declare(strict_types=1);

namespace App;

/**
 * UrlChecker
 *
 * Core engine for checking HTTP status of URLs using cURL.
 * Handles validation, single checks, redirects, retries, and timeouts.
 *
 * @package App
 */
class UrlChecker
{
    // ─── HTTP Status Categories ───────────────────────────────────────────────

    private const STATUS_MEANINGS = [
        // 1xx Informational
        100 => 'Continue',
        101 => 'Switching Protocols',
        102 => 'Processing',

        // 2xx Success
        200 => 'OK',
        201 => 'Created',
        202 => 'Accepted',
        204 => 'No Content',
        206 => 'Partial Content',

        // 3xx Redirects
        301 => 'Moved Permanently',
        302 => 'Found (Temporary Redirect)',
        303 => 'See Other',
        304 => 'Not Modified',
        307 => 'Temporary Redirect',
        308 => 'Permanent Redirect',

        // 4xx Client Errors
        400 => 'Bad Request',
        401 => 'Unauthorized',
        403 => 'Forbidden',
        404 => 'Not Found',
        405 => 'Method Not Allowed',
        408 => 'Request Timeout',
        409 => 'Conflict',
        410 => 'Gone',
        422 => 'Unprocessable Entity',
        429 => 'Too Many Requests',

        // 5xx Server Errors
        500 => 'Internal Server Error',
        501 => 'Not Implemented',
        502 => 'Bad Gateway',
        503 => 'Service Unavailable',
        504 => 'Gateway Timeout',
        505 => 'HTTP Version Not Supported',
    ];

    /** @var int cURL timeout in seconds */
    private int $timeout;

    /** @var int Number of retry attempts on failure */
    private int $retries;

    /** @var bool Follow redirects */
    private bool $followRedirects;

    /**
     * @param int  $timeout         Request timeout in seconds
     * @param int  $retries         Retry count on failure/timeout
     * @param bool $followRedirects Whether to follow HTTP redirects
     */
    public function __construct(
        int $timeout = 10,
        int $retries = 1,
        bool $followRedirects = true
    ) {
        $this->timeout         = $timeout;
        $this->retries         = $retries;
        $this->followRedirects = $followRedirects;
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Validate and check a single URL.
     *
     * @return array{
     *   url: string,
     *   valid: bool,
     *   status_code: int|null,
     *   status_meaning: string,
     *   category: string,
     *   response_time_ms: float|null,
     *   final_url: string|null,
     *   redirected: bool,
     *   redirect_count: int,
     *   error: string|null,
     *   timestamp: string
     * }
     */
    public function check(string $url): array
    {
        $timestamp = date('Y-m-d H:i:s');

        // Validate URL before doing anything
        if (!$this->isValidUrl($url)) {
            return $this->buildResult(
                url: $url,
                valid: false,
                statusCode: null,
                responseTime: null,
                finalUrl: null,
                redirectCount: 0,
                error: 'Invalid or malformed URL',
                timestamp: $timestamp
            );
        }

        // Attempt check with retry logic
        $attempt = 0;
        $lastError = null;

        do {
            $attempt++;
            $result = $this->performRequest($url, $timestamp);

            // If successful (no error), return immediately
            if ($result['error'] === null) {
                return $result;
            }

            $lastError = $result['error'];

            // Small pause between retries
            if ($attempt < $this->retries) {
                usleep(300000); // 300ms
            }
        } while ($attempt < $this->retries);

        // All retries exhausted — return last result
        return $result;
    }

    /**
     * Check multiple URLs and return all results.
     *
     * @param  string[]  $urls
     * @param  callable  $onProgress  Called after each check: fn(int $current, int $total, array $result)
     * @return array[]
     */
    public function checkAll(array $urls, callable $onProgress): array
    {
        $results = [];
        $total   = count($urls);

        foreach ($urls as $index => $url) {
            $url     = trim($url);
            $current = $index + 1;

            if ($url === '' || str_starts_with($url, '#')) {
                // Skip blank lines and comment lines
                $total--;
                continue;
            }

            $result    = $this->check($url);
            $results[] = $result;

            $onProgress($current, $total, $result);
        }

        return $results;
    }

    // ─── URL Validation ──────────────────────────────────────────────────────

    /**
     * Validate a URL using PHP's filter_var with FILTER_VALIDATE_URL.
     * Also ensures http/https scheme is present.
     */
    public function isValidUrl(string $url): bool
    {
        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        $scheme = parse_url($url, PHP_URL_SCHEME);
        return in_array(strtolower((string)$scheme), ['http', 'https'], true);
    }

    /**
     * Load URLs from a text file (one per line, skips blanks and #comments).
     *
     * @return string[]
     * @throws \RuntimeException If file does not exist or is not readable
     */
    public function loadUrlsFromFile(string $filePath): array
    {
        if (!file_exists($filePath)) {
            throw new \RuntimeException("File not found: {$filePath}");
        }
        if (!is_readable($filePath)) {
            throw new \RuntimeException("File not readable: {$filePath}");
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        if ($lines === false) {
            throw new \RuntimeException("Could not read file: {$filePath}");
        }

        // Filter out comment lines
        return array_values(array_filter($lines, fn($l) => !str_starts_with(trim($l), '#')));
    }

    // ─── cURL Request ────────────────────────────────────────────────────────

    /**
     * Perform the actual cURL request and return structured result.
     *
     * @return array<string, mixed>
     */
    private function performRequest(string $url, string $timestamp): array
    {
        $ch = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER         => false,
            CURLOPT_NOBODY         => true,           // HEAD request only (faster)
            CURLOPT_FOLLOWLOCATION => $this->followRedirects,
            CURLOPT_MAXREDIRS      => 10,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_CONNECTTIMEOUT => max(5, (int)($this->timeout / 2)),
            CURLOPT_SSL_VERIFYPEER => false,          // Allow self-signed certs
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_USERAGENT      => 'UrlStatusChecker/1.0 (PHP CLI Tool)',
            CURLOPT_ENCODING       => '',             // Accept compressed responses
        ]);

        $startTime = microtime(true);
        curl_exec($ch);
        $elapsed = (microtime(true) - $startTime) * 1000; // ms

        $statusCode    = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $finalUrl      = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
        $redirectCount = (int)curl_getinfo($ch, CURLINFO_REDIRECT_COUNT);
        $errno         = curl_errno($ch);
        $errorMsg      = curl_error($ch);

        curl_close($ch);

        // Handle cURL errors
        if ($errno !== 0) {
            $friendly = $this->friendlyCurlError($errno, $errorMsg);
            return $this->buildResult(
                url: $url,
                valid: true,
                statusCode: $statusCode > 0 ? $statusCode : null,
                responseTime: round($elapsed, 2),
                finalUrl: $finalUrl ?: null,
                redirectCount: $redirectCount,
                error: $friendly,
                timestamp: $timestamp
            );
        }

        return $this->buildResult(
            url: $url,
            valid: true,
            statusCode: $statusCode,
            responseTime: round($elapsed, 2),
            finalUrl: $finalUrl !== $url ? $finalUrl : null,
            redirectCount: $redirectCount,
            error: null,
            timestamp: $timestamp
        );
    }

    // ─── Result Builder ──────────────────────────────────────────────────────

    /**
     * Build a standardized result array from request data.
     *
     * @return array<string, mixed>
     */
    private function buildResult(
        string  $url,
        bool    $valid,
        ?int    $statusCode,
        ?float  $responseTime,
        ?string $finalUrl,
        int     $redirectCount,
        ?string $error,
        string  $timestamp
    ): array {
        $category = $this->categorize($valid, $statusCode, $error);
        $meaning  = $statusCode !== null
            ? (self::STATUS_MEANINGS[$statusCode] ?? "Unknown Status ({$statusCode})")
            : ($error ?? 'Unknown Error');

        return [
            'url'              => $url,
            'valid'            => $valid,
            'status_code'      => $statusCode,
            'status_meaning'   => $meaning,
            'category'         => $category,
            'response_time_ms' => $responseTime,
            'final_url'        => $finalUrl,
            'redirected'       => $redirectCount > 0,
            'redirect_count'   => $redirectCount,
            'error'            => $error,
            'timestamp'        => $timestamp,
        ];
    }

    // ─── Categorization ──────────────────────────────────────────────────────

    /**
     * Categorize result based on validity, status code, and error.
     */
    private function categorize(bool $valid, ?int $code, ?string $error): string
    {
        if (!$valid) {
            return 'Invalid URL';
        }

        if ($error !== null) {
            if (stripos($error, 'timed out') !== false || stripos($error, 'timeout') !== false) {
                return 'Timeout / Failed';
            }
            return 'Timeout / Failed';
        }

        if ($code === null) {
            return 'Timeout / Failed';
        }

        return match (true) {
            $code >= 200 && $code < 300 => 'Online',
            $code >= 300 && $code < 400 => 'Redirecting',
            $code >= 400 && $code < 500 => 'Client Error',
            $code >= 500 && $code < 600 => 'Server Error',
            default                      => 'Unknown',
        };
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Convert cURL error number to a human-friendly message.
     */
    private function friendlyCurlError(int $errno, string $raw): string
    {
        return match ($errno) {
            CURLE_OPERATION_TIMEOUTED  => 'Request timed out',
            CURLE_COULDNT_RESOLVE_HOST => 'Could not resolve host (DNS failure)',
            CURLE_COULDNT_CONNECT      => 'Could not connect to host',
            CURLE_SSL_CONNECT_ERROR    => 'SSL connection error',
            CURLE_TOO_MANY_REDIRECTS   => 'Too many redirects',
            default                    => "cURL error ({$errno}): {$raw}",
        };
    }

    /**
     * Get statistics summary from a list of results.
     *
     * @param  array[]  $results
     * @return array<string, int|float>
     */
    public static function summarize(array $results): array
    {
        $total    = count($results);
        $online   = 0;
        $redirect = 0;
        $client   = 0;
        $server   = 0;
        $invalid  = 0;
        $failed   = 0;
        $times    = [];

        foreach ($results as $r) {
            match ($r['category']) {
                'Online'           => $online++,
                'Redirecting'      => $redirect++,
                'Client Error'     => $client++,
                'Server Error'     => $server++,
                'Invalid URL'      => $invalid++,
                'Timeout / Failed' => $failed++,
                default            => null,
            };

            if ($r['response_time_ms'] !== null) {
                $times[] = $r['response_time_ms'];
            }
        }

        $avgTime = count($times) > 0 ? round(array_sum($times) / count($times), 2) : 0;

        return [
            'total'    => $total,
            'online'   => $online,
            'redirect' => $redirect,
            'client'   => $client,
            'server'   => $server,
            'invalid'  => $invalid,
            'failed'   => $failed,
            'avg_time' => $avgTime,
        ];
    }
}
