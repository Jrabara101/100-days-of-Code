<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary(); // Allows custom workflow IDs like 8800, 8801, 8802
            $table->string('name');
            $table->string('trigger_type'); // Webhook, Schedule, Event
            $table->string('trigger_name');
            $table->string('trigger_route');
            $table->string('status')->default('ACTIVE');
            $table->string('summary_mapping')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_id');
            $table->unsignedInteger('order');
            $table->string('name');
            $table->string('action_key'); // e.g. 'hubspot.create_contact', 'slack.send_message'
            $table->json('template'); // Mustache mappings: {"email": "{{ trigger.user.email }}"}
            $table->timestamps();

            $table->foreign('workflow_id')->references('id')->on('workflows')->cascadeOnDelete();
            $table->unique(['workflow_id', 'order']);
        });

        Schema::create('workflow_executions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workflow_id');
            $table->string('status')->default('PENDING'); // RUNNING, SUCCESS, FAILED
            $table->json('trigger_payload')->nullable();
            $table->json('accumulated_context')->nullable();
            $table->json('topology_trace')->nullable(); // Detailed step timings and token resolutions
            $table->decimal('total_duration_seconds', 8, 4)->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('executed_at')->nullable();
            $table->timestamps();

            $table->foreign('workflow_id')->references('id')->on('workflows')->cascadeOnDelete();
            $table->index(['workflow_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_executions');
        Schema::dropIfExists('workflow_steps');
        Schema::dropIfExists('workflows');
    }
};
