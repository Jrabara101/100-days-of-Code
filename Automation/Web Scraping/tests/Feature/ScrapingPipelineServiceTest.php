<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CrawlRun;
use App\Models\CrawlTarget;
use App\Models\ScrapedRecord;
use App\Services\Scraper\ScrapingPipelineService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScrapingPipelineServiceTest extends TestCase
{
    use RefreshDatabase;

    private ScrapingPipelineService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ScrapingPipelineService();
    }

    public function test_executes_pipeline_on_mock_target_and_persists_records(): void
    {
        $target = CrawlTarget::create([
            'name' => 'Mock Engineering Portal',
            'target_url' => 'https://mock.internal/catalog/tech-articles',
            'parser_strategy' => 'TECH_NEWS_ARTICLE',
            'rate_limit_delay_ms' => 0,
        ]);

        $result = $this->service->execute($target, dryRun: false);

        $this->assertTrue($result->success);
        $this->assertSame(3, $result->itemsFound);
        $this->assertSame(3, $result->itemsSaved);
        $this->assertSame(0, $result->duplicatesSkipped);

        $this->assertDatabaseCount('scraped_records', 3);
        $this->assertDatabaseCount('crawl_runs', 1);

        $run = CrawlRun::first();
        $this->assertSame('COMPLETED', $run->status);
        $this->assertSame(3, $run->items_saved);
    }

    public function test_dry_run_does_not_commit_database_records(): void
    {
        $target = CrawlTarget::create([
            'name' => 'Mock Engineering Portal',
            'target_url' => 'https://mock.internal/catalog/tech-articles',
            'parser_strategy' => 'TECH_NEWS_ARTICLE',
            'rate_limit_delay_ms' => 0,
        ]);

        $result = $this->service->execute($target, dryRun: true);

        $this->assertTrue($result->success);
        $this->assertSame(3, $result->itemsFound);
        $this->assertSame(3, $result->itemsSaved);

        $this->assertDatabaseCount('scraped_records', 0);
        $this->assertDatabaseCount('crawl_runs', 0);
    }

    public function test_second_crawl_intercepts_and_deduplicates_all_records(): void
    {
        $target = CrawlTarget::create([
            'name' => 'Mock Engineering Portal',
            'target_url' => 'https://mock.internal/catalog/tech-articles',
            'parser_strategy' => 'TECH_NEWS_ARTICLE',
            'rate_limit_delay_ms' => 0,
        ]);

        // First crawl
        $first = $this->service->execute($target, dryRun: false);
        $this->assertSame(3, $first->itemsSaved);
        $this->assertSame(0, $first->duplicatesSkipped);

        // Second crawl
        $second = $this->service->execute($target, dryRun: false);
        $this->assertSame(0, $second->itemsSaved);
        $this->assertSame(3, $second->duplicatesSkipped);

        $this->assertDatabaseCount('scraped_records', 3);
        $this->assertDatabaseCount('crawl_runs', 2);
    }
}
