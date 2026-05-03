<?php

declare(strict_types=1);

namespace DedupeCLI\Engine;

/**
 * FileStreamer – Memory-safe, generator-based bidirectional file streamer.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  STREAMING METHODOLOGY                                               │
 * │                                                                      │
 * │  PHP's file(), file_get_contents(), and array_unique() all require   │
 * │  the entire file to reside in RAM simultaneously. For a 50 GB SQL   │
 * │  dump that means 50 GB of heap—fatal on any normal server.          │
 * │                                                                      │
 * │  This class uses SplFileObject wrapping a standard OS file handle.  │
 * │  PHP's runtime keeps exactly ONE line in the $line variable at any  │
 * │  given time. After `yield`, the generator suspends and the GC is    │
 * │  free to reclaim the previous line's memory before the next one     │
 * │  is read. Effective working memory = O(1), independent of file size.│
 * │                                                                      │
 * │  Reading a 50 GB file this way uses ~512 KB of RAM (stack + I/O    │
 * │  buffer), the same as reading a 1 KB file.                          │
 * │                                                                      │
 * │  Time complexity: O(N) — a single sequential pass is unavoidable    │
 * │  because we must inspect every line at least once.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
class FileStreamer
{
    private int $fileSize   = 0;
    private int $totalLines = 0;

    public function __construct(
        private readonly string $filePath
    ) {
        if (!is_file($this->filePath) || !is_readable($this->filePath)) {
            throw new \InvalidArgumentException(
                "Source file not found or not readable: {$this->filePath}"
            );
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
     * Yield one raw line at a time from the source file.
     *
     * Each iteration yields an associative array:
     *   [
     *     'raw'        => string  – exact line content (newline stripped)
     *     'bytesRead'  => int     – cumulative bytes consumed so far
     *     'lineNumber' => int     – 1-based line index
     *   ]
     *
     * The generator is lazy: PHP does NOT read the next line until the
     * consumer calls next() (i.e., proceeds to the next foreach iteration).
     * This makes the pipeline — Streamer → Engine → Writer — process exactly
     * one line at a time, achieving the minimal O(1) space profile.
     *
     * @return \Generator<int, array{raw: string, bytesRead: int, lineNumber: int}>
     */
    public function stream(): \Generator
    {
        $file = new \SplFileObject($this->filePath, 'r');
        $file->setFlags(\SplFileObject::DROP_NEW_LINE);

        $lineNumber = 0;
        $bytesRead  = 0;

        while (!$file->eof()) {
            $line = $file->fgets();

            // fgets() returns false only on a read error (not on EOF alone)
            if ($line === false) {
                break;
            }

            $lineNumber++;
            // Strip \r to handle CRLF (Windows) line endings.
            // SplFileObject::DROP_NEW_LINE strips \n only; \r must be removed manually.
            $line = rtrim($line, "\r");
            // +1 accounts for the stripped newline character
            $bytesRead += strlen($line) + 1;

            yield [
                'raw'        => $line,
                'bytesRead'  => $bytesRead,
                'lineNumber' => $lineNumber,
            ];
        }

        $this->totalLines = $lineNumber;

        // Explicitly unset to release the OS file handle immediately,
        // rather than waiting for PHP's GC to close it at end-of-scope.
        unset($file);
    }
}
