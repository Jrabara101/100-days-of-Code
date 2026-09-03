<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\CrawlTarget;
use App\Models\ScrapedRecord;
use App\Services\Scraper\PipelineResult;
use App\Services\Scraper\ScrapingPipelineService;
use Illuminate\Console\Command;
use function Termwind\{render};

class ScrapePipelineCommand extends Command
{
    protected $signature = 'scrape:pipeline
                            {--target= : Specific Crawl Target ID}
                            {--export= : Export normalized dataset to path (JSON or CSV)}
                            {--dry-run : Ingest and parse DOM without database commits}
                            {--rate-limit= : Override base delay interval in milliseconds}';

    protected $description = 'Executes the resilient web scraping pipeline with deduplication and structured reporting.';

    public function handle(ScrapingPipelineService $pipeline): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $targetId = $this->option('target');
        $exportPath = $this->option('export');
        $rateLimitOverride = $this->option('rate-limit');

        $query = CrawlTarget::query();
        if ($targetId) {
            $query->where('id', $targetId);
        }

        $targets = $query->get();

        if ($targets->isEmpty()) {
            render(<<<'HTML'
                <div class="my-1 mx-2 p-1 bg-red-900 text-white font-bold">
                    ✖ ERROR: No active crawl targets configured. Seed the database first.
                </div>
            HTML);
            return self::FAILURE;
        }

        $this->renderHeader($targets->count(), $dryRun);

        $results = [];
        $totalFound = 0;
        $totalSaved = 0;
        $totalDuplicates = 0;

        foreach ($targets as $target) {
            if ($rateLimitOverride) {
                $target->rate_limit_delay_ms = (int) $rateLimitOverride;
            }

            $this->output->write(sprintf('  <fg=cyan>➜ Ingesting & Parsing:</> <fg=white;options=bold>%s</> ... ', $target->name));
            
            $res = $pipeline->execute($target, $dryRun);
            $results[] = $res;

            if ($res->success) {
                $totalFound += $res->itemsFound;
                $totalSaved += $res->itemsSaved;
                $totalDuplicates += $res->duplicatesSkipped;
                $this->output->writeln('<fg=green;options=bold>✔ 200 OK</>');
            } else {
                $this->output->writeln('<fg=red;options=bold>✖ FAILED</>');
            }
        }

        $this->newLine();
        $this->renderExecutionTable($results);
        $this->renderSummaryTelemetry($totalFound, $totalSaved, $totalDuplicates, $dryRun);

        if ($exportPath) {
            $this->exportDataset($exportPath);
        }

        return self::SUCCESS;
    }

    private function renderHeader(int $targetCount, bool $dryRun): void
    {
        $modeBadge = $dryRun
            ? '<span class="bg-yellow-500 text-black px-1 font-bold">SIMULATION / DRY-RUN</span>'
            : '<span class="bg-emerald-600 text-white px-1 font-bold">ACTIVE DATABASE COMMITS</span>';

        render(<<<HTML
            <div class="mx-1 my-1 p-1">
                <div class="flex justify-between">
                    <span class="text-cyan-400 font-bold">⚡ RESILIENT WEB SCRAPING &amp; REPORTING PIPELINE</span>
                    {$modeBadge}
                </div>
                <div class="text-gray-400 mt-1">
                    Targets Queued: <span class="text-white font-bold">{$targetCount}</span> | Deduplication: <span class="text-cyan-300">SHA-256 Unique Constraints</span> | Engine: <span class="text-indigo-400">DOMDocument + XPath</span>
                </div>
            </div>
        HTML);
    }

    /**
     * @param array<PipelineResult> $results
     */
    private function renderExecutionTable(array $results): void
    {
        $rows = '';
        foreach ($results as $r) {
            $statusBadge = $r->success
                ? '<span class="text-emerald-400 font-bold">✔ OK</span>'
                : '<span class="text-red-400 font-bold">✖ FAIL</span>';

            $duration = $r->durationSeconds . 's';
            $errorInfo = $r->errorMessage
                ? sprintf('<div class="text-red-400 italic mt-1">%s</div>', e($r->errorMessage))
                : '';

            $rows .= <<<HTML
                <tr>
                    <td class="font-bold text-white">{$r->target->name}</td>
                    <td class="text-gray-400">{$r->target->target_url}</td>
                    <td class="text-right text-cyan-300">{$r->itemsFound}</td>
                    <td class="text-right text-emerald-400 font-bold">{$r->itemsSaved}</td>
                    <td class="text-right text-yellow-400">{$r->duplicatesSkipped}</td>
                    <td class="text-right text-gray-400">{$duration}</td>
                    <td>{$statusBadge} {$errorInfo}</td>
                </tr>
            HTML;
        }

        render(<<<HTML
            <table class="w-full my-1">
                <thead>
                    <tr class="text-gray-400">
                        <th class="text-left font-bold text-cyan-400">Target Source</th>
                        <th class="text-left font-bold text-cyan-400">Ingestion URL</th>
                        <th class="text-right font-bold text-cyan-400">Parsed</th>
                        <th class="text-right font-bold text-cyan-400">New Saved</th>
                        <th class="text-right font-bold text-cyan-400">Deduplicated</th>
                        <th class="text-right font-bold text-cyan-400">Latency</th>
                        <th class="text-left font-bold text-cyan-400">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {$rows}
                </tbody>
            </table>
        HTML);
    }

    private function renderSummaryTelemetry(int $found, int $saved, int $duplicates, bool $dryRun): void
    {
        render(<<<HTML
            <div class="my-1 p-1 bg-gray-900">
                <div class="font-bold text-indigo-300 mb-1">📊 CRAWL RUN RECONCILIATION SUMMARY</div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Total Extracted Node Elements:</span>
                    <span class="text-white font-bold">{$found}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">New Records Persisted to Warehouse:</span>
                    <span class="text-emerald-400 font-bold">{$saved}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-gray-400">Duplicate Items Intercepted &amp; Suppressed:</span>
                    <span class="text-yellow-400 font-bold">{$duplicates}</span>
                </div>
            </div>
        HTML);
    }

    private function exportDataset(string $path): void
    {
        $records = ScrapedRecord::latest()->limit(500)->get();

        $dir = dirname($path);
        if (!empty($dir) && !is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        if (str_ends_with($path, '.json')) {
            file_put_contents($path, json_encode($records->toArray(), JSON_PRETTY_PRINT));
            $this->info("Structured dataset exported to JSON: {$path}");
        } elseif (str_ends_with($path, '.csv')) {
            $handle = fopen($path, 'w');
            fputcsv($handle, ['ID', 'Title', 'Canonical URL', 'Value Cents', 'Fingerprint Hash', 'Created At']);
            foreach ($records as $r) {
                fputcsv($handle, [
                    $r->id,
                    $r->title,
                    $r->canonical_url ?? $r->canonicalUrl,
                    $r->numeric_value_cents ?? $r->numericValueCents,
                    $r->fingerprint_hash,
                    (string) $r->created_at,
                ]);
            }
            fclose($handle);
            $this->info("Structured dataset exported to CSV: {$path}");
        } else {
            $this->warn("Unsupported export extension. Please specify .json or .csv.");
        }
    }
}
