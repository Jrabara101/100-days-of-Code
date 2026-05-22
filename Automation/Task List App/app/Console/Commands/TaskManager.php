<?php

namespace App\Console\Commands;

use App\Models\Task;
use Illuminate\Console\Command;
use function Laravel\Prompts\text;
use function Laravel\Prompts\select;
use function Laravel\Prompts\confirm;
use function Laravel\Prompts\spin;
use function Laravel\Prompts\intro;
use function Laravel\Prompts\outro;
use function Laravel\Prompts\info;
use function Laravel\Prompts\error;

class TaskManager extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:tasks';

    /**
     * The console command description.
     */
    protected $description = 'Interactive CLI Task Management System';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        intro('🚀 Laravel Interactive Task Manager');

        // The Application Loop
        while (true) {
            $action = select(
                label: 'What would you like to do?',
                options: [
                    'list'     => '📋 View All Tasks',
                    'add'      => '✨ Add New Task',
                    'complete' => '✅ Complete a Task',
                    'delete'   => '🗑️  Delete a Task',
                    'exit'     => '🚪 Exit Application',
                ],
                default: 'list'
            );

            switch ($action) {
                case 'list':
                    $this->listTasks();
                    break;
                case 'add':
                    $this->addTask();
                    break;
                case 'complete':
                    $this->completeTask();
                    break;
                case 'delete':
                    $this->deleteTask();
                    break;
                case 'exit':
                    outro('Goodbye! Have a productive day. ☕');
                    return self::SUCCESS;
            }
        }
    }

    /**
     * Fetch and display all tasks in an ASCII table.
     */
    private function listTasks(): void
    {
        $tasks = Task::orderBy('is_completed')
            ->orderBy('created_at', 'desc')
            ->get();

        if ($tasks->isEmpty()) {
            info('Your task list is currently empty. Great job!');
            return;
        }

        $formattedTasks = $tasks->map(function ($task) {
            return [
                'ID' => $task->id,
                'Status' => $task->is_completed ? '<info>✔ Done</info>' : '<comment>⏱ Pending</comment>',
                'Task' => $task->title,
                'Created' => $task->created_at->diffForHumans(),
            ];
        });

        $this->table(
            ['ID', 'Status', 'Task', 'Created At'],
            $formattedTasks
        );
    }

    /**
     * Prompt for text and create a new task.
     */
    private function addTask(): void
    {
        $title = text(
            label: 'What do you need to do?',
            placeholder: 'e.g., Review pull requests',
            required: 'A task title is required.',
            validate: fn (string $value) => match (true) {
                strlen($value) < 3 => 'The task must be at least 3 characters.',
                strlen($value) > 255 => 'The task is too long.',
                default => null
            }
        );

        // Use spin() for visual feedback during database writes
        spin(
            fn () => Task::create(['title' => $title]),
            'Saving your task...'
        );

        info("Task '{$title}' added successfully!");
    }

    /**
     * Show an interactive select menu of pending tasks to mark as complete.
     */
    private function completeTask(): void
    {
        $pendingTasks = Task::where('is_completed', false)->pluck('title', 'id')->toArray();

        if (empty($pendingTasks)) {
            info('You have no pending tasks to complete!');
            return;
        }

        $taskId = select(
            label: 'Which task did you complete?',
            options: $pendingTasks,
            scroll: 10 // Allows scrolling if there are many tasks
        );

        spin(
            fn () => Task::where('id', $taskId)->update(['is_completed' => true]),
            'Marking as complete...'
        );

        $taskTitle = $pendingTasks[$taskId];
        info("Awesome! Task '{$taskTitle}' marked as complete.");
    }

    /**
     * Show an interactive select menu of all tasks to delete, with a confirmation.
     */
    private function deleteTask(): void
    {
        // Format options with a status icon for the select menu
        $tasks = Task::orderBy('created_at', 'desc')->get()->mapWithKeys(function ($task) {
            $icon = $task->is_completed ? '✅' : '⏱ ';
            return [$task->id => "{$icon} {$task->title}"];
        })->toArray();

        if (empty($tasks)) {
            info('There are no tasks to delete.');
            return;
        }

        $taskId = select(
            label: 'Select a task to permanently delete:',
            options: $tasks,
            scroll: 10
        );

        // Safeguard: Ask for confirmation before destroying data
        $confirmed = confirm(
            label: 'Are you sure you want to delete this task? This cannot be undone.',
            default: false
        );

        if ($confirmed) {
            spin(
                fn () => Task::destroy($taskId),
                'Deleting task...'
            );
            info('Task deleted successfully.');
        } else {
            error('Deletion cancelled.');
        }
    }
}
