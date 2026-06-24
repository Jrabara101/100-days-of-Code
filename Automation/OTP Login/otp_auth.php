#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Cryptographically Secure OTP Authentication Engine
 * Usage: php otp_auth.php
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

    public static function prompt(string $message, bool $secret = false): string {
        echo self::BOLD . $message . self::RESET . ": ";
        if ($secret) {
            // Disable echoing in terminal for secret credentials input
            if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
                shell_exec('stty -echo');
                $input = trim(fgets(STDIN));
                shell_exec('stty echo');
                echo "\n";
                return $input;
            }
        }
        return trim(fgets(STDIN));
    }

    public static function pause(): void {
        echo "\n" . self::DIM . "Press Enter to return to identity gateway..." . self::RESET;
        fgets(STDIN);
    }

    public static function success(string $msg): void { echo self::GREEN . "✔ SUCCESS: " . $msg . self::RESET . "\n"; }
    public static function error(string $msg): void { echo self::RED . "✖ ERROR: " . $msg . self::RESET . "\n"; }
    public static function info(string $msg): void { echo self::CYAN . "ℹ [SYSTEM] " . self::RESET . $msg . "\n"; }
}

// ==========================================
// 2. Data Persistence Layer (SQLite Isolation)
// ==========================================
class OtpRepository {
    private PDO $db;

    public function __construct() {
        $this->db = new PDO("sqlite:" . __DIR__ . '/identity_vault.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $this->initSchema();
    }

    private function initSchema(): void {
        // Secure token ledger with tracking metadata constraints
        $this->db->exec("CREATE TABLE IF NOT EXISTS otp_challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identity_marker TEXT NOT NULL,
            hashed_token TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            failed_attempts INTEGER DEFAULT 0,
            status TEXT DEFAULT 'VALID', -- VALID, USED, INVALIDATED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_active_challenges ON otp_challenges(identity_marker, status)");
    }

    public function invalidateActiveTokens(string $identity): void {
        $stmt = $this->db->prepare("UPDATE otp_challenges SET status = 'INVALIDATED' WHERE identity_marker = ? AND status = 'VALID'");
        $stmt->execute([strtolower(trim($identity))]);
    }

    public function issueChallenge(string $identity, string $hashedToken, int $ttlSeconds): void {
        $expiry = date('Y-m-d H:i:s', time() + $ttlSeconds);
        $stmt = $this->db->prepare("INSERT INTO otp_challenges (identity_marker, hashed_token, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([strtolower(trim($identity)), $hashedToken, $expiry]);
    }

    public function findActiveChallenge(string $identity): ?array {
        $stmt = $this->db->prepare("
            SELECT * FROM otp_challenges 
            WHERE identity_marker = ? AND status = 'VALID' AND expires_at > datetime('now') 
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmt->execute([strtolower(trim($identity))]);
        return $stmt->fetch() ?: null;
    }

    public function incrementFailures(int $id): int {
        $stmt = $this->db->prepare("UPDATE otp_challenges SET failed_attempts = failed_attempts + 1 WHERE id = ?");
        $stmt->execute([$id]);

        // Fetch back updated metric to see if threshold rule bounds are breached
        $check = $this->db->prepare("SELECT failed_attempts FROM otp_challenges WHERE id = ?");
        $check->execute([$id]);
        return (int)$check->fetchColumn();
    }

    public function updateStatus(int $id, string $status): void {
        $stmt = $this->db->prepare("UPDATE otp_challenges SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
    }
}

// ==========================================
// 3. Cryptographic Token Lifecycle Domain Service
// ==========================================
class OtpAuthenticationEngine {
    private OtpRepository $repo;
    private const TOKEN_TTL = 300;       // Strict 5-minute validity window
    private const MAX_ATTEMPTS = 3;      // Burn code after 3 invalid tries

    public function __construct() {
        $this->repo = new OtpRepository();
    }

    public function initiateChallenge(string $identity): void {
        // Step 1: Invalidate any old outstanding codes for this specific identity
        $this->repo->invalidateActiveTokens($identity);

        // Step 2: Generate token backed by cryptographically secure runtime entropy
        $rawToken = (string)random_int(100000, 999999);

        // Step 3: Hash token in transit before database persistence to prevent database-compromise spoofing
        $hashedToken = password_hash($rawToken, PASSWORD_DEFAULT);
        $this->repo->issueChallenge($identity, $hashedToken, self::TOKEN_TTL);

        // Simulated Delivery Layer (In production, route to Twilio, Amazon SNS, or Mailgun templates here)
        CliUI::info("Dispatched cryptographically secure token challenge to internal transport lanes...");
        echo "\n " . CliUI::YELLOW . CliUI::BOLD . "✨ [MOCK TRANSPORT DELIVERY] OTP Code sent to {$identity}: " . CliUI::GREEN . $rawToken . CliUI::RESET . "\n";
    }

    public function verifyChallenge(string $identity, string $inputToken): bool|string {
        $challenge = $this->repo->findActiveChallenge($identity);

        if (!$challenge) {
            return "No active, unexpired verification token challenge found for this account pipeline.";
        }

        // Verify the raw user input against the cryptographically secure hash
        if (password_verify($inputToken, $challenge['hashed_token'])) {
            // Success: Mutate state instantly to enforce Single-Use constraint rules
            $this->repo->updateStatus($challenge['id'], 'USED');
            return true;
        }

        // Failure processing matrix tracking bounds
        $failures = $this->repo->incrementFailures($challenge['id']);
        if ($failures >= self::MAX_ATTEMPTS) {
            $this->repo->updateStatus($challenge['id'], 'INVALIDATED');
            return "Security Lockout: Explicit brute-force limit breached. Verification token has been permanently burned.";
        }

        $remaining = self::MAX_ATTEMPTS - $failures;
        return "Invalid authentication credentials token supplied. Remaining context verification retries: {$remaining}";
    }
}

// ==========================================
// 4. Main Runtime System Orchestration Loop
// ==========================================
class IdentityGatewayApp {
    private OtpAuthenticationEngine $engine;

    public function __construct() {
        $this->engine = new OtpAuthenticationEngine();
    }

    public function run(): void {
        while (true) {
            CliUI::header("Identity Access Management Gateway", "Secure Authentication Protocol Node");
            echo "  " . CliUI::CYAN . "1." . CliUI::RESET . " Request One-Time Access Token (Challenge Stage)\n";
            echo "  " . CliUI::CYAN . "2." . CliUI::RESET . " Submit Verification Token (Validation Stage)\n";
            echo "  " . CliUI::CYAN . "0." . CliUI::RESET . " Shut down access panel framework console\n\n";

            switch (CliUI::prompt("Select System Action Vector")) {
                case '1': $this->requestFlow(); break;
                case '2': $this->verifyFlow(); break;
                case '0':
                    CliUI::clearScreen();
                    echo CliUI::BLUE . "Identity infrastructure access link closed cleanly.\n" . CliUI::RESET;
                    exit(0);
                default:
                    break;
            }
        }
    }

    private function requestFlow(): void {
        CliUI::header("Request Access Challenge");
        $identity = CliUI::prompt("Enter user account verification route (Email or Phone)");

        if (empty($identity)) {
            CliUI::error("Identity identifier cannot evaluate to blank parameter strings.");
            CliUI::pause();
            return;
        }

        $this->engine->initiateChallenge($identity);
        CliUI::success("Challenge tracking pipeline initialized. Proceed to validation step within 5 minutes.");
        CliUI::pause();
    }

    private function verifyFlow(): void {
        CliUI::header("Submit Verification Token");
        $identity = CliUI::prompt("Confirm identity account route string");
        $token = CliUI::prompt("Enter your 6-digit secure access token", true); // Mask input stream

        if (empty($identity) || empty($token)) {
            CliUI::error("All validation sequence metadata arguments are required.");
            CliUI::pause();
            return;
        }

        $status = $this->engine->verifyChallenge($identity, $token);

        if ($status === true) {
            CliUI::clearScreen();
            CliUI::header("ACCESS GRANTED", "Identity Cryptographically Authorized");
            echo "\n " . CliUI::GREEN . CliUI::BOLD . "✔ Authentication successful." . CliUI::RESET . " Welcome back, user account workspace successfully logged in.\n";
            CliUI::pause();
        } else {
            CliUI::error($status);
            CliUI::pause();
        }
    }
}

// ==========================================
// 5. System Execution Bootstrap Gateway
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("Security Engine Alert: Distributed cryptographically isolated authentication contexts must be spawned natively via modern terminal processes.");
}

try {
    $gateway = new IdentityGatewayApp();
    $gateway->run();
} catch (Exception $e) {
    echo "\n\e[31m\e[1mFatal Security Kernel Exception: \e[0m" . $e->getMessage() . "\n";
    exit(1);
}
