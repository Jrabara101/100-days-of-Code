<?php $pageTitle = 'Settings'; ?>

<div class="page-header">
  <div>
    <h1 class="page-title">⚙️ Settings</h1>
    <p class="page-subtitle">System configuration and deployment info.</p>
  </div>
</div>

<div class="settings-grid">

  <!-- Database Info -->
  <div class="info-card">
    <div class="info-card-header">
      <h3>🗄 Database Configuration</h3>
    </div>
    <ul class="info-list">
      <li><span class="label">Host</span>     <span class="value"><?= e($db_host) ?></span></li>
      <li><span class="label">Database</span> <span class="value"><?= e($db_name) ?></span></li>
      <li><span class="label">User</span>     <span class="value"><?= e($db_user) ?></span></li>
      <li><span class="label">Charset</span>  <span class="value">utf8mb4</span></li>
    </ul>
    <div style="padding:14px 20px;border-top:1px solid var(--border)">
      <p style="font-size:12px;color:var(--text-muted)">
        Edit <code style="font-size:11px;background:var(--surface-2);padding:2px 6px;border-radius:4px">config/database.php</code> to change credentials.
      </p>
    </div>
  </div>

  <!-- App Info -->
  <div class="info-card">
    <div class="info-card-header">
      <h3>🚀 Application Info</h3>
    </div>
    <ul class="info-list">
      <li><span class="label">App Name</span>    <span class="value"><?= e(APP_NAME) ?></span></li>
      <li><span class="label">Version</span>     <span class="value"><?= e($app_version) ?></span></li>
      <li><span class="label">PHP Version</span> <span class="value"><?= phpversion() ?></span></li>
      <li><span class="label">Timezone</span>    <span class="value"><?= e($timezone) ?></span></li>
      <li><span class="label">Base URL</span>    <span class="value"><?= e($base_url) ?></span></li>
      <li><span class="label">Server Time</span> <span class="value"><?= date('Y-m-d H:i:s') ?></span></li>
    </ul>
  </div>

  <!-- Email Setup -->
  <div class="info-card">
    <div class="info-card-header">
      <h3>✉ Email Setup</h3>
    </div>
    <div style="padding:16px 20px">
      <p style="font-size:13px;color:var(--text-muted);line-height:1.7;margin-bottom:14px">
        By default, the system uses PHP's <code>mail()</code> function.
        For reliable delivery, replace <code>helpers/mailer.php</code> with PHPMailer or SwiftMailer SMTP.
      </p>
      <div class="cron-block" style="font-size:12px">
        <span class="cron-comment"># Install PHPMailer via Composer:</span><br>
        <span class="cron-cmd">composer require phpmailer/phpmailer</span>
      </div>
    </div>
  </div>

  <!-- Cron Setup -->
  <div class="info-card">
    <div class="info-card-header">
      <h3>⏰ Cron Automation</h3>
    </div>
    <div style="padding:16px 20px">
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">
        Set up a daily cron job to automatically generate and send birthday reminders.
      </p>
      <div class="cron-block" style="font-size:12px">
        <span class="cron-comment"># Daily at 8:00 AM (Linux)</span><br>
        <span class="cron-cmd">0 8 * * * /usr/bin/php /path/to/cron/cron_birthday_reminder.php >> /var/log/birthday_cron.log 2>&1</span><br><br>
        <span class="cron-comment"># Manual test run:</span><br>
        <span class="cron-cmd">php cron/cron_birthday_reminder.php</span>
      </div>
    </div>
  </div>

  <!-- Quick Links -->
  <div class="info-card" style="grid-column: 1 / -1">
    <div class="info-card-header">
      <h3>🔗 Quick Actions</h3>
    </div>
    <div style="padding:20px;display:flex;gap:12px;flex-wrap:wrap">
      <a href="<?= url('page=birthdays&action=create') ?>" class="btn btn-primary" id="btn-add-birthday">+ Add Birthday</a>
      <a href="<?= url('page=birthdays&action=export') ?>" class="btn btn-outline" id="btn-export">⬇ Export CSV</a>
      <a href="<?= url('page=logs') ?>" class="btn btn-outline" id="btn-logs">📋 View Logs</a>
      <a href="<?= url('page=reminders') ?>" class="btn btn-outline" id="btn-reminders">🔔 View Reminders</a>
    </div>
  </div>

</div>
