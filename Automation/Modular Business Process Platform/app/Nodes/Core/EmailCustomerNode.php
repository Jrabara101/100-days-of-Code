<?php

declare(strict_types=1);

namespace App\Nodes\Core;

use App\DTOs\WorkflowContext;
use App\Enums\LogLevel;
use App\Models\Configurations\EmailNodeConfig;
use App\Nodes\Contracts\NodeInterface;
use Closure;

class EmailCustomerNode implements NodeInterface
{
    public function __construct(
        protected ?EmailNodeConfig $config = null,
    ) {
    }

    public function key(): string
    {
        return 'EmailCustomerNode';
    }

    public function label(): string
    {
        return 'EmailCustomerNode';
    }

    public function handle(WorkflowContext $context, Closure $next): WorkflowContext
    {
        usleep(40000); // 40ms simulation

        $payload = $context->payload;
        $recipient = $payload->get('extracted.customer.email') ?? 'sarah.connor@cyberdyne.io';
        $invoiceId = $payload->get('extracted.invoice.id') ?? 'INV-2026-992';

        $emailRecord = [
            'to' => $recipient,
            'subject' => "Your Invoice #{$invoiceId} is ready",
            'template' => 'billing.invoice_receipt',
            'sent_at' => now()->toIso8601String(),
            'message_id' => 'msg_' . bin2hex(random_bytes(8)),
            'status' => 'DELIVERED',
        ];

        $mutatedPayload = $payload
            ->with('dispatches.email', $emailRecord);

        $updatedContext = $context
            ->withPayload($mutatedPayload)
            ->withStepOutput($this->key(), [
                'status_detail' => "Dispatched: {$recipient}",
                'dispatch' => $emailRecord,
            ])
            ->addLog(
                level: LogLevel::SUCCESS,
                message: "Customer invoice email dispatched to {$recipient}.",
                nodeKey: $this->key(),
            );

        return $next($updatedContext);
    }
}
