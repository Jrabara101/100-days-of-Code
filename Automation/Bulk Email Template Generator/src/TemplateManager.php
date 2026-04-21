<?php

/**
 * TemplateManager - Manages email templates
 * 
 * Handles CRUD operations for email templates including
 * create, read, update, delete, search, duplicate, and list.
 */
class TemplateManager
{
    /** @var FileManager File manager instance */
    private FileManager $fileManager;

    /** @var string Path to templates data file */
    private string $dataFile = 'data/templates.json';

    /** @var array Cached templates */
    private array $templates = [];

    public function __construct(FileManager $fileManager)
    {
        $this->fileManager = $fileManager;
        $this->loadTemplates();
    }

    /**
     * Load templates from the JSON file
     */
    private function loadTemplates(): void
    {
        $this->templates = $this->fileManager->readJson($this->dataFile);
    }

    /**
     * Save templates to the JSON file
     */
    private function saveTemplates(): void
    {
        $this->fileManager->writeJson($this->dataFile, $this->templates);
    }

    /**
     * Generate a unique template ID
     */
    private function generateId(): string
    {
        return 'tpl_' . substr(md5(uniqid((string)mt_rand(), true)), 0, 8);
    }

    /**
     * Create a new template
     *
     * @param string $name Template name
     * @param string $subject Email subject template
     * @param string $body Email body template
     * @param string $type Template type ('text' or 'html')
     * @return array The created template
     */
    public function create(string $name, string $subject, string $body, string $type = 'text'): array
    {
        $template = [
            'id'         => $this->generateId(),
            'name'       => $name,
            'subject'    => $subject,
            'body'       => $body,
            'type'       => strtolower($type),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        $this->templates[] = $template;
        $this->saveTemplates();

        return $template;
    }

    /**
     * Get all templates
     *
     * @return array All templates
     */
    public function getAll(): array
    {
        return $this->templates;
    }

    /**
     * Get a template by its ID
     *
     * @param string $id Template ID
     * @return array|null The template or null
     */
    public function getById(string $id): ?array
    {
        foreach ($this->templates as $template) {
            if ($template['id'] === $id) {
                return $template;
            }
        }
        return null;
    }

    /**
     * Get a template by its index (1-based)
     *
     * @param int $index 1-based index
     * @return array|null The template or null
     */
    public function getByIndex(int $index): ?array
    {
        $idx = $index - 1;
        return $this->templates[$idx] ?? null;
    }

    /**
     * Update an existing template
     *
     * @param string $id Template ID
     * @param array $updates Key-value pairs to update
     * @return array|null Updated template or null if not found
     */
    public function update(string $id, array $updates): ?array
    {
        foreach ($this->templates as &$template) {
            if ($template['id'] === $id) {
                foreach ($updates as $key => $value) {
                    if ($key !== 'id' && $key !== 'created_at') {
                        $template[$key] = $value;
                    }
                }
                $template['updated_at'] = date('Y-m-d H:i:s');
                $this->saveTemplates();
                return $template;
            }
        }
        return null;
    }

    /**
     * Delete a template by ID
     *
     * @param string $id Template ID
     * @return bool True if deleted
     */
    public function delete(string $id): bool
    {
        foreach ($this->templates as $index => $template) {
            if ($template['id'] === $id) {
                array_splice($this->templates, $index, 1);
                $this->saveTemplates();
                return true;
            }
        }
        return false;
    }

    /**
     * Search templates by name (case-insensitive partial match)
     *
     * @param string $query Search query
     * @return array Matching templates
     */
    public function search(string $query): array
    {
        $query = strtolower(trim($query));
        $results = [];

        foreach ($this->templates as $template) {
            if (stripos($template['name'], $query) !== false) {
                $results[] = $template;
            }
        }

        return $results;
    }

    /**
     * Duplicate a template
     *
     * @param string $id Template ID to duplicate
     * @return array|null The new duplicated template or null
     */
    public function duplicate(string $id): ?array
    {
        $original = $this->getById($id);
        if ($original === null) {
            return null;
        }

        return $this->create(
            $original['name'] . ' (Copy)',
            $original['subject'],
            $original['body'],
            $original['type']
        );
    }

    /**
     * Get the count of templates
     */
    public function count(): int
    {
        return count($this->templates);
    }

    /**
     * Get all placeholder fields used in a template
     *
     * @param array $template The template data
     * @return array List of placeholder names
     */
    public function getPlaceholders(array $template): array
    {
        $subjectPlaceholders = Validator::extractPlaceholders($template['subject'] ?? '');
        $bodyPlaceholders = Validator::extractPlaceholders($template['body'] ?? '');
        return array_unique(array_merge($subjectPlaceholders, $bodyPlaceholders));
    }
}
