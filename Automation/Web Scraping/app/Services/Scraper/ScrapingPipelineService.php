<?php

declare(strict_types=1);

namespace App\Services\Scraper;

use App\Models\CrawlRun;
use App\Models\CrawlTarget;
use App\Models\ScrapedRecord;
use App\Services\Scraper\Contracts\ScraperStrategyInterface;
use App\Services\Scraper\Strategies\TechNewsScraperStrategy;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

readonly class PipelineResult
{
    public function __construct(
        public CrawlTarget $target,
        public int $itemsFound,
        public int $itemsSaved,
        public int $duplicatesSkipped,
        public int $httpStatus,
        public float $durationSeconds,
        public bool $success,
        public ?string $errorMessage = null
    ) {}
}

class ScrapingPipelineService
{
    private array $strategies = [];
    private array $userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    ];

    public function __construct()
    {
        $this->registerStrategy(new TechNewsScraperStrategy());
    }

    public function registerStrategy(ScraperStrategyInterface $strategy): void
    {
        $this->strategies[$strategy->getIdentifier()] = $strategy;
    }

    public function execute(CrawlTarget $target, bool $dryRun = false): PipelineResult
    {
        $startTime = microtime(true);
        $strategy = $this->strategies[$target->parser_strategy] ?? $this->strategies['TECH_NEWS_ARTICLE'];

        try {
            // Polite Jitter & Rate Limiting delay
            $jitterMs = $target->rate_limit_delay_ms + rand(50, 150);
            usleep($jitterMs * 1000);

            // Resilient HTTP Client with retry policy & header rotation
            $ua = $this->userAgents[array_rand($this->userAgents)];

            // Simulation Fallback if using local/mock URLs
            if (str_contains($target->target_url, 'mock.internal')) {
                $html = $this->getMockHtmlPayload();
                $httpStatus = 200;
            } else {
                $response = Http::withHeaders([
                    'User-Agent' => $ua,
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9',
                    'Accept-Language' => 'en-US,en;q=0.9',
                ])->timeout(10)->retry(2, 200)->get($target->target_url);

                $httpStatus = $response->status();
                $html = $response->body();

                if (!$response->successful()) {
                    throw new Exception("HTTP request failed with status: {$httpStatus}");
                }
            }

            // Extract structured DTOs using configured Strategy
            $items = $strategy->parseHtml($html, $target->target_url);
            $itemsFound = count($items);
            $itemsSaved = 0;
            $duplicatesSkipped = 0;

            if (!$dryRun) {
                DB::transaction(function () use ($items, $target, &$itemsSaved, &$duplicatesSkipped) {
                    foreach ($items as $item) {
                        $fingerprint = $item->generateFingerprint((int) $target->id);

                        $exists = ScrapedRecord::query()->where('fingerprint_hash', $fingerprint)->exists();

                        if ($exists) {
                            $duplicatesSkipped++;
                            continue;
                        }

                        ScrapedRecord::create([
                            'crawl_target_id' => $target->id,
                            'fingerprint_hash' => $fingerprint,
                            'title' => $item->title,
                            'canonical_url' => $item->canonicalUrl,
                            'numeric_value_cents' => $item->numericValueCents,
                            'metadata' => $item->metadata,
                            'status' => 'NEW',
                        ]);

                        $itemsSaved++;
                    }

                    $target->update(['last_crawled_at' => now()]);
                });
            } else {
                $itemsSaved = $itemsFound; // In dry run, treat found as simulated saves
            }

            $duration = round(microtime(true) - $startTime, 3);

            if (!$dryRun) {
                CrawlRun::create([
                    'crawl_target_id' => $target->id,
                    'items_found' => $itemsFound,
                    'items_saved' => $itemsSaved,
                    'duplicates_skipped' => $duplicatesSkipped,
                    'http_status' => $httpStatus,
                    'duration_seconds' => $duration,
                    'status' => 'COMPLETED',
                ]);
            }

            return new PipelineResult(
                target: $target,
                itemsFound: $itemsFound,
                itemsSaved: $itemsSaved,
                duplicatesSkipped: $duplicatesSkipped,
                httpStatus: $httpStatus,
                durationSeconds: $duration,
                success: true
            );

        } catch (Exception $e) {
            $duration = round(microtime(true) - $startTime, 3);

            if (!$dryRun) {
                CrawlRun::create([
                    'crawl_target_id' => $target->id,
                    'items_found' => 0,
                    'items_saved' => 0,
                    'duplicates_skipped' => 0,
                    'http_status' => 500,
                    'duration_seconds' => $duration,
                    'status' => 'FAILED',
                    'error_message' => $e->getMessage(),
                ]);
            }

            return new PipelineResult(
                target: $target,
                itemsFound: 0,
                itemsSaved: 0,
                duplicatesSkipped: 0,
                httpStatus: 500,
                durationSeconds: $duration,
                success: false,
                errorMessage: $e->getMessage()
            );
        }
    }

    private function getMockHtmlPayload(): string
    {
        return <<<'HTML'
        <!DOCTYPE html>
        <html>
        <body>
            <div class="container">
                <article class="post-item">
                    <h2><a class="title" href="/articles/distributed-consensus-php">Distributed Consensus Protocols in Modern PHP 8.4</a></h2>
                    <span class="price">$199.00</span>
                </article>
                <article class="post-item">
                    <h2><a class="title" href="/articles/event-driven-architecture-cqrs">Building Event-Sourced Architectures at Scale</a></h2>
                    <span class="price">$249.50</span>
                </article>
                <article class="post-item">
                    <h2><a class="title" href="/articles/zero-downtime-deployments">High-Availability PostgreSQL Multi-Region Failover</a></h2>
                    <span class="price">$150.00</span>
                </article>
            </div>
        </body>
        </html>
        HTML;
    }
}
