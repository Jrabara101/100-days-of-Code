<?php

namespace App\Console\Commands;

use App\Jobs\CheckLinkJob;
use App\Models\ScanSession;
use App\Notifications\BrokenLinksFound;
use App\Services\CrawlerService;
use App\Services\LinkCheckerService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class CheckBrokenLinks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'links:check
                            {url : The base URL to crawl}
                            {--depth= : Crawl depth override (default from config)}
                            {--queue : Dispatch CheckLinkJob for each link (requires queue worker)}
                            {--report : Print JSON report after scan completes}
                            {--notify : Send notification if broken links are found}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crawl a website and check all links for broken URLs';

    public function __construct(
        private CrawlerService    $crawler,
        private LinkCheckerService $checker,
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $baseUrl  = rtrim($this->argument('url'), '/');
        $depth    = (int) ($this->option('depth') ?? config('linkchecker.depth', 3));
        $useQueue = $this->option('queue');

        // ── Validate URL ──────────────────────────────────────────────────
        if (! filter_var($baseUrl, FILTER_VALIDATE_URL)) {
            $this->error("Invalid URL: {$baseUrl}");

            return self::FAILURE;
        }

        $this->newLine();
        $this->line("  <fg=cyan;options=bold>🔗 Broken Link Checker</>");
        $this->line("  <fg=gray>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</>");
        $this->line("  <fg=white>Base URL :</> <fg=yellow>{$baseUrl}</>");
        $this->line("  <fg=white>Depth    :</> <fg=yellow>{$depth}</>");
        $this->line("  <fg=white>Mode     :</> " . ($useQueue ? '<fg=green>Async (queue)</>' : '<fg=green>Sync (inline)</>'));
        $this->line("  <fg=gray>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</>");
        $this->newLine();

        // ── Create scan session ───────────────────────────────────────────
        $session = ScanSession::create([
            'base_url'   => $baseUrl,
            'status'     => 'running',
            'depth'      => $depth,
            'started_at' => now(),
        ]);

        $this->info("  Session #{$session->id} created.");

        // ── Crawl ─────────────────────────────────────────────────────────
        $this->line("\n  <fg=cyan>🕷  Crawling pages...</>");
        $links = $this->crawler->crawl($baseUrl, $depth);
        $total = $links->count();

        $this->info("  Found <fg=yellow>{$total}</> links to check.");
        $this->newLine();

        if ($total === 0) {
            $this->warn('  No links found. Ensure the URL is accessible and returns HTML.');
            $session->update(['status' => 'completed', 'completed_at' => now()]);

            return self::SUCCESS;
        }

        // ── Check links ───────────────────────────────────────────────────
        if ($useQueue) {
            $this->checkViaQueue($session, $links);
        } else {
            $this->checkInline($session, $links);
        }

        // ── Finalise session ──────────────────────────────────────────────
        $session->update([
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        // Reload for accurate counts
        $session->refresh();
        $brokenCount = $session->broken_count;

        $this->newLine();
        $this->line("  <fg=gray>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</>");
        $this->line("  ✅  Scan complete  |  Session #{$session->id}");
        $this->line("  <fg=white>Total Links  :</> <fg=yellow>{$session->total_links}</>");
        $this->line("  <fg=white>Valid        :</> <fg=green>{$session->valid_count}</>");
        $this->line("  <fg=white>Redirects    :</> <fg=yellow>{$session->redirect_count}</>");
        $this->line("  <fg=white>Broken       :</> <fg=red>{$brokenCount}</>");
        $this->line("  <fg=gray>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</>");

        // ── Optional: notify ──────────────────────────────────────────────
        if ($this->option('notify') && $brokenCount > 0) {
            $this->sendNotification($session);
        }

        // ── Optional: print report ────────────────────────────────────────
        if ($this->option('report')) {
            $this->newLine();
            $this->call('links:report', ['session_id' => $session->id]);
        }

        return self::SUCCESS;
    }

    /**
     * Check each link synchronously with a progress bar.
     */
    private function checkInline(ScanSession $session, \Illuminate\Support\Collection $links): void
    {
        $bar = $this->output->createProgressBar($links->count());
        $bar->setFormat(
            "  %current%/%max% [%bar%] %percent:3s%%  <fg=cyan>%message%</>"
        );
        $bar->setMessage('Starting...');
        $bar->start();

        foreach ($links as $link) {
            $bar->setMessage(mb_substr($link['url'], 0, 60));

            $result = $this->checker->check($link['url']);

            \App\Models\LinkResult::create([
                'scan_session_id' => $session->id,
                'url'             => $link['url'],
                'source_page'     => $link['source_page'],
                'status_code'     => $result->statusCode,
                'final_url'       => $result->finalUrl,
                'error_message'   => $result->errorMessage,
                'is_broken'       => $result->isBroken,
                'is_external'     => $link['is_external'],
                'checked_at'      => now(),
            ]);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Dispatch a CheckLinkJob for each link.
     */
    private function checkViaQueue(ScanSession $session, \Illuminate\Support\Collection $links): void
    {
        $this->line("  <fg=cyan>📬 Dispatching jobs to queue...</>");

        foreach ($links as $link) {
            CheckLinkJob::dispatch(
                $session->id,
                $link['url'],
                $link['source_page'],
                $link['is_external'],
            );
        }

        $this->info("  {$links->count()} jobs dispatched. Run <fg=yellow>php artisan queue:work</> to process.");
    }

    /**
     * Send notification to configured channels.
     */
    private function sendNotification(ScanSession $session): void
    {
        $email   = config('linkchecker.notify_email');
        $webhook = config('linkchecker.notify_slack');

        if (! $email && ! $webhook) {
            $this->warn('  Notification skipped: no email or Slack webhook configured.');

            return;
        }

        try {
            Notification::route('mail', $email)
                ->route('slack', $webhook)
                ->notify(new BrokenLinksFound($session));

            $this->info('  📧 Notification sent.');
        } catch (\Throwable $e) {
            $this->error('  Failed to send notification: ' . $e->getMessage());
        }
    }
}
