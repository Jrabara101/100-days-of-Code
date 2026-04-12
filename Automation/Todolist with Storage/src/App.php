<?php

namespace TodoApp;

class App {
    private Storage $storage;
    /** @var Todo[] */
    private array $todos;

    public function __construct() {
        $this->storage = new Storage();
        $this->todos = $this->storage->load();
    }

    public function run(array $argv): void {
        $command = $argv[1] ?? 'help';
        $args = array_slice($argv, 2);

        switch ($command) {
            case 'add':
                $this->add($args);
                break;
            case 'list':
                $this->list();
                break;
            case 'done':
                $this->done($args);
                break;
            case 'delete':
                $this->delete($args);
                break;
            case 'edit':
                $this->edit($args);
                break;
            case 'pending':
                $this->list(Todo::STATUS_PENDING);
                break;
            case 'completed':
                $this->list(Todo::STATUS_COMPLETED);
                break;
            case 'clear':
                $this->clear();
                break;
            case 'help':
            default:
                $this->help();
                break;
        }
    }

    private function add(array $args): void {
        if (empty($args)) {
            Utils::error("Usage: add <title> [description]");
            return;
        }

        $title = $args[0];
        $description = $args[1] ?? '';
        $id = empty($this->todos) ? 1 : max(array_column($this->todos, 'id')) + 1;

        $todo = new Todo($id, $title, $description);
        $this->todos[] = $todo;
        $this->storage->save($this->todos);

        Utils::success("Task added successfully with ID #$id");
    }

    private function list(?string $statusFilter = null): void {
        $filtered = array_filter($this->todos, function (Todo $todo) use ($statusFilter) {
            return $statusFilter === null || $todo->status === $statusFilter;
        });

        Utils::header($statusFilter ? "$statusFilter Tasks" : "All Tasks");

        $rows = array_map(function (Todo $todo) {
            return [
                $todo->id,
                $todo->title,
                $todo->status,
                $todo->created_at
            ];
        }, $filtered);

        Utils::formatTable(['ID', 'Title', 'Status', 'Created At'], $rows);
    }

    private function done(array $args): void {
        if (empty($args)) {
            Utils::error("Usage: done <id>");
            return;
        }

        $id = (int)$args[0];
        foreach ($this->todos as $todo) {
            if ($todo->id === $id) {
                $todo->markAsDone();
                $this->storage->save($this->todos);
                Utils::success("Task #$id marked as completed.");
                return;
            }
        }

        Utils::error("Task #$id not found.");
    }

    private function delete(array $args): void {
        if (empty($args)) {
            Utils::error("Usage: delete <id>");
            return;
        }

        $id = (int)$args[0];
        $initialCount = count($this->todos);
        $this->todos = array_filter($this->todos, fn($t) => $t->id !== $id);

        if (count($this->todos) < $initialCount) {
            $this->storage->save($this->todos);
            Utils::success("Task #$id deleted.");
        } else {
            Utils::error("Task #$id not found.");
        }
    }

    private function edit(array $args): void {
        if (count($args) < 2) {
            Utils::error("Usage: edit <id> <new_title> [new_description]");
            return;
        }

        $id = (int)$args[0];
        $title = $args[1];
        $description = $args[2] ?? '';

        foreach ($this->todos as $todo) {
            if ($todo->id === $id) {
                $todo->update($title, $description);
                $this->storage->save($this->todos);
                Utils::success("Task #$id updated.");
                return;
            }
        }

        Utils::error("Task #$id not found.");
    }

    private function clear(): void {
        echo "Are you sure you want to clear all tasks? (y/n): ";
        $input = strtolower(trim(fgets(STDIN)));
        
        if ($input === 'y') {
            $this->todos = [];
            $this->storage->save($this->todos);
            Utils::success("All tasks cleared.");
        } else {
            Utils::print("Operation cancelled.");
        }
    }

    private function help(): void {
        Utils::header("Todo CLI Help");
        echo "Usage: php todo.php <command> [arguments]" . PHP_EOL . PHP_EOL;
        
        $commands = [
            ['add <title> [desc]', 'Add a new task'],
            ['list', 'Show all tasks'],
            ['done <id>', 'Mark a task as completed'],
            ['delete <id>', 'Remove a task'],
            ['edit <id> <t> [d]', 'Update a task'],
            ['pending', 'Show only pending tasks'],
            ['completed', 'Show only completed tasks'],
            ['clear', 'Delete all tasks'],
            ['help', 'Show this help menu'],
        ];

        Utils::formatTable(['Command', 'Description'], $commands);
    }
}
