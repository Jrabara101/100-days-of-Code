<?php

declare(strict_types=1);

namespace App\Nodes\Core;

use App\DTOs\WorkflowContext;
use App\Enums\LogLevel;
use App\Exceptions\RateLimitException;
use App\Exceptions\WorkflowExecutionException;
use App\Models\Configurations\AsyncPdfNodeConfig;
use App\Nodes\Contracts\AsyncNodeInterface;
use Closure;

class GeneratePdfInvoiceNode implements AsyncNodeInterface
{
    public function __construct(
        protected ?AsyncPdfNodeConfig $config = null,
    ) {
    }

    public function key(): string
    {
        return 'GeneratePdfInvoiceNode';
    }

    public function label(): string
    {
        return 'GeneratePdfInvoiceNode';
    }

    public function queueName(): string
    {
        return $this->config?->queue_name ?? 'high-priority';
    }

    public function maxAttempts(): int
    {
        return 3;
    }

    public function handle(WorkflowContext $context, Closure $next): WorkflowContext
    {
        // Check for simulated failure injection (for idempotency / resumption testing)
        $failTarget = $context->payload->get('__simulation.fail_at');
        $rateLimitTarget = $context->payload->get('__simulation.rate_limit_at');

        if ($failTarget === $this->key()) {
            throw new WorkflowExecutionException(
                message: 'Simulated downstream rendering failure in PDF engine.',
                nodeKey: $this->key(),
            );
        }

        if ($rateLimitTarget === $this->key() && ! $context->payload->get('__simulation.rate_limit_recovered')) {
            throw new RateLimitException(
                message: 'PDF Rendering API rate limited (HTTP 429). Exponential backoff triggered.',
                retryAfterSeconds: 1,
            );
        }

        // Execute asynchronous workload
        $updatedContext = $this->executeAsync($context);

        return $next($updatedContext);
    }

    public function executeAsync(WorkflowContext $context): WorkflowContext
    {
        // Simulate heavy async rendering workload (250ms)
        usleep(250000);

        $payload = $context->payload;
        $invoiceId = $payload->get('extracted.invoice.id') ?? 'INV-2026-992';
        $checksum = hash('sha256', $invoiceId . microtime(true));

        $pdfArtifact = [
            'filename' => "invoice_{$invoiceId}.pdf",
            'file_size_bytes' => 14240,
            'checksum_sha256' => $checksum,
            'download_url' => "https://storage.automata.enterprise/invoices/{$invoiceId}.pdf",
            'rendered_at' => now()->toIso8601String(),
            'engine' => 'Chromium-PDF-Core v11.4',
        ];

        $mutatedPayload = $payload
            ->with('artifacts.pdf_invoice', $pdfArtifact);

        return $context
            ->withPayload($mutatedPayload)
            ->withStepOutput($this->key(), [
                'status_detail' => "PDF Rendered: {$pdfArtifact['filename']}",
                'artifact' => $pdfArtifact,
            ])
            ->addLog(
                level: LogLevel::SUCCESS,
                message: "PDF invoice compiled asynchronously: {$pdfArtifact['filename']} [SHA: " . substr($checksum, 0, 8) . "...]",
                nodeKey: $this->key(),
            );
    }
}
