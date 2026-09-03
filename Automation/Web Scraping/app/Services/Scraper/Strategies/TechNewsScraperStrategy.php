<?php

declare(strict_types=1);

namespace App\Services\Scraper\Strategies;

use App\Services\Scraper\Contracts\ScraperStrategyInterface;
use App\Services\Scraper\Dto\ScrapedItemDto;
use DOMDocument;
use DOMXPath;

class TechNewsScraperStrategy implements ScraperStrategyInterface
{
    public function getIdentifier(): string
    {
        return 'TECH_NEWS_ARTICLE';
    }

    /**
     * @return array<ScrapedItemDto>
     */
    public function parseHtml(string $html, string $baseUrl): array
    {
        $internalErrors = libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $dom->loadHTML($html, LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NONET);
        libxml_use_internal_errors($internalErrors);

        $xpath = new DOMXPath($dom);
        $articles = $xpath->query("//article | //div[contains(@class, 'post-item')] | //li[contains(@class, 'item')] | //tr[contains(@class, 'athing')]");
        $items = [];

        if (!$articles || $articles->length === 0) {
            // Generic fallback selector: any headings containing anchor links
            $headings = $xpath->query("//h2/a | //h3/a");
            if ($headings) {
                foreach ($headings as $anchor) {
                    $title = trim($anchor->textContent);
                    $href = $anchor->getAttribute('href');
                    if (!empty($title) && !empty($href)) {
                        $canonical = str_starts_with($href, 'http') ? $href : rtrim($baseUrl, '/') . '/' . ltrim($href, '/');
                        $items[] = new ScrapedItemDto(
                            title: $title,
                            canonicalUrl: $canonical,
                            numericValueCents: 0,
                            metadata: ['source' => 'generic_heading_fallback']
                        );
                    }
                }
            }
            return $items;
        }

        foreach ($articles as $articleNode) {
            $titleNode = $xpath->query(".//h2 | .//h3 | .//a[contains(@class, 'title')] | .//span[contains(@class, 'titleline')]/a", $articleNode)->item(0);
            $linkNode = $xpath->query(".//a[@href]", $articleNode)->item(0);
            $priceNode = $xpath->query(".//*[contains(@class, 'price')] | .//*[contains(text(), '$')]", $articleNode)->item(0);

            $title = $titleNode ? trim($titleNode->textContent) : 'Untitled Ingestion';
            $href = ($titleNode && $titleNode->hasAttribute('href')) 
                ? $titleNode->getAttribute('href') 
                : ($linkNode ? $linkNode->getAttribute('href') : $baseUrl);
            $canonical = str_starts_with($href, 'http') ? $href : rtrim($baseUrl, '/') . '/' . ltrim($href, '/');

            // Parse numeric price/metrics if present (e.g., "$1,299.99" -> 129999)
            $cents = 0;
            if ($priceNode) {
                preg_match('/\$?([0-9,]+(\.[0-9]{2})?)/', $priceNode->textContent, $matches);
                if (!empty($matches[1])) {
                    $cents = (int) round((float) str_replace(',', '', $matches[1]) * 100);
                }
            }

            $items[] = new ScrapedItemDto(
                title: $title,
                canonicalUrl: $canonical,
                numericValueCents: $cents,
                metadata: [
                    'extracted_at' => date('Y-m-d H:i:s'),
                    'tag' => 'enterprise_ingest',
                ]
            );
        }

        return $items;
    }
}
