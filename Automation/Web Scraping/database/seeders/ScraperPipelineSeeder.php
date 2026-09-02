<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\CrawlTarget;
use Illuminate\Database\Seeder;

class ScraperPipelineSeeder extends Seeder
{
    public function run(): void
    {
        CrawlTarget::create([
            'name' => 'Internal Engineering Portal (Mock)',
            'target_url' => 'https://mock.internal/catalog/tech-articles',
            'parser_strategy' => 'TECH_NEWS_ARTICLE',
            'rate_limit_delay_ms' => 200,
        ]);

        CrawlTarget::create([
            'name' => 'HackerNews Top Stories Feed',
            'target_url' => 'https://news.ycombinator.com/',
            'parser_strategy' => 'TECH_NEWS_ARTICLE',
            'rate_limit_delay_ms' => 500,
        ]);
    }
}
