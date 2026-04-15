<?php

require_once __DIR__ . '/app/Terminal.php';
require_once __DIR__ . '/app/Validator.php';
require_once __DIR__ . '/app/CsvManager.php';

/**
 * App.php (inline entry class)
 * 
 * Orchestrates all user interactions and delegates work to:
 *  - Terminal   → UI rendering, prompts, status messages
 *  - CsvManager → CSV file I/O operations
 *  - Validator  → Input validation rules
 * 
 * Each menu action follows the pattern:
 *   1. Show a section header
 *   2. Collect & validate user input
 *   3. Perform the operation via CsvManager
 *   4. Show a success / error message
 *   5. Pause, then return to menu
 */
class App
{
    private Terminal   $term;
    private CsvManager $csv;

    public function __construct()
    {
        $this->term = new Terminal();
        $this->csv  = new CsvManager();
    }

    // ─── Application Entry Point ───────────────────────────────────

    /**
     * Starts the main application loop.
     * The loop keeps running until the user explicitly chooses to exit.
     */
    public function run(): void
    {
        $this->term->showBanner();

        // Main application loop
        while (true) {
            $choice = $this->term->showMenu();

            switch ($choice) {
                case '1':
                    $this->handleCreate();
                    break;
                case '2':
                    $this->handleRead();
                    break;
                case '3':
                    $this->handleOverwrite();
                    break;
                case '4':
                    $this->handleAppend();
                    break;
                case '5':
                case 'exit':
                case 'quit':
                case 'q':
                    $this->handleExit();
                    break; // unreachable, but good practice
                default:
                    $this->term->warn("Invalid choice. Please enter a number between 1 and 5.");
            }
        }
    }

    // ─── Action Handlers ───────────────────────────────────────────

    /**
     * [1] Create CSV
     * 
     * Asks the user for a filename and column headers,
     * then creates the CSV file with those headers.
     * Refuses to overwrite an existing file without asking first.
     */
    private function handleCreate(): void
    {
        $this->term->header("CREATE CSV FILE");

        // Step 1: Get a valid filename
        $filename = $this->term->promptAndValidate(
            "  Enter CSV filename (e.g. contacts)",
            ['Validator', 'validateFilename']
        );

        // Step 2: Check if the file already exists
        if ($this->csv->fileExists($filename)) {
            $this->term->warn("File '" . $this->csv->getBasename($filename) . "' already exists.");
            if (!$this->term->confirm("  Do you want to delete existing content and start fresh?")) {
                $this->term->info("Operation cancelled. The existing file was not changed.");
                $this->term->pause();
                $this->term->clear();
                return;
            }
        }

        // Step 3: Get number of columns
        $colCount = (int) $this->term->promptAndValidate(
            "  How many columns?",
            ['Validator', 'validateColumnCount']
        );

        // Step 4: Collect column header names
        $headers = [];
        echo "\n";
        $this->term->info("Enter a name for each column:");
        for ($i = 1; $i <= $colCount; $i++) {
            $headers[] = $this->term->promptAndValidate(
                "  Column $i name",
                ['Validator', 'validateHeader']
            );
        }

        // Step 5: Optionally add rows right away
        $addRows = $this->term->confirm("  Would you like to add initial data rows now?");
        $rows    = [];
        if ($addRows) {
            $rows = $this->collectRows($headers);
        }

        // Step 6: Perform Create (or overwrite if confirmed above)
        try {
            if ($this->csv->fileExists($filename)) {
                // User confirmed overwrite — use overwrite() instead of create()
                $this->csv->overwrite($filename, $headers, $rows);
            } else {
                $this->csv->create($filename, $headers);
                if (!empty($rows)) {
                    $this->csv->append($filename, $rows);
                }
            }

            $this->term->success("File '" . $this->csv->getBasename($filename) . "' created successfully.");
            if (!empty($rows)) {
                $this->term->info(count($rows) . " row(s) written.");
            }
        } catch (RuntimeException $e) {
            $this->term->error($e->getMessage());
        }

        $this->term->pause();
        $this->term->clear();
    }

    /**
     * [2] Read CSV
     * 
     * Lets the user pick a CSV file, then renders all records
     * in a formatted table with column headers.
     */
    private function handleRead(): void
    {
        $this->term->header("READ CSV FILE");

        // Show available CSV files as a convenience listing
        $this->showAvailableFiles();

        $filename = $this->term->promptAndValidate(
            "  Enter CSV filename to read",
            ['Validator', 'validateFilename']
        );

        if (!$this->csv->fileExists($filename)) {
            $this->term->error("File '" . $this->csv->getBasename($filename) . "' not found in the data directory.");
            $this->term->pause();
            $this->term->clear();
            return;
        }

        try {
            $data    = $this->csv->read($filename);
            $headers = $data['headers'];
            $rows    = $data['rows'];

            echo "\n";
            $this->term->info("Reading: " . $this->csv->getBasename($filename));

            if (empty($headers)) {
                $this->term->warn("File exists but appears to be empty (no headers found).");
            } else {
                // Render the records in a visual table
                $this->term->renderTable($headers, $rows);

                if (empty($rows)) {
                    $this->term->warn("No data rows found. The file contains only headers.");
                }
            }
        } catch (RuntimeException $e) {
            $this->term->error($e->getMessage());
        }

        $this->term->pause();
        $this->term->clear();
    }

    /**
     * [3] Overwrite CSV
     * 
     * Replaces ALL content in an existing CSV file with new headers and rows.
     * Requires double confirmation to prevent accidental data loss.
     */
    private function handleOverwrite(): void
    {
        $this->term->header("OVERWRITE CSV FILE");
        $this->term->warn("This will PERMANENTLY replace all content in the file.");

        $this->showAvailableFiles();

        $filename = $this->term->promptAndValidate(
            "  Enter CSV filename to overwrite",
            ['Validator', 'validateFilename']
        );

        if (!$this->csv->fileExists($filename)) {
            $this->term->error("File '" . $this->csv->getBasename($filename) . "' not found.");
            $this->term->info("Tip: Use option [1] to create a new file.");
            $this->term->pause();
            $this->term->clear();
            return;
        }

        // Show existing content before wiping it
        try {
            $existing = $this->csv->read($filename);
            echo "\n";
            $this->term->info("Current content of '" . $this->csv->getBasename($filename) . "':");
            $this->term->renderTable($existing['headers'], $existing['rows']);
        } catch (RuntimeException $e) {
            $this->term->warn("Could not preview existing content: " . $e->getMessage());
        }

        // First confirmation
        if (!$this->term->confirm("  Are you sure you want to overwrite '" . $this->csv->getBasename($filename) . "'?")) {
            $this->term->info("Overwrite cancelled. No changes were made.");
            $this->term->pause();
            $this->term->clear();
            return;
        }

        // Second confirmation (destructive action safeguard)
        if (!$this->term->confirm("  ⚠  Final check — this cannot be undone. Proceed?")) {
            $this->term->info("Overwrite cancelled.");
            $this->term->pause();
            $this->term->clear();
            return;
        }

        // Collect new column headers
        $colCount = (int) $this->term->promptAndValidate(
            "  How many columns for the new content?",
            ['Validator', 'validateColumnCount']
        );

        $headers = [];
        echo "\n";
        $this->term->info("Enter new column names:");
        for ($i = 1; $i <= $colCount; $i++) {
            $headers[] = $this->term->promptAndValidate(
                "  Column $i name",
                ['Validator', 'validateHeader']
            );
        }

        // Collect new data rows
        $rows = $this->collectRows($headers);

        try {
            $this->csv->overwrite($filename, $headers, $rows);
            $this->term->success("File '" . $this->csv->getBasename($filename) . "' has been overwritten.");
            $this->term->info(count($rows) . " row(s) written.");
        } catch (RuntimeException $e) {
            $this->term->error($e->getMessage());
        }

        $this->term->pause();
        $this->term->clear();
    }

    /**
     * [4] Append Row(s)
     * 
     * Adds one or more rows to an existing CSV file using the
     * existing column structure (read from the headers row).
     */
    private function handleAppend(): void
    {
        $this->term->header("APPEND ROW(S) TO CSV");

        $this->showAvailableFiles();

        $filename = $this->term->promptAndValidate(
            "  Enter CSV filename to append to",
            ['Validator', 'validateFilename']
        );

        if (!$this->csv->fileExists($filename)) {
            $this->term->error("File '" . $this->csv->getBasename($filename) . "' not found.");
            $this->term->info("Tip: Use option [1] to create a new file first.");
            $this->term->pause();
            $this->term->clear();
            return;
        }

        // Load existing headers so we know what columns to ask for
        try {
            $data    = $this->csv->read($filename);
            $headers = $data['headers'];

            if (empty($headers)) {
                $this->term->warn("Cannot append: file has no headers. Please recreate it with option [1].");
                $this->term->pause();
                $this->term->clear();
                return;
            }

            $this->term->info("File columns: " . implode(' | ', $headers));
            echo "\n";

            $rows = $this->collectRows($headers);

            $this->csv->append($filename, $rows);
            $this->term->success(count($rows) . " row(s) appended to '" . $this->csv->getBasename($filename) . "'.");
        } catch (RuntimeException $e) {
            $this->term->error($e->getMessage());
        }

        $this->term->pause();
        $this->term->clear();
    }

    /**
     * [5] Exit
     * 
     * Shows a goodbye message and terminates the process cleanly.
     */
    private function handleExit(): void
    {
        $this->term->clear();
        echo Terminal::FG_CYAN . Terminal::BOLD;
        echo "\n  ╔══════════════════════════════════════════════╗\n";
        echo "  ║   Thank you for using PHP CSV Tool!  👋     ║\n";
        echo "  ║   Part of the 100 Days of Code challenge.   ║\n";
        echo "  ╚══════════════════════════════════════════════╝\n";
        echo Terminal::RESET . "\n";
        exit(0);
    }

    // ─── Shared Input Helpers ──────────────────────────────────────

    /**
     * Interactively collects one or more data rows from the user.
     * Prompts for a value per column for each row.
     * 
     * @param string[] $headers  Column names (to show as prompt labels)
     * @return array[]           Array of rows, each row is an indexed array
     */
    private function collectRows(array $headers): array
    {
        $rowCount = (int) $this->term->promptAndValidate(
            "  How many rows do you want to add?",
            ['Validator', 'validateRowCount']
        );

        $rows = [];
        for ($r = 1; $r <= $rowCount; $r++) {
            echo "\n";
            $this->term->info("Row $r of $rowCount:");
            $row = [];
            foreach ($headers as $colName) {
                $value = $this->term->promptAndValidate(
                    "    $colName",
                    ['Validator', 'validateCellValue']
                );
                $row[] = $value;
            }
            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * Prints a listing of all .csv files currently in the data directory.
     * If none exist, shows a friendly notice.
     */
    private function showAvailableFiles(): void
    {
        $files = $this->csv->listFiles();

        if (empty($files)) {
            $this->term->info("No CSV files found in the data directory yet.");
        } else {
            echo Terminal::DIM . "  Available files:\n" . Terminal::RESET;
            foreach ($files as $file) {
                echo Terminal::FG_CYAN . "    • $file\n" . Terminal::RESET;
            }
        }
        echo "\n";
    }
}

// ─── Bootstrap ────────────────────────────────────────────────────

// Ensure the application is only run via CLI
if (php_sapi_name() !== 'cli') {
    die("This script must be run from the command line.\n");
}

// Start the application
$app = new App();
$app->run();
