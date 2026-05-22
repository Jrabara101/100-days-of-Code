<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskManagerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_empty_tasks_and_exit(): void
    {
        $this->artisan('app:tasks')
            ->expectsQuestion('What would you like to do?', 'exit')
            ->assertExitCode(0);
    }

    public function test_can_add_task_and_exit(): void
    {
        $this->artisan('app:tasks')
            ->expectsQuestion('What would you like to do?', 'add')
            ->expectsQuestion('What do you need to do?', 'Buy groceries')
            ->expectsQuestion('What would you like to do?', 'exit')
            ->assertExitCode(0);

        $this->assertDatabaseHas('tasks', [
            'title' => 'Buy groceries',
            'is_completed' => false,
        ]);
    }

    public function test_can_complete_task_and_exit(): void
    {
        $task = Task::create(['title' => 'Review PRs', 'is_completed' => false]);

        $this->artisan('app:tasks')
            ->expectsQuestion('What would you like to do?', 'complete')
            ->expectsQuestion('Which task did you complete?', $task->id)
            ->expectsQuestion('What would you like to do?', 'exit')
            ->assertExitCode(0);

        $this->assertTrue($task->fresh()->is_completed);
    }

    public function test_can_delete_task_and_exit(): void
    {
        $task = Task::create(['title' => 'Delete this', 'is_completed' => false]);

        $this->artisan('app:tasks')
            ->expectsQuestion('What would you like to do?', 'delete')
            ->expectsQuestion('Select a task to permanently delete:', $task->id)
            ->expectsQuestion('Are you sure you want to delete this task? This cannot be undone.', true)
            ->expectsQuestion('What would you like to do?', 'exit')
            ->assertExitCode(0);

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }
}
