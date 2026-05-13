<?php

declare(strict_types=1);

namespace ChronoVault\System;

use RuntimeException;

/**
 * EditorProcess — Opens the system's $EDITOR and captures its output.
 *
 * ARCHITECTURAL REASONING (Process Control):
 * ─────────────────────────────────────────────────────────────────────
 * The challenge here is that PHP is a scripting runtime, not a process
 * manager. To let the user write in Vim/Nano/Notepad, we must:
 *
 *   1. PAUSE the PHP process
 *   2. HAND OVER full terminal control to the editor
 *   3. WAIT (block) until the user exits the editor
 *   4. RESUME and read the file the editor saved
 *
 * WHY proc_open() AND NOT exec() OR shell_exec()?
 * ─────────────────────────────────────────────────────────────────────
 * exec("vim $tmpfile") — This works for basic cases, but:
 *   - On some PHP configurations, stdin/stdout are detached from the TTY
 *   - Vim's full-screen mode requires a real TTY (it uses escape sequences
 *     to query terminal dimensions via /dev/tty)
 *   - With a non-TTY stdin, Vim falls back to "Not a terminal" errors
 *
 * proc_open() with inherited file descriptors solves this completely:
 *   $descriptors = [0 => STDIN, 1 => STDOUT, 2 => STDERR];
 *
 * By passing the CURRENT process's STDIN/STDOUT/STDERR directly as
 * descriptor specs, proc_open() tells the OS: "the child process (editor)
 * should share file handles with the parent." This means:
 *   - The editor gets the real PTY (pseudo-terminal)
 *   - Vim can render its full-screen interface
 *   - Nano can read arrow keys
 *   - proc_close() blocks until the editor's process exits (user :q or ^X)
 *
 * SECURE DELETION:
 * After reading the temp file content, we overwrite it with zero bytes
 * (using fwrite) before unlink. This mitigates filesystem forensics where
 * the OS might not immediately reclaim and zero disk blocks after unlink.
 * Note: on SSDs with wear leveling, true secure deletion is OS-dependent,
 * but this is a reasonable best-effort mitigation for the threat model.
 */
class EditorProcess
{
    /** Default editor fallback chain (checked in order). */
    private const EDITOR_FALLBACKS = ['nano', 'vim', 'vi', 'notepad.exe'];

    /**
     * Opens the system editor with a temporary file, waits for it to exit,
     * reads the content, securely deletes the temp file, and returns the text.
     *
     * @param string $initialContent  Pre-populate the temp file (e.g., a template).
     * @return string                 The text the user wrote.
     * @throws RuntimeException       If no editor is found or process fails.
     */
    public function openAndCapture(string $initialContent = ''): string
    {
        $tmpFile = $this->createTempFile($initialContent);

        try {
            $editor = $this->resolveEditor();
            $this->runEditor($editor, $tmpFile);
            $content = $this->readAndSecureDelete($tmpFile);
        } catch (\Throwable $e) {
            // Ensure temp file is cleaned up even on failure
            if (file_exists($tmpFile)) {
                @unlink($tmpFile);
            }
            throw $e;
        }

        return $content;
    }

    /**
     * Creates a secure temporary file with optional initial content.
     * Using sys_get_temp_dir() ensures OS-managed temp space.
     */
    private function createTempFile(string $initialContent): string
    {
        $tmpFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'cvault_' . bin2hex(random_bytes(8)) . '.md';

        if (file_put_contents($tmpFile, $initialContent) === false) {
            throw new RuntimeException("Cannot create temp file: {$tmpFile}");
        }

        // Restrict temp file to owner-only on Unix.
        if (PHP_OS_FAMILY !== 'Windows') {
            chmod($tmpFile, 0600);
        }

        return $tmpFile;
    }

    /**
     * Resolves which editor to use:
     * 1. $EDITOR environment variable (user's explicit preference)
     * 2. $VISUAL environment variable (less common alternative)
     * 3. Fallback chain: nano → vim → vi → notepad.exe
     */
    private function resolveEditor(): string
    {
        $editor = getenv('EDITOR') ?: getenv('VISUAL');

        if ($editor !== false && trim($editor) !== '') {
            return trim($editor);
        }

        // Detect OS and pick best default.
        if (PHP_OS_FAMILY === 'Windows') {
            return 'notepad.exe';
        }

        foreach (self::EDITOR_FALLBACKS as $candidate) {
            // Use 'which' (Unix) to check if the editor binary exists.
            exec("which {$candidate} 2>/dev/null", $out, $rc);
            if ($rc === 0 && !empty($out)) {
                return $candidate;
            }
        }

        throw new RuntimeException(
            'No text editor found. Set the $EDITOR environment variable (e.g., export EDITOR=nano).'
        );
    }

    /**
     * Launches the editor process with full TTY inheritance via proc_open().
     *
     * The descriptor spec [0 => STDIN, 1 => STDOUT, 2 => STDERR] passes
     * the current process's file handles directly to the child. This is the
     * key to giving the editor full terminal access.
     */
    private function runEditor(string $editor, string $tmpFile): void
    {
        // Build the command. Escape the temp file path for shell safety.
        $escapedPath = escapeshellarg($tmpFile);
        $cmd         = "{$editor} {$escapedPath}";

        // On Windows, start the editor and wait for it.
        if (PHP_OS_FAMILY === 'Windows') {
            $cmd = "start /wait {$editor} {$escapedPath}";
        }

        // Descriptor spec: child process inherits our TTY handles.
        $descriptors = [
            0 => STDIN,
            1 => STDOUT,
            2 => STDERR,
        ];

        $pipes   = [];
        $process = proc_open($cmd, $descriptors, $pipes);

        if ($process === false) {
            throw new RuntimeException("Failed to launch editor: {$editor}");
        }

        // proc_close() is the critical blocking call. PHP halts here until
        // the editor process exits. The exit code is the editor's return value.
        $exitCode = proc_close($process);

        // Most editors exit 0 on normal exit. Treat non-zero as warning but
        // don't fail — Vim occasionally returns 1 on certain exit scenarios.
        if ($exitCode > 1) {
            throw new RuntimeException("Editor exited with unexpected code: {$exitCode}");
        }
    }

    /**
     * Reads the temp file content, then securely overwrites and deletes it.
     *
     * SECURE DELETION STRATEGY:
     * 1. Read content into memory
     * 2. Open the file for writing and overwrite with NUL bytes (0x00)
     * 3. Flush and close the handle
     * 4. Unlink (delete) the file
     *
     * This ensures the plaintext is not trivially recoverable from disk sectors
     * that haven't yet been overwritten by the OS's filesystem layer.
     */
    private function readAndSecureDelete(string $tmpFile): string
    {
        if (!file_exists($tmpFile)) {
            throw new RuntimeException('Temp file was deleted before we could read it.');
        }

        $content = file_get_contents($tmpFile);
        if ($content === false) {
            throw new RuntimeException("Cannot read temp file: {$tmpFile}");
        }

        // Phase 1: Overwrite with zeros.
        $fileSize = filesize($tmpFile);
        if ($fileSize > 0) {
            $handle = fopen($tmpFile, 'wb');
            if ($handle !== false) {
                fwrite($handle, str_repeat("\x00", $fileSize));
                fflush($handle);
                fclose($handle);
            }
        }

        // Phase 2: Delete the (now zeroed) file.
        @unlink($tmpFile);

        return $content;
    }
}
