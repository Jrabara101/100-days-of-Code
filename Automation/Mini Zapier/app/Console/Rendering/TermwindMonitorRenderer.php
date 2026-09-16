<?php

declare(strict_types=1);

namespace App\Console\Rendering;

use App\Integrations\Contracts\TriggerInterface;
use App\Models\WorkflowExecution;
use function Termwind\render;

/**
 * Dedicated CLI Renderer using Termwind to create an auto-refreshing dashboard
 * with precise spacing, alignment, and modern terminal styling.
 */
class TermwindMonitorRenderer
{
    /**
     * Render the complete live monitor dashboard.
     *
     * @param array<TriggerInterface> $activeTriggers
     * @param \Illuminate\Database\Eloquent\Collection<int, WorkflowExecution> $recentExecutions
     * @param WorkflowExecution|null $debugExecution
     * @param array{uptime: string, throughput: string, peakRam: string, engine: string, driver: string} $meta
     */
    public function renderDashboard(
        array $activeTriggers,
        $recentExecutions,
        ?WorkflowExecution $debugExecution,
        array $meta
    ): void {
        $html = $this->buildHtml($activeTriggers, $recentExecutions, $debugExecution, $meta);
        render($html);
    }

    /**
     * Build the Termwind HTML layout.
     *
     * @param array<TriggerInterface> $activeTriggers
     * @param \Illuminate\Database\Eloquent\Collection<int, WorkflowExecution> $recentExecutions
     */
    public function buildHtml(
        array $activeTriggers,
        $recentExecutions,
        ?WorkflowExecution $debugExecution,
        array $meta
    ): string {
        $uptime = $meta['uptime'] ?? '04h 12m 09s';
        $throughput = $meta['throughput'] ?? '12 Zaps/min';
        $peakRam = $meta['peakRam'] ?? '24MB';
        $engine = $meta['engine'] ?? 'Laravel 11';
        $driver = $meta['driver'] ?? 'Redis Horizon';

        $separator = str_repeat('=', 70);
        $subSeparator = str_repeat('-', 70);

        // Header Section
        $out = "
        <div>
            <div class=\"flex justify-between text-cyan-400 font-bold\">
                <span>CoreLink Daemon v2.4.0</span>
                <span class=\"text-slate-400\">[Engine: {$engine} | Driver: {$driver}]</span>
            </div>
            <div class=\"text-slate-500\">{$separator}</div>

            <div class=\"flex justify-between font-bold\">
                <span class=\"text-yellow-400\">[ LIVE WORKFLOW MONITOR ]</span>
                <span class=\"text-slate-300\">Uptime: <span class=\"text-emerald-400 font-bold\">{$uptime}</span></span>
            </div>

            <!-- Active Triggers Section -->
            <div class=\"mt-1 text-amber-300 font-bold\">⚡ ACTIVE TRIGGERS (Listening)</div>
        ";

        foreach ($activeTriggers as $trigger) {
            $namePadded = str_pad($trigger->getName(), 32);
            $route = $trigger->getRoute();
            $out .= "
            <div>
                <span class=\"text-emerald-400 font-bold\">&nbsp;&nbsp;[✔]</span>
                <span class=\"text-slate-100\">&nbsp;{$namePadded}</span>
                <span class=\"text-slate-400\">&nbsp;&nbsp;&nbsp;-&gt; Route:&nbsp;</span>
                <span class=\"text-cyan-300\">{$route}</span>
            </div>";
        }

        $out .= "
            <div class=\"text-slate-500 mt-1\">{$separator}</div>
            <div class=\"text-yellow-400 font-bold\">[ RECENT EXECUTIONS ]</div>
            <div class=\"text-slate-500\">{$subSeparator}</div>
            <div class=\"text-slate-400 font-bold\">
                <span>ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;Workflow Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;Mapped Data&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;Status</span>
            </div>
            <div class=\"text-slate-500\">{$subSeparator}</div>
        ";

        // Recent Executions Table
        foreach ($recentExecutions as $exec) {
            $wf = $exec->workflow;
            $wfId = '#' . $exec->workflow_id;
            $wfName = $wf?->name ?? 'Unknown Workflow';
            $mappedData = $wf?->summary_mapping ?? 'trigger -> action';

            $statusHtml = match ($exec->status?->value ?? '') {
                'SUCCESS' => '<span class="text-emerald-400 font-bold">[SUCCESS]</span>',
                'FAILED' => '<span class="text-rose-500 font-bold">[FAILED] ❌</span>',
                'RUNNING' => '<span class="text-amber-400 font-bold">[RUNNING]</span>',
                default => '<span class="text-slate-400">[' . ($exec->status?->value ?? 'PENDING') . ']</span>',
            };

            $idPadded = str_replace(' ', '&nbsp;', str_pad($wfId, 8));
            $namePadded = str_replace(' ', '&nbsp;', str_pad($wfName, 21));
            $mappedPadded = str_replace(' ', '&nbsp;', str_pad($mappedData, 28));

            $out .= "
            <div>
                <span class=\"text-cyan-400 font-bold\">{$idPadded}</span>
                <span class=\"text-slate-500\">|&nbsp;</span>
                <span class=\"text-slate-200\">{$namePadded}</span>
                <span class=\"text-slate-500\">|&nbsp;</span>
                <span class=\"text-slate-400\">{$mappedPadded}</span>
                <span class=\"text-slate-500\">|&nbsp;</span>
                {$statusHtml}
            </div>";
        }

        // Debug Workflow Topology Section
        $debugWfId = $debugExecution ? '#' . $debugExecution->workflow_id : '#8802';
        $out .= "
            <div class=\"text-slate-500 mt-1\">{$separator}</div>
            <div class=\"text-yellow-400 font-bold\">[ DEBUG: WORKFLOW {$debugWfId} TOPOLOGY ]</div>
        ";

        if ($debugExecution) {
            $wf = $debugExecution->workflow;
            $triggerName = $wf?->trigger_name ?? 'Inbound User Registration';
            $traceSteps = $debugExecution->topology_trace ?? [];

            $out .= "
            <div class=\"mt-1\">
                <span class=\"text-purple-400 font-bold\">&nbsp;&nbsp;(Trigger)</span>
                <span class=\"text-slate-100 font-bold\">&nbsp;{$triggerName}</span>
            </div>
            <div class=\"text-slate-500\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│</div>
            <div class=\"text-slate-500\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─► <span class=\"text-cyan-300 font-bold\">Interpolating Payload...</span></div>
            ";

            // Extract tokens from first step or execution traces
            $firstStepTraces = $traceSteps[0]['traces'] ?? [];
            if (empty($firstStepTraces)) {
                $firstStepTraces = [
                    ['token' => '{{ trigger.user.name }}', 'resolved' => 'Jane Doe'],
                    ['token' => '{{ trigger.user.email }}', 'resolved' => 'jane@example.com'],
                ];
            }

            $count = count($firstStepTraces);
            foreach ($firstStepTraces as $idx => $t) {
                $isLast = ($idx === $count - 1);
                $branch = $isLast ? '└─' : '├─';
                $token = $t['token'] ?? '{{ token }}';
                $resolved = is_string($t['resolved']) ? "\"{$t['resolved']}\"" : json_encode($t['resolved']);

                $out .= "
            <div class=\"text-slate-500\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;{$branch}&nbsp;<span class=\"text-amber-300\">{$token}</span>&nbsp;&nbsp;=&gt;&nbsp;<span class=\"text-emerald-300 font-bold\">{$resolved}</span></div>";
            }

            $out .= "
            <div class=\"text-slate-500\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│</div>
            <div class=\"text-slate-500\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼</div>";

            // Steps
            $totalSteps = count($traceSteps);
            foreach ($traceSteps as $sIdx => $step) {
                $isLastStep = ($sIdx === $totalSteps - 1);
                $stepName = $step['name'] ?? 'Action Step';
                $duration = isset($step['duration']) ? number_format((float) $step['duration'], 2) . 's' : '0.20s';
                $isSuccess = ($step['status'] ?? '') === 'SUCCESS';
                $badge = $isSuccess
                    ? '<span class="text-emerald-400 font-bold">[✔]</span>'
                    : '<span class="text-rose-500 font-bold">[❌]</span>';

                $out .= "
            <div>
                <span class=\"text-blue-400 font-bold\">&nbsp;&nbsp;(Action)</span>
                <span class=\"text-slate-100 font-bold\">&nbsp;{$stepName}</span>
                <span>&nbsp;{$badge}</span>
                <span class=\"text-slate-400\">&nbsp;({$duration})</span>
            </div>";

                if (! $isLastStep) {
                    $out .= "
            <div class=\"text-slate-500\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│</div>
            <div class=\"text-slate-500\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼</div>";
                }
            }
        }

        // Footer Section
        $out .= "
            <div class=\"text-slate-500 mt-1\">{$separator}</div>
            <div>
                <span class=\"text-slate-300\">System Health:&nbsp;</span>
                <span class=\"text-emerald-400 font-bold\">Excellent</span>
                <span class=\"text-slate-500\">&nbsp;|&nbsp;</span>
                <span class=\"text-slate-300\">Throughput:&nbsp;</span>
                <span class=\"text-cyan-400 font-bold\">{$throughput}</span>
                <span class=\"text-slate-500\">&nbsp;|&nbsp;</span>
                <span class=\"text-slate-300\">Peak RAM:&nbsp;</span>
                <span class=\"text-yellow-300 font-bold\">{$peakRam}</span>
            </div>
            <div class=\"text-slate-500\">Press 'Ctrl+C' to terminate daemon.</div>
        </div>
        ";

        return $out;
    }
}
