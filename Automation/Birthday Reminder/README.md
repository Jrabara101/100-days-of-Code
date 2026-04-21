# Birthday Reminder Automation System

A professional PHP-based birthday reminder web application with automated cron scheduling, MySQL persistence, and a premium admin dashboard.

---

## 🚀 Features

- **Dashboard** — Stats cards, next birthday countdown, monthly chart, automation status
- **Birthday Management** — Add, edit, delete (soft), search, filter by month, sort, CSV export
- **Reminder Rules** — Per-person rules: timing (same day / 1/3/7 days before), delivery type (dashboard / email / SMS), yearly recurrence
- **Automated Cron Script** — Daily execution, duplicate prevention, email sending, detailed logging
- **Reminder History** — Filter by status, delivery type, and month; manual status override
- **Automation Logs** — Full audit trail per cron run with error reporting
- **Dark Mode** — Persistent via `localStorage`
- **Responsive** — Mobile sidebar, adaptive grid layouts

---

## 📁 Project Structure

```
Birthday Reminder/
├── config/           # Database credentials & app constants
├── core/             # Router, base Controller, base Model
├── models/           # Birthday, ReminderRule, Reminder, AutomationLog
├── controllers/      # DashboardController, BirthdayController, ReminderController, LogController, SettingsController
├── views/
│   ├── layouts/      # header.php, footer.php
│   ├── dashboard/    # index.php
│   ├── birthdays/    # index.php, create.php, edit.php
│   ├── reminders/    # index.php
│   ├── logs/         # index.php
│   └── settings/     # index.php
├── assets/
│   ├── css/app.css   # Full premium stylesheet (~650 lines)
│   └── js/app.js     # Interactivity, charts, dark mode
├── cron/
│   └── cron_birthday_reminder.php   # Standalone automation script
├── database/
│   ├── schema.sql    # DDL — run this first
│   └── seed.sql      # Sample data
├── helpers/
│   ├── functions.php # CSRF, flash, sanitize, date helpers, badges
│   └── mailer.php    # Email sending wrapper
├── public/
│   └── index.php     # Front controller entry point
└── .htaccess         # URL rewriting
```

---

## ⚙️ Setup Instructions

### 1. Database

1. Open **phpMyAdmin** (or any MySQL client)
2. Run `database/schema.sql` to create the database and tables
3. Optionally run `database/seed.sql` to populate sample data

### 2. Configure the Application

Edit **`config/database.php`**:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'birthday_reminder');
define('DB_USER', 'root');
define('DB_PASS', '');          // Change for production
```

Edit **`config/app.php`** if needed:
```php
define('TIMEZONE', 'Asia/Manila');   // Your server timezone
```

### 3. Deploy on XAMPP

1. Copy the entire `Birthday Reminder` folder to `C:\xampp\htdocs\`
2. Rename any spaces in the folder name if needed: `birthday-reminder`
3. Access: `http://localhost/birthday-reminder/public/`

> **Alternative:** Use XAMPP's Virtual Hosts to point a domain directly at `public/`.

### 4. URL Rewriting

The `.htaccess` at the project root rewrites all traffic to `public/index.php`.

Make sure `mod_rewrite` is enabled in XAMPP:
- Open `C:\xampp\apache\conf\httpd.conf`
- Ensure `LoadModule rewrite_module modules/mod_rewrite.so` is uncommented
- Set `AllowOverride All` for your htdocs directory

---

## ⏰ Cron Setup

### Linux / macOS

```bash
# Edit crontab
crontab -e

# Add this line — runs daily at 8:00 AM
0 8 * * * /usr/bin/php /var/www/html/birthday-reminder/cron/cron_birthday_reminder.php >> /var/log/birthday_cron.log 2>&1
```

### Windows (Task Scheduler)

1. Open **Task Scheduler** → Create Basic Task
2. Trigger: **Daily at 08:00**
3. Action: **Start a program**
   - Program: `C:\xampp\php\php.exe`
   - Arguments: `C:\xampp\htdocs\birthday-reminder\cron\cron_birthday_reminder.php`

### Manual Testing

```bash
php cron/cron_birthday_reminder.php
```

---

## 🔔 How Reminder Generation Works

1. The cron script loads all **active reminder rules** joined with their birthdays
2. For each rule, it computes:
   - **This year's birthday date** (e.g., April 25, 2025)
   - **Trigger date** = birthday date − `days_before` (e.g., April 18 for 7 days before)
3. If today matches the trigger date:
   - Checks for an existing reminder record with the same `(birthday_id, rule_id, reminder_date)` — **skips if duplicate**
   - Inserts a new `pending` reminder
   - Sends email if delivery type is `email`
   - Marks dashboard reminders as `completed` immediately
4. All execution stats are written to `automation_logs`

The `UNIQUE KEY uq_reminder (birthday_id, rule_id, reminder_date)` in the database also enforces no duplicates at the DB level as a safety net.

---

## ✉ Email Configuration

By default, `helpers/mailer.php` uses PHP's native `mail()` function.

For production SMTP delivery, install PHPMailer:
```bash
composer require phpmailer/phpmailer
```
Then update `send_birthday_email()` in `helpers/mailer.php` with SMTP credentials.

---

## 🔒 Security

- **CSRF protection** on all POST forms
- **PDO prepared statements** — no SQL injection vulnerabilities
- **`htmlspecialchars()`** (via `e()`) on all output
- **`strip_tags()` + `trim()`** on all input via `sanitize()`
- **Soft deletes** — birthday records are deactivated, not permanently removed
- **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`

---

## 📦 Requirements

| Requirement | Version |
|-------------|---------|
| PHP         | 8.1+    |
| MySQL       | 5.7+ / MariaDB 10.3+ |
| Apache      | `mod_rewrite` enabled |

No Composer required for base installation.
