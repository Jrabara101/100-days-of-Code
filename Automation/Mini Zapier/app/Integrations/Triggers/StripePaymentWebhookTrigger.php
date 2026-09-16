<?php

declare(strict_types=1);

namespace App\Integrations\Triggers;

use App\Integrations\Attributes\AsTrigger;
use App\Integrations\Contracts\TriggerInterface;
use App\Integrations\Enums\TriggerType;

#[AsTrigger(
    id: 'stripe.payment_success',
    name: 'Webhook: Stripe.PaymentSuccess',
    type: 'Webhook',
    route: '/hooks/stripe',
    description: 'Fired when a charge or payment succeeds in Stripe.',
    outputSchema: [
        'event_id' => 'string',
        'customer' => 'array',
        'amount' => 'integer',
        'currency' => 'string',
    ]
)]
class StripePaymentWebhookTrigger implements TriggerInterface
{
    public function getId(): string
    {
        return 'stripe.payment_success';
    }

    public function getName(): string
    {
        return 'Webhook: Stripe.PaymentSuccess';
    }

    public function getType(): TriggerType
    {
        return TriggerType::WEBHOOK;
    }

    public function getRoute(): string
    {
        return '/hooks/stripe';
    }

    public function getOutputSchema(): array
    {
        return [
            'event_id' => 'string',
            'customer' => 'array',
            'amount' => 'integer',
            'currency' => 'string',
        ];
    }
}
