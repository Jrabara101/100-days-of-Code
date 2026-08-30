<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('email_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('subject');
            $table->text('body_template');
            $table->string('status')->default('draft'); // draft, queued, processing, completed, failed, cancelled
            $table->string('batch_id')->nullable();
            $table->unsignedInteger('total_recipients')->default(0);
            $table->unsignedInteger('suppressed_count')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->dateTime('scheduled_at')->nullable();
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'scheduled_at']);
        });

        Schema::create('subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->boolean('is_subscribed')->default(true);
            $table->unsignedTinyInteger('bounce_count')->default(0);
            $table->dateTime('last_bounced_at')->nullable();
            $table->timestamps();

            $table->index(['is_subscribed', 'bounce_count']);
        });

        Schema::create('campaign_dispatches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('email_campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscriber_id')->constrained()->cascadeOnDelete();
            $table->string('idempotency_hash')->unique();
            $table->string('status')->default('queued'); // queued, sent, failed, suppressed
            $table->string('recipient_email');
            $table->text('error_message')->nullable();
            $table->dateTime('dispatched_at')->nullable();
            $table->timestamps();

            $table->index(['email_campaign_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_dispatches');
        Schema::dropIfExists('subscribers');
        Schema::dropIfExists('email_campaigns');
    }
};
