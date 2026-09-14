<?php

declare(strict_types=1);

namespace App\Nodes\Core;

use App\DTOs\WorkflowContext;
use App\Enums\LogLevel;
use App\Models\Configurations\ExtractDataNodeConfig;
use App\Nodes\Contracts\NodeInterface;
use Closure;

class ExtractCustomerDataNode implements NodeInterface
{
    public function __construct(
        protected ?ExtractDataNodeConfig $config = null,
    ) {
    }

    public function key(): string
    {
        return 'ExtractCustomerDataNode';
    }

    public function label(): string
    {
        return 'ExtractCustomerDataNode';
    }

    public function handle(WorkflowContext $context, Closure $next): WorkflowContext
    {
        $payload = $context->payload;

        usleep(140000); // 140ms simulation

        $customerId = $payload->get('customer.id') ?? $payload->get('data.object.customer') ?? 'CUST_883';
        $customerEmail = $payload->get('customer.email') ?? $payload->get('data.object.customer_email') ?? 'sarah.connor@cyberdyne.io';
        $amount = $payload->get('invoice.amount') ?? $payload->get('data.object.amount_due') ?? 145000;
        $currency = $payload->get('invoice.currency') ?? $payload->get('data.object.currency') ?? 'usd';
        $invoiceId = $payload->get('invoice.id') ?? $payload->get('data.object.id') ?? 'in_1NtV4B2eZvKYlo2C883';

        $extractedData = [
            'id' => $customerId,
            'name' => 'Sarah Connor',
            'email' => $customerEmail,
            'organization' => 'Cyberdyne Systems',
            'tier' => 'Enterprise SLA',
        ];

        $invoiceDetails = [
            'id' => $invoiceId,
            'amount_cents' => $amount,
            'amount_formatted' => sprintf('$%.2f', $amount / 100),
            'currency' => strtoupper((string) $currency),
            'items_count' => 3,
            'billing_period' => 'September 2026',
        ];

        $mutatedPayload = $payload
            ->with('extracted.customer', $extractedData)
            ->with('extracted.invoice', $invoiceDetails);

        $updatedContext = $context
            ->withPayload($mutatedPayload)
            ->withStepOutput($this->key(), [
                'status_detail' => "Extracted: {$customerId}",
                'customer_id' => $customerId,
            ])
            ->addLog(
                level: LogLevel::SUCCESS,
                message: "Context mutated by ExtractCustomerDataNode. Extracted {$customerId}.",
                nodeKey: $this->key(),
            );

        return $next($updatedContext);
    }
}
