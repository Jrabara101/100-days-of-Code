<?php

declare(strict_types=1);

namespace App\Services\NotificationCenter\Providers;

use App\Models\NotificationSubscriber;
use App\Services\NotificationCenter\Contracts\ChannelProviderInterface;
use App\Services\NotificationCenter\Dto\IngestedEventDto;
use App\Services\NotificationCenter\Dto\ProviderDeliveryResponse;

class DiscordGateway implements ChannelProviderInterface
{
    public function code(): string { return 'DISCORD'; }

    public function deliver(NotificationSubscriber $subscriber, IngestedEventDto $event): ProviderDeliveryResponse
    {
        $start = microtime(true);
        if (empty($subscriber->discord_webhook_url)) {
            return new ProviderDeliveryResponse(false, 0, null, 'No Discord Webhook configured.');
        }

        usleep(rand(20000, 35000));
        $latency = (int) round((microtime(true) - $start) * 1000);

        return new ProviderDeliveryResponse(true, $latency, 'dsc_' . bin2hex(random_bytes(4)));
    }
}
