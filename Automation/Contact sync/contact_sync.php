#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Form to Master Contact Sync Engine
 * * Usage:
 * php contact_sync.php        (Run synchronization lifecycle worker)
 * php contact_sync.php seed   (Inject raw mock form submissions for testing)
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Layout & TUI Render Component
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const BOLD = "\e[1m";
    const DIM = "\e[2m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";
    const BLUE = "\e[34m";

    public static function clearScreen(): void { echo "\033[2J\033[;H"; }

    public static function header(string $title, string $subtitle = ""): void {
        self::clearScreen();
        echo self::BLUE . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        if ($subtitle) {
            echo "║ " . str_pad($subtitle, 71, " ", STR_PAD_BOTH) . " ║\n";
        }
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function success(string $msg): void { echo "\n" . self::GREEN . self::BOLD . "✔ SUCCESS: " . self::RESET . self::GREEN . $msg . self::RESET . "\n\n"; }
    public static function error(string $msg): void { echo "\n" . self::RED . self::BOLD . "✖ ERROR: " . self::RESET . self::RED . $msg . self::RESET . "\n\n"; }
    
    public static function progress(string $msg): void {
        echo "\r" . str_repeat(" ", 80) . "\r" . self::YELLOW . "⚙ Syncing" . self::RESET . " -> " . $msg;
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) return;
        $widths = array_map('strlen', $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $widths[$key] = max($widths[$key], strlen((string)($row[$key] ?? '')));
            }
        }
        $drawSeparator = function($l, $m, $r) use ($widths) {
            $segments = array_map(fn($w) => str_repeat("─", $w + 2), $widths);
            echo $l . implode($m, $segments) . $r . "\n";
        };
        $drawSeparator("┌", "┬", "┐");
        echo "│ ";
        foreach ($headers as $key => $label) {
            echo self::BOLD . self::CYAN . str_pad($label, $widths[$key]) . self::RESET . " │ ";
        }
        echo "\n";
        $drawSeparator("├", "┼", "┤");
        foreach ($data as $row) {
            echo "│ ";
            foreach ($headers as $key => $label) {
                echo str_pad((string)($row[$key] ?? ''), $widths[$key]) . " │ ";
            }
            echo "\n";
        }
        $drawSeparator("└", "┴", "┘");
    }
}

// ==========================================
// 2. Database Infrastructure Ledger
// ==========================================
class ContactRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/contacts_sync.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Form Ingestion Buffer Table (Staging Area)
        $this->db->exec("CREATE TABLE IF NOT EXISTS form_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            form_source TEXT NOT NULL,
            raw_name TEXT NOT NULL,
            raw_email TEXT NOT NULL,
            raw_phone TEXT,
            sync_status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSING, SYNCED, FAILED
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Production Consolidated Master Table (Core Identity Ledger)
        $this->db->exec("CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            last_sync_source TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_submission_state ON form_submissions(sync_status)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_contact_lookup ON contacts(email)");
    }

    public function seedMockSubmissions(): void {
        $stmt = $this->db->prepare("INSERT INTO form_submissions (form_source, raw_name, raw_email, raw_phone) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Contact Form', 'Thomas Anderson', 'neo@matrix.io', '+1-555-0199']);
        $stmt->execute(['Newsletter Signup', 'Trinity', 'trinity@matrix.io', null]);
        $stmt->execute(['Whitepaper Download', 'Morpheus', 'morpheus@matrix.io', '+1-555-0100']);
        // Simulating a profile modification conflict update scenario
        $stmt->execute(['Webinar Registration', 'Thomas Anderson', 'neo@matrix.io', '+1-555-9999']); 
    }

    public function fetchPendingChunk(int $limit): array {
        $stmt = $this->db->prepare("SELECT * FROM form_submissions WHERE sync_status = 'PENDING' LIMIT ?");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }

    public function updateStagingStatus(int $id, string $status, ?string $error = null): void {
        $stmt = $this->db->prepare("UPDATE form_submissions SET sync_status = ?, error_message = ? WHERE id = ?");
        $stmt->execute([$status, $error, $id]);
    }

    public function findMasterContactByEmail(string $email): ?array {
        $stmt = $this->db->prepare("SELECT * FROM contacts WHERE email = ? LIMIT 1");
        $stmt->execute([strtolower(trim($email))]);
        return $stmt->fetch() ?: null;
    }

    public function writeToMaster(array $payload): string {
        $this->db->beginTransaction();
        try {
            $email = strtolower(trim($payload['email']));
            $existing = $this->findMasterContactByEmail($email);

            if ($existing) {
                // Determine if any delta updates are required to minimize database churn
                if ($existing['name'] === $payload['name'] && $existing['phone'] === $payload['phone']) {
                    $this->db->commit();
                    return 'SKIPPED';
                }

                $stmt = $this->db->prepare("UPDATE contacts SET name = ?, phone = ?, last_sync_source = ?, updated_at = datetime('now') WHERE id = ?");
                $stmt->execute([$payload['name'], $payload['phone'] ?? $existing['phone'], $payload['source'], $existing['id']]);
                $this->db->commit();
                return 'UPDATED';
            } else {
                $stmt = $this->db->prepare("INSERT INTO contacts (name, email, phone, last_sync_source) VALUES (?, ?, ?, ?)");
                $stmt->execute([$payload['name'], $email, $payload['phone'], $payload['source']]);
                $this->db->commit();
                return 'CREATED';
            }
        } catch (PDOException $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}

// ==========================================
// 3. Synchronization Pipeline Automation Controller
// ==========================================
class ContactSyncEngine {
    private ContactRepository $repo;
    private const BATCH_SIZE = 500;

    public function __construct() {
        $this->repo = new ContactRepository();
    }

    public function execute(): void {
        CliUI::header("Identity Synchronization Hub", "Pipeline Extraction State Node");
        CliUI::info("Querying staging buffers for un-synchronized records...");

        $metrics = ['CREATED' => 0, 'UPDATED' => 0, 'SKIPPED' => 0, 'FAILED' => 0];
        $startTime = microtime(true);

        while (true) {
            $batch = $this->repo->fetchPendingChunk(self::BATCH_SIZE);
            if (empty($batch)) break;

            foreach ($batch as $submission) {
                // Lock the active staging row record to guard against race conditions
                $this->repo->updateStagingStatus($submission['id'], 'PROCESSING');

                // Perform inline structural data validation checks
                if (!filter_var($submission['raw_email'], FILTER_VALIDATE_EMAIL)) {
                    $this->repo->updateStagingStatus($submission['id'], 'FAILED', 'Malformed syntax tracking error on contact email parameter.');
                    $metrics['FAILED']++;
                    continue;
                }

                try {
                    $resolution = $this->repo->writeToMaster([
                        'name'   => trim($submission['raw_name']),
                        'email'  => $submission['raw_email'],
                        'phone'  => $submission['raw_phone'] ? trim($submission['raw_phone']) : null,
                        'source' => $submission['form_source']
                    ]);

                    $this->repo->updateStagingStatus($submission['id'], 'SYNCED');
                    $metrics[$resolution]++;

                } catch (Exception $e) {
                    $this->repo->updateStagingStatus($submission['id'], 'FAILED', $e->getMessage());
                    $metrics['FAILED']++;
                }

                $totalRun = array_sum($metrics);
                CliUI::progress("Aggregating transformations: {$totalRun} processed records");
            }
            
            unset($batch);
            gc_collect_cycles(); // Manual memory leak protection
        }

        $duration = round(microtime(true) - $startTime, 2);
        
        if (array_sum($metrics) === 0) {
            CliUI::success("Core master ledger states match staging tables exactly. No mutations required.");
            return;
        }

        CliUI::success("Operational data migration sequence executed cleanly.");
        
        // Output final operational data matrix report grid
        echo " 📊 " . CliUI::BOLD . "Pipeline Metrics Summary Table (Duration: {$duration}s):" . CliUI::RESET . "\n";
        CliUI::drawTable([
            [
                'created' => CliUI::GREEN . $metrics['CREATED'] . CliUI::RESET,
                'updated' => CliUI::YELLOW . $metrics['UPDATED'] . CliUI::RESET,
                'skipped' => CliUI::DIM . $metrics['SKIPPED'] . CliUI::RESET,
                'failed'  => CliUI::RED . $metrics['FAILED'] . CliUI::RESET,
            ]
        ], ['created' => 'Identities Created', 'updated' => 'Identities Updated', 'skipped' => 'Identities Stable (No Delta)', 'failed' => 'Data Fault Rejections']);
        echo "\n";
    }

    public function seedEnv(): void {
        $this->repo->seedMockSubmissions();
        echo "\n \e[32m✔ Safe sandbox staging parameters seeded into local SQLite instance.\e[0m\n\n";
    }
}

// ==========================================
// 4. Runtime Ingestion Guard Bootstrapper
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Automated database syncing command configurations require native shell console configurations.");
}

$engine = new ContactSyncEngine();
$action = $argv[1] ?? 'run';

if ($action === 'seed') {
    $engine->seedEnv();
} else {
    $engine->execute();
}
