<?php

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
        // Tasks Table
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'in_progress', 'editing', 'done'])->default('draft');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->dateTime('due_date')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); 
            
            // Efficiency Metrics
            $table->integer('estimated_time_minutes')->default(0);
            $table->integer('actual_completion_minutes')->nullable();
            
            $table->timestamps();

            // Composite Index for Kanban Performance
            // "Create composite indexes on (status, user_id, due_date)"
            $table->index(['status', 'user_id', 'due_date']);
        });

        // Subtasks Table (One-to-Many)
        Schema::create('subtasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->string('title');
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });

        // Reminders Table
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->dateTime('reminder_time');
            $table->boolean('is_sent')->default(false);
            $table->timestamps();
        });

        // The Ledger Model (Task History)
        Schema::create('task_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->string('status_from')->nullable();
            $table->string('status_to');
            $table->timestamp('changed_at')->useCurrent();
            
            // To track efficiency: How long was it in the previous status?
            $table->integer('duration_in_previous_status_seconds')->nullable();
            
            $table->foreignId('changed_by_user_id')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_history');
        Schema::dropIfExists('reminders');
        Schema::dropIfExists('subtasks');
        Schema::dropIfExists('tasks');
    }
};
