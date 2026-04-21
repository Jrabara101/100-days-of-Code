<?php
// ============================================================
// Database Configuration — Update credentials before deployment
// ============================================================

define('DB_HOST',    'localhost');
define('DB_NAME',    'birthday_reminder');
define('DB_USER',    'root');
define('DB_PASS',    '');           // Change for production
define('DB_CHARSET', 'utf8mb4');

class Database
{
    private static ?PDO $instance = null;

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } catch (PDOException $e) {
                // In production, log this and show a friendly error page
                die('<h2 style="font-family:sans-serif;color:#ef4444">Database connection failed: '
                    . htmlspecialchars($e->getMessage()) . '</h2>');
            }
        }

        return self::$instance;
    }

    // Prevent cloning and unserialization of the singleton
    private function __clone() {}
    public function __wakeup() { throw new \Exception("Cannot unserialize singleton."); }
}
