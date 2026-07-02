#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Concurrency-Safe Customer Ticket Auto-Router
 * * Usage:
 * php ticket_router.php        (Interactive Supervisor Dashboard)
 * php ticket_router.php inject (Simulate a customer submitting a new ticket)
 * php ticket_router.php route  (Headless Background Cron Worker to route queues)
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
        echo "\n" . self::DIM . "Press Enter to return to main operations panel..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; }
    public static function daemonLog(string $msg): void { echo " [" . date('Y-m-d H:i:s') . "] " . self::CYAN . "[ROUTER] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'ONLINE', 'ASSIGNED' => self::GREEN . self::BOLD . " {$status} " . self::RESET,
            'OFFLINE'            => self::DIM . " {$status} " . self::RESET,
            'UNASSIGNED'         => self::YELLOW . self::BOLD . " {$status} " . self::RESET,
            default              => $status
        };
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No matching system operational metrics located.\n" . self::RESET;
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
// 2. Data Persistence Layer (SQLite Storage)
// ==========================================
class TicketRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/support_pipeline.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Customer Support Agents table
        $this->db->exec("CREATE TABLE IF NOT EXISTS agents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialty TEXT NOT NULL, -- TECHNICAL, BILLING
            status TEXT DEFAULT 'ONLINE' -- ONLINE, OFFLINE
        )");

        // Support Tickets Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_email TEXT NOT NULL,
            category TEXT NOT NULL, -- TECHNICAL, BILLING
            subject TEXT NOT NULL,
            routing_status TEXT DEFAULT 'UNASSIGNED', -- UNASSIGNED, ASSIGNED, ESCALATED
            agent_id INTEGER DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agents(id)
        )");

        // Structural database optimization indices
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_agents_routing ON agents(status, specialty)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_tickets_queue ON tickets(routing_status, created_at)");

        // Auto-seed baseline template records if workspace sandbox is empty
        if ($this->db->query("SELECT COUNT(*) FROM agents")->fetchColumn() == 0) {
            $stmt = $this->db->prepare("INSERT INTO agents (name, specialty, status) VALUES (?, ?, 'ONLINE')");
            $stmt->execute(['Alice Vance', 'TECHNICAL']);
            $stmt->execute(['Marcus Brody', 'BILLING']);
            $stmt->execute(['Elena Fisher', 'TECHNICAL']);
        }
    }

    public function createTicket(string $email, string $category, string $subject): void {
        $stmt = $this->db->prepare("INSERT INTO tickets (customer_email, category, subject) VALUES (?, ?, ?)");
        $stmt->execute([strtolower(trim($email)), $category, trim($subject)]);
    }

    public function getUnassignedQueue(): array {
        return $this->db->query("SELECT * FROM tickets WHERE routing_status = 'UNASSIGNED' ORDER BY created_at ASC")->fetchAll();
    }

    public function getAgentLoadMetrics(): array {
        return $this->db->query("
            SELECT a.id, a.name, a.specialty, a.status, COUNT(t.id) as active_tickets
            FROM agents a
            LEFT JOIN tickets t ON a.id = t.agent_id AND t.routing_status = 'ASSIGNED'
            GROUP BY a.id ORDER BY a.name ASC
        ")->fetchAll();
    }

    public function toggleAgentStatus(int $id, string $status): void {
        $stmt = $this->db->prepare("UPDATE agents SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
    }

    /**
     * Senior Auto-Routing Mechanism: Isolates routing tasks inside an atomic
     * transaction. Selects the matching online agent currently carrying the minimum
     * volume load. Fallbacks to a general manager routing if matching lanes are closed.
     */
    public function routeTicketAtomically(array $ticket): bool|string {
        $this->db->beginTransaction();
        try {
            // Find an online agent specializing in this specific ticket category, sorted by lowest live active load
            $agentStmt = $this->db->prepare("
                SELECT a.id, a.name 
                FROM agents a
                LEFT JOIN tickets t ON a.id = t.agent_id AND t.routing_status = 'ASSIGNED'
                WHERE a.status = 'ONLINE' AND a.specialty = ?
                GROUP BY a.id 
                ORDER BY COUNT(t.id) ASC LIMIT 1
            ");
            $agentStmt->execute([$ticket['category']]);
            $agent = $agentStmt->fetch();

            if ($agent) {
                // Route ticket directly to the targeted agent
                $updateTicket = $this->db->prepare("UPDATE tickets SET routing_status = 'ASSIGNED', agent_id = ? WHERE id = ?");
                $updateTicket->execute([$agent['id'], $ticket['id']]);
                
                $this->db->commit();
                return $agent['name'];
            }

            // Fallback Safe Mode Strategy: No specialists found online. Elevate to ESCALATED triage lane.
            $escalateTicket = $this->db->prepare("UPDATE tickets SET routing_status = 'ESCALATED', agent_id = NULL WHERE id = ?");
            $escalateTicket->execute([$ticket['id']]);
            
            $this->db->commit();
            return 'ESCALATED_TO_MANAGEMENT_POOL';

        } catch (PDOException $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}

// ==========================================
// 3. System Core Pipeline Orchestrator
// ==========================================
class TicketRouterApp {
    private TicketRepository $repo;

    public function __construct() {
        $this->repo = new TicketRepository();
    }

    // --- SUPERVISOR INTERACTIVE TUI ---
    public function dashboard(): void {
        while (true) {
            $agents = $this->repo->getAgentLoadMetrics();
            $unassignedCount = count($this->repo->getUnassignedQueue());
            
            CliUI::header("Omni-Channel Ticket Routing Gateway", "Staging Backlog Queue Count: {$unassignedCount}");

            $tableData = [];
            foreach ($agents as $row) {
                $tableData[] = [
                    'id'           => $row['id'],
                    'name'         => $row['name'],
                    'specialty'    => $row['specialty'],
                    'status'       => CliUI::statusBadge($row['status']),
                    'active_loads' => $row['active_tickets'] . " active tickets"
                ];
            }

            CliUI::drawTable($tableData, [
                'id' => 'ID', 'name' => 'Support Engineer', 'specialty' => 'Assigned Skill Context', 'status' => 'Duty State', 'active_loads' => 'Queue Load Balance'
            ]);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Toggle Support Engineer Availability (Online/Offline)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Fire Ad-Hoc Auto-Routing Sweep Task (Process Queue)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Severe interactive console tracking links\n\n";

            switch (CliUI::prompt("Select Action Route Key")) {
                case '1': $this->toggleAgentAvailability($agents); break;
                case '2': $this->processRoutingQueue(false); CliUI::pause(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Routing infrastructure nodes disconnected safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function toggleAgentAvailability(array $agents): void {
        CliUI::header("Modify Staff Operational States");
        $id = (int)CliUI::prompt("Enter target staff user ID");
        
        $match = null;
        foreach ($agents as $agent) {
            if ((int)$agent['id'] === $id) { $match = $agent; break; }
        }

        if (!$match) {
            CliUI::error("Target identity context reference parameters could not be resolved.");
            CliUI::pause();
            return;
        }

        $nextState = $match['status'] === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
        $this->repo->toggleAgentStatus($id, $nextState);
        CliUI::success("Status modified. Engineer is now flagged {$nextState}.");
        sleep(1);
    }

    // --- AUTOMATED HEADLESS BACKGROUND DAEMON WORKER ---
    public function processRoutingQueue(bool $headlessMode = true): void {
        if ($headlessMode) {
            CliUI::daemonLog("Scanning unassigned support queue arrays for processing blocks...");
        } else {
            echo "Processing queue routing matrices...\n";
        }

        $queue = $this->repo->getUnassignedQueue();
        $processedCount = 0;

        foreach ($queue as $ticket) {
            $routingResult = $this->repo->routeTicketAtomically($ticket);
            
            if ($headlessMode) {
                CliUI::daemonLog("Ticket #{$ticket['id']} [{$ticket['category']}] -> Routed to: {$routingResult}");
            } else {
                $color = $routingResult === 'ESCALATED_TO_MANAGEMENT_POOL' ? CliUI::YELLOW : CliUI::GREEN;
                echo "  ➜ Ticket [#" . CliUI::YELLOW . $ticket['id'] . CliUI::RESET . "] categorized '{$ticket['category']}' -> Routed to: {$color}{$routingResult}" . CliUI::RESET . "\n";
            }
            $processedCount++;
            
            usleep(40000); // 40ms buffer to prevent resource locks on database networks
        }

        $summaryText = "Queue scanning sequence finalized. Total tickets distributed: {$processedCount}";
        if ($headlessMode) {
            CliUI::daemonLog($summaryText);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $summaryText . CliUI::RESET . "\n";
        }
    }

    public function runMockInjection(): void {
        $categories = ['TECHNICAL', 'BILLING'];
        $selectedCategory = $categories[array_rand($categories)];
        
        $subjects = [
            'TECHNICAL' => ['Database latency index errors on API layer', 'Unable to negotiate SSL handshake certificates', 'Volumetric packet drop on local routing cluster'],
            'BILLING'   => ['Duplicate corporate subscription invoice processing', 'Update primary corporate credit card payment token', 'Requesting dynamic cross-border tax exemptions documentation']
        ];
        $selectedSubject = $subjects[$selectedCategory][array_rand($subjects[$selectedCategory])];
        $mockEmail = "enterprise_client_" . rand(10, 99) . "@corporate.com";

        $this->repo->createTicket($mockEmail, $selectedCategory, $selectedSubject);
        echo "\n \e[32m✔ Simulation Hook Injected: Customer ticket written safely to unassigned backlog.\e[0m\n\n";
    }
}

// ==========================================
// 4. Runtime Ingestion Guard Bootstrapper
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System failure error: Automated data routing blocks require standard command terminal shell pipelines.");
}

$app = new TicketRouterApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === 'route') {
    $app->processRoutingQueue(true);
} elseif ($mode === 'inject') {
    $app->runMockInjection();
} else {
    $app->dashboard();
}
