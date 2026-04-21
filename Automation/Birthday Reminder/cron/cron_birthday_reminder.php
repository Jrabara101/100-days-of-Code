#!/usr/bin/env php
<?php
// ============================================================
// Birthday Reminder — Cron Automation Script
//
// PURPOSE:
//   This script runs daily (via cron or task scheduler) to:
//   1. Fetch all active birthdays with active reminder rules
//   2. Compute whether today is a trigger date for each rule
//   3. Insert new 'pending' reminder records (skipping duplicates)
//   4. Send email reminders for email-type rules
//   5. Log the entire run in automation_logs
//
// CRON SETUP (Linux — daily at 8:00 AM):
//   0 8 * * * /usr/bin/php /var/www/html/birthday-reminder/cron/cron_birthday_reminder.php >> /var/log/birthday_cron.log 2>&1
//
// MANUAL RUN (for testing):
//   php cron/cron_birthday_reminder.php
// ============================================================

declare(strict_types=1);

$startTime = microtime(true);

// ─── Bootstrap (CLI context — no HTTP, no session) ──────────
$rootPath = dirname(__DIR__);

require_once $rootPath . '/config/app.php';
require_once $rootPath . '/config/database.php';
require_once $rootPath . '/helpers/functions.php';
require_once $rootPath . '/helpers/mailer.php';
require_once $rootPath . '/core/Model.php';
require_once $rootPath . '/models/Birthday.php';
require_once $rootPath . '/models/ReminderRule.php';
require_once $rootPath . '/models/Reminder.php';
require_once $rootPath . '/models/AutomationLog.php';

// ─── Logger (stdout + optional log file) ─────────────────────
function cron_log(string $message): void
{
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
    echo $line;
}

// ─── Main Script ─────────────────────────────────────────────
cron_log('=== Birthday Reminder Cron Starting ===');

$ruleModel    = new ReminderRule();
$reminderModel= new Reminder();
$logModel     = new AutomationLog();

$today = new DateTime('today');

// Counters for log entry
$birthdaysChecked   = 0;
$remindersGenerated = 0;
$remindersSent      = 0;
$errors             = [];

// Fetch all active rules with their birthday data
$allRules = $ruleModel->getAllActiveWithBirthdays();
cron_log('Loaded ' . count($allRules) . ' active rule(s) to process.');

// Track birthday IDs we've already counted to avoid double-counting
$checkedBirthdayIds = [];

foreach ($allRules as $rule) {
    // Using explicit aliases set in ReminderRule::getAllActiveWithBirthdays()
    $actualRuleId     = (int)$rule['rule_id'];
    $actualBirthdayId = (int)$rule['birthday_id'];

    // Count unique birthdays
    if (!in_array($actualBirthdayId, $checkedBirthdayIds, true)) {
        $checkedBirthdayIds[] = $actualBirthdayId;
        $birthdaysChecked++;
    }

    $dob        = new DateTime($rule['date_of_birth']);
    $daysBefore = (int)$rule['days_before'];

    // ── Compute this year's birthday anniversary ──────────────
    $thisYearBirthday = new DateTime(
        $today->format('Y') . '-' . $dob->format('m') . '-' . $dob->format('d')
    );

    // If this year's birthday has already passed, skip (already handled)
    // OR compute next year's if is_recurring and needed
    if ($thisYearBirthday < $today) {
        if ($rule['is_recurring']) {
            // Shift to next year for next run cycle — nothing to do today
        }
        continue;
    }

    // ── Compute reminder trigger date ─────────────────────────
    $reminderDate = clone $thisYearBirthday;
    $reminderDate->modify("-{$daysBefore} days");

    // Only process if reminder date is today
    if ($reminderDate->format('Y-m-d') !== $today->format('Y-m-d')) {
        continue;
    }

    $reminderDateStr = $reminderDate->format('Y-m-d');
    $birthdayDateStr = $thisYearBirthday->format('Y-m-d');

    cron_log("Processing: {$rule['full_name']} | Birthday: {$birthdayDateStr} | Remind today (−{$daysBefore}d) | Via: {$rule['delivery_type']}");

    // ── Duplicate prevention ──────────────────────────────────
    if ($reminderModel->existsForBirthdayRuleDate($actualBirthdayId, $actualRuleId, $reminderDateStr)) {
        cron_log("  → Skipped (duplicate already exists)");
        continue;
    }

    // ── Build message ─────────────────────────────────────────
    $daysLeft = (int)$today->diff($thisYearBirthday)->days;
    $message  = "Birthday reminder for {$rule['full_name']} — "
              . ($daysLeft === 0 ? 'today is their birthday!' : "birthday in {$daysLeft} day(s).");

    // ── Insert reminder record ────────────────────────────────
    try {
        $reminderId = $reminderModel->create([
            'birthday_id'  => $actualBirthdayId,
            'rule_id'      => $actualRuleId,
            'reminder_date'=> $reminderDateStr,
            'status'       => 'pending',
            'delivery_type'=> $rule['delivery_type'],
            'message'      => $message,
        ]);
        $remindersGenerated++;
        cron_log("  → Reminder #{$reminderId} created (pending)");
    } catch (Exception $e) {
        $errMsg = "Failed to create reminder for {$rule['full_name']}: " . $e->getMessage();
        $errors[] = $errMsg;
        cron_log("  ✕ ERROR: {$errMsg}");
        continue;
    }

    // ── Deliver based on type ─────────────────────────────────
    if ($rule['delivery_type'] === 'dashboard') {
        // Dashboard notifications are visible through the UI immediately
        $reminderModel->updateStatus($reminderId, 'completed');
        cron_log("  → Dashboard notification set to completed");

    } elseif ($rule['delivery_type'] === 'email') {
        // Send email reminder
        $toEmail  = $rule['email'];
        $toName   = $rule['full_name'];
        $subject  = "🎂 Birthday Reminder: {$toName}'s birthday is "
                  . ($daysLeft === 0 ? 'today!' : "in {$daysLeft} day(s)!");
        $body     = build_birthday_email_body(
            $toName,
            (string)$daysLeft,
            $birthdayDateStr,
            $rule['custom_note'] ?? ''
        );

        $sent = send_birthday_email($toEmail, $toName, $subject, $body);

        if ($sent) {
            $reminderModel->updateStatus($reminderId, 'sent', date('Y-m-d H:i:s'));
            $remindersSent++;
            cron_log("  → Email sent to {$toEmail}");
        } else {
            $reminderModel->updateStatus($reminderId, 'failed');
            $errMsg = "Email send failed for {$toEmail}";
            $errors[] = $errMsg;
            cron_log("  ✕ ERROR: {$errMsg}");
        }

    } elseif ($rule['delivery_type'] === 'sms') {
        // SMS placeholder — integrate Twilio/other provider here
        cron_log("  → SMS delivery skipped (not configured — integrate Twilio here)");
        $reminderModel->updateStatus($reminderId, 'pending'); // stays pending
    }
}

// ─── Write Automation Log ─────────────────────────────────────
$executionMs = (int)round((microtime(true) - $startTime) * 1000);

$logModel->logRun([
    'birthdays_checked'   => $birthdaysChecked,
    'reminders_generated' => $remindersGenerated,
    'reminders_sent'      => $remindersSent,
    'errors'              => $errors,
    'execution_ms'        => $executionMs,
]);

cron_log('=== Run Complete ===');
cron_log("Birthdays checked:   {$birthdaysChecked}");
cron_log("Reminders generated: {$remindersGenerated}");
cron_log("Reminders sent:      {$remindersSent}");
cron_log('Errors:              ' . count($errors));
cron_log("Execution time:      {$executionMs}ms");

if (!empty($errors)) {
    cron_log('Error details:');
    foreach ($errors as $err) {
        cron_log("  - {$err}");
    }
}

exit(empty($errors) ? 0 : 1);
