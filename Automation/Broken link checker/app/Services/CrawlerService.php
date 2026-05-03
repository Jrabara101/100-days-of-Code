<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CrawlerService
{
    /**
     * All discovered links: [url => source_page].
     */
    private array $discovered = [];

    /**
     * Set of URLs already crawled (internal pages only).
     */
    private array $crawled = [];

    /**
     * Base URL host for determining internal vs external.
     */
    private string $baseHost = '';

    /**
     * Base URL scheme (http|https).
     */
    private string $baseScheme = '';

    private LinkCheckerService $checker;

    public function __construct(LinkCheckerService $checker)
    {
        $this->checker = $checker;
    }

    /**
     * Begin crawling from $baseUrl up to $maxDepth levels deep.
     *
     * Returns a Collection of:
     *   ['url' => string, 'source_page' => string, 'is_external' => bool]
     *
     * @param  string  $baseUrl
     * @param  int     $maxDepth
     * @return Collection
     */
    public function crawl(string $baseUrl, int $maxDepth): Collection
    {
        // Reset state for a fresh crawl
        $this->discovered = [];
        $this->crawled    = [];

        $parsed           = parse_url($baseUrl);
        $this->baseHost   = $parsed['host']   ?? '';
        $this->baseScheme = $parsed['scheme']  ?? 'https';

        // Start recursive crawl
        $this->crawlPage($baseUrl, $baseUrl, 0, $maxDepth);

        return collect($this->discovered);
    }

    /**
     * Recursively fetch a page and extract all anchor links.
     */
    private function crawlPage(
        string $pageUrl,
        string $sourcePage,
        int    $currentDepth,
        int    $maxDepth
    ): void {
        $normalised = $this->checker->normalizeUrl($pageUrl, $pageUrl);

        if (! $normalised) {
            return;
        }

        // Skip if already crawled
        if (isset($this->crawled[$normalised])) {
            return;
        }

        $this->crawled[$normalised] = true;

        // Check cache for previously visited pages
        $cacheKey = 'crawler_page_' . md5($normalised);
        $html     = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($normalised) {
            return $this->fetchPage($normalised);
        });

        if ($html === null) {
            return;
        }

        // Extract all hrefs
        $links = $this->extractLinks($html, $normalised);

        foreach ($links as $link) {
            $url        = $link['url'];
            $isExternal = $link['is_external'];

            // Register this discovered URL (avoid duplicates)
            if (! isset($this->discovered[$url])) {
                $this->discovered[$url] = [
                    'url'         => $url,
                    'source_page' => $sourcePage,
                    'is_external' => $isExternal,
                ];
            }

            // Only recurse into internal pages within depth limit
            if (! $isExternal && $currentDepth < $maxDepth) {
                $this->crawlPage($url, $url, $currentDepth + 1, $maxDepth);
            }
        }
    }

    /**
     * Perform an HTTP GET for a page and return its HTML body.
     */
    private function fetchPage(string $url): ?string
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => config('linkchecker.user_agent'),
                'Accept'     => 'text/html,application/xhtml+xml',
            ])
                ->timeout(config('linkchecker.timeout', 10))
                ->withoutVerifying()   // Handle self-signed SSL gracefully
                ->get($url);

            if ($response->successful()) {
                $contentType = $response->header('Content-Type', '');
                if (str_contains($contentType, 'text/html')) {
                    return $response->body();
                }
            }

            return null;
        } catch (\Throwable $e) {
            Log::debug("CrawlerService: could not fetch [{$url}]: " . $e->getMessage());

            return null;
        }
    }

    /**
     * Parse HTML and extract all <a href> attributes.
     * Returns an array of ['url' => string, 'is_external' => bool].
     */
    private function extractLinks(string $html, string $currentPageUrl): array
    {
        $links = [];

        // Suppress DOM parsing warnings
        libxml_use_internal_errors(true);
        $dom = new \DOMDocument();
        $dom->loadHTML($html, LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();

        $anchors = $dom->getElementsByTagName('a');

        foreach ($anchors as $anchor) {
            /** @var \DOMElement $anchor */
            $href = trim($anchor->getAttribute('href'));

            // Pre-clean: remove PHP-style escaped forward slashes (\/) that
            // some templating engines embed in HTML attributes
            $href = str_replace('\\/', '/', $href);
            $href = str_replace('\\', '', $href);
            $href = trim($href);

            if (empty($href)) {
                continue;
            }

            // Skip ignored schemes
            foreach (config('linkchecker.ignored_schemes', []) as $scheme) {
                if (str_starts_with($href, $scheme)) {
                    continue 2;
                }
            }

            // Normalize relative URL against current page
            $normalized = $this->checker->normalizeUrl($href, $currentPageUrl);

            if (! $normalized) {
                continue;
            }

            $isExternal = $this->isExternal($normalized);

            // Skip external if config says so
            if ($isExternal && ! config('linkchecker.check_external', true)) {
                continue;
            }

            $links[] = [
                'url'         => $normalized,
                'is_external' => $isExternal,
            ];
        }

        return $links;
    }

    /**
     * Determine if a fully-qualified URL is external to the base domain.
     */
    private function isExternal(string $url): bool
    {
        $parsed = parse_url($url);
        $host   = $parsed['host'] ?? '';

        return $host !== $this->baseHost;
    }
}
