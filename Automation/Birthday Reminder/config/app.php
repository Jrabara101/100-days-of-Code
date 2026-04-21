<?php
// ============================================================
// Application Configuration
// ============================================================

define('APP_NAME',    'Birthday Reminder');
define('APP_VERSION', '1.0.0');
define('TIMEZONE',    'Asia/Manila');   // Change to your server timezone
define('ROOT_PATH',   dirname(__DIR__));
define('APP_SECRET',  'br_s3cr3t_k3y_ch4ng3_1n_pr0duct10n_xyz');

// Dynamically detect base URL (works on XAMPP and VPS)
if (PHP_SAPI !== 'cli') {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $script   = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/public/index.php');
    $base     = rtrim(dirname($script), '/');
    define('BASE_URL', $protocol . '://' . $host . $base);
} else {
    // CLI context (cron script) — adjust if your server path differs
    define('BASE_URL', 'http://localhost/birthday-reminder/public');
}

date_default_timezone_set(TIMEZONE);
