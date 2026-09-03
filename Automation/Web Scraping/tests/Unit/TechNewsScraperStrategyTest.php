<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Scraper\Strategies\TechNewsScraperStrategy;
use PHPUnit\Framework\TestCase;

class TechNewsScraperStrategyTest extends TestCase
{
    private TechNewsScraperStrategy $strategy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->strategy = new TechNewsScraperStrategy();
    }

    public function test_identifier(): void
    {
        $this->assertSame('TECH_NEWS_ARTICLE', $this->strategy->getIdentifier());
    }

    public function test_parses_article_elements_and_prices(): void
    {
        $html = <<<HTML
        <div>
            <article class="post-item">
                <h2><a class="title" href="/news/tech-breakthrough">Tech Breakthrough 2026</a></h2>
                <span class="price">$149.99</span>
            </article>
        </div>
        HTML;

        $results = $this->strategy->parseHtml($html, 'https://example.com');

        $this->assertCount(1, $results);
        $this->assertSame('Tech Breakthrough 2026', $results[0]->title);
        $this->assertSame('https://example.com/news/tech-breakthrough', $results[0]->canonicalUrl);
        $this->assertSame(14999, $results[0]->numericValueCents);
    }

    public function test_falls_back_to_generic_headings(): void
    {
        $html = <<<HTML
        <div>
            <h2><a href="/updates/first-post">First Post</a></h2>
            <h3><a href="https://other.com/external-post">External Post</a></h3>
        </div>
        HTML;

        $results = $this->strategy->parseHtml($html, 'https://example.com');

        $this->assertCount(2, $results);
        $this->assertSame('First Post', $results[0]->title);
        $this->assertSame('https://example.com/updates/first-post', $results[0]->canonicalUrl);
        $this->assertSame('External Post', $results[1]->title);
        $this->assertSame('https://other.com/external-post', $results[1]->canonicalUrl);
    }

    public function test_handles_malformed_html_without_exceptions(): void
    {
        $malformedHtml = '<div unclosed tag><article><h2><a href="/test">Unclosed Article</span>';
        $results = $this->strategy->parseHtml($malformedHtml, 'https://example.com');

        $this->assertIsArray($results);
    }
}
