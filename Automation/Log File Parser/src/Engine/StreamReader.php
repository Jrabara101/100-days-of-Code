<?php

declare(strict_types=1);

namespace OmniLog\Engine;

/**
 * StreamReader – Memory-safe generator-based file reader.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  MEMORY MANAGEMENT STRATEGY                                 │
 * │                                                             │
 * │  file_get_contents() → O(n) space: entire file in RAM       │
 * │  file()              → O(n) space: all lines in RAM array   │
 * │  SplFileObject+yield → O(1) space: ONE line in RAM at once  │
 * │                                                             │
 * │  A 4 GB log file processed with this generator uses the     │
 * │  same ~4 KB of memory as a 4 KB log file.                   │
 * │                                                             │
 * │  Time complexity: O(n) — unavoidable single sequential pass │
 * └─────────────────────────────────────────────────────────────┘
 *
 * SplFileObject is preferred over fopen/fgets because it wraps
 * the file handle in an object with RAII-style cleanup when
 * the object goes out of scope (no explicit fclose required).
 */
class StreamReader
{
    private int $fileSize   = 0;
    private int $totalLines = 0;

    public function __construct(
        private readonly string $filePath
    ) {
        if (!is_file($this->filePath)) {
            throw new \InvalidArgumentException("File not found or not readable: {$this->filePath}");
        }
        $this->fileSize = (int) filesize($this->filePath);
    }

    public function getFileSize(): int
    {
        return $this->fileSize;
    }

    public function getTotalLines(): int
    {
        return $this->totalLines;
    }

    /**
     * Generator that yields one line at a time.
     *
     * Each yielded value is an associative array:
     *   [
     *     'line'       => string  – raw line content (newline stripped)
     *     'bytesRead'  => int     – cumulative bytes read so far
     *     'lineNumber' => int     – 1-based line counter
     *   ]
     *
     * The generator is lazy: no line is read until the caller calls next().
     * This enables the pipeline (Reader → Parser → Filter → Aggregator)
     * to process one entry at a time with O(1) working memory.
     *
     * @return \Generator<int, array{line: string, bytesRead: int, lineNumber: int}>
     */
    public function stream(): \Generator
    {
        $file = new \SplFileObject($this->filePath, 'r');
        $file->setFlags(\SplFileObject::DROP_NEW_LINE);

        $lineNumber = 0;
        $bytesRead  = 0;

        while (!$file->eof()) {
            $line = $file->fgets();

            if ($line === false) {
                break;
            }

            $lineNumber++;
            $bytesRead += strlen($line) + 1; // +1 for stripped newline

            yield [
                'line'       => $line,
                'bytesRead'  => $bytesRead,
                'lineNumber' => $lineNumber,
            ];
        }

        $this->totalLines = $lineNumber;

        // Explicitly null the object to release the file handle immediately
        unset($file);
    }
}
