<?php

require_once __DIR__ . '/Submission.php';

class SubmissionStore
{
    private string $filePath;

    public function __construct(string $filePath)
    {
        $this->filePath = $filePath;
        $this->ensureFileExists();
    }

    /**
     * Creates the data file and directory if they don't exist
     */
    private function ensureFileExists(): void
    {
        $dir = dirname($this->filePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        if (!file_exists($this->filePath)) {
            file_put_contents($this->filePath, json_encode([]));
        }
    }

    /**
     * Reads all submissions from JSON
     * @return Submission[]
     */
    public function getAll(): array
    {
        if (!file_exists($this->filePath)) {
            return [];
        }

        $json = file_get_contents($this->filePath);
        $data = json_decode($json, true);

        if (!is_array($data)) {
            return [];
        }

        $submissions = [];
        foreach ($data as $item) {
            $submissions[] = Submission::fromArray($item);
        }

        return $submissions;
    }

    /**
     * Finds a single submission by ID
     */
    public function getById(string $id): ?Submission
    {
        $all = $this->getAll();
        foreach ($all as $sub) {
            if ($sub->id === $id) {
                return $sub;
            }
        }
        return null;
    }

    /**
     * Saves a new submission and writes to file
     */
    public function save(Submission $submission): bool
    {
        $all = $this->getAll();
        $all[] = $submission;
        return $this->writeToFile($all);
    }

    /**
     * Updates an existing submission
     */
    public function update(Submission $submission): bool
    {
        $all = $this->getAll();
        $updated = false;

        foreach ($all as &$item) {
            if ($item->id === $submission->id) {
                $item = $submission;
                $updated = true;
                break;
            }
        }

        if ($updated) {
            return $this->writeToFile($all);
        }

        return false;
    }

    /**
     * Deletes a submission by ID
     */
    public function delete(string $id): bool
    {
        $all = $this->getAll();
        $filtered = array_filter($all, fn(Submission $sub) => $sub->id !== $id);

        if (count($all) === count($filtered)) {
            return false; // Not found
        }

        return $this->writeToFile(array_values($filtered));
    }

    /**
     * Exports all submissions to a CSV file
     */
    public function exportToCsv(string $destinationPath): int|false
    {
        $all = $this->getAll();
        if (empty($all)) {
            return 0; // Nothing to export
        }

        $fp = fopen($destinationPath, 'w');
        if (!$fp) {
            return false;
        }

        // Write header
        fputcsv($fp, ['ID', 'Name', 'Email', 'Subject', 'Message', 'Phone', 'Created At', 'Updated At']);

        // Write rows
        foreach ($all as $sub) {
            fputcsv($fp, [
                $sub->id,
                $sub->name,
                $sub->email,
                $sub->subject,
                $sub->message,
                $sub->phone ?? 'N/A',
                $sub->createdAt,
                $sub->updatedAt
            ]);
        }

        fclose($fp);
        return count($all);
    }

    /**
     * Search submissions by keyword (matches name, email, subject, or message)
     * @return Submission[]
     */
    public function search(string $keyword): array
    {
        $all = $this->getAll();
        $keyword = strtolower($keyword);

        return array_filter($all, function(Submission $sub) use ($keyword) {
            return str_contains(strtolower($sub->name), $keyword) ||
                   str_contains(strtolower($sub->email), $keyword) ||
                   str_contains(strtolower($sub->subject), $keyword) ||
                   str_contains(strtolower($sub->message), $keyword);
        });
    }

    /**
     * Helper to persist array of Submission objects to JSON
     */
    private function writeToFile(array $submissions): bool
    {
        $data = array_map(fn($sub) => $sub->toArray(), $submissions);
        $result = file_put_contents($this->filePath, json_encode($data, JSON_PRETTY_PRINT));
        return $result !== false;
    }
}
