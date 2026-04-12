<?php

namespace TodoApp;

class Todo {
    public const STATUS_PENDING = 'pending';
    public const STATUS_COMPLETED = 'completed';

    public function __construct(
        public int $id,
        public string $title,
        public string $description = '',
        public string $status = self::STATUS_PENDING,
        public ?string $created_at = null,
        public ?string $updated_at = null
    ) {
        $now = date('Y-m-d H:i:s');
        $this->created_at = $created_at ?? $now;
        $this->updated_at = $updated_at ?? $now;
    }

    /**
     * Create a Todo object from an associative array.
     */
    public static function fromArray(array $data): self {
        return new self(
            id: (int)$data['id'],
            title: $data['title'],
            description: $data['description'] ?? '',
            status: $data['status'] ?? self::STATUS_PENDING,
            created_at: $data['created_at'] ?? null,
            updated_at: $data['updated_at'] ?? null
        );
    }

    /**
     * Convert the Todo object to an associative array for storage.
     */
    public function toArray(): array {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Mark the task as completed.
     */
    public function markAsDone(): void {
        $this->status = self::STATUS_COMPLETED;
        $this->updated_at = date('Y-m-d H:i:s');
    }

    /**
     * Update task details.
     */
    public function update(string $title, string $description): void {
        $this->title = $title;
        $this->description = $description;
        $this->updated_at = date('Y-m-d H:i:s');
    }
}
