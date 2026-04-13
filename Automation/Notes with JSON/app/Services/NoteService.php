<?php

namespace App\Services;

use App\Models\Note;
use App\Repositories\NoteRepository;
use Exception;

/**
 * Service to handle Note business logic
 */
class NoteService
{
    private NoteRepository $repository;
    private ?Note $lastDeletedNote = null;

    public function __construct(NoteRepository $repository)
    {
        $this->repository = $repository;
    }

    public function createNote(string $title, string $content, array $tags = [], string $category = 'General'): Note
    {
        if (empty($title)) throw new Exception("Title cannot be empty.");
        
        $note = new Note([
            'title' => $title,
            'content' => $content,
            'tags' => $tags,
            'category' => $category
        ]);

        return $this->repository->save($note);
    }

    public function updateNote(int $id, array $updates): Note
    {
        $note = $this->getNote($id);
        
        foreach ($updates as $key => $value) {
            if (property_exists($note, $key)) {
                $note->$key = $value;
            }
        }

        return $this->repository->save($note);
    }

    public function getNote(int $id): Note
    {
        $note = $this->repository->find($id);
        if (!$note) {
            throw new Exception("Note with ID {$id} not found.");
        }
        return $note;
    }

    public function listNotes(array $filters = [], string $sort = 'latest'): array
    {
        $notes = $this->repository->filter($filters);
        $this->repository->sort($notes, $sort);
        return $notes;
    }

    public function trashNote(int $id): void
    {
        $note = $this->getNote($id);
        $this->lastDeletedNote = clone $note;
        $this->repository->delete($id, false);
    }

    public function restoreNote(int $id): void
    {
        $note = $this->getNote($id);
        $note->status = 'active';
        $this->repository->save($note);
    }

    public function undoTrash(): ?Note
    {
        if ($this->lastDeletedNote) {
            $note = $this->lastDeletedNote;
            $note->status = 'active';
            $restored = $this->repository->save($note);
            $this->lastDeletedNote = null;
            return $restored;
        }
        return null;
    }

    public function deletePermanently(int $id): void
    {
        $this->repository->delete($id, true);
    }

    public function getStats(): array
    {
        return $this->repository->getStats();
    }
}
