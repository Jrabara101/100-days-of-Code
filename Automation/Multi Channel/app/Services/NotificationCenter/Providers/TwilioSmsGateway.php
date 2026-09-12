<?php

declare(strict_types=1);

namespace App\Services\NotificationCenter\Providers;

use App\Models\NotificationSubscriber;
use App\Services\NotificationCenter\Contracts\ChannelProviderInterface;
use App\Services\NotificationCenter\Dto\IngestedEventDto;
use App\Services\NotificationCenter\Dto\ProviderDeliveryResponse;

class TwilioSmsGateway implements ChannelProviderInterface
{
    public function code(): string { return 'TWILIO_SMS'; }

    public function deliver(NotificationSubscriber $subscriber, IngestedEventDto $event): ProviderDeliveryResponse
    {
        $start = microtime(true);
        if (empty($subscriber->phone)) {
            return new ProviderDeliveryResponse(false, 0, null, 'Missing E.164 phone destination.');
        }

        usleep(rand(50000, 85000));
        $latency = (int) round((microtime(true) - $start) * 1000);

        return new ProviderDeliveryResponse(true, $latency, 'tw_sms_' . bin2hex(random_bytes(5)));
    }
}
