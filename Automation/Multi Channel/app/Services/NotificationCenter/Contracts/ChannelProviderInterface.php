<?php

declare(strict_types=1);

namespace App\Services\NotificationCenter\Contracts;

use App\Models\NotificationSubscriber;
use App\Services\NotificationCenter\Dto\IngestedEventDto;
use App\Services\NotificationCenter\Dto\ProviderDeliveryResponse;

interface ChannelProviderInterface
{
    public function code(): string;
    public function deliver(NotificationSubscriber $subscriber, IngestedEventDto $event): ProviderDeliveryResponse;
}
