<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Provider Gateways & Circuit Breaker State
        Schema::create('notification_providers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique(); // SLACK, DISCORD, TWILIO_SMS, AWS_SES
            $table->string('name', 64);
            $table->string('circuit_state', 16)->default('CLOSED'); // CLOSED, OPEN, HALF_OPEN
            $table->unsignedInteger('consecutive_failures')->default(0);
            $table->unsignedInteger('rate_limit_per_minute')->default(120);
            $table->dateTime('circuit_opened_at')->nullable();
            $table->dateTime('last_canary_probed_at')->nullable();
            $table->timestamps();
        });

        // Recipient Profiles & Routing Preferences
        Schema::create('notification_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone', 32)->nullable();
            $table->string('slack_webhook_url')->nullable();
            $table->string('discord_webhook_url')->nullable();
            $table->string('timezone', 64)->default('UTC');
            $table->unsignedTinyInteger('quiet_hours_start')->default(22); // 22:00
            $table->unsignedTinyInteger('quiet_hours_end')->default(8);    // 08:00
            $table->json('channel_routing_priority'); // Priority array of preferred channels
            $table->timestamps();
        });

        // Event Ingestion Ledger
        Schema::create('dispatch_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('event_uuid')->unique();
            $table->string('event_type', 64); // AUTH_BREACH, CLUSTER_DOWN, INVOICE_OVERDUE
            $table->string('priority', 8)->default('P2'); // P0, P1, P2, P3
            $table->string('reference_id', 64);
            $table->string('title');
            $table->text('message');
            $table->json('context_payload')->nullable();
            $table->timestamps();

            $table->index(['priority', 'created_at']);
        });

        // Immutable Transactional Outbox & Delivery Ledger
        Schema::create('dispatch_outbox', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispatch_event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscriber_id')->constrained('notification_subscribers')->cascadeOnDelete();
            $table->string('provider_code', 32);
            $table->string('idempotency_hash', 64)->unique();
            $table->string('status', 32)->default('QUEUED'); // QUEUED, DELIVERED, FALLBACK, SUPPRESSED_DND, CIRCUIT_BYPASS, FAILED
            $table->unsignedInteger('latency_ms')->default(0);
            $table->text('error_details')->nullable();
            $table->dateTime('dispatched_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'provider_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispatch_outbox');
        Schema::dropIfExists('dispatch_events');
        Schema::dropIfExists('notification_subscribers');
        Schema::dropIfExists('notification_providers');
    }
};
