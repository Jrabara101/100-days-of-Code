<?php
// ============================================================
// Front Controller — Birthday Reminder Application
// All web requests route through this file.
// ============================================================

declare(strict_types=1);

// ── Bootstrap ────────────────────────────────────────────────
$rootPath = dirname(__DIR__);

require_once $rootPath . '/config/app.php';
require_once $rootPath . '/config/database.php';
require_once $rootPath . '/helpers/functions.php';
require_once $rootPath . '/helpers/mailer.php';

// ── Core MVC ─────────────────────────────────────────────────
require_once $rootPath . '/core/Model.php';
require_once $rootPath . '/core/Controller.php';
require_once $rootPath . '/core/Router.php';

// ── Models ───────────────────────────────────────────────────
require_once $rootPath . '/models/Birthday.php';
require_once $rootPath . '/models/ReminderRule.php';
require_once $rootPath . '/models/Reminder.php';
require_once $rootPath . '/models/AutomationLog.php';

// ── Controllers ──────────────────────────────────────────────
require_once $rootPath . '/controllers/DashboardController.php';
require_once $rootPath . '/controllers/BirthdayController.php';
require_once $rootPath . '/controllers/ReminderController.php';
require_once $rootPath . '/controllers/LogController.php';
require_once $rootPath . '/controllers/SettingsController.php';

// ── Session ───────────────────────────────────────────────────
session_start();

// ── Security headers ─────────────────────────────────────────
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

// ── Dispatch ─────────────────────────────────────────────────
$router = new Router();
$router->dispatch();
