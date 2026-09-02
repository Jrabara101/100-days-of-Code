<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CrawlTarget;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScrapePipelineCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_fails_when_no_targets_configured(): void
    {
        $this->artisan('scrape:pipeline')
            ->assertExitCode(1);
    }

    public function test_executes_command_with_dry_run_option(): void
    {
        CrawlTarget::create([
            'name' => 'Mock Internal Target',
            'target_url' => 'https://mock.internal/catalog/tech-articles',
            'parser_strategy' => 'TECH_NEWS_ARTICLE',
            'rate_limit_delay_ms' => 0,
        ]);

        $this->artisan('scrape:pipeline', ['--dry-run' => true])
            ->assertSuccessful();

        $this->assertDatabaseCount('scraped_records', 0);
    }

    public function test_executes_command_with_export_option(): void
    {
        CrawlTarget::create([
            'name' => 'Mock Internal Target',
            'target_url' => 'https://mock.internal/catalog/tech-articles',
            'parser_strategy' => 'TECH_NEWS_ARTICLE',
            'rate_limit_delay_ms' => 0,
        ]);

        $exportJson = storage_path('app/test_export.json');
        $exportCsv = storage_path('app/test_export.csv');

        $this->artisan('scrape:pipeline', ['--export' => $exportJson])
            ->assertSuccessful();

        $this->assertFileExists($exportJson);
        $this->assertStringContainsString('Distributed Consensus', file_get_contents($exportJson));

        $this->artisan('scrape:pipeline', ['--export' => $exportCsv])
            ->assertSuccessful();

        $this->assertFileExists($exportCsv);
        $this->assertStringContainsString('Distributed Consensus', file_get_contents($exportCsv));

        @unlink($exportJson);
        @unlink($exportCsv);
    }
}
