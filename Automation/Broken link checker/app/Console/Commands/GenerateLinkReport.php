<?php

namespace App\Console\Commands;

use App\Models\LinkResult;
use App\Models\ScanSession;
use Illuminate\Console\Command;

class GenerateLinkReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'links:report
                            {session_id? : Specific session ID to report on}
                            {--latest : Use the most recent scan session}
                            {--format=json : Output format: json or table}
                            {--broken-only : Only output broken links (no summary)}
                            {--out= : Write report to a file path instead of stdout}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a broken links report for a scan session';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $session = $this->resolveSession();

        if (! $session) {
            return self::FAILURE;
        }

        $report = $this->buildReport($session);

        if ($this->option('format') === 'table') {
            $this->renderTable($session, $report);
        } else {
            $this->renderJson($report);
        }

        return self::SUCCESS;
    }

    /**
     * Resolve the ScanSession to report on.
     */
    private function resolveSession(): ?ScanSession
    {
        $sessionId = $this->argument('session_id');

        if ($sessionId) {
            $session = ScanSession::find($sessionId);
            if (! $session) {
                $this->error("Session #{$sessionId} not found.");

                return null;
            }

            return $session;
        }

        if ($this->option('latest')) {
            $session = ScanSession::latest()->first();
            if (! $session) {
                $this->error('No scan sessions found in the database.');

                return null;
            }

            return $session;
        }

        // If no argument and no --latest, show available sessions
        $sessions = ScanSession::orderByDesc('created_at')->take(10)->get();

        if ($sessions->isEmpty()) {
            $this->error('No scan sessions found. Run php artisan links:check first.');

            return null;
        }

        $this->line("\n  <fg=cyan>Available sessions:</>");
        $rows = $sessions->map(fn ($s) => [
            $s->id,
            $s->base_url,
            $s->status,
            $s->linkResults()->count(),
            $s->linkResults()->where('is_broken', true)->count(),
            $s->created_at->format('Y-m-d H:i:s'),
        ])->toArray();

        $this->table(
            ['ID', 'Base URL', 'Status', 'Total Links', 'Broken', 'Created At'],
            $rows
        );

        $id = $this->ask('Enter session ID to report on');

        $session = ScanSession::find($id);
        if (! $session) {
            $this->error("Session #{$id} not found.");

            return null;
        }

        return $session;
    }

    /**
     * Build the full report data structure.
     */
    private function buildReport(ScanSession $session): array
    {
        $results = $session->linkResults()->get();

        $broken    = $results->where('is_broken', true);
        $redirects = $results->filter(fn ($r) => $r->status_code >= 300 && $r->status_code < 400);
        $valid     = $results->filter(fn ($r) => $r->status_code >= 200 && $r->status_code < 300);

        // Group broken links by source page
        $brokenByPage = $broken
            ->groupBy('source_page')
            ->map(fn ($group) => $group->map(fn ($r) => [
                'url'          => $r->url,
                'status_code'  => $r->status_code,
                'error'        => $r->error_message,
                'is_external'  => $r->is_external,
                'checked_at'   => $r->checked_at?->toIso8601String(),
            ])->values()->toArray())
            ->toArray();

        // Group redirects by source page
        $redirectsByPage = $redirects
            ->groupBy('source_page')
            ->map(fn ($group) => $group->map(fn ($r) => [
                'url'           => $r->url,
                'status_code'   => $r->status_code,
                'final_url'     => $r->final_url,
                'is_external'   => $r->is_external,
                'checked_at'    => $r->checked_at?->toIso8601String(),
            ])->values()->toArray())
            ->toArray();

        return [
            'summary' => [
                'session_id'   => $session->id,
                'base_url'     => $session->base_url,
                'depth'        => $session->depth,
                'status'       => $session->status,
                'total_links'  => $results->count(),
                'valid_links'  => $valid->count(),
                'redirects'    => $redirects->count(),
                'broken_links' => $broken->count(),
                'started_at'   => $session->started_at?->toIso8601String(),
                'completed_at' => $session->completed_at?->toIso8601String(),
            ],
            'broken_links' => $brokenByPage,
            'redirects'    => $redirectsByPage,
        ];
    }

    /**
     * Output the report as pretty-printed JSON.
     */
    private function renderJson(array $report): void
    {
        $json = json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $outPath = $this->option('out');
        if ($outPath) {
            file_put_contents($outPath, $json);
            $this->info("Report written to: {$outPath}");
        } else {
            $this->line($json);
        }
    }

    /**
     * Output the report as CLI tables.
     */
    private function renderTable(ScanSession $session, array $report): void
    {
        $summary = $report['summary'];

        $this->newLine();
        $this->line("  <fg=cyan;options=bold>📊 Scan Report — Session #{$session->id}</>");
        $this->line("  <fg=gray>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</>");
        $this->line("  Base URL   : <fg=yellow>{$summary['base_url']}</>");
        $this->line("  Depth      : <fg=yellow>{$summary['depth']}</>");
        $this->line("  Status     : <fg=green>{$summary['status']}</>");
        $this->line("  Started    : {$summary['started_at']}");
        $this->line("  Completed  : {$summary['completed_at']}");
        $this->newLine();

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Links', $summary['total_links']],
                ['<fg=green>Valid (2xx)</>', "<fg=green>{$summary['valid_links']}</>"],
                ['<fg=yellow>Redirects (3xx)</>', "<fg=yellow>{$summary['redirects']}</>"],
                ['<fg=red>Broken (4xx/5xx/err)</>', "<fg=red>{$summary['broken_links']}</>"],
            ]
        );

        if (! empty($report['broken_links'])) {
            $this->newLine();
            $this->line("  <fg=red;options=bold>❌ Broken Links by Source Page</>");
            $this->line("  <fg=gray>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</>");

            $rows = [];
            foreach ($report['broken_links'] as $sourcePage => $links) {
                foreach ($links as $link) {
                    $rows[] = [
                        mb_strimwidth($sourcePage, 0, 50, '…'),
                        mb_strimwidth($link['url'], 0, 60, '…'),
                        $link['status_code'] ?? 'ERR',
                        $link['error'] ?? '-',
                    ];
                }
            }

            $this->table(['Source Page', 'Broken URL', 'Status', 'Error'], $rows);
        } else {
            $this->newLine();
            $this->info('  🎉 No broken links found!');
        }

        if (! empty($report['redirects'])) {
            $this->newLine();
            $this->line("  <fg=yellow;options=bold>↪  Redirects (3xx)</>");
            $rows = [];
            foreach ($report['redirects'] as $sourcePage => $links) {
                foreach ($links as $link) {
                    $rows[] = [
                        mb_strimwidth($sourcePage, 0, 40, '…'),
                        mb_strimwidth($link['url'], 0, 50, '…'),
                        $link['status_code'],
                        mb_strimwidth($link['final_url'] ?? '', 0, 50, '…'),
                    ];
                }
            }
            $this->table(['Source Page', 'URL', 'Status', 'Final URL'], $rows);
        }
    }
}
