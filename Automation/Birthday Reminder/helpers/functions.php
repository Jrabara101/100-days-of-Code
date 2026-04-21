<?php
// ============================================================
// Global Helper Functions
// ============================================================

// ─────────────────────────────────────────────
// CSRF Protection
// ─────────────────────────────────────────────

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_input(): string
{
    return '<input type="hidden" name="csrf_token" value="' . csrf_token() . '">';
}

function verify_csrf(string $token): bool
{
    return isset($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

// ─────────────────────────────────────────────
// Flash Messages
// ─────────────────────────────────────────────

function flash(string $key, string $message, string $type = 'success'): void
{
    $_SESSION['flash'][$key] = ['message' => $message, 'type' => $type];
}

function get_flash(string $key): ?array
{
    if (isset($_SESSION['flash'][$key])) {
        $data = $_SESSION['flash'][$key];
        unset($_SESSION['flash'][$key]);
        return $data;
    }
    return null;
}

// ─────────────────────────────────────────────
// Sanitization & Output Escaping
// ─────────────────────────────────────────────

/** Escape output for HTML context — always use this in views */
function e(mixed $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/** Strip tags and trim for safe input storage */
function sanitize(string $input): string
{
    return trim(strip_tags($input));
}

// ─────────────────────────────────────────────
// Date / Birthday Helpers
// ─────────────────────────────────────────────

/** Number of days from today until next birthday anniversary */
function days_until_birthday(string $dateOfBirth): int
{
    $today    = new DateTime('today');
    $dob      = new DateTime($dateOfBirth);
    $thisYear = (int)$today->format('Y');
    $upcoming = new DateTime($thisYear . '-' . $dob->format('m') . '-' . $dob->format('d'));

    if ($upcoming < $today) {
        $upcoming->modify('+1 year');
    }

    return (int)$today->diff($upcoming)->days;
}

/** Returns Y-m-d string of the next birthday anniversary */
function next_birthday_date(string $dateOfBirth): string
{
    $today    = new DateTime('today');
    $dob      = new DateTime($dateOfBirth);
    $thisYear = (int)$today->format('Y');
    $upcoming = new DateTime($thisYear . '-' . $dob->format('m') . '-' . $dob->format('d'));

    if ($upcoming < $today) {
        $upcoming->modify('+1 year');
    }

    return $upcoming->format('Y-m-d');
}

/** Current age based on date of birth */
function age_from_dob(string $dateOfBirth): int
{
    return (new DateTime($dateOfBirth))->diff(new DateTime('today'))->y;
}

/** Format a date string with given PHP format */
function format_date(string $date, string $format = 'M d, Y'): string
{
    return (new DateTime($date))->format($format);
}

/** Month number → full month name */
function month_name(int $month): string
{
    return date('F', mktime(0, 0, 0, $month, 1));
}

// ─────────────────────────────────────────────
// URL Helper
// ─────────────────────────────────────────────

function url(string $queryString = ''): string
{
    return BASE_URL . ($queryString ? '?' . ltrim($queryString, '?') : '');
}

// ─────────────────────────────────────────────
// Badge Renderers
// ─────────────────────────────────────────────

function status_badge(string $status): string
{
    $classes = [
        'pending'   => 'badge-warning',
        'sent'      => 'badge-info',
        'failed'    => 'badge-danger',
        'completed' => 'badge-success',
    ];
    $icons = [
        'pending'   => '⏳',
        'sent'      => '✉',
        'failed'    => '✕',
        'completed' => '✓',
    ];
    $cls  = $classes[$status] ?? 'badge-secondary';
    $icon = $icons[$status]   ?? '';
    return '<span class="badge ' . $cls . '">' . $icon . ' ' . ucfirst(e($status)) . '</span>';
}

function delivery_badge(string $type): string
{
    $classes = [
        'dashboard' => 'badge-primary',
        'email'     => 'badge-info',
        'sms'       => 'badge-purple',
    ];
    $icons = [
        'dashboard' => '🔔',
        'email'     => '✉',
        'sms'       => '💬',
    ];
    $cls  = $classes[$type] ?? 'badge-secondary';
    $icon = $icons[$type]   ?? '';
    return '<span class="badge ' . $cls . '">' . $icon . ' ' . ucfirst(e($type)) . '</span>';
}

function days_before_label(int $days): string
{
    return match ($days) {
        0       => 'Same Day',
        1       => '1 Day Before',
        3       => '3 Days Before',
        7       => '7 Days Before',
        default => $days . ' Days Before',
    };
}
