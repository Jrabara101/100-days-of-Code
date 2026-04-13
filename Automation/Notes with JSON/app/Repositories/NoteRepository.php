<?php

namespace App\Repositories;

use App\Models\Note;
use Exception;

/**
 * Repository for managing Notes in JSON storage
 */
class NoteRepository
{
    private JsonStorage $storage;
    private array $data;

    public function __construct(JsonStorage $storage)
    {
        $this->storage = $storage;
        $this->data = $this->storage->read();
    }

    public function all(): array
    {
        return array_map(fn($item) => new Note($item), $this->data['notes']);
    }

    public function find(int $id): ?Note
    {
        foreach ($this->data['notes'] as $item) {
            if ($item['id'] === $id) {
                return new Note($item);
            }
        }
        return null;
    }

    public function save(Note $note): Note
    {
        if ($note->id === 0) {
            $this->data['last_id']++;
            $note->id = $this->data['last_id'];
            $this->data['notes'][] = $note->toArray();
        } else {
            foreach ($this->data['notes'] as $key => $item) {
                if ($item['id'] === $note->id) {
                    $note->updated_at = date('Y-m-d H:i:s');
                    $this->data['notes'][$key] = $note->toArray();
                    break;
                }
            }
        }

        $this->persist();
        return $note;
    }

    public function delete(int $id, bool $permanent = false): bool
    {
        if (!$permanent) {
            $note = $this->find($id);
            if ($note) {
                $note->status = 'trashed';
                $this->save($note);
                return true;
            }
            return false;
        }

        $found = false;
        foreach ($this->data['notes'] as $key => $item) {
            if ($item['id'] === $id) {
                unset($this->data['notes'][$key]);
                $this->data['notes'] = array_values($this->data['notes']);
                $found = true;
                break;
            }
        }

        if ($found) {
            $this->persist();
        }

        return $found;
    }

    public function search(string $keyword): array
    {
        $keyword = strtolower($keyword);
        $results = [];
        foreach ($this->all() as $note) {
            if (
                str_contains(strtolower($note->title), $keyword) ||
                str_contains(strtolower($note->content), $keyword) ||
                in_array($keyword, array_map('strtolower', $note->tags))
            ) {
                $results[] = $note;
            }
        }
        return $results;
    }

    public function filter(array $criteria): array
    {
        $results = $this->all();

        if (isset($criteria['status'])) {
            $results = array_filter($results, fn($n) => $n->status === $criteria['status']);
        }

        if (isset($criteria['tag'])) {
            $results = array_filter($results, fn($n) => in_array($criteria['tag'], $n->tags));
        }

        if (isset($criteria['pinned'])) {
            $results = array_filter($results, fn($n) => $n->pinned === (bool)$criteria['pinned']);
        }

        if (isset($criteria['favorite'])) {
            $results = array_filter($results, fn($n) => $n->favorite === (bool)$criteria['favorite']);
        }

        return array_values($results);
    }

    public function sort(array &$notes, string $by = 'latest'): void
    {
        usort($notes, function($a, $b) use ($by) {
            switch ($by) {
                case 'oldest':
                    return strcmp($a->created_at, $b->created_at);
                case 'title':
                    return strcasecmp($a->title, $b->title);
                case 'updated':
                    return strcmp($b->updated_at, $a->updated_at);
                case 'latest':
                default:
                    return strcmp($b->created_at, $a->created_at);
            }
        });
    }

    private function persist(): void
    {
        $this->storage->write($this->data);
    }

    public function getStats(): array
    {
        $stats = [
            'total' => count($this->data['notes']),
            'active' => 0,
            'archived' => 0,
            'trashed' => 0,
            'favorites' => 0,
            'pinned' => 0
        ];

        foreach ($this->all() as $note) {
            if ($note->status === 'active') $stats['active']++;
            if ($note->status === 'archived') $stats['archived']++;
            if ($note->status === 'trashed') $stats['trashed']++;
            if ($note->favorite) $stats['favorites']++;
            if ($note->pinned) $stats['pinned']++;
        }

        return $stats;
    }
}
