#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Lead Capture & High-Equity Assignment Engine
 * * Usage:
 * php lead_distributor.php          (Interactive Sales Team Dashboard)
 * php lead_distributor.php capture  (Simulate an inbound web form capture)
 * php lead_distributor.php process  (Headless Cron Worker to route queues)
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

    public static function prompt(string $message): string {
        echo self::BOLD . $message . self::RESET . ": ";
        return trim(fgets(STDIN));
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to main matrix node..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[WORKER] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'ACTIVE', 'ASSIGNED' => self::GREEN . self::BOLD . " {$status} " . self::RESET,
            'INACTIVE'           => self::DIM . " {$status} " . self::RESET,
            'UNASSIGNED'         => self::YELLOW . self::BOLD . " {$status} " . self::RESET,
            default              => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No matching data sets located.\n" . self::RESET;
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
// 2. Data Infrastructure Layer (SQLite)
// ==========================================
class LeadRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/lead_pipeline.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Sales Representatives table
        $this->db->exec("CREATE TABLE IF NOT EXISTS sales_reps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
            last_assigned_at DATETIME DEFAULT '1970-01-01 00:00:00'
        )");

        // Leads pipeline table
        $this->db->exec("CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            contact_email TEXT NOT NULL,
            assignment_status TEXT DEFAULT 'UNASSIGNED', -- UNASSIGNED, ASSIGNED
            sales_rep_id INTEGER DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sales_rep_id) REFERENCES sales_reps(id)
        )");

        // Structural indexing performance optimizations
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_reps_avail ON sales_reps(status, last_assigned_at)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_leads_queue ON leads(assignment_status, created_at)");

        // Seed initial simulation records if testing sandbox is clean
        if ($this->db->query("SELECT COUNT(*) FROM sales_reps")->fetchColumn() == 0) {
            $stmt = $this->db->prepare("INSERT INTO sales_reps (name, status) VALUES (?, 'ACTIVE')");
            $stmt->execute(['Alice Vance']);
            $stmt->execute(['Marcus Brody']);
            $stmt->execute(['Elena Fisher']);
        }
    }

    public function captureLead(string $company, string $email): void {
        $stmt = $this->db->prepare("INSERT INTO leads (company_name, contact_email) VALUES (?, ?)");
        $stmt->execute([trim($company), strtolower(trim($email))]);
    }

    public function getUnassignedQueue(): array {
        return $this->db->query("SELECT * FROM leads WHERE assignment_status = 'UNASSIGNED' ORDER BY created_at ASC")->fetchAll();
    }

    public function getSalesRepsPerformance(): array {
        return $this->db->query("
            SELECT r.id, r.name, r.status, r.last_assigned_at, COUNT(l.id) as allocated_leads
            FROM sales_reps r
            LEFT JOIN leads l ON r.id = l.sales_rep_id
            GROUP BY r.id ORDER BY r.name ASC
        ")->fetchAll();
    }

    public function toggleRepStatus(int $id, string $status): void {
        $stmt = $this->db->prepare("UPDATE sales_reps SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
    }

    /**
     * Senior Distribution Engine Pattern: Extracts the active representative who has
     * spent the longest time waiting since their last allocation block. Wraps execution
     * in an isolated transaction block to guard against race conditions.
     */
    public function routeNextLeadToNextRep(array $lead): bool {
        $this->db->beginTransaction();
        try {
            // Find the least-recently assigned active representative
            $repStmt = $this->db->query("
                SELECT id FROM sales_reps 
                WHERE status = 'ACTIVE' 
                ORDER BY last_assigned_at ASC LIMIT 1
            ");
            $repId = $repStmt->fetchColumn();

            if (!$repId) {
                $this->db->rollBack();
                return false; // No active representatives available to receive allocation
            }

            $timestamp = date('Y-m-d H:i:s');

            // 1. Assign lead to selected representative
            $leadStmt = $this->db->prepare("UPDATE leads SET assignment_status = 'ASSIGNED', sales_rep_id = ?, created_at = ? WHERE id = ?");
            $leadStmt->execute([$repId, $timestamp, $lead['id']]);

            // 2. Mutate the rotation pointer timestamp instantly to pass priority back down the line
            $repUpdate = $this->db->prepare("UPDATE sales_reps SET last_assigned_at = ? WHERE id = ?");
            $repUpdate->execute([$timestamp, $repId]);

            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}

// ==========================================
// 3. Main Business Logic Orchestrator
// ==========================================
class LeadCaptureApp {
    private LeadRepository $repo;

    public function __construct() {
        $this->repo = new LeadRepository();
    }

    // --- MANAGERIAL WORKSPACE TUI ---
    public function dashboard(): void {
        while (true) {
            $reps = $this->repo->getSalesRepsPerformance();
            $unassignedCount = count($this->repo->getUnassignedQueue());
            
            CliUI::header("Lead Routing & Distribution Center", "Pending Processing Queue Volume: {$unassignedCount}");

            $tableData = [];
            foreach ($reps as $row) {
                $tableData[] = [
                    'id'           => $row['id'],
                    'name'         => $row['name'],
                    'status'       => CliUI::statusBadge($row['status']),
                    'last_seen'    => $row['last_assigned_at'] === '1970-01-01 00:00:00' ? 'Never' : $row['last_assigned_at'],
                    'volume_count' => $row['allocated_leads'] . " leads assigned"
                ];
            }

            CliUI::drawTable($tableData, [
                'id' => 'ID', 'name' => 'Account Director', 'status' => 'Duty State', 'last_seen' => 'Last Assigned Allocation', 'volume_count' => 'Historical Share'
            ]);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Toggle Representative Availability Status (Active/Inactive)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Trigger Ad-Hoc Queue Router (Process Pipeline)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Sever interactive workspace links\n\n";

            switch (CliUI::prompt("Select Task Target")) {
                case '1': $this->toggleRepAvailability($reps); break;
                case '2': $this->processQueue(false); CliUI::pause(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Operational data pipelines safely closed.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function toggleRepAvailability(array $reps): void {
        CliUI::header("Toggle Staff Availability Status");
        $id = (int)CliUI::prompt("Enter target user ID");
        
        $match = null;
        foreach ($reps as $rep) {
            if ((int)$rep['id'] === $id) { $match = $rep; break; }
        }

        if (!$match) {
            CliUI::error("User ID reference unresolved.");
            CliUI::pause();
            return;
        }

        $nextState = $match['status'] === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        $this->repo->toggleRepStatus($id, $nextState);
        CliUI::success("Status modification saved. Account flipped to {$nextState}.");
        sleep(1);
    }

    // --- HEADLESS PIPELINE CONTEXT WORKER ---
    public function processQueue(bool $headlessMode = true): void {
        if ($headlessMode) {
            CliUI::stepLog("Querying staging data frames for raw unassigned entries...");
        } else {
            echo "Processing queue operations sequence...\n";
        }

        $queue = $this->repo->getUnassignedQueue();
        $assignedCount = 0;

        foreach ($queue as $lead) {
            $success = $this->repo->routeNextLeadToNextRep($lead);
            
            if ($success) {
                if ($headlessMode) {
                    CliUI::stepLog("Idempotent assignment executed: Lead #{$lead['id']} mapped safely to next rep.");
                } else {
                    echo "  ➜ Lead [#" . CliUI::YELLOW . $lead['id'] . CliUI::RESET . "] from '{$lead['company_name']}' routed successfully.\n";
                }
                $assignedCount++;
            } else {
                if ($headlessMode) {
                    CliUI::stepLog("[WARNING] Pipeline stalled: Zero active representatives are currently flagged available.");
                } else {
                    echo "  " . CliUI::RED . "⚠ Pipeline halted: No available active representatives found." . CliUI::RESET . "\n";
                }
                break;
            }
            
            usleep(50000); // Small 50ms block to prevent thread starvation on large updates
        }

        $finalMsg = "Queue routing sweep complete. Total workloads assigned: {$assignedCount}";
        if ($headlessMode) {
            CliUI::stepLog($finalMsg);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $finalMsg . CliUI::RESET . "\n";
        }
    }

    public function runMockCapture(): void {
        // Simulates an API call capturing values from a web form webhook entry point
        $companies = ['Tyrell Corp', 'Omni Consumer Products', 'Initech LLC', 'Hooli Inc', 'Soylent Corp'];
        $selectedCompany = $companies[array_rand($companies)];
        $mockEmail = "contact@" . strtolower(str_replace(' ', '', $selectedCompany)) . ".io";

        $this->repo->captureLead($selectedCompany, $mockEmail);
        echo "\n \e[32m✔ Live Lead Capture Simulated: Ingested entry from '{$selectedCompany}' into unassigned queue staging bounds.\e[0m\n\n";
    }
}

// ==========================================
// 4. Execution Guard Pipeline Bootstrapper
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System error: Data routing nodes can only run inside active terminal tasks.");
}

$app = new LeadCaptureApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === 'process') {
    $app->processQueue(true);
} elseif ($mode === 'capture') {
    $app->runMockCapture();
} else {
    $app->dashboard();
}
