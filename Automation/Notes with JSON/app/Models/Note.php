<?php

namespace App\Models;

/**
 * Note Data Value Object
 */
class Note
{
    public int $id;
    public string $title;
    public string $content;
    public array $tags;
    public string $category;
    public string $created_at;
    public string $updated_at;
    public string $status; // active, archived, trashed
    public bool $pinned;
    public bool $favorite;

    public function __construct(array $data = [])
    {
        $this->id = $data['id'] ?? 0;
        $this->title = $data['title'] ?? '';
        $this->content = $data['content'] ?? '';
        $this->tags = $data['tags'] ?? [];
        $this->category = $data['category'] ?? 'General';
        $this->created_at = $data['created_at'] ?? date('Y-m-d H:i:s');
        $this->updated_at = $data['updated_at'] ?? date('Y-m-d H:i:s');
        $this->status = $data['status'] ?? 'active';
        $this->pinned = $data['pinned'] ?? false;
        $this->favorite = $data['favorite'] ?? false;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'tags' => $this->tags,
            'category' => $this->category,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'status' => $this->status,
            'pinned' => $this->pinned,
            'favorite' => $this->favorite,
        ];
    }
}
