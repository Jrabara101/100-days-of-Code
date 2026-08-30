<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\EmailCampaign;
use App\Models\Subscriber;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

class CampaignDemoSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Target Broadcast Campaign
        EmailCampaign::create([
            'name' => 'Q3 Product Feature Announcement',
            'subject' => 'Introducing Distributed Edge Cloud 2.0 ⚡',
            'body_template' => '<h1>Hello {{first_name}}</h1><p>Check out our brand new feature releases for Q3!</p>',
            'status' => 'draft',
            'scheduled_at' => CarbonImmutable::now(),
        ]);

        // 2. Create Deliverable Prime Subscribers (35 subscribers)
        for ($i = 1; $i <= 35; $i++) {
            Subscriber::create([
                'email' => "developer_{$i}@enterprise.io",
                'first_name' => "Dev_{$i}",
                'last_name' => "User",
                'is_subscribed' => true,
                'bounce_count' => 0,
            ]);
        }

        // 3. Create Hard-Bounced & Unsubscribed Records (Suppression Verification)
        for ($i = 1; $i <= 8; $i++) {
            Subscriber::create([
                'email' => "bounced_user_{$i}@dead-mailbox.com",
                'first_name' => "Bounced_{$i}",
                'is_subscribed' => true,
                'bounce_count' => 2, // Hard bounce
                'last_bounced_at' => CarbonImmutable::now()->subDays(10),
            ]);
        }

        for ($i = 1; $i <= 7; $i++) {
            Subscriber::create([
                'email' => "optout_user_{$i}@privacy.org",
                'first_name' => "OptOut_{$i}",
                'is_subscribed' => false, // Active Unsubscribe
                'bounce_count' => 0,
            ]);
        }

        // 4. Create Simulated Failure Edge-Cases
        Subscriber::create([
            'email' => 'gateway.fail-test@telecom.org',
            'first_name' => 'Network',
            'last_name' => 'Timeout',
            'is_subscribed' => true,
            'bounce_count' => 0,
        ]);
    }
}
