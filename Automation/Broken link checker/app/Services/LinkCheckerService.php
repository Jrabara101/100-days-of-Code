<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Represents the result of checking a single URL.
 */
class LinkCheckResult
{
    public function __construct(
        public readonly string  $url,
        public readonly ?int    $statusCode,
        public readonly ?string $finalUrl,
        public readonly ?string $errorMessage,
        public readonly bool    $isBroken,
    ) {}
}

class LinkCheckerService
{
    /**
     * Normalize a URL (relative or absolute) against a base/current page URL.
     *
     * @param  string  $href         Raw href from <a> tag
     * @param  string  $currentPage  The page the link was found on
     * @return string|null           Fully-qualified URL, or null if invalid
     */
    public function normalizeUrl(string $href, string $currentPage): ?string
    {
        $href = trim($href);

        // Decode HTML entities and remove backslashes used as escape chars in some HTML
        $href = html_entity_decode($href, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $href = str_replace('\\', '', $href);
        $href = trim($href);

        // Strip fragment-only links
        if (str_starts_with($href, '#') || $href === '') {
            return null;
        }

        // Already absolute
        if (preg_match('/^https?:\/\//i', $href)) {
            return $this->cleanUrl($href);
        }

        // Protocol-relative  //example.com/path
        if (str_starts_with($href, '//')) {
            $scheme = parse_url($currentPage, PHP_URL_SCHEME) ?? 'https';

            return $this->cleanUrl("{$scheme}:{$href}");
        }

        // Relative URL — resolve against current page
        $base = $this->resolveBase($currentPage);

        if (! $base) {
            return null;
        }

        if (str_starts_with($href, '/')) {
            // Root-relative
            return $this->cleanUrl("{$base['scheme']}://{$base['host']}{$href}");
        }

        // Path-relative — resolve against directory of current page
        // NOTE: PHP's dirname() uses OS path separator (\\ on Windows),
        // so we use a custom forward-slash-safe parent resolver.
        $basePath = $this->urlDirname($base['path'] ?? '/');

        return $this->cleanUrl("{$base['scheme']}://{$base['host']}{$basePath}/{$href}");
    }

    /**
     * Return the directory portion of a URL path, always using '/'.
     * This is equivalent to POSIX dirname() — safe on Windows.
     */
    private function urlDirname(string $path): string
    {
        // Remove trailing slash, then take everything before the last '/'
        $path = rtrim($path, '/');
        $pos  = strrpos($path, '/');

        if ($pos === false) {
            return '';
        }

        if ($pos === 0) {
            return '';   // Root-level page — no sub-directory prefix needed
        }

        return substr($path, 0, $pos);

    }

    /**
     * Check the HTTP status of a URL.
     *
     * Strategy:
     *   1. Try HEAD request (lightweight).
     *   2. Fall back to GET if HEAD fails or returns 405.
     *
     * @param  string  $url
     * @return LinkCheckResult
     */
    public function check(string $url): LinkCheckResult
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => config('linkchecker.user_agent'),
            ])
                ->timeout(config('linkchecker.timeout', 10))
                ->withoutVerifying()
                ->withOptions(['allow_redirects' => ['track_redirects' => true, 'max' => 10]])
                ->head($url);

            // Some servers don't support HEAD — retry with GET
            if ($response->status() === 405) {
                $response = Http::withHeaders([
                    'User-Agent' => config('linkchecker.user_agent'),
                ])
                    ->timeout(config('linkchecker.timeout', 10))
                    ->withoutVerifying()
                    ->withOptions(['allow_redirects' => ['track_redirects' => true, 'max' => 10]])
                    ->get($url);
            }

            $statusCode = $response->status();
            $finalUrl   = $this->extractFinalUrl($response, $url);
            $isBroken   = $statusCode >= 400;

            return new LinkCheckResult(
                url:          $url,
                statusCode:   $statusCode,
                finalUrl:     $finalUrl !== $url ? $finalUrl : null,
                errorMessage: null,
                isBroken:     $isBroken,
            );
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            $message = $this->classifyConnectionError($e->getMessage());

            return new LinkCheckResult(
                url:          $url,
                statusCode:   null,
                finalUrl:     null,
                errorMessage: $message,
                isBroken:     true,
            );
        } catch (\Throwable $e) {
            Log::debug("LinkCheckerService: unexpected error for [{$url}]: " . $e->getMessage());

            return new LinkCheckResult(
                url:          $url,
                statusCode:   null,
                finalUrl:     null,
                errorMessage: 'Unexpected error: ' . $e->getMessage(),
                isBroken:     true,
            );
        }
    }

    /**
     * Attempt to extract the final resolved URL after redirects.
     */
    private function extractFinalUrl($response, string $originalUrl): string
    {
        try {
            // Guzzle stores the effective URL in transfer stats
            $effectiveUri = $response->transferStats?->getEffectiveUri();
            if ($effectiveUri) {
                return (string) $effectiveUri;
            }
        } catch (\Throwable) {
            // Ignore — fall through
        }

        return $originalUrl;
    }

    /**
     * Classify common connection errors into readable messages.
     */
    private function classifyConnectionError(string $message): string
    {
        $lower = strtolower($message);

        if (str_contains($lower, 'timed out') || str_contains($lower, 'timeout')) {
            return 'Request timed out';
        }

        if (str_contains($lower, 'ssl') || str_contains($lower, 'certificate')) {
            return 'SSL/TLS certificate error';
        }

        if (str_contains($lower, 'could not resolve') || str_contains($lower, 'name or service not known')) {
            return 'DNS resolution failed';
        }

        if (str_contains($lower, 'connection refused')) {
            return 'Connection refused';
        }

        return 'Connection error: ' . $message;
    }

    /**
     * Clean a URL: remove fragments, normalise trailing slash inconsistencies.
     */
    private function cleanUrl(string $url): string
    {
        // Remove fragment
        $url = preg_replace('/#.*$/', '', $url);

        // Normalise double slashes in path (but preserve protocol //)
        $parsed = parse_url($url);
        if (isset($parsed['path'])) {
            $parsed['path'] = preg_replace('#/+#', '/', $parsed['path']);
        }

        return $this->buildUrl($parsed);
    }

    /**
     * Parse a URL into scheme/host/path components.
     */
    private function resolveBase(string $url): ?array
    {
        $parts = parse_url($url);
        if (! isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        return [
            'scheme' => $parts['scheme'],
            'host'   => $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : ''),
            'path'   => $parts['path'] ?? '/',
        ];
    }

    /**
     * Rebuild a URL from parse_url components.
     */
    private function buildUrl(array $parts): string
    {
        $url = '';

        if (isset($parts['scheme'])) {
            $url .= $parts['scheme'] . '://';
        }

        if (isset($parts['host'])) {
            $url .= $parts['host'];
        }

        if (isset($parts['port'])) {
            $url .= ':' . $parts['port'];
        }

        if (isset($parts['path'])) {
            $url .= $parts['path'];
        }

        if (isset($parts['query'])) {
            $url .= '?' . $parts['query'];
        }

        return $url;
    }
}
