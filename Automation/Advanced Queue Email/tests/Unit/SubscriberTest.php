<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Subscriber;
use Carbon\CarbonImmutable;
use Tests\TestCase;

class SubscriberTest extends TestCase
{
    public function test_deliverability_rules(): void
    {
        $activeClean = new Subscriber([
            'email' => 'clean@example.com',
            'is_subscribed' => true,
            'bounce_count' => 0,
        ]);
        $this->assertTrue($activeClean->isDeliverable());

        $unsubscribed = new Subscriber([
            'email' => 'optout@example.com',
            'is_subscribed' => false,
            'bounce_count' => 0,
        ]);
        $this->assertFalse($unsubscribed->isDeliverable());

        $bounced = new Subscriber([
            'email' => 'bounced@example.com',
            'is_subscribed' => true,
            'bounce_count' => 1,
            'last_bounced_at' => CarbonImmutable::now(),
        ]);
        $this->assertFalse($bounced->isDeliverable());

        $bouncedAndUnsubscribed = new Subscriber([
            'email' => 'both@example.com',
            'is_subscribed' => false,
            'bounce_count' => 3,
        ]);
        $this->assertFalse($bouncedAndUnsubscribed->isDeliverable());
    }
}
