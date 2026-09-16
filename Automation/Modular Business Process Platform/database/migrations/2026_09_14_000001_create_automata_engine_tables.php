<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Workflow Definitions
        Schema::create('workflow_definitions', function (Blueprint $table): void {
            $table->string('id')->primary(); // e.g. WF-992-ALPHA
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('trigger_type'); // e.g. Inbound Webhook (Stripe Invoice)
            $table->string('version')->default('1.0.0');
            $table->json('dag_topology')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Polymorphic Node Configurations
        Schema::create('webhook_node_configs', function (Blueprint $table): void {
            $table->id();
            $table->string('webhook_secret');
            $table->string('signature_header')->default('Stripe-Signature');
            $table->string('expected_event')->default('invoice.payment_succeeded');
            $table->json('ip_allowlist')->nullable();
            $table->timestamps();
        });

        Schema::create('extract_data_node_configs', function (Blueprint $table): void {
            $table->id();
            $table->json('mapping_rules');
            $table->boolean('strict_validation')->default(true);
            $table->timestamps();
        });

        Schema::create('async_pdf_node_configs', function (Blueprint $table): void {
            $table->id();
            $table->string('template_name')->default('enterprise_invoice_v2');
            $table->string('page_orientation')->default('portrait');
            $table->boolean('high_compression')->default(true);
            $table->string('queue_name')->default('high-priority');
            $table->timestamps();
        });

        Schema::create('email_node_configs', function (Blueprint $table): void {
            $table->id();
            $table->string('sender_email')->default('billing@automata.enterprise');
            $table->string('recipient_field')->default('customer.email');
            $table->string('subject_template')->default('Your Invoice #{{invoice_id}} is ready');
            $table->boolean('attach_pdf')->default(true);
            $table->timestamps();
        });

        Schema::create('slack_node_configs', function (Blueprint $table): void {
            $table->id();
            $table->string('webhook_url')->default('https://hooks.slack.com/services/T00/B00/XXXX');
            $table->string('channel')->default('#ops-alerts');
            $table->string('bot_name')->default('AutomataOpsBot');
            $table->string('mention_roles')->nullable()->default('@finance-team');
            $table->timestamps();
        });

        // 3. Workflow Nodes (Unified Registry with Polymorphic Config)
        Schema::create('workflow_nodes', function (Blueprint $table): void {
            $table->id();
            $table->string('workflow_definition_id');
            $table->string('node_key'); // e.g. webhook_receiver
            $table->string('node_class'); // FQCN
            $table->integer('order_index');
            $table->boolean('is_async')->default(false);
            $table->string('queue_name')->nullable();
            $table->integer('max_attempts')->default(3);
            $table->integer('timeout_seconds')->default(60);

            // Polymorphic configuration relationship
            $table->string('configurable_type');
            $table->unsignedBigInteger('configurable_id');
            $table->index(['configurable_type', 'configurable_id'], 'node_config_index');

            $table->timestamps();

            $table->foreign('workflow_definition_id')
                ->references('id')
                ->on('workflow_definitions')
                ->cascadeOnDelete();
        });

        // 4. Workflow Execution Runs
        Schema::create('workflow_runs', function (Blueprint $table): void {
            $table->string('id')->primary(); // e.g. WF-992-ALPHA
            $table->string('workflow_definition_id');
            $table->string('status')->default('initialized');
            $table->string('trigger_source');
            $table->longText('initial_payload')->nullable();
            $table->longText('current_payload')->nullable();
            $table->string('current_node_key')->nullable();
            $table->float('total_execution_time_ms')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_summary')->nullable();
            $table->timestamps();

            $table->foreign('workflow_definition_id')
                ->references('id')
                ->on('workflow_definitions')
                ->cascadeOnDelete();
        });

        // 5. Workflow Node Executions (Idempotency & State Resumption Tracking)
        Schema::create('workflow_node_executions', function (Blueprint $table): void {
            $table->id();
            $table->string('workflow_run_id');
            $table->string('node_key');
            $table->string('node_class');
            $table->integer('order_index');
            $table->string('status')->default('pending');
            $table->integer('attempts')->default(0);
            $table->integer('max_attempts')->default(3);
            $table->boolean('is_async')->default(false);
            $table->string('queue_name')->nullable();
            $table->float('execution_time_ms')->default(0);
            $table->string('status_detail')->nullable();
            $table->longText('input_payload_snapshot')->nullable();
            $table->longText('output_payload_snapshot')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('workflow_run_id')
                ->references('id')
                ->on('workflow_runs')
                ->cascadeOnDelete();

            $table->unique(['workflow_run_id', 'node_key']);
        });

        // 6. Workflow Events (Immutable Event-Sourced Audit Trail)
        Schema::create('workflow_events', function (Blueprint $table): void {
            $table->id();
            $table->string('workflow_run_id');
            $table->string('node_key')->nullable();
            $table->string('event_type'); // e.g. RUN_INITIALIZED, PAYLOAD_MUTATED, NODE_COMPLETED
            $table->string('log_level')->default('INFO'); // INFO, SUCCESS, QUEUE, WARNING, ERROR, RETRY
            $table->string('message');
            $table->text('delta_summary')->nullable();
            $table->longText('payload_before')->nullable();
            $table->longText('payload_after')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['workflow_run_id', 'created_at']);
        });

        // 7. Laravel Queues table (for async jobs)
        Schema::create('jobs', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('failed_jobs', function (Blueprint $table): void {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('workflow_events');
        Schema::dropIfExists('workflow_node_executions');
        Schema::dropIfExists('workflow_runs');
        Schema::dropIfExists('workflow_nodes');
        Schema::dropIfExists('slack_node_configs');
        Schema::dropIfExists('email_node_configs');
        Schema::dropIfExists('async_pdf_node_configs');
        Schema::dropIfExists('extract_data_node_configs');
        Schema::dropIfExists('webhook_node_configs');
        Schema::dropIfExists('workflow_definitions');
    }
};
