<?php
// ============================================================
// Email Helper
// Uses PHP's native mail() — swap in PHPMailer for SMTP/production
// ============================================================

/**
 * Send a birthday reminder email.
 *
 * @param string $toEmail    Recipient email address
 * @param string $toName     Recipient display name
 * @param string $subject    Email subject line
 * @param string $htmlBody   Full HTML body
 * @return bool              True if mail() accepted the message
 */
function send_birthday_email(
    string $toEmail,
    string $toName,
    string $subject,
    string $htmlBody
): bool {
    $fromName  = APP_NAME;
    $fromEmail = 'noreply@birthday-reminder.local';

    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: {$fromName} <{$fromEmail}>\r\n";
    $headers .= "Reply-To: {$fromEmail}\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    // Suppress warnings — mail() returns false if transfer fails
    return @mail($toEmail, $subject, $htmlBody, $headers);
}

/**
 * Build a styled HTML email body for a birthday reminder.
 */
function build_birthday_email_body(
    string $birthdayPersonName,
    string $daysLeft,
    string $birthdayDate,
    string $customNote = ''
): string {
    $daysText = match ((int)$daysLeft) {
        0       => "Today! 🎉",
        1       => "Tomorrow",
        default => "in {$daysLeft} days",
    };

    $noteHtml = '';
    if ($customNote) {
        $noteHtml = '<div class="note">📝 <strong>Note:</strong> ' . htmlspecialchars($customNote, ENT_QUOTES, 'UTF-8') . '</div>';
    }

    $name    = htmlspecialchars($birthdayPersonName, ENT_QUOTES, 'UTF-8');
    $date    = htmlspecialchars(date('F j', strtotime($birthdayDate)), ENT_QUOTES, 'UTF-8');
    $appName = htmlspecialchars(APP_NAME, ENT_QUOTES, 'UTF-8');

    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Birthday Reminder</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4ff; margin: 0; padding: 24px; }
  .card { background: #fff; border-radius: 20px; padding: 44px; max-width: 560px; margin: 0 auto; box-shadow: 0 8px 32px rgba(99,102,241,.10); }
  .header { text-align: center; margin-bottom: 28px; }
  .emoji { font-size: 60px; display: block; margin-bottom: 10px; }
  h1 { color: #6366f1; margin: 0 0 6px; font-size: 26px; font-weight: 700; }
  .subtitle { color: #94a3b8; font-size: 14px; margin: 0; }
  p { color: #475569; line-height: 1.7; }
  .countdown { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border-radius: 14px; padding: 22px; text-align: center; margin: 24px 0; }
  .countdown-number { font-size: 48px; font-weight: 800; display: block; line-height: 1; }
  .countdown-sub { font-size: 15px; opacity: .85; margin-top: 6px; }
  .date-chip { display: inline-block; background: #f1f5f9; color: #6366f1; font-weight: 600; border-radius: 30px; padding: 5px 16px; font-size: 14px; margin-bottom: 18px; }
  .note { background: #f8faff; border-left: 4px solid #6366f1; border-radius: 6px; padding: 14px 18px; color: #475569; font-style: italic; margin-top: 20px; font-size: 14px; }
  .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <span class="emoji">🎂</span>
    <h1>Birthday Reminder</h1>
    <p class="subtitle">Automated reminder from {$appName}</p>
  </div>
  <p>Hello!</p>
  <p>Just a friendly heads-up — <strong>{$name}</strong>'s birthday is coming up <strong>{$daysText}</strong>.</p>
  <span class="date-chip">📅 {$date}</span>
  <div class="countdown">
    <span class="countdown-number">{$daysLeft}</span>
    <div class="countdown-sub">days remaining</div>
  </div>
  {$noteHtml}
  <div class="footer">
    <p>This is an automated message from <strong>{$appName}</strong>.<br>Please do not reply to this email.</p>
  </div>
</div>
</body>
</html>
HTML;
}
