<?php

declare(strict_types=1);

namespace App\Rendering;

use App\DTOs\WorkflowContext;
use App\Enums\NodeStatus;
use App\Models\WorkflowNodeExecution;
use App\Models\WorkflowRun;
use Symfony\Component\Console\Output\OutputInterface;
use function Termwind\render;

class CliTopologyRenderer
{
    protected string $engineVersion = 'Laravel 11';
    protected string $queueDriver = 'Redis';

    public function __construct(
        protected ?OutputInterface $output = null,
    ) {
    }

    public function setOutput(OutputInterface $output): self
    {
        $this->output = $output;

        return $this;
    }

    public function setQueueDriver(string $driver): self
    {
        $this->queueDriver = $driver;

        return $this;
    }

    /**
     * Clear terminal screen and reset cursor position.
     */
    public function clearScreen(): void
    {
        if ($this->output) {
            $this->output->write("\033[2J\033[H");
        }
    }

    /**
     * Render the complete DevOps dashboard live view.
     *
     * @param WorkflowRun $run
     * @param WorkflowContext $context
     * @param WorkflowNodeExecution[]|iterable $executions
     * @param WorkflowNodeExecution|null $activeExecution
     */
    public function renderDashboard(
        WorkflowRun $run,
        WorkflowContext $context,
        iterable $executions,
        ?WorkflowNodeExecution $activeExecution = null,
        bool $clear = true,
    ): void {
        if ($clear) {
            $this->clearScreen();
        }

        $lines = [];

        // 1. Header
        $lines[] = "<info>AutomataCLI v1.0.0</info>  <comment>[Engine: {$this->engineVersion} | Queue: {$this->queueDriver}]</comment>";
        $lines[] = str_repeat('=', 70);

        // 2. Workflow Run Metadata
        $lines[] = "<options=bold>[ WORKFLOW RUN: {$run->id} ]</>";
        $lines[] = sprintf('Trigger : %s', $run->trigger_source);
        $lines[] = sprintf('Payload : %s', $context->payload->getFormattedSize());
        $lines[] = '';

        // 3. Topology Section
        $lines[] = '<options=bold>[ PIPELINE EXECUTION TOPOLOGY ]</>';
        $lines[] = '';

        $execList = is_array($executions) ? $executions : iterator_to_array($executions);
        $totalNodes = count($execList);

        foreach ($execList as $idx => $nodeExec) {
            $isLast = ($idx === $totalNodes - 1);
            $order = $nodeExec->order_index ?? ($idx + 1);
            $nodeKey = $nodeExec->node_key;
            $status = $nodeExec->status instanceof NodeStatus ? $nodeExec->status : NodeStatus::from((string) $nodeExec->status);
            $isAsync = (bool) $nodeExec->is_async;
            $queueName = $nodeExec->queue_name ?? 'high-priority';
            $attempts = $nodeExec->attempts ?? 0;
            $maxAttempts = $nodeExec->max_attempts ?? 3;

            // Status Badge
            $statusBadge = match ($status) {
                NodeStatus::COMPLETED => '<fg=green;options=bold>[✔]</>',
                NodeStatus::PROCESSING => '<fg=yellow;options=bold>[⚙]</>',
                NodeStatus::FAILED => '<fg=red;options=bold>[✖]</>',
                NodeStatus::RATE_LIMITED => '<fg=magenta;options=bold>[⏳]</>',
                default => '<fg=gray>[ ]</>',
            };

            // Timing / Mode label
            if ($status === NodeStatus::COMPLETED) {
                $seconds = $nodeExec->execution_time_ms ? ($nodeExec->execution_time_ms / 1000) : 0.02;
                $timingLabel = sprintf('(%0.2fs)', $seconds);
            } elseif ($status === NodeStatus::PROCESSING) {
                $timingLabel = $isAsync ? '(Async)' : '(Running)';
            } else {
                $timingLabel = $isAsync ? '(Async)' : '(Pending)';
            }

            // Detail or active indicator
            $nodeLabel = str_pad($nodeKey, 24, ' ');
            $timePad = str_pad($timingLabel, 9, ' ');

            if ($status === NodeStatus::PROCESSING) {
                $line = sprintf('  %s %d. %s %s <-- <fg=yellow;options=bold>[ RUNNING ]</>', $statusBadge, $order, $nodeLabel, $timePad);
                $lines[] = $line;

                if (! $isLast) {
                    $lines[] = sprintf('   │%s<fg=gray>Queue: %s</>', str_repeat(' ', 44), $queueName);
                    $lines[] = sprintf('   ▼%s<fg=gray>Attempts: %d/%d</>', str_repeat(' ', 44), max(1, $attempts), $maxAttempts);
                } else {
                    $lines[] = sprintf('    %s<fg=gray>Queue: %s</>', str_repeat(' ', 44), $queueName);
                    $lines[] = sprintf('    %s<fg=gray>Attempts: %d/%d</>', str_repeat(' ', 44), max(1, $attempts), $maxAttempts);
                }
            } elseif ($status === NodeStatus::COMPLETED) {
                $detail = $nodeExec->status_detail ?? 'Payload Validated';
                $line = sprintf('  %s %d. %s %s [%s]', $statusBadge, $order, $nodeLabel, $timePad, $detail);
                $lines[] = $line;

                if (! $isLast) {
                    $lines[] = '   │';
                    $lines[] = '   ▼';
                }
            } elseif ($status === NodeStatus::FAILED) {
                $errorMsg = $nodeExec->error_message ?? 'Execution Failed';
                $line = sprintf('  %s %d. %s %s <fg=red>[FAILED: %s]</>', $statusBadge, $order, $nodeLabel, $timePad, $errorMsg);
                $lines[] = $line;

                if (! $isLast) {
                    $lines[] = '   │';
                    $lines[] = '   ▼';
                }
            } elseif ($status === NodeStatus::RATE_LIMITED) {
                $line = sprintf('  %s %d. %s %s <fg=magenta>[RATE LIMITED - RETRYING]</>', $statusBadge, $order, $nodeLabel, $timePad);
                $lines[] = $line;

                if (! $isLast) {
                    $lines[] = '   │';
                    $lines[] = '   ▼';
                }
            } else {
                // Pending
                $line = sprintf('  %s %d. %s %s', $statusBadge, $order, $nodeLabel, $timePad);
                $lines[] = $line;

                if (! $isLast) {
                    $lines[] = '   │';
                    $lines[] = '   ▼';
                }
            }
        }

        // 4. Live Event Log Section
        $lines[] = '';
        $lines[] = str_repeat('=', 70);
        $lines[] = '<options=bold>[ LIVE EVENT LOG ]</>';

        $logs = array_slice($context->liveLogs, -6);
        foreach ($logs as $log) {
            $timestamp = $log['timestamp'] ?? date('H:i:s');
            $level = strtoupper((string) ($log['level'] ?? 'INFO'));
            $msg = $log['message'] ?? '';

            $levelPadded = str_pad("[{$level}]", 9, ' ');
            $coloredLevel = match ($level) {
                'INFO' => "<fg=cyan>{$levelPadded}</>",
                'SUCCESS' => "<fg=green>{$levelPadded}</>",
                'QUEUE' => "<fg=yellow>{$levelPadded}</>",
                'WARNING' => "<fg=magenta>{$levelPadded}</>",
                'ERROR' => "<fg=red;options=bold>{$levelPadded}</>",
                'RETRY' => "<fg=blue>{$levelPadded}</>",
                default => "<fg=white>{$levelPadded}</>",
            };

            $lines[] = sprintf('<fg=gray>[%s]</> %s %s', $timestamp, $coloredLevel, $msg);
        }

        // 5. Footer
        $lines[] = '';
        $lines[] = str_repeat('=', 70);
        $lines[] = '<fg=gray>Press Ctrl+C to detach UI (Workflow will continue in background)</>';

        $outputContent = implode(PHP_EOL, $lines);

        if ($this->output) {
            $this->output->writeln($outputContent);
        }
    }
}
