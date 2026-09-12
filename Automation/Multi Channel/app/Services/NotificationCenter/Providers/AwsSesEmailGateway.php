<?php

declare(strict_types=1);

namespace App\Services\NotificationCenter\Providers;

use App\Models\NotificationSubscriber;
use App\Services\NotificationCenter\Contracts\ChannelProviderInterface;
use App\Services\NotificationCenter\Dto\IngestedEventDto;
use App\Services\NotificationCenter\Dto\ProviderDeliveryResponse;

class AwsSesEmailGateway implements ChannelProviderInterface
{
    public function code(): string { return 'AWS_SES'; }

    public function deliver(NotificationSubscriber $subscriber, IngestedEventDto $event): ProviderDeliveryResponse
    {
        $start = microtime(true);
        if (empty($subscriber->email)) {
            return new ProviderDeliveryResponse(false, 0, null, 'Missing verified email.');
        }

        usleep(rand(40000, 70000));
        $latency = (int) round((microtime(true) - $start) * 1000);

        return new ProviderDeliveryResponse(true, $latency, 'ses_msg_' . bin2hex(random_bytes(6)));
    }
}
