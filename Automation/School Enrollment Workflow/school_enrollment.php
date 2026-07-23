#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Advanced PHP CLI - Atomic School Enrollment Workflow Engine
 * * Usage:
 * php school_enrollment.php          (Interactive Registrar Dashboard)
 * php school_enrollment.php --cron   (Headless Batch Application Processor)
 */

date_default_timezone_set('UTC');

// ==========================================
// 1. Visual Styling & TUI Layout Engine
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
        echo self::BLUE . self::BOLD;
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
        echo "\n" . self::DIM . "Press Enter to return to main workspace..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; sleep(1); }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [INFO] " . self::RESET . $msg . "\n"; }
    public static function stepLog(string $msg): void { echo " [" . date('H:i:s') . "] " . self::CYAN . "[ENROLL-ENGINE] " . self::RESET . $msg . "\n"; }

    public static function statusBadge(string $status): string {
        return match ($status) {
            'ENROLLED', 'SEAT_RESERVED'  => self::GREEN . self::BOLD . " {$status} " . self::RESET,
            'SUBMITTED', 'DOCS_VERIFIED' => self::CYAN . " {$status} " . self::RESET,
            'PENDING_DOCS', 'WAITLISTED' => self::YELLOW . " {$status} " . self::RESET,
            'PREREQ_FAILED', 'REJECTED'  => self::RED . self::BOLD . " {$status} " . self::RESET,
            default                     => $status
        };
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
// 2. Data Persistence Layer (SQLite Isolation)
// ==========================================
class EnrollmentRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/enrollment_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Courses Registry
        $this->db->exec("CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            enrolled_count INTEGER DEFAULT 0,
            prerequisite_code TEXT DEFAULT NULL
        )");

        // Student Master Profiles
        $this->db->exec("CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_number TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            completed_courses TEXT DEFAULT '[]' -- JSON array of course codes
        )");

        // Enrollment Applications Pipeline
        $this->db->exec("CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            status TEXT DEFAULT 'SUBMITTED', 
            documents_verified INTEGER DEFAULT 0,
            tuition_cleared INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (course_id) REFERENCES courses(id),
            UNIQUE(student_id, course_id)
        )");

        // Immutable Audit Trail Ledger
        $this->db->exec("CREATE TABLE IF NOT EXISTS enrollment_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            application_id INTEGER NOT NULL,
            previous_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            actor TEXT NOT NULL,
            notes TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (application_id) REFERENCES applications(id)
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_app_status ON applications(status)");

        // Seed initial simulation datasets if clean
        if ($this->db->query("SELECT COUNT(*) FROM courses")->fetchColumn() == 0) {
            $this->seedBaselineData();
        }
    }

    private function seedBaselineData(): void {
        // Add Courses (Note: CS201 has capacity of 2 to test race conditions & waitlisting)
        $cStmt = $this->db->prepare("INSERT INTO courses (code, title, capacity, enrolled_count, prerequisite_code) VALUES (?, ?, ?, ?, ?)");
        $cStmt->execute(['CS101', 'Intro to Computer Science', 10, 0, null]);
        $cStmt->execute(['CS201', 'Data Structures & Algorithms', 2, 0, 'CS101']);
        $cStmt->execute(['MATH101', 'Calculus I', 5, 0, null]);

        // Add Students
        $sStmt = $this->db->prepare("INSERT INTO students (student_number, full_name, email, completed_courses) VALUES (?, ?, ?, ?)");
        $sStmt->execute(['STU-1001', 'Alice Vance', 'a.vance@university.edu', json_encode(['CS101'])]);
        $sStmt->execute(['STU-1002', 'Bob Smith', 'b.smith@university.edu', json_encode([])]); // Lacks CS101 prereq
        $sStmt->execute(['STU-1003', 'Charlie Brown', 'c.brown@university.edu', json_encode(['CS101'])]);
        $sStmt->execute(['STU-1004', 'Diana Prince', 'd.prince@university.edu', json_encode(['CS101'])]);

        // Seed Initial Applications
        $this->createApplication(1, 2); // Alice -> CS201 (Valid, Has Prereq)
        $this->createApplication(2, 2); // Bob -> CS201 (Will Fail Prereq)
        $this->createApplication(3, 2); // Charlie -> CS201 (Valid, Has Prereq)
        $this->createApplication(4, 2); // Diana -> CS201 (Valid, Should trigger Waitlist/Full capacity)
    }

    public function createApplication(int $studentId, int $courseId): int {
        $stmt = $this->db->prepare("INSERT INTO applications (student_id, course_id) VALUES (?, ?)");
        $stmt->execute([$studentId, $courseId]);
        $appId = (int)$this->db->lastInsertId();

        $this->logAudit($appId, 'NONE', 'SUBMITTED', 'SYSTEM', 'Application submitted to registrar backlog.');
        return $appId;
    }

    public function getPendingApplications(): array {
        return $this->db->query("
            SELECT a.*, s.student_number, s.full_name, s.email, s.completed_courses,
                   c.code as course_code, c.title as course_title, c.capacity, c.enrolled_count, c.prerequisite_code
            FROM applications a
            JOIN students s ON a.student_id = s.id
            JOIN courses c ON a.course_id = c.id
            WHERE a.status NOT IN ('ENROLLED', 'REJECTED', 'PREREQ_FAILED', 'WAITLISTED')
            ORDER BY a.id ASC
        ")->fetchAll();
    }

    public function getGlobalRegistry(): array {
        return $this->db->query("
            SELECT a.id, s.student_number, s.full_name, c.code as course_code, 
                   a.status, a.documents_verified, a.tuition_cleared, a.updated_at
            FROM applications a
            JOIN students s ON a.student_id = s.id
            JOIN courses c ON a.course_id = c.id
            ORDER BY a.id DESC LIMIT 30
        ")->fetchAll();
    }

    public function getCourseMetrics(): array {
        return $this->db->query("SELECT * FROM courses ORDER BY code ASC")->fetchAll();
    }

    public function getAuditTrail(int $appId): array {
        $stmt = $this->db->prepare("SELECT * FROM enrollment_audit_logs WHERE application_id = ? ORDER BY id ASC");
        $stmt->execute([$appId]);
        return $stmt->fetchAll();
    }

    public function logAudit(int $appId, string $prevStatus, string $newStatus, string $actor, string $notes): void {
        $stmt = $this->db->prepare("
            INSERT INTO enrollment_audit_logs (application_id, previous_status, new_status, actor, notes) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$appId, $prevStatus, $newStatus, $actor, $notes]);
    }

    public function updateApplicationStatus(int $appId, string $status): void {
        $stmt = $this->db->prepare("UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?");
        $stmt->execute([$status, $appId]);
    }

    public function setDocumentsVerified(int $appId, bool $state): void {
        $stmt = $this->db->prepare("UPDATE applications SET documents_verified = ? WHERE id = ?");
        $stmt->execute([$state ? 1 : 0, $appId]);
    }

    public function setTuitionCleared(int $appId, bool $state): void {
        $stmt = $this->db->prepare("UPDATE applications SET tuition_cleared = ? WHERE id = ?");
        $stmt->execute([$state ? 1 : 0, $appId]);
    }

    /**
     * Senior Concurrency Guard: Atomically increments course enrolment count.
     * Prevents over-booking when multiple applications execute in parallel.
     */
    public function tryReserveSeatAtomically(int $courseId): bool {
        $stmt = $this->db->prepare("
            UPDATE courses 
            SET enrolled_count = enrolled_count + 1 
            WHERE id = ? AND enrolled_count < capacity
        ");
        $stmt->execute([$courseId]);
        return $stmt->rowCount() > 0;
    }

    public function getPDO(): PDO {
        return $this->db;
    }
}

// ==========================================
// 3. Workflow Engine & Domain Logic Services
// ==========================================
class EnrollmentWorkflowEngine {
    private EnrollmentRepository $repo;

    public function __construct(EnrollmentRepository $repo) {
        $this->repo = $repo;
    }

    /**
     * Evaluates an application through the strict state machine pipeline.
     */
    public function processApplication(array $app, string $actor = 'WORKER_DAEMON'): array {
        $db = $this->repo->getPDO();
        $db->beginTransaction();

        try {
            $appId = (int)$app['id'];
            $currentStatus = $app['status'];

            // Step 1: Document Verification Check
            if ($app['documents_verified'] == 0) {
                // In production, this checks document hash uploads. For workflow engine simulation, we auto-verify.
                $this->repo->setDocumentsVerified($appId, true);
                $this->repo->updateApplicationStatus($appId, 'DOCS_VERIFIED');
                $this->repo->logAudit($appId, $currentStatus, 'DOCS_VERIFIED', $actor, 'Identity, birth certificate, and high school transcripts verified.');
                $currentStatus = 'DOCS_VERIFIED';
            }

            // Step 2: Prerequisite Evaluation Engine
            $prereq = $app['prerequisite_code'];
            if (!empty($prereq)) {
                $completedCourses = json_decode($app['completed_courses'] ?? '[]', true) ?: [];
                if (!in_array($prereq, $completedCourses, true)) {
                    $this->repo->updateApplicationStatus($appId, 'PREREQ_FAILED');
                    $this->repo->logAudit($appId, $currentStatus, 'PREREQ_FAILED', $actor, "Academic Gate Blocked: Required prerequisite [{$prereq}] not found on transcript.");
                    $db->commit();
                    return ['status' => 'PREREQ_FAILED', 'reason' => "Missing Prerequisite: {$prereq}"];
                }
            }

            // Step 3: Atomic Seat Reservation
            if ($currentStatus !== 'SEAT_RESERVED') {
                $seatClaimed = $this->repo->tryReserveSeatAtomically((int)$app['course_id']);
                if (!$seatClaimed) {
                    $this->repo->updateApplicationStatus($appId, 'WAITLISTED');
                    $this->repo->logAudit($appId, $currentStatus, 'WAITLISTED', $actor, "Capacity Limit Reached: Course [{$app['course_code']}] is fully booked.");
                    $db->commit();
                    return ['status' => 'WAITLISTED', 'reason' => "Course {$app['course_code']} Capacity Reached"];
                }

                $this->repo->updateApplicationStatus($appId, 'SEAT_RESERVED');
                $this->repo->logAudit($appId, $currentStatus, 'SEAT_RESERVED', $actor, "Atomic Seat Claimed: Seat reserved in course [{$app['course_code']}].");
                $currentStatus = 'SEAT_RESERVED';
            }

            // Step 4: Tuition Clearance & Final Matriculation
            if ($app['tuition_cleared'] == 0) {
                // Auto-clear financial hold for processing loop simulation
                $this->repo->setTuitionCleared($appId, true);
            }

            $this->repo->updateApplicationStatus($appId, 'ENROLLED');
            $this->repo->logAudit($appId, $currentStatus, 'ENROLLED', $actor, "Matriculation Complete: Student officially enrolled in [{$app['course_code']}].");

            $db->commit();
            return ['status' => 'ENROLLED', 'reason' => 'Successfully Enrolled'];

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
}

// ==========================================
// 4. Main Application Controller
// ==========================================
class EnrollmentConsoleApp {
    private EnrollmentRepository $repo;
    private EnrollmentWorkflowEngine $engine;

    public function __construct() {
        $this->repo = new EnrollmentRepository();
        $this->engine = new EnrollmentWorkflowEngine($this->repo);
    }

    public function launchWorkspace(): void {
        while (true) {
            $pending = $this->repo->getPendingApplications();
            CliUI::header("University Enrollment & Registrar Gateway", "Backlog Applications Pending: " . count($pending));

            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Process Pending Applications (Run Workflow Engine)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " View Course Capacities & Enrollment Counts\n";
            echo "  " . CliUI::CYAN . "3." . CliUI::RESET . " Output Global Enrollment Master Registry\n";
            echo "  " . CliUI::CYAN . "4." . CliUI::RESET . " Audit Application Compliance Log Trail\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Disconnect registrar workspace\n\n";

            switch (CliUI::prompt("Select Operation Route")) {
                case '1': $this->runBatchProcessing(false); CliUI::pause(); break;
                case '2': $this->viewCourseMetrics(); break;
                case '3': $this->viewGlobalRegistry(); break;
                case '4': $this->auditLogTrail(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Registrar workflow engine unmounted safely.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    public function runBatchProcessing(bool $headlessMode = true): void {
        if ($headlessMode) {
            CliUI::stepLog("Querying un-processed enrollment applications...");
        } else {
            echo "Executing enrollment workflow processing pass...\n";
        }

        $pending = $this->repo->getPendingApplications();
        if (empty($pending)) {
            if ($headlessMode) {
                CliUI::stepLog("No pending applications found in queue.");
            } else {
                CliUI::info("No applications are currently awaiting processing.");
            }
            return;
        }

        $processed = 0;
        foreach ($pending as $app) {
            try {
                $result = $this->engine->processApplication($app, $headlessMode ? 'DAEMON_CRON' : 'REGISTRAR_ADMIN');
                $statusColor = match($result['status']) {
                    'ENROLLED' => CliUI::GREEN,
                    'WAITLISTED' => CliUI::YELLOW,
                    default => CliUI::RED
                };

                $logStr = "App #{$app['id']} [{$app['student_number']} - {$app['full_name']}] -> Course [{$app['course_code']}] => {$statusColor}{$result['status']}" . CliUI::RESET . " ({$result['reason']})";

                if ($headlessMode) {
                    CliUI::stepLog($logStr);
                } else {
                    echo "  ➜ " . $logStr . "\n";
                }
                $processed++;
            } catch (Exception $e) {
                CliUI::error("Failed processing App #{$app['id']}: " . $e->getMessage());
            }
            usleep(50000); // 50ms processing pause
        }

        $msg = "Batch run complete. Total applications evaluated: {$processed}";
        if ($headlessMode) {
            CliUI::stepLog($msg);
        } else {
            echo "\n " . CliUI::GREEN . "✔ " . $msg . CliUI::RESET . "\n";
        }
    }

    private function viewCourseMetrics(): void {
        CliUI::header("Course Capacities & Enrollment Status");
        $courses = $this->repo->getCourseMetrics();

        $tableData = [];
        foreach ($courses as $c) {
            $ratio = $c['enrolled_count'] . " / " . $c['capacity'];
            $status = $c['enrolled_count'] >= $c['capacity'] 
                ? CliUI::RED . "FULL" . CliUI::RESET 
                : CliUI::GREEN . "OPEN" . CliUI::RESET;

            $tableData[] = [
                'code'       => $c['code'],
                'title'      => $c['title'],
                'capacity'   => $ratio,
                'prereq'     => $c['prerequisite_code'] ?: CliUI::DIM . "None" . CliUI::RESET,
                'state'      => $status
            ];
        }

        CliUI::drawTable($tableData, [
            'code' => 'Code', 'title' => 'Course Name', 'capacity' => 'Seats Filled', 'prereq' => 'Prerequisites', 'state' => 'Status'
        ]);

        CliUI::pause();
    }

    private function viewGlobalRegistry(): void {
        CliUI::header("Global Enrollment Applications Registry");
        $registry = $this->repo->getGlobalRegistry();

        $tableData = [];
        foreach ($registry as $r) {
            $tableData[] = [
                'id'       => $r['id'],
                'student'  => $r['student_number'] . " (" . $r['full_name'] . ")",
                'course'   => $r['course_code'],
                'docs'     => $r['documents_verified'] ? CliUI::GREEN . "YES" . CliUI::RESET : CliUI::RED . "NO" . CliUI::RESET,
                'tuition'  => $r['tuition_cleared'] ? CliUI::GREEN . "YES" . CliUI::RESET : CliUI::RED . "NO" . CliUI::RESET,
                'badge'    => CliUI::statusBadge($r['status'])
            ];
        }

        CliUI::drawTable($tableData, [
            'id' => 'ID', 'student' => 'Student Details', 'course' => 'Course', 'docs' => 'Docs Verified', 'tuition' => 'Tuition Paid', 'badge' => 'Workflow Status'
        ]);

        CliUI::pause();
    }

    private function auditLogTrail(): void {
        CliUI::header("Audit Compliance Log Trail");
        $appId = (int)CliUI::prompt("Enter Application ID to extract compliance trail");

        $logs = $this->repo->getAuditTrail($appId);
        if (empty($logs)) {
            CliUI::error("No audit logs found matching that Application ID.");
            CliUI::pause();
            return;
        }

        echo "\n " . CliUI::BOLD . "CHRONOLOGICAL AUDIT LEDGER FOR APPLICATION #{$appId}:" . CliUI::RESET . "\n";
        foreach ($logs as $log) {
            $color = match($log['new_status']) {
                'ENROLLED' => CliUI::GREEN,
                'WAITLISTED' => CliUI::YELLOW,
                'PREREQ_FAILED' => CliUI::RED,
                default => CliUI::CYAN
            };

            echo "  ├─ [" . $log['timestamp'] . "] Actor: " . CliUI::BOLD . $log['actor'] . CliUI::RESET . "\n";
            echo "  │  Transition : " . CliUI::DIM . $log['previous_status'] . CliUI::RESET . " ──> " . $color . $log['new_status'] . CliUI::RESET . "\n";
            echo "  │  Log Notes  : " . $log['notes'] . "\n";
        }
        echo "  └─ End of Sequence.\n";

        CliUI::pause();
    }
}

// ==========================================
// 5. Global Runtime Execution Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("System Monitoring Guard: Enrollment workflow engines require standard console CLI environments.");
}

$app = new EnrollmentConsoleApp();
$mode = $argv[1] ?? 'dashboard';

if ($mode === '--cron') {
    $app->runBatchProcessing(true);
} else {
    $app->launchWorkspace();
}
