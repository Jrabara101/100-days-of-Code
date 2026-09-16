<?php

declare(strict_types=1);

namespace App\Services\NotificationCenter\Providers;

use App\Models\NotificationSubscriber;
use App\Services\NotificationCenter\Contracts\ChannelProviderInterface;
use App\Services\NotificationCenter\Dto\IngestedEventDto;
use App\Services\NotificationCenter\Dto\ProviderDeliveryResponse;

class SlackGateway implements ChannelProviderInterface
{
    public function code(): string { return 'SLACK'; }

    public function deliver(NotificationSubscriber $subscriber, IngestedEventDto $event): ProviderDeliveryResponse
    {
        $start = microtime(true);
        if (empty($subscriber->slack_webhook_url)) {
            return new ProviderDeliveryResponse(false, 0, null, 'No Slack Webhook configured.');
        }

        // Network simulation & outage injection test
        usleep(rand(25000, 45000));
        $latency = (int) round((microtime(true) - $start) * 1000);

        if (str_contains($subscriber->slack_webhook_url, 'simulate-outage')) {
            return new ProviderDeliveryResponse(false, $latency, null, 'HTTP 503 Service Unavailable: Slack Ingress Tarpit', true);
        }

        return new ProviderDeliveryResponse(true, $latency, 'slk_' . bin2hex(random_bytes(4)));
    }
}
