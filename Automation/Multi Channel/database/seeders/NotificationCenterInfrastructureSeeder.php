<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\NotificationProvider;
use App\Models\NotificationSubscriber;
use Illuminate\Database\Seeder;

class NotificationCenterInfrastructureSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Gateways
        NotificationProvider::create([
            'code' => 'SLACK',
            'name' => 'Slack Corporate Webhook',
            'circuit_state' => 'CLOSED',
        ]);

        NotificationProvider::create([
            'code' => 'DISCORD',
            'name' => 'Discord SecOps Webhook',
            'circuit_state' => 'CLOSED',
        ]);

        NotificationProvider::create([
            'code' => 'TWILIO_SMS',
            'name' => 'Twilio Direct Carrier SMS',
            'circuit_state' => 'CLOSED',
        ]);

        NotificationProvider::create([
            'code' => 'AWS_SES',
            'name' => 'AWS Simple Email Service',
            'circuit_state' => 'CLOSED',
        ]);

        // 2. Seed Subscribers
        // Subscriber 1: Healthy Multi-Channel Lead
        NotificationSubscriber::create([
            'name' => 'Alice Vance (SecOps Principal)',
            'email' => 'alice@enterprise.cloud',
            'phone' => '+15550192834',
            'slack_webhook_url' => 'https://hooks.slack.com/services/prod/T01/B01',
            'discord_webhook_url' => 'https://discord.com/api/webhooks/prod/001',
            'timezone' => 'America/New_York',
            'quiet_hours_start' => 22,
            'quiet_hours_end' => 7,
            'channel_routing_priority' => ['SLACK', 'DISCORD', 'AWS_SES'],
        ]);

        // Subscriber 2: Injected Outage Test (Failing Slack Webhook triggers fallback to Discord)
        NotificationSubscriber::create([
            'name' => 'Marcus Brody (SRE On-Call)',
            'email' => 'marcus@enterprise.cloud',
            'phone' => '+15550198822',
            'slack_webhook_url' => 'https://hooks.slack.com/services/simulate-outage/503',
            'discord_webhook_url' => 'https://discord.com/api/webhooks/prod/002',
            'timezone' => 'America/Chicago',
            'quiet_hours_start' => 22,
            'quiet_hours_end' => 8,
            'channel_routing_priority' => ['SLACK', 'DISCORD', 'TWILIO_SMS'],
        ]);

        // Subscriber 3: Global Executive in Night DND Window
        NotificationSubscriber::create([
            'name' => 'Elena Fisher (VP Infrastructure)',
            'email' => 'elena@enterprise.cloud',
            'phone' => '+15550194411',
            'slack_webhook_url' => 'https://hooks.slack.com/services/prod/T01/B03',
            'timezone' => 'Asia/Tokyo', // Currently night time in local timezone
            'quiet_hours_start' => 21,
            'quiet_hours_end' => 9,
            'channel_routing_priority' => ['SLACK', 'AWS_SES'],
        ]);
    }
}
