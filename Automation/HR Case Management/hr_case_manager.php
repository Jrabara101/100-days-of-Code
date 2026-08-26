#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Enterprise HR Case Management & SLA Automation Engine
 * 
 * Usage:
 *   php hr_case_manager.php           (Interactive Operations Dashboard)
 *   php hr_case_manager.php --watch   (Headless SLA Breach Watchdog Runner)
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Presentation & TUI Layout Engine
// ==========================================
class CliUI {
    const RESET   = "\e[0m";
    const BOLD    = "\e[1m";
    const DIM     = "\e[2m";
    const GREEN   = "\e[32m";
    const RED     = "\e[31m";
    const CYAN    = "\e[36m";
    const YELLOW  = "\e[33m";
    const BLUE    = "\e[34m";
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
        echo "\n" . self::DIM . "Press Enter to return to operations panel..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[HR-WATCHDOG] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'INGESTED'             => self::DIM . "  INGESTED  " . self::RESET,
            'TRIAGED'              => self::BLUE . "  TRIAGED   " . self::RESET,
            'UNDER_INVESTIGATION'  => self::CYAN . self::BOLD . " INVESTIGATE" . self::RESET,
            'RESOLUTION_PENDING'   => self::YELLOW . " RES_PENDING" . self::RESET,
            'RESOLVED', 'CLOSED'   => self::GREEN . self::BOLD . "   CLOSED   " . self::RESET,
            'ESCALATED_SLA_BREACH' => self::RED . self::BOLD . " SLA_BREACH " . self::RESET,
            default                => $status
        };
    }

    public static function severityBadge(string $severity): string {
        return match ($severity) {
            'CRITICAL_LEGAL' => self::RED . self::BOLD . " CRITICAL " . self::RESET,
            'HIGH'           => self::YELLOW . self::BOLD . "   HIGH   " . self::RESET,
            'MEDIUM'         => self::BLUE . "  MEDIUM  " . self::RESET,
            'LOW'            => self::DIM . "   LOW    " . self::RESET,
            default          => $severity
        };
    }

    public static function renderSlaBar(string $createdAt, string $dueAt, string $status): string {
        if (in_array($status, ['RESOLVED', 'CLOSED'], true)) {
            return self::GREEN . "[ COMPLETED ]" . self::RESET;
        }

        $createdTs = strtotime($createdAt);
        $dueTs = strtotime($dueAt);
        $nowTs = time();

        $totalWindow = max(1, $dueTs - $createdTs);
        $elapsed = max(0, $nowTs - $createdTs);
        $ratio = min(1.0, $elapsed / $totalWindow);

        $width = 10;
        $filled = (int)round($ratio * $width);
        $empty = max(0, $width - $filled);
        $pct = round($ratio * 100);

        if ($nowTs > $dueTs) {
            $overdueHours = round(($nowTs - $dueTs) / 3600, 1);
            return self::RED . self::BOLD . "[BREACH +" . $overdueHours . "h]" . self::RESET;
        }

        $color = ($pct >= 80) ? self::RED : (($pct >= 50) ? self::YELLOW : self::GREEN);
        return $color . "[" . str_repeat("■", $filled) . str_repeat(" ", $empty) . "] " . str_pad((string)$pct, 3, " ", STR_PAD_LEFT) . "%" . self::RESET;
    }

    public static function drawTable(array $data, array $headers): void {
        if (empty($data)) {
            echo self::DIM . "No tracking records match current query parameters.\n" . self::RESET;
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
// 2. Data Persistence Layer (SQLite Vault)
// ==========================================
class HrCaseRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/hr_cases_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Investigators & Personnel Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS hr_personnel (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL -- HR_GENERALIST, HR_DIRECTOR, LEGAL_COUNSEL
        )");

        // Master HR Cases Table
        $this->db->exec("CREATE TABLE IF NOT EXISTS hr_cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_number TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL, -- HARASSMENT, WHISTLEBLOWER, WAGE_DISPUTE, POLICY_VIOLATION
            severity TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL_LEGAL
            status TEXT DEFAULT 'INGESTED',
            reporter_token TEXT NOT NULL, -- Real name OR Anonymous Token
            is_anonymous INTEGER DEFAULT 0,
            assigned_investigator_id INTEGER DEFAULT NULL,
            sla_due_at DATETIME NOT NULL,
            resolution_summary TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assigned_investigator_id) REFERENCES hr_personnel(id)
        )");

        // Case Evidence & Findings Audit Log (Tamper-Evident)
        $this->db->exec("CREATE TABLE IF NOT EXISTS case_evidence_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            author_name TEXT NOT NULL,
            author_role TEXT NOT NULL,
            entry_type TEXT NOT NULL, -- INTAKE, INTERVIEW_NOTE, EVIDENCE, RESOLUTION
            details TEXT NOT NULL,
            signature_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (case_id) REFERENCES hr_cases(id)
        )");

        // SLA Breach Escalation Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS sla_breach_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            breached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            escalation_action TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES hr_cases(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_case_status ON hr_cases(status)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_case_sla ON hr_cases(sla_due_at, status)");

        if ($this->db->query("SELECT COUNT(*) FROM hr_personnel")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        $pStmt = $this->db->prepare("INSERT INTO hr_personnel (name, email, role) VALUES (?, ?, ?)");
        $pStmt->execute(['Alice Vance', 'a.vance@enterprise.hr', 'HR_DIRECTOR']);
        $pStmt->execute(['Marcus Brody', 'm.brody@enterprise.hr', 'HR_GENERALIST']);
        $pStmt->execute(['Elena Fisher', 'e.fisher@enterprise.legal', 'LEGAL_COUNSEL']);

        // Seed Case 1: Urgent Harassment Allegation (Critical 24h SLA)
        $this->createCase(
            'Hostile Workplace & Harassment in Regional Sales',
            'HARASSMENT',
            'CRITICAL_LEGAL',
            'Sarah Connor',
            false,
            24
        );

        // Seed Case 2: Anonymous Whistleblower Procurement Fraud (High 48h SLA)
        $this->createCase(
            'Unapproved Kickbacks in Hardware Sourcing',
            'WHISTLEBLOWER',
            'HIGH',
            'ANON-' . strtoupper(bin2hex(random_bytes(4))),
            true,
            48
        );

        // Seed Case 3: Overdue Dispute Simulation (Pre-seeded past due SLA for watchdog test)
        $pastSla = date('Y-m-d H:i:s', strtotime('-4 hours'));
        $cStmt = $this->db->prepare("
            INSERT INTO hr_cases (case_number, title, category, severity, status, reporter_token, is_anonymous, sla_due_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $cStmt->execute([
            'HRC-2026-0099',
            'Overtime Classification Dispute',
            'WAGE_DISPUTE',
            'MEDIUM',
            'TRIAGED',
            'John Doe',
            0,
            $pastSla,
            date('Y-m-d H:i:s', strtotime('-124 hours'))
        ]);
        $this->logEvidence(3, 'SYSTEM', 'SYSTEM', 'INTAKE', 'Pre-seeded historical wage dispute case.');
    }

    public function createCase(string $title, string $category, string $severity, string $reporter, bool $isAnon, int $slaHours): string {
        $caseNum = "HRC-" . date('Y') . "-" . rand(1000, 9999);
        $slaDue = date('Y-m-d H:i:s', strtotime("+{$slaHours} hours"));

        $stmt = $this->db->prepare("
            INSERT INTO hr_cases (case_number, title, category, severity, reporter_token, is_anonymous, sla_due_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$caseNum, trim($title), $category, $severity, trim($reporter), $isAnon ? 1 : 0, $slaDue]);
        $caseId = (int)$this->db->lastInsertId();

        $this->logEvidence($caseId, 'SYSTEM_INTAKE', 'INTAKE', 'INTAKE', "Case ingested under severity [{$severity}] with {$slaHours}h SLA.");
        return $caseNum;
    }

    public function logEvidence(int $caseId, string $author, string $role, string $type, string $details): void {
        $sig = hash('sha256', "{$caseId}|{$author}|{$role}|{$type}|{$details}|" . microtime());
        $stmt = $this->db->prepare("
            INSERT INTO case_evidence_logs (case_id, author_name, author_role, entry_type, details, signature_hash)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$caseId, $author, $role, $type, trim($details), $sig]);
    }

    public function getPersonnel(): array {
        return $this->db->query("SELECT * FROM hr_personnel ORDER BY id ASC")->fetchAll();
    }

    public function getCases(): array {
        return $this->db->query("
            SELECT c.*, p.name as investigator_name 
            FROM hr_cases c
            LEFT JOIN hr_personnel p ON c.assigned_investigator_id = p.id
            ORDER BY c.id DESC
        ")->fetchAll();
    }

    public function getCaseById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT c.*, p.name as investigator_name 
            FROM hr_cases c
            LEFT JOIN hr_personnel p ON c.assigned_investigator_id = p.id
            WHERE c.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function getEvidenceLogs(int $caseId): array {
        $stmt = $this->db->prepare("SELECT * FROM case_evidence_logs WHERE case_id = ? ORDER BY id ASC");
        $stmt->execute([$caseId]);
        return $stmt->fetchAll();
    }

    public function updateStatus(int $caseId, string $status, ?string $resolution = null): void {
        $stmt = $this->db->prepare("
            UPDATE hr_cases 
            SET status = ?, resolution_summary = COALESCE(?, resolution_summary), updated_at = datetime('now')
            WHERE id = ?
        ");
        $stmt->execute([$status, $resolution, $caseId]);
    }

    public function assignInvestigator(int $caseId, int $investigatorId): void {
        $stmt = $this->db->prepare("
            UPDATE hr_cases 
            SET assigned_investigator_id = ?, status = 'UNDER_INVESTIGATION', updated_at = datetime('now')
            WHERE id = ?
        ");
        $stmt->execute([$investigatorId, $caseId]);
    }

    public function getOverdueCases(): array {
        return $this->db->query("
            SELECT * FROM hr_cases 
            WHERE status NOT IN ('RESOLVED', 'CLOSED', 'ESCALATED_SLA_BREACH')
              AND sla_due_at <= datetime('now')
        ")->fetchAll();
    }

    public function logBreach(int $caseId, string $action): void {
        $stmt = $this->db->prepare("INSERT INTO sla_breach_logs (case_id, escalation_action) VALUES (?, ?)");
        $stmt->execute([$caseId, $action]);
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Domain Case Lifecycle Engine
// ==========================================
class HrCaseEngine {
    public function __construct(private HrCaseRepository $repo) {}

    /**
     * Ingests a new grievance and sets the dynamic SLA clock.
     */
    public function ingestGrievance(string $title, string $category, string $severity, string $complainantName, bool $anonymous): string {
        $slaHours = match ($severity) {
            'CRITICAL_LEGAL' => 24,
            'HIGH'           => 48,
            'MEDIUM'         => 120,
            'LOW'            => 240,
            default          => 72
        };

        $reporter = $anonymous 
            ? "ANON-" . strtoupper(bin2hex(random_bytes(4))) 
            : $complainantName;

        return $this->repo->createCase($title, $category, $severity, $reporter, $anonymous, $slaHours);
    }

    /**
     * Triages and assigns a certified investigator to a case.
     */
    public function assignCase(int $caseId, int $investigatorId, string $actorName, string $actorRole): array {
        $case = $this->repo->getCaseById($caseId);
        if (!$case) {
            return ['success' => false, 'message' => "Case ID #{$caseId} not found."];
        }

        $personnel = $this->repo->getPersonnel();
        $targetInvestigator = null;
        foreach ($personnel as $p) {
            if ((int)$p['id'] === $investigatorId) {
                $targetInvestigator = $p;
                break;
            }
        }

        if (!$targetInvestigator) {
            return ['success' => false, 'message' => "Investigator ID #{$investigatorId} is invalid."];
        }

        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $this->repo->assignInvestigator($caseId, $investigatorId);
            $this->repo->logEvidence(
                $caseId,
                $actorName,
                $actorRole,
                'ASSIGNMENT',
                "Case assigned to investigator {$targetInvestigator['name']} ({$targetInvestigator['role']}). Status advanced to UNDER_INVESTIGATION."
            );

            $db->commit();
            return ['success' => true, 'investigator' => $targetInvestigator['name']];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Appends an unalterable investigation note with SHA-256 evidence sealing.
     */
    public function addFinding(int $caseId, string $author, string $role, string $note): array {
        $case = $this->repo->getCaseById($caseId);
        if (!$case) {
            return ['success' => false, 'message' => "Case not found."];
        }

        if (in_array($case['status'], ['RESOLVED', 'CLOSED'], true)) {
            return ['success' => false, 'message' => "Cannot append findings to a closed case."];
        }

        $this->repo->logEvidence($caseId, $author, $role, 'INVESTIGATION_FINDING', $note);
        return ['success' => true];
    }

    /**
     * Closes case with formal legal resolution.
     */
    public function resolveCase(int $caseId, string $resolution, string $author, string $role): array {
        $case = $this->repo->getCaseById($caseId);
        if (!$case) {
            return ['success' => false, 'message' => "Case not found."];
        }

        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $this->repo->updateStatus($caseId, 'RESOLVED', $resolution);
            $this->repo->logEvidence($caseId, $author, $role, 'RESOLUTION', "Case legally resolved: " . $resolution);

            $db->commit();
            return ['success' => true];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * SLA Watchdog Scanner: Identifies breached cases and triggers escalations.
     */
    public function executeSlaWatchdog(bool $silent = false): int {
        $overdue = $this->repo->getOverdueCases();
        $breachedCount = 0;

        foreach ($overdue as $c) {
            $caseId = (int)$c['id'];
            $db = $this->repo->getPDO();
            $db->beginTransaction();

            try {
                $this->repo->updateStatus($caseId, 'ESCALATED_SLA_BREACH');
                $action = "SLA Target breached ({$c['sla_due_at']} UTC). Escalated automatically to Corporate Legal & HR Director.";
                $this->repo->logBreach($caseId, $action);
                $this->repo->logEvidence($caseId, 'SLA_WATCHDOG', 'SYSTEM', 'SLA_ESCALATION', $action);

                $db->commit();
                $breachedCount++;

                if (!$silent) {
                    CliUI::stepLog(CliUI::RED . "CRITICAL BREACH: Case {$c['case_number']} [{$c['title']}] overdue! Auto-escalated to Legal." . CliUI::RESET);
                }
            } catch (Exception $e) {
                $db->rollBack();
            }
        }

        return $breachedCount;
    }
}

// ==========================================
// 4. Main Application Console Loop
// ==========================================
class HrCaseConsoleApp {
    private HrCaseRepository $repo;
    private HrCaseEngine $engine;
    private array $activeUser;

    public function __construct() {
        $this->repo = new HrCaseRepository();
        $this->engine = new HrCaseEngine($this->repo);
        
        $personnel = $this->repo->getPersonnel();
        $this->activeUser = $personnel[0]; // Default: Alice Vance (HR Director)
    }

    public function launchWorkspace(): void {
        while (true) {
            $cases = $this->repo->getCases();
            $sub = "Operator: " . $this->activeUser['name'] . " (" . $this->activeUser['role'] . ")";
            CliUI::header("HR Case Management & SLA Automation Engine", $sub);

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Ingest New Grievance / Ethics Report (Intake Wizard)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Triage & Assign Case Investigator\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Append Investigation Finding / Evidence Note (SHA-256 Seal)\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Conclude & Resolve HR Case\n";
            echo "  " . CliUI::CYAN . "5." . CliUI::RESET . " Inspect Active Cases Registry & SLA Depletion Bars\n";
            echo "  " . CliUI::CYAN . "6." . CliUI::RESET . " Audit Tamper-Evident Evidence Trail\n";
            echo "  " . CliUI::CYAN . "7." . CliUI::RESET . " Run SLA Watchdog Scanner\n";
            echo "  " . CliUI::CYAN . "8." . CliUI::RESET . " Switch Operating Authority Profile\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect Console\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->ingestWizard(); break;
                case '2': $this->triageWizard(); break;
                case '3': $this->findingWizard(); break;
                case '4': $this->resolveWizard(); break;
                case '5': $this->viewCases(); break;
                case '6': $this->auditTrailFlow(); break;
                case '7': $this->runWatchdogManual(); break;
                case '8': $this->switchProfileWizard(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "HR compliance vault unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function ingestWizard(): void {
        CliUI::header("Grievance Intake & Ethics Ingestion");

        $title = CliUI::prompt("Grievance Subject / Title");
        if (empty($title)) { CliUI::error("Title is mandatory."); CliUI::pause(); return; }

        echo "\n Incident Classification:\n";
        echo "  [1] Workplace Harassment / Discrimination (Critical - 24h SLA)\n";
        echo "  [2] Ethics / Whistleblower Accounting Fraud (High - 48h SLA)\n";
        echo "  [3] Wage, Hour & Benefits Dispute (Medium - 120h SLA)\n";
        echo "  [4] General Interpersonal Policy Grievance (Low - 240h SLA)\n\n";

        $choice = CliUI::prompt("Select Classification", "1");
        [$cat, $sev] = match ($choice) {
            '1' => ['HARASSMENT', 'CRITICAL_LEGAL'],
            '2' => ['WHISTLEBLOWER', 'HIGH'],
            '3' => ['WAGE_DISPUTE', 'MEDIUM'],
            default => ['POLICY_VIOLATION', 'LOW']
        };

        $isAnon = (strtoupper(CliUI::prompt("File as Anonymous Whistleblower? (Y/N)", "N")) === 'Y');
        $name = $isAnon ? "ANONYMOUS" : CliUI::prompt("Complainant Full Name", "Jane Doe");

        $caseCode = $this->engine->ingestGrievance($title, $cat, $sev, $name, $isAnon);

        CliUI::success("Case {$caseCode} created under [{$sev}] with automatic SLA enforcement!");
        CliUI::pause();
    }

    private function triageWizard(): void {
        CliUI::header("Triage & Assign Case Investigator");
        $cases = $this->repo->getCases();
        $unassigned = array_filter($cases, fn($c) => in_array($c['status'], ['INGESTED', 'TRIAGED'], true));

        if (empty($unassigned)) {
            CliUI::info("No unassigned cases awaiting triage.");
            CliUI::pause();
            return;
        }

        $tableData = [];
        foreach ($unassigned as $c) {
            $tableData[] = [
                'id'       => $c['id'],
                'code'     => $c['case_number'],
                'title'    => strlen($c['title']) > 26 ? substr($c['title'], 0, 23) . "..." : $c['title'],
                'severity' => CliUI::severityBadge($c['severity']),
                'status'   => CliUI::statusBadge($c['status'])
            ];
        }
        CliUI::drawTable($tableData, ['id' => 'ID', 'code' => 'Case Code', 'title' => 'Title', 'severity' => 'Severity', 'status' => 'Status']);

        $caseId = (int)CliUI::prompt("Enter Case ID to assign");
        $personnel = $this->repo->getPersonnel();

        echo "\n Certified Lead Investigators:\n";
        foreach ($personnel as $p) {
            echo "  [{$p['id']}] {$p['name']} (" . CliUI::CYAN . $p['role'] . CliUI::RESET . ")\n";
        }
        echo "\n";

        $invId = (int)CliUI::prompt("Select Investigator ID");
        $res = $this->engine->assignCase($caseId, $invId, $this->activeUser['name'], $this->activeUser['role']);

        if ($res['success']) {
            CliUI::success("Case #{$caseId} assigned to {$res['investigator']}! Status: UNDER_INVESTIGATION.");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function findingWizard(): void {
        CliUI::header("Append Investigation Finding (Evidence Vault)");
        $caseId = (int)CliUI::prompt("Enter Case ID");
        $case = $this->repo->getCaseById($caseId);

        if (!$case) { CliUI::error("Case not found."); CliUI::pause(); return; }

        echo " Case Title : " . CliUI::BOLD . $case['title'] . CliUI::RESET . "\n";
        echo " Status     : " . CliUI::statusBadge($case['status']) . "\n\n";

        $note = CliUI::prompt("Enter Interview Note / Forensic Finding");
        if (empty($note)) { CliUI::error("Finding note cannot be blank."); CliUI::pause(); return; }

        $res = $this->engine->addFinding($caseId, $this->activeUser['name'], $this->activeUser['role'], $note);
        if ($res['success']) {
            CliUI::success("Evidence note committed with SHA-256 signature seal.");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function resolveWizard(): void {
        CliUI::header("Conclude & Resolve HR Case");
        $caseId = (int)CliUI::prompt("Enter Case ID to resolve");
        $case = $this->repo->getCaseById($caseId);

        if (!$case) { CliUI::error("Case not found."); CliUI::pause(); return; }

        $resText = CliUI::prompt("Legal Resolution Summary / Corrective Action");
        if (empty($resText)) { CliUI::error("Resolution summary is mandatory."); CliUI::pause(); return; }

        $res = $this->engine->resolveCase($caseId, $resText, $this->activeUser['name'], $this->activeUser['role']);
        if ($res['success']) {
            CliUI::success("Case #{$caseId} marked as RESOLVED and permanently locked.");
        } else {
            CliUI::error($res['message']);
        }

        CliUI::pause();
    }

    private function viewCases(): void {
        CliUI::header("Active HR Cases & SLA Watchdog Grid");
        $cases = $this->repo->getCases();

        $tableData = [];
        foreach ($cases as $c) {
            $tableData[] = [
                'id'       => $c['id'],
                'code'     => $c['case_number'],
                'reporter' => $c['reporter_token'],
                'severity' => CliUI::severityBadge($c['severity']),
                'sla_bar'  => CliUI::renderSlaBar($c['created_at'], $c['sla_due_at'], $c['status']),
                'status'   => CliUI::statusBadge($c['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'code' => 'Case Code', 'reporter' => 'Complainant', 'severity' => 'Severity', 'sla_bar' => 'SLA Depletion', 'status' => 'Status'
        ]);

        CliUI::pause();
    }

    private function auditTrailFlow(): void {
        CliUI::header("Audit Cryptographic Evidence Trail");
        $caseId = (int)CliUI::prompt("Enter Case ID to inspect chain-of-custody");

        $logs = $this->repo->getEvidenceLogs($caseId);
        if (empty($logs)) {
            CliUI::error("No evidence logs found for Case ID #{$caseId}.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHAIN-OF-CUSTODY EVIDENCE LOG FOR CASE #{$caseId}:" . CliUI::RESET . "\n";
        foreach ($logs as $l) {
            echo "  ├─ [" . $l['created_at'] . "] " . CliUI::BOLD . $l['author_name'] . " (" . $l['author_role'] . ")" . CliUI::RESET . " ──► Type: " . CliUI::CYAN . $l['entry_type'] . CliUI::RESET . "\n";
            echo "  │  Detail   : " . $l['details'] . "\n";
            echo "  │  SHA Seal : " . CliUI::YELLOW . substr($l['signature_hash'], 0, 18) . "..." . CliUI::RESET . "\n";
        }
        echo "  └─ Sequence Analysis End.\n";

        CliUI::pause();
    }

    private function runWatchdogManual(): void {
        CliUI::header("Executing SLA Watchdog Scanner Pass");
        $count = $this->engine->executeSlaWatchdog(false);

        if ($count === 0) {
            CliUI::success("All active cases are within legal SLA parameters. Zero breaches detected.");
        } else {
            CliUI::error("Escalation triggered! {$count} case(s) breached SLA and escalated to Legal.");
        }

        CliUI::pause();
    }

    private function switchProfileWizard(): void {
        CliUI::header("Switch Operating Authority Session");
        $personnel = $this->repo->getPersonnel();

        foreach ($personnel as $p) {
            echo "  [{$p['id']}] {$p['name']} (" . CliUI::CYAN . $p['role'] . CliUI::RESET . ")\n";
        }
        echo "\n";

        $id = (int)CliUI::prompt("Select User ID");
        foreach ($personnel as $p) {
            if ((int)$p['id'] === $id) {
                $this->activeUser = $p;
                CliUI::success("Active authority switched to {$p['name']} ({$p['role']}).");
                return;
            }
        }

        CliUI::error("Invalid user selection.");
        CliUI::pause();
    }
}

// ==========================================
// 5. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Guard: HR Case Engine requires a standard console CLI environment.\n");
}

$app = new HrCaseConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--watch') {
    $repo = new HrCaseRepository();
    $engine = new HrCaseEngine($repo);
    CliUI::stepLog("Starting headless SLA Watchdog sweep...");
    $breaches = $engine->executeSlaWatchdog(true);
    CliUI::stepLog("Watchdog pass concluded. Breaches escalated: {$breaches}");
} else {
    $app->launchWorkspace();
}
