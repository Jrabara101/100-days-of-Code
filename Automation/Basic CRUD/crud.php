#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI CRUD System
 * 
 * Usage: 
 * php crud.php init
 * php crud.php add "Name" "Email"
 * php crud.php list
 * php crud.php update <id> "New Name" "New Email"
 * php crud.php delete <id>
 */

// ==========================================
// 1. Visual Styling Component
// ==========================================
class CliFormatter {
    const RESET = "\e[0m";
    const GREEN = "\e[32m";
    const RED = "\e[31m";
    const CYAN = "\e[36m";
    const YELLOW = "\e[33m";
    const BOLD = "\e[1m";

    public static function info(string $msg): void { echo self::CYAN . "ℹ " . $msg . self::RESET . PHP_EOL; }
    public static function success(string $msg): void { echo self::GREEN . self::BOLD . "✔ " . $msg . self::RESET . PHP_EOL; }
    public static function error(string $msg): void { echo self::RED . self::BOLD . "✖ ERROR: " . self::RESET . self::RED . $msg . self::RESET . PHP_EOL; exit(1); }
    public static function warning(string $msg): void { echo self::YELLOW . "⚠ " . $msg . self::RESET . PHP_EOL; }
    public static function title(string $msg): void { echo PHP_EOL . self::BOLD . self::CYAN . "=== " . strtoupper($msg) . " ===" . self::RESET . PHP_EOL . PHP_EOL; }

    /**
     * Dynamically renders an ASCII table from an associative array
     */
    public static function table(array $data): void {
        if (empty($data)) {
            self::warning("No records found.");
            return;
        }

        $columns = array_keys($data[0]);
        $widths = [];

        // Calculate max width for each column
        foreach ($columns as $col) {
            $widths[$col] = strlen($col);
        }
        foreach ($data as $row) {
            foreach ($columns as $col) {
                $widths[$col] = max($widths[$col], strlen((string)$row[$col]));
            }
        }

        // Helper to draw separators
        $drawSeparator = function() use ($columns, $widths) {
            $line = "+";
            foreach ($columns as $col) {
                $line .= str_repeat("-", $widths[$col] + 2) . "+";
            }
            echo $line . PHP_EOL;
        };

        // Render Table
        echo PHP_EOL;
        $drawSeparator();
        
        // Headers
        echo "|";
        foreach ($columns as $col) {
            echo self::BOLD . " " . str_pad($col, $widths[$col]) . " " . self::RESET . "|";
        }
        echo PHP_EOL;
        $drawSeparator();

        // Rows
        foreach ($data as $row) {
            echo "|";
            foreach ($columns as $col) {
                echo " " . str_pad((string)$row[$col], $widths[$col]) . " |";
            }
            echo PHP_EOL;
        }
        $drawSeparator();
        echo PHP_EOL;
    }
}

// ==========================================
// 2. Database Component
// ==========================================
class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            try {
                $dbPath = __DIR__ . '/database.sqlite';
                self::$instance = new PDO("sqlite:" . $dbPath);
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                CliFormatter::error("Database Connection Failed: " . $e->getMessage());
            }
        }
        return self::$instance;
    }
}

// ==========================================
// 3. Business Logic (CRUD)
// ==========================================
class UserCrud {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function init(): void {
        $sql = "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )";
        $this->db->exec($sql);
        CliFormatter::success("Database initialized. 'users' table is ready.");
    }

    public function create(string $name, string $email): void {
        try {
            $stmt = $this->db->prepare("INSERT INTO users (name, email) VALUES (:name, :email)");
            $stmt->execute(['name' => $name, 'email' => $email]);
            CliFormatter::success("User '{$name}' created successfully with ID: " . $this->db->lastInsertId());
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                CliFormatter::error("A user with email '{$email}' already exists.");
            }
            CliFormatter::error("Failed to create user: " . $e->getMessage());
        }
    }

    public function read(): void {
        $stmt = $this->db->query("SELECT id, name, email, created_at FROM users ORDER BY id ASC");
        $users = $stmt->fetchAll();
        CliFormatter::table($users);
    }

    public function update(int $id, string $name, string $email): void {
        $stmt = $this->db->prepare("UPDATE users SET name = :name, email = :email WHERE id = :id");
        $stmt->execute(['name' => $name, 'email' => $email, 'id' => $id]);
        
        if ($stmt->rowCount() > 0) {
            CliFormatter::success("User ID {$id} updated successfully.");
        } else {
            CliFormatter::warning("No changes made. User ID {$id} might not exist or data is identical.");
        }
    }

    public function delete(int $id): void {
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);

        if ($stmt->rowCount() > 0) {
            CliFormatter::success("User ID {$id} deleted successfully.");
        } else {
            CliFormatter::warning("User ID {$id} not found.");
        }
    }
}

// ==========================================
// 4. CLI Router / Bootstrap
// ==========================================
if (php_sapi_name() !== 'cli') {
    die("This script can only be run from the command line.");
}

if ($argc < 2) {
    CliFormatter::title("PHP User Management CLI");
    echo "Commands:\n";
    echo "  " . CliFormatter::GREEN . "init" . CliFormatter::RESET . "                          - Initialize the database\n";
    echo "  " . CliFormatter::GREEN . "list" . CliFormatter::RESET . "                          - Show all users\n";
    echo "  " . CliFormatter::GREEN . "add" . CliFormatter::RESET . " <name> <email>            - Add a new user\n";
    echo "  " . CliFormatter::GREEN . "update" . CliFormatter::RESET . " <id> <name> <email>    - Update an existing user\n";
    echo "  " . CliFormatter::GREEN . "delete" . CliFormatter::RESET . " <id>                 - Delete a user\n\n";
    exit(1);
}

$command = $argv[1];
$crud = new UserCrud();

try {
    switch ($command) {
        case 'init':
            $crud->init();
            break;
        case 'add':
            if ($argc < 4) CliFormatter::error("Missing arguments. Usage: add <name> <email>");
            $crud->create($argv[2], $argv[3]);
            break;
        case 'list':
            CliFormatter::title("User Database");
            $crud->read();
            break;
        case 'update':
            if ($argc < 5) CliFormatter::error("Missing arguments. Usage: update <id> <name> <email>");
            $crud->update((int)$argv[2], $argv[3], $argv[4]);
            break;
        case 'delete':
            if ($argc < 3) CliFormatter::error("Missing argument. Usage: delete <id>");
            $crud->delete((int)$argv[2]);
            break;
        default:
            CliFormatter::error("Unknown command: {$command}");
    }
} catch (Exception $e) {
    CliFormatter::error("An unexpected error occurred: " . $e->getMessage());
}
