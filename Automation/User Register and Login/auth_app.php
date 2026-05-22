#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI Authentication System
 * 
 * Usage: php auth_app.php
 */

// ==========================================
// 1. Visual Styling & UI Component
// ==========================================
class CliUI {
    const RESET = "\e[0m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";
    const BOLD = "\e[1m";

    public static function clearScreen(): void {
        echo "\033[2J\033[;H"; // ANSI escape code to clear screen
    }

    public static function header(string $title): void {
        self::clearScreen();
        echo self::CYAN . self::BOLD;
        echo "=================================================\n";
        echo "   " . strtoupper($title) . "\n";
        echo "=================================================\n" . self::RESET;
    }

    public static function success(string $msg): void { echo "\n" . self::GREEN . self::BOLD . "✔ " . $msg . self::RESET . "\n\n"; }
    public static function error(string $msg): void { echo "\n" . self::RED . self::BOLD . "✖ " . $msg . self::RESET . "\n\n"; }
    public static function warning(string $msg): void { echo "\n" . self::YELLOW . "⚠ " . $msg . self::RESET . "\n\n"; }

    public static function prompt(string $message): string {
        echo self::BOLD . $message . self::RESET . ": ";
        return trim(fgets(STDIN));
    }

    public static function promptPassword(string $message): string {
        echo self::BOLD . $message . self::RESET . ": ";
        
        // Attempt to mask password on Unix systems
        $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        if (!$isWindows) {
            system('stty -echo');
            $password = trim(fgets(STDIN));
            system('stty echo');
            echo "\n"; // Add newline since enter was masked
            return $password;
        } else {
            // Fallback for Windows (echo will be visible)
            return trim(fgets(STDIN));
        }
    }
}

// ==========================================
// 2. Database Component (SQLite Singleton)
// ==========================================
class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dbPath = __DIR__ . '/auth_database.sqlite';
            self::$instance = new PDO("sqlite:" . $dbPath);
            self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            self::initializeTables();
        }
        return self::$instance;
    }

    private static function initializeTables(): void {
        $sql = "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )";
        self::$instance->exec($sql);
    }
}

// ==========================================
// 3. Authentication Logic
// ==========================================
class AuthManager {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function register(string $username, string $password): bool {
        if (strlen($password) < 6) {
            CliUI::error("Password must be at least 6 characters long.");
            return false;
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        try {
            $stmt = $this->db->prepare("INSERT INTO users (username, password_hash) VALUES (:username, :hash)");
            $stmt->execute(['username' => $username, 'hash' => $hash]);
            CliUI::success("User '{$username}' registered successfully! You can now log in.");
            return true;
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                CliUI::error("Username '{$username}' is already taken.");
            } else {
                CliUI::error("Registration failed: " . $e->getMessage());
            }
            return false;
        }
    }

    public function login(string $username, string $password): ?array {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            return $user;
        }

        CliUI::error("Invalid username or password.");
        return null;
    }
}

// ==========================================
// 4. Main Application Loop
// ==========================================
class App {
    private AuthManager $auth;
    private ?array $currentUser = null;

    public function __construct() {
        $this->auth = new AuthManager();
    }

    public function run(): void {
        while (true) {
            if ($this->currentUser === null) {
                $this->showGuestMenu();
            } else {
                $this->showUserMenu();
            }
        }
    }

    private function showGuestMenu(): void {
        CliUI::header("Secure CLI Gateway");
        echo "1. Log In\n";
        echo "2. Register\n";
        echo "3. Exit\n\n";

        $choice = CliUI::prompt("Select an option");

        switch ($choice) {
            case '1':
                $this->handleLogin();
                break;
            case '2':
                $this->handleRegister();
                break;
            case '3':
                CliUI::clearScreen();
                echo CliUI::CYAN . "Goodbye!\n" . CliUI::RESET;
                exit(0);
            default:
                CliUI::error("Invalid option.");
                sleep(1);
        }
    }

    private function showUserMenu(): void {
        CliUI::header("Dashboard - Welcome, " . $this->currentUser['username']);
        echo CliUI::GREEN . "User ID: " . CliUI::RESET . $this->currentUser['id'] . "\n";
        echo CliUI::GREEN . "Member Since: " . CliUI::RESET . $this->currentUser['created_at'] . "\n\n";
        
        echo "1. Log Out\n";
        echo "2. Exit Application\n\n";

        $choice = CliUI::prompt("Select an option");

        switch ($choice) {
            case '1':
                $this->currentUser = null;
                CliUI::success("Logged out successfully.");
                sleep(1);
                break;
            case '2':
                CliUI::clearScreen();
                echo CliUI::CYAN . "Goodbye!\n" . CliUI::RESET;
                exit(0);
            default:
                CliUI::error("Invalid option.");
                sleep(1);
        }
    }

    private function handleRegister(): void {
        CliUI::header("Create an Account");
        $username = CliUI::prompt("Enter new username");
        $password = CliUI::promptPassword("Enter new password");
        
        if (!empty($username) && !empty($password)) {
            $this->auth->register($username, $password);
        } else {
            CliUI::error("Username and password cannot be empty.");
        }
        CliUI::prompt("Press Enter to continue...");
    }

    private function handleLogin(): void {
        CliUI::header("User Login");
        $username = CliUI::prompt("Username");
        $password = CliUI::promptPassword("Password");

        $user = $this->auth->login($username, $password);
        if ($user) {
            $this->currentUser = $user;
            CliUI::success("Login successful!");
            sleep(1); // Brief pause before loading dashboard
        } else {
            CliUI::prompt("Press Enter to continue...");
        }
    }
}

// Bootstrap the application
if (php_sapi_name() !== 'cli') {
    die("This application must be run from the command line.");
}

$app = new App();
$app->run();
