#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Enterprise Document Approval System
 * Usage: php document_approval.php
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Styling & TUI Layout Engine
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
    const MAGENTA = "\e[35m";

    public static function clearScreen(): void { echo "\033[2J\033[;H"; }

    public static function header(string $title, string $subtitle = ""): void {
        self::clearScreen();
        echo self::MAGENTA . self::BOLD;
        echo "╔═════════════════════════════════════════════════════════════════════════╗\n";
        echo "║ " . str_pad(strtoupper($title), 71, " ", STR_PAD_BOTH) . " ║\n";
        if ($subtitle) {
            echo "║ " . str_pad($subtitle, 71, " ", STR_PAD_BOTH) . " ║\n";
        }
        echo "╚═════════════════════════════════════════════════════════════════════════╝\n" . self::RESET . "\n";
    }

    public static function prompt(string $message, string $default = ""): string {
        $defLabel = $default ? self::DIM . " [{$default}]" . self::RESET : "";
        echo self::BOLD . $message . $defLabel . self::RESET . ": ";
        $input = trim(fgets(STDIN));
        return $input === "" ? $default : $input;
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to management workspace..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . $msg . self::RESET . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'DRAFT'          => self::DIM . "   DRAFT   " . self::RESET,
            'PENDING_REVIEW' => self::YELLOW . " UNDER REVIEW " . self::RESET,
            'APPROVED'       => self::GREEN . self::BOLD . "  APPROVED  " . self::RESET,
            'REJECTED'       => self::RED . self::BOLD . "  REJECTED  " . self::RESET,
            default          => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No tracking parameters found matching current visibility metrics.\n" . self::RESET;
            return;
        }

        $widths = array_map('strlen', $headers);
        foreach ($data as $row) {
            foreach ($headers as $key => $label) {
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', (string)($row[$key] ?? ''));
                $widths[$key] = max($widths[$key], strlen($cleanString));
            }
        }

        $drawSeparator = function($l, $m, $r, $lineChar) use ($widths) {
            $segments = array_map(fn($w) => str_repeat($lineChar, $w + 2), $widths);
            echo $l . implode($m, $segments) . $r . "\n";
        };

        $drawSeparator("┌", "┬", "┐", "─");
        echo "│ ";
        foreach ($headers as $key => $label) {
            echo self::BOLD . self::CYAN . str_pad($label, $widths[$key]) . self::RESET . " │ ";
        }
        echo "\n";
        $drawSeparator("├", "┼", "┤", "─");

        foreach ($data as $row) {
            echo "│ ";
            foreach ($headers as $key => $label) {
                $content = (string)($row[$key] ?? '');
                $cleanString = preg_replace('#\\x1b[[][^A-Za-z]*[A-Za-z]#', '', $content);
                $padding = str_repeat(" ", max(0, $widths[$key] - strlen($cleanString)));
                echo $content . $padding . " │ ";
            }
            echo "\n";
        }
        $drawSeparator("└", "┴", "┘", "─");
        echo "\n";
    }
}

// ==========================================
// 2. Data Persistence Infrastructure (SQLite)
// ==========================================
class DocumentRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/document_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Corporate Identities Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL -- AUTHOR, REVIEWER
        )");

        // Immutability Document Master Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            content_hash TEXT NOT NULL, -- SHA-256 Signature Guard
            current_status TEXT DEFAULT 'DRAFT', 
            owner_name TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        // Permanent Audit Trail Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS document_audit_trail (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            actor_name TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            action_taken TEXT NOT NULL, -- SUBMITTED, APPROVED, REJECTED
            signature_verified INTEGER NOT NULL, -- Boolean Flag
            audit_notes TEXT,
            actioned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (document_id) REFERENCES documents(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_doc_status ON documents(current_status)");

        // Auto-seed baseline operational actors if database is fresh
        if ($this->db->query("SELECT COUNT(*) FROM users")->fetchColumn() == 0) {
            $stmt = $this->db->prepare("INSERT INTO users (name, role) VALUES (?, ?)");
            $stmt->execute(['Alice Vance', 'AUTHOR']);
            $stmt->execute(['Marcus Brody', 'REVIEWER']);
            $stmt->execute(['Elena Fisher', 'REVIEWER']);
        }
    }

    public function createDocument(string $title, string $content, string $owner): void {
        $hash = hash('sha256', $content);
        $stmt = $this->db->prepare("INSERT INTO documents (title, content, content_hash, owner_name) VALUES (?, ?, ?, ?)");
        $stmt->execute([trim($title), $content, $hash, $owner]);
    }

    public function getAllUsers(): array {
        return $this->db->query("SELECT * FROM users ORDER BY id ASC")->fetchAll();
    }

    public function getPendingQueue(): array {
        return $this->db->query("SELECT * FROM documents WHERE current_status = 'PENDING_REVIEW' ORDER BY id ASC")->fetchAll();
    }

    public function getGlobalRegistry(): array {
        return $this->db->query("SELECT * FROM documents ORDER BY id DESC LIMIT 25")->fetchAll();
    }

    public function getAuditTrail(int $docId): array {
        $stmt = $this->db->prepare("SELECT * FROM document_audit_trail WHERE document_id = ? ORDER BY id ASC");
        $stmt->execute([$docId]);
        return $stmt->fetchAll();
    }

    /**
     * Senior State Ingestion Module: Atomic State Shifts.
     * Generates a structural delta evaluation on document content strings to enforce immutability rules.
     */
    public function transitionDocumentState(int $docId, string $action, string $notes, array $actor): bool|string {
        $this->db->beginTransaction();
        try {
            // 1. Fetch current persistence metrics using explicit isolation parameters
            $stmt = $this->db->prepare("SELECT * FROM documents WHERE id = ?");
            $stmt->execute([$docId]);
            $document = $stmt->fetch();

            if (!$document) {
                $this->db->rollBack();
                return "Target document key could not be resolved inside database storage pools.";
            }

            // 2. State Machine Rules Boundary Check
            if ($action === 'SUBMIT') {
                if ($document['current_status'] !== 'DRAFT') {
                    $this->db->rollBack();
                    return "Document is already submitted or closed inside workflow parameters.";
                }
                
                $update = $this->db->prepare("UPDATE documents SET current_status = 'PENDING_REVIEW', updated_at = datetime('now') WHERE id = ?");
                $update->execute([$docId]);

                $log = $this->db->prepare("INSERT INTO document_audit_trail (document_id, actor_name, actor_role, action_taken, signature_verified, audit_notes) VALUES (?, ?, ?, 'SUBMITTED', 1, ?)");
                $log->execute([$docId, $actor['name'], $actor['role'], trim($notes)]);
                
                $this->db->commit();
                return true;
            }

            // Review Phase Guard Checklist
            if ($document['current_status'] !== 'PENDING_REVIEW') {
                $this->db->rollBack();
                return "Document is not currently flagged as awaiting active sign-off procedures.";
            }

            if ($actor['role'] !== 'REVIEWER') {
                $this->db->rollBack();
                return "Security Error: Clearance profile [{$actor['role']}] lacks authorization rights to execute signs.";
            }

            // 3. Cryptographic Footprint Integrity Check
            $recalculatedHash = hash('sha256', $document['content']);
            $signatureValid = hash_equals($document['content_hash'], $recalculatedHash) ? 1 : 0;

            if (!$signatureValid) {
                // Cryptographic validation breakdown: Intercept process, record compromise alert, change state to REJECTED
                $update = $this->db->prepare("UPDATE documents SET current_status = 'REJECTED', updated_at = datetime('now') WHERE id = ?");
                $update->execute([$docId]);

                $log = $this->db->prepare("INSERT INTO document_audit_trail (document_id, actor_name, actor_role, action_taken, signature_verified, audit_notes) VALUES (?, ?, ?, 'REJECTED', 0, 'SECURITY ALERT: File content anomaly detected! Hash mismatched state parameters.')");
                $log->execute([$docId, $actor['name'], $actor['role']]);
                
                $this->db->commit();
                return "SECURITY REJECTION: Document content hash mismatch. The original file has been altered post-submission.";
            }

            // 4. Update core parent lifecycle attributes
            $nextStage = ($action === 'APPROVE') ? 'APPROVED' : 'REJECTED';
            $update = $this->db->prepare("UPDATE documents SET current_status = ?, updated_at = datetime('now') WHERE id = ?");
            $update->execute([$nextStage, $docId]);

            // 5. Commit immutable step entries down to history ledgers
            $log = $this->db->prepare("
                INSERT INTO document_audit_trail (document_id, actor_name, actor_role, action_taken, signature_verified, audit_notes) 
                VALUES (?, ?, ?, ?, 1, ?)
            ");
            $log->execute([$docId, $actor['name'], $actor['role'], $nextStage, trim($notes)]);

            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            return "Critical Engine Fault: Transaction rolled back safely. Details: " . $e->getMessage();
        }
    }

    /**
     * Backdoor simulation tool designed strictly to model files modified outside of proper application gates
     */
    public function simulateBackdoorTampering(int $docId, string $maliciousText): void {
        $stmt = $this->db->prepare("UPDATE documents SET content = ? WHERE id = ?");
        $stmt->execute([$maliciousText, $docId]);
    }
}

// ==========================================
// 3. Application Operational Control Loop
// ==========================================
class DocumentApprovalApp {
    private DocumentRepository $repo;
    private ?array $sessionUser = null;

    public function __construct() {
        $this->repo = new DocumentRepository();
    }

    public function start(): void {
        $users = $this->repo->getAllUsers();
        $this->sessionUser = $users[0] ?? null; // Default to Alice Vance (Author)

        while (true) {
            $contextSubtitle = "User Node: " . $this->sessionUser['name'] . " (" . $this->sessionUser['role'] . ")";
            CliUI::header("Immutable Document Tracking Portal", $contextSubtitle);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Draft & Upload New Document Corporate Asset\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Route Outstanding Draft to Review Queue\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Process Pending Sign-off Review Inbox\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Output Global Document Status Manifest\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Audit Document Transaction Trail & Integrity Logs\n";
            echo "  " . CliUI::CYAN . "6." . CliUI::RESET . " Switch User Clearance Context (Impersonate Identity Node)\n";
            echo "  " . CliUI::CYAN . "7." . CliUI::RESET . " Simulate Malicious Out-of-Band File Tampering\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect local workspace server link\n\n";

            switch (CliUI::prompt("Select System Route")) {
                case '1': $this->draftDocumentFlow(); break;
                case '2': $this->submitForReviewFlow(); break;
                case '3': $this->processReviewInboxFlow(); break;
                case '4': $this->viewGlobalManifestGrid(); break;
                case '5': $this->auditTrailAnalysisFlow(); break;
                case '6': $this->switchContextFlow($users); break;
                case '7': $this->simulateTamperingFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Vault database pipeline connections unmounted cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function draftDocumentFlow(): void {
        CliUI::header("Draft & Upload Document");
        $title = CliUI::prompt("Enter structural document title");
        if (empty($title)) { CliUI::error("Asset labels cannot evaluate to blank parameter strings."); CliUI::pause(); return; }

        $content = CliUI::prompt("Enter document content payload body text");
        if (empty($content)) { CliUI::error("Content rows are mandatory for compliance trace metrics."); CliUI::pause(); return; }

        $this->repo->createDocument($title, $content, $this->sessionUser['name']);
        CliUI::success("Asset written to local database vault. Current State: DRAFT.");
        CliUI::pause();
    }

    private function submitForReviewFlow(): void {
        CliUI::header("Route Draft to Review Queue");
        $allDocs = $this->repo->getGlobalRegistry();
        
        $drafts = array_filter($allDocs, fn($d) => $d['current_status'] === 'DRAFT');
        
        $tableData = [];
        foreach ($drafts as $row) {
            $tableData[] = ['id' => $row['id'], 'title' => $row['title'], 'owner' => $row['owner_name']];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'title' => 'Document Title', 'owner' => 'Author Owner']);

        $id = (int)CliUI::prompt("Select Document ID to push to verification queue");
        if (!in_array($id, array_column($drafts, 'id'), true)) { CliUI::error("ID does not match outstanding drafts."); CliUI::pause(); return; }

        $notes = CliUI::prompt("Enter submission remarks summary text");
        
        $result = $this->repo->transitionDocumentState($id, 'SUBMIT', $notes, $this->sessionUser);
        if ($result === true) {
            CliUI::success("Workflow shifted. Status updated to PENDING_REVIEW.");
        } else {
            CliUI::error($result);
        }
        CliUI::pause();
    }

    private function processReviewInboxFlow(): void {
        CliUI::header("Review Inbox: Action Queue");
        $queue = $this->repo->getPendingQueue();

        if (empty($queue)) {
            CliUI::info("No documents are currently awaiting review pipelines.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($queue as $row) {
            $tableData[] = [
                'id'    => $row['id'],
                'title' => $row['title'],
                'owner' => $row['owner_name'],
                'body'  => strlen($row['content']) > 35 ? substr($row['content'], 0, 32) . "..." : $row['content']
            ];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'title' => 'Document Title', 'owner' => 'Author Node', 'body' => 'Document Content Preview']);

        $id = (int)CliUI::prompt("Select Document ID to inspect & verify");
        if (!in_array($id, array_column($queue, 'id'), true)) { CliUI::error("Selected reference parameters mismatch."); CliUI::pause(); return; }

        // Isolate targeted array record row for clear in-line validation visibility
        $targetDoc = null;
        foreach ($queue as $d) { if ((int)$d['id'] === $id) { $targetDoc = $d; break; } }

        echo "\n" . str_repeat("─", 75) . "\n";
        echo " " . CliUI::BOLD . "DOCUMENT CONTENT REVIEW READOUT:" . CliUI::RESET . "\n";
        echo " Title   : " . $targetDoc['title'] . "\n";
        echo " Content : " . CliUI::CYAN . $targetDoc['content'] . CliUI::RESET . "\n";
        echo str_repeat("─", 75) . "\n";

        echo "\n Decisions Matrix: [" . CliUI::GREEN . "A" . CliUI::RESET . "] Confirm Approval | [" . CliUI::RED . "R" . CliUI::RESET . "] Issue Rejection Lock\n";
        $actionKey = strtoupper(CliUI::prompt("Input command key"));

        if ($actionKey !== 'A' && $actionKey !== 'R') {
            CliUI::info("Action aborted. File pointers preserved.");
            CliUI::pause();
            return;
        }

        $action = ($actionKey === 'A') ? 'APPROVE' : 'REJECT';
        $notes = CliUI::prompt("Provide trace summary signature notes");

        $result = $this->repo->transitionDocumentState($id, $action, $notes, $this->sessionUser);
        
        if ($result === true) {
            CliUI::success("Authorization committed. Lifecycle status converted.");
        } else {
            CliUI::error($result);
        }
        CliUI::pause();
    }

    private function viewGlobalManifestGrid(): void {
        CliUI::header("Global Document Manifest Registry");
        $manifest = $this->repo->getGlobalRegistry();

        foreach ($manifest as &$row) {
            $row['badge'] = CliUI::statusBadge($row['current_status']);
            $row['hash_short'] = substr($row['content_hash'], 0, 10) . "...";
        }

        CliUI::drawTable($manifest, [
            'id' => 'ID', 'title' => 'Document Reference', 'owner_name' => 'Author Origin', 'hash_short' => 'Secure SHA Hash', 'badge' => 'Active Pipeline State'
        ]);
        CliUI::pause();
    }

    private function auditTrailAnalysisFlow(): void {
        CliUI::header("Audit Chronological History Ledger");
        $id = (int)CliUI::prompt("Enter target Document ID to pull compliance records");

        $logs = $this->repo->getAuditTrail($id);
        if (empty($logs)) { CliUI::error("No validated operational trails link to that tracking index."); CliUI::pause(); return; }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL SECURITY INTEGRITY LEDGER TRAIL FOR DOCUMENT #{$id}:" . CliUI::RESET . "\n";
        foreach ($logs as $log) {
            $color = ($log['action_taken'] === 'APPROVED' || $log['action_taken'] === 'SUBMITTED') ? CliUI::GREEN : CliUI::RED;
            $verifyText = $log['signature_verified'] 
                ? CliUI::GREEN . " [PASSED: CRYPTOGRAPHIC SIGNATURE MATCH] " . CliUI::RESET 
                : CliUI::RED . " [FAILED: MALICIOUS ALTERATION ALARM DETECTED] " . CliUI::RESET;

            echo "  ├─ [" . $log['actioned_at'] . "] " . CliUI::BOLD . $log['actor_name'] . " (" . $log['actor_role'] . ")" . CliUI::RESET . "\n";
            echo "  │  Action Type        : " . $color . $log['action_taken'] . CliUI::RESET . "\n";
            echo "  │  Integrity Check    : " . $verifyText . "\n";
            echo "  │  Review Notes       : " . CliUI::DIM . ($log['audit_notes'] ?: 'No structural notes supplied.') . CliUI::RESET . "\n";
        }
        echo "  └─ Operations Telemetry Review Concluded.\n";
        CliUI::pause();
    }

    private function switchContextFlow(array $users): void {
        CliUI::header("Assume Next Gatekeeper Identity Node");
        CliUI::drawTable($users, ['id' => 'ID', 'name' => 'Identity Full Name', 'role' => 'Assigned Clearance Role']);
        
        $id = (int)CliUI::prompt("Select target ID to assign dynamically into active context constraints");
        foreach ($users as $u) {
            if ((int)$u['id'] === $id) {
                $this->sessionUser = $u;
                CliUI::success("Authorization profile token assigned cleanly to: {$u['name']}.");
                return;
            }
        }
        CliUI::error("Selected key falls out of tracking matrix limits.");
        CliUI::pause();
    }

    private function simulateTamperingFlow(): void {
        CliUI::header("Simulate Out-of-Band Database Tampering");
        $id = (int)CliUI::prompt("Enter target Document ID to inject direct content text modifications");
        
        $maliciousChange = CliUI::prompt("Type altered payload string content (Malicious Injection string value)");
        if (empty($maliciousChange)) { return; }

        $this->repo->simulateBackdoorTampering($id, $maliciousChange);
        CliUI::success("SIMULATION COMPLETE: Document data has been modified on disk behind the scenes via raw database operations.");
        CliUI::pause();
    }
}

// ==========================================
// 4. Global System Execution Bootstrapper
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Monitoring Guard: Document authorization frameworks require standard command terminal shell pipelines.");
}

// Ensure this script is the entrypoint before booting the TUI loop
$isEntrypoint = false;
if (isset($argv[0])) {
    $entryScript = realpath($argv[0]);
    $currentScript = realpath(__FILE__);
    if ($entryScript && $currentScript && $entryScript === $currentScript) {
        $isEntrypoint = true;
    }
}

if ($isEntrypoint) {
    try {
        $app = new DocumentApprovalApp();
        $app->start();
    } catch (Exception $e) {
        echo "\n\e[31m\e[1mFatal Application Kernel Crash: \e[0m" . $e->getMessage() . "\n";
        exit(1);
    }
}

