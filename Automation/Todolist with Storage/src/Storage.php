<?php

namespace TodoApp;

class Storage {
    private string $filePath;

    public function __construct(string $filePath = 'data/todos.json') {
        $this->filePath = $filePath;
        $this->ensureDirectoryExists();
    }

    /**
     * Load todos from the JSON file.
     * @return Todo[]
     */
    public function load(): array {
        if (!file_exists($this->filePath)) {
            return [];
        }

        $content = file_get_contents($this->filePath);
        if (empty($content)) {
            return [];
        }

        try {
            $data = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($data)) {
                return [];
            }

            return array_map(fn($item) => Todo::fromArray($item), $data);
        } catch (\JsonException $e) {
            // If JSON is invalid, return empty list (defensive programming)
            return [];
        }
    }

    /**
     * Save todos to the JSON file.
     * @param Todo[] $todos
     */
    public function save(array $todos): void {
        $data = array_map(fn($todo) => $todo->toArray(), $todos);
        
        try {
            $json = json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
            file_put_contents($this->filePath, $json);
        } catch (\JsonException $e) {
            Utils::error("Failed to save data: " . $e->getMessage());
        }
    }

    /**
     * Helper to ensure the storage directory exists.
     */
    private function ensureDirectoryExists(): void {
        $dir = dirname($this->filePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
    }
}
