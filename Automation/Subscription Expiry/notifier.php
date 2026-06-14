#!/usr/bin/env php
<?php

/**
 * Advanced PHP CLI - Subscription Expiry State Machine
 */

// ==========================================
// 1. Visual Stylist (ANSI Colors)
// ==========================================
class UI {
    public const RESET = "\e[0m";
    public const BOLD = "\e[1m";
    public const GREEN = "\e[32m";
    public const RED = "\e[31m";
    public const YELLOW = "\e[33m";
    public const CYAN = "\e[36m";

    public static function header($text) {
        echo "\n" . self::CYAN . self::BOLD . "=== " . strtoupper($text) . " ===" . self::RESET . "\n\n";
    }

    public static function status($msg, $color = self::RESET) {
        echo " [" . date('H:i:s') . "] " . $color . $msg . self::RESET . "\n";
    }
}

// ==========================================
// 2. Data Persistence Layer
// ==========================================
class Database {
    private static $pdo;

    public static function connect() {
        if (!self::$pdo) {
            self::$pdo = new PDO("sqlite:" . __DIR__ . "/subscriptions.sqlite");
            self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::init();
        }
        return self::$pdo;
    }

    private static function init() {
        self::$pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY, 
            email TEXT, 
            expiry_date DATE, 
            status TEXT DEFAULT 'ACTIVE'
        )");
        self::$pdo->exec("CREATE TABLE IF NOT EXISTS notification_history (
            id INTEGER PRIMARY KEY, 
            user_id INTEGER, 
            tier TEXT, 
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, tier)
        )");
        
        // Seed mock data for first-time run
        $count = self::$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        if ($count == 0) {
            $stmt = self::$pdo->prepare("INSERT INTO users (email, expiry_date) VALUES (?, ?)");
            $stmt->execute(['alice@example.com', date('Y-m-d', strtotime('+29 days'))]);
            $stmt->execute(['bob@example.com', date('Y-m-d', strtotime('+6 days'))]);
            $stmt->execute(['charlie@example.com', date('Y-m-d', strtotime('+1 day'))]);
        }
    }
}

// ==========================================
// 3. Notification Logic
// ==========================================
class ExpiryNotifier {
    private $db;
    private $tiers = [
        30 => 'THIRTY_DAY',
        7  => 'SEVEN_DAY',
        1  => 'ONE_DAY'
    ];

    public function __construct() {
        $this->db = Database::connect();
    }

    public function run() {
        UI::header("Starting Expiry Scan");

        foreach ($this->tiers as $days => $tierName) {
            $targetDate = date('Y-m-d', strtotime("+$days days"));
            $this->processTier($targetDate, $tierName);
        }

        UI::status("Scan complete.", UI::GREEN);
    }

    private function processTier($date, $tier) {
        // Find users expiring on this date who haven't been notified for this tier
        $sql = "SELECT u.* FROM users u 
                LEFT JOIN notification_history h ON u.id = h.user_id AND h.tier = :tier
                WHERE u.expiry_date = :date 
                AND h.id IS NULL 
                AND u.status = 'ACTIVE'";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['date' => $date, 'tier' => $tier]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($users)) {
            UI::status("No pending actions for tier: $tier", UI::YELLOW);
            return;
        }

        foreach ($users as $user) {
            UI::status("Notifying {$user['email']} (Tier: $tier)...", UI::CYAN);
            
            // SIMULATE MAILER
            $success = true; 

            if ($success) {
                $log = $this->db->prepare("INSERT INTO notification_history (user_id, tier) VALUES (?, ?)");
                $log->execute([$user['id'], $tier]);
                UI::status("SUCCESS: History updated.", UI::GREEN);
            }
        }
    }
}

// Start
if (php_sapi_name() !== 'cli') die("Must run in CLI.");
$app = new ExpiryNotifier();
$app->run();
