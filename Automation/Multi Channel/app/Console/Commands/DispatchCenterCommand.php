<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\DispatchOutbox;
use App\Models\NotificationProvider;
use App\Services\NotificationCenter\Dto\IngestedEventDto;
use App\Services\NotificationCenter\Dto\OutboxAuditReceipt;
use App\Services\NotificationCenter\NotificationOrchestratorService;
use Illuminate\Console\Command;
use function Termwind\{render};

class DispatchCenterCommand extends Command
{
    protected $signature = 'notifications:orchestrate
                            {--priority=P1 : Alert Priority (P0, P1, P2, P3)}
                            {--type=SECURITY_INCIDENT : Incident Type (SECURITY_INCIDENT, K8S_NODE_FAIL, BILLING_BREACH)}
                            {--dry-run : Simulate multi-channel routing without network transactions}
                            {--reset-circuits : Reset all circuit breakers to CLOSED prior to dispatch}
                            {--health : Render live provider health and circuit status dashboard}';

    protected $description = 'Enterprise Multi-Channel Notification Orchestrator with Circuit Breaker and Auto-Escalation';

    public function handle(NotificationOrchestratorService $orchestrator): int
    {
        if ($this->option('reset-circuits')) {
            NotificationProvider::query()->update(['circuit_state' => 'CLOSED', 'consecutive_failures' => 0, 'circuit_opened_at' => null]);
            $this->info('All provider gateway circuit breakers reset to [CLOSED].');
        }

        $priority = strtoupper((string) $this->option('priority'));
        $type = (string) $this->option('type');
        $dryRun = (bool) $this->option('dry-run');

        $this->renderHeader($priority, $type, $dryRun);

        if ($this->option('health')) {
            $this->renderProviderHealthDashboard();
            return self::SUCCESS;
        }

        $dto = new IngestedEventDto(
            eventType: $type,
            priority: $priority,
            referenceId: 'INC-' . date('Ymd') . '-' . rand(1000, 9999),
            title: match ($priority) {
                'P0' => '💥 P0 OUTAGE: Production Aurora Database Master Unreachable',
                'P1' => '🚨 P1 ALERT: High Latency Ingress Spike (>1500ms) on API Gateway',
                default => 'ℹ Operational System Report Generated',
            },
            message: 'Automated monitoring detected telemetry threshold anomalies. Multi-channel escalation triggered.',
            context: ['cluster' => 'us-east-prod', 'threshold_breach' => '99.4%']
        );

        $this->output->write("  <fg=cyan>⚡ Evaluating circuit states, quiet-hours, and channel fallback chains...</> ");
        $receipts = $orchestrator->orchestrate($dto, $dryRun);
        $this->output->writeln("<fg=green;options=bold>DONE</>\n");

        $this->renderReceiptsTable($receipts);
        $this->renderSummaryTelemetry($receipts);

        return self::SUCCESS;
    }

    private function renderHeader(string $priority, string $type, bool $dryRun): void
    {
        $modeBadge = $dryRun
            ? '<span class="bg-amber-500 text-black px-1 font-bold">DRY-RUN SIMULATION</span>'
            : '<span class="bg-emerald-600 text-white px-1 font-bold">LIVE PRODUCTION DISPATCH</span>';

        $priorityBadge = match ($priority) {
            'P0'    => '<span class="bg-rose-600 text-white px-1 font-bold">P0 CRITICAL (ALL-CHANNEL FANOUT &bull; DND BYPASS)</span>',
            'P1'    => '<span class="bg-amber-500 text-black px-1 font-bold">P1 HIGH (DYNAMIC ESCALATION)</span>',
            default => "<span class=\"text-cyan-400 font-bold\">{$priority} STANDARD</span>",
        };

        render(<<<HTML
            <div class="mx-1 my-1 p-1 bg-zinc-900">
                <div class="flex justify-between">
                    <span class="text-indigo-400 font-bold">⚡ ENTERPRISE NOTIFICATION ORCHESTRATOR</span>
                    {$modeBadge}
                </div>
                <div class="text-zinc-400 mt-1">
                    Event Type: <span class="text-white font-bold">{$type}</span> &bull; 
                    Urgency: {$priorityBadge} &bull; 
                    Engine: <span class="text-cyan-300">Circuit Breaker + Fallback Cascades</span>
                </div>
            </div>
            <hr class="text-zinc-700"/>
        HTML);
    }

    /**
     * @param array<OutboxAuditReceipt> $receipts
     */
    private function renderReceiptsTable(array $receipts): void
    {
        $rows = '';
        foreach ($receipts as $r) {
            $statusBadge = match ($r->status) {
                'DELIVERED'          => '<span class="text-emerald-400 font-bold">✔ DELIVERED</span>',
                'FALLBACK_RECOVERED' => '<span class="text-amber-400 font-bold">⚡ FALLBACK</span>',
                'SUPPRESSED_DND'     => '<span class="text-zinc-500 italic">🌙 DND MUTED</span>',
                'CIRCUIT_BYPASS'     => '<span class="text-rose-400 font-bold">⛔ CIRCUIT BYPASS</span>',
                'IDEMPOTENT_SKIPPED' => '<span class="text-blue-400">⏭ IDEMPOTENT</span>',
                'SIMULATED'          => '<span class="text-cyan-400 font-bold">🧪 SIMULATED</span>',
                default              => '<span class="text-rose-500 font-bold">✖ FAILED</span>',
            };

            $latency = $r->latencyMs > 0 ? "{$r->latencyMs}ms" : '<span class="text-zinc-600">0ms</span>';
            $detail = $r->logDetail
                ? sprintf('<div class="text-zinc-400 italic mt-1">%s</div>', e($r->logDetail))
                : '';

            $rows .= <<<HTML
                <tr>
                    <td class="font-bold text-white">{$r->recipientName}</td>
                    <td class="text-cyan-300">{$r->channelTrail}</td>
                    <td class="text-right text-zinc-400">{$latency}</td>
                    <td>{$statusBadge} {$detail}</td>
                </tr>
            HTML;
        }

        render(<<<HTML
            <table class="w-full my-1">
                <thead>
                    <tr class="text-zinc-400">
                        <th class="text-left font-bold text-cyan-400">Subscriber</th>
                        <th class="text-left font-bold text-cyan-400">Channel Path</th>
                        <th class="text-right font-bold text-cyan-400">Latency</th>
                        <th class="text-left font-bold text-cyan-400">Execution Status</th>
                    </tr>
                </thead>
                <tbody>
                    {$rows}
                </tbody>
            </table>
        HTML);
    }

    /**
     * @param array<OutboxAuditReceipt> $receipts
     */
    private function renderSummaryTelemetry(array $receipts): void
    {
        $total = count($receipts);
        $delivered = count(array_filter($receipts, fn($r) => in_array($r->status, ['DELIVERED', 'FALLBACK_RECOVERED', 'SIMULATED'])));
        $fallbacks = count(array_filter($receipts, fn($r) => $r->fallbackOccurred));
        $bypasses = count(array_filter($receipts, fn($r) => $r->circuitTripped));
        $suppressed = count(array_filter($receipts, fn($r) => $r->status === 'SUPPRESSED_DND'));

        render(<<<HTML
            <div class="my-1 p-1 bg-zinc-900">
                <div class="font-bold text-indigo-300 mb-1">📊 OUTBOX DISPATCH RECONCILIATION</div>
                <hr class="text-zinc-700 mb-1"/>
                <div class="flex justify-between py-1">
                    <span class="text-zinc-400">Total Delivery Channels Evaluated:</span>
                    <span class="text-white font-bold">{$total}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-zinc-400">Successful Direct Deliveries:</span>
                    <span class="text-emerald-400 font-bold">{$delivered}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-zinc-400">Automated Fallback Recoveries:</span>
                    <span class="text-amber-400 font-bold">{$fallbacks}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-zinc-400">Fast Circuit-Breaker Bypasses (0ms penalty):</span>
                    <span class="text-rose-400 font-bold">{$bypasses}</span>
                </div>
                <div class="flex justify-between py-1">
                    <span class="text-zinc-400">Suppressed (Quiet Hours / DND Schedule):</span>
                    <span class="text-zinc-500 font-bold">{$suppressed}</span>
                </div>
            </div>
        HTML);
    }

    private function renderProviderHealthDashboard(): void
    {
        $providers = NotificationProvider::all();
        $rows = '';

        foreach ($providers as $p) {
            $circuitBadge = match ($p->circuit_state) {
                'CLOSED'    => '<span class="text-emerald-400 font-bold">● CLOSED (HEALTHY)</span>',
                'HALF_OPEN' => '<span class="text-amber-400 font-bold">◐ HALF_OPEN (CANARY)</span>',
                'OPEN'      => '<span class="text-rose-400 font-bold">○ OPEN (TRIPPED)</span>',
                default     => $p->circuit_state,
            };

            $totalDispatches = DispatchOutbox::where('provider_code', $p->code)->count();
            $delivered = DispatchOutbox::where('provider_code', $p->code)->where('status', 'DELIVERED')->count();
            $avgLatency = (int) DispatchOutbox::where('provider_code', $p->code)->where('status', 'DELIVERED')->avg('latency_ms');

            $uptimePct = $totalDispatches > 0 ? round(($delivered / $totalDispatches) * 100, 1) : 100.0;
            $uptimeColor = $uptimePct >= 95 ? 'text-emerald-400' : ($uptimePct >= 80 ? 'text-amber-400' : 'text-rose-400');

            $rows .= <<<HTML
                <tr>
                    <td class="font-bold text-white">{$p->name} ({$p->code})</td>
                    <td>{$circuitBadge}</td>
                    <td class="text-right text-zinc-300">{$p->consecutive_failures}</td>
                    <td class="text-right text-zinc-400">{$avgLatency}ms</td>
                    <td class="text-right {$uptimeColor} font-bold">{$uptimePct}%</td>
                </tr>
            HTML;
        }

        render(<<<HTML
            <div class="my-1 p-1 bg-zinc-900">
                <div class="font-bold text-indigo-300 mb-1">📈 GATEWAY TELEMETRY &amp; CIRCUIT STATUS</div>
                <hr class="text-zinc-700 mb-1"/>
                <table class="w-full my-1">
                    <thead>
                        <tr class="text-zinc-400">
                            <th class="text-left font-bold text-cyan-400">Gateway Provider</th>
                            <th class="text-left font-bold text-cyan-400">Circuit State</th>
                            <th class="text-right font-bold text-cyan-400">Consecutive Fails</th>
                            <th class="text-right font-bold text-cyan-400">Avg Latency</th>
                            <th class="text-right font-bold text-cyan-400">SLA Health</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$rows}
                    </tbody>
                </table>
            </div>
        HTML);
    }
}
